/**
 * Google Drive API & Firebase Auth Integration Service
 * จัดการการเชื่อมต่อบัญชี Google และการบันทึก/ซิงค์ข้อมูลลง Google Drive
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { StorageService } from './storage';

// Initialize Firebase App safely (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with Drive scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.appdata');
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token cache (NEVER in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface SyncStatus {
  isConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  folderName: string;
  fileName: string;
  driveFileId: string | null;
  error: string | null;
}

const DRIVE_FOLDER_NAME = 'โรงพยาบาลท่าคันโท_สปสช_2570';
const DRIVE_FILE_NAME = 'nhso_cloud_database_2570.json';
const LAST_SYNC_KEY = 'nhso_drive_last_synced_at';

// Subscribers for sync status changes
type StatusListener = (status: SyncStatus) => void;
const listeners: StatusListener[] = [];

let currentSyncStatus: SyncStatus = {
  isConnected: false,
  userEmail: null,
  userName: null,
  userPhoto: null,
  lastSyncedAt: localStorage.getItem(LAST_SYNC_KEY),
  isSyncing: false,
  folderName: DRIVE_FOLDER_NAME,
  fileName: DRIVE_FILE_NAME,
  driveFileId: null,
  error: null,
};

function notifyListeners() {
  listeners.forEach(fn => fn({ ...currentSyncStatus }));
}

export class GoogleDriveService {
  public static subscribe(listener: StatusListener): () => void {
    listeners.push(listener);
    listener({ ...currentSyncStatus });
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  public static getStatus(): SyncStatus {
    return { ...currentSyncStatus };
  }

  public static async fetchCentralDriveStatus(): Promise<void> {
    try {
      const res = await fetch('/api/drive-status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.status) {
          const s = json.status;
          currentSyncStatus = {
            ...currentSyncStatus,
            isConnected: true,
            userEmail: s.userEmail || 'hmlr11082@gmail.com',
            userName: s.userName || 'โรงพยาบาลท่าคันโท (ศูนย์ข้อมูล สปสช.)',
            folderName: s.folderName || DRIVE_FOLDER_NAME,
            fileName: s.fileName || DRIVE_FILE_NAME,
            lastSyncedAt: s.lastSyncedAt || currentSyncStatus.lastSyncedAt || new Date().toISOString(),
          };
          notifyListeners();
        }
      }
    } catch {
      // offline fallback
    }
  }

  public static hasValidToken(): boolean {
    return !!cachedAccessToken;
  }

  public static initAuth(
    onAuthSuccess?: (user: FirebaseUser, token: string) => void,
    onAuthFailure?: () => void
  ) {
    // Immediately load central persistent Drive status for all devices
    this.fetchCentralDriveStatus();

    return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user && cachedAccessToken) {
        currentSyncStatus = {
          ...currentSyncStatus,
          isConnected: true,
          userEmail: user.email,
          userName: user.displayName,
          userPhoto: user.photoURL,
          error: null,
        };
        notifyListeners();
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        await this.fetchCentralDriveStatus();
        if (onAuthFailure) onAuthFailure();
      }
    });
  }

  public static async googleSignIn(): Promise<{ user: FirebaseUser; accessToken: string }> {
    try {
      isSigningIn = true;
      currentSyncStatus = { ...currentSyncStatus, isSyncing: true, error: null };
      notifyListeners();

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('ไม่สามารถดึง OAuth access token จาก Google ได้');
      }

      cachedAccessToken = credential.accessToken;
      currentSyncStatus = {
        ...currentSyncStatus,
        isConnected: true,
        userEmail: result.user.email,
        userName: result.user.displayName,
        userPhoto: result.user.photoURL,
        isSyncing: false,
        error: null,
      };
      notifyListeners();

      // Automatically update central persistent Drive status on server
      try {
        await fetch('/api/drive-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: {
              isPermanentlyLinked: true,
              userEmail: result.user.email || 'hmlr11082@gmail.com',
              userName: result.user.displayName || 'โรงพยาบาลท่าคันโท (ศูนย์ข้อมูล สปสช.)',
              folderName: DRIVE_FOLDER_NAME,
              fileName: DRIVE_FILE_NAME,
              lastSyncedAt: new Date().toISOString(),
            },
          }),
        });
      } catch (err) {
        console.warn('Central drive status update error:', err);
      }

      // Automatically sync data to Drive after sign in
      try {
        await this.syncToDrive();
      } catch (err: any) {
        console.warn('Initial sync warning:', err);
      }

      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      currentSyncStatus = {
        ...currentSyncStatus,
        isSyncing: false,
        error: error.message || 'การเข้าสู่ระบบ Google ล้มเหลว',
      };
      notifyListeners();
      throw error;
    } finally {
      isSigningIn = false;
    }
  }

  public static async logout(): Promise<void> {
    await signOut(auth);
    cachedAccessToken = null;
    currentSyncStatus = {
      ...currentSyncStatus,
      isConnected: false,
      userEmail: null,
      userName: null,
      userPhoto: null,
      isSyncing: false,
      driveFileId: null,
      error: null,
    };
    notifyListeners();
  }

  public static async signInWithGoogle(): Promise<{ user: FirebaseUser; accessToken: string }> {
    return this.googleSignIn();
  }

  public static async signOut(): Promise<void> {
    return this.logout();
  }

  public static async getAccessToken(): Promise<string | null> {
    return cachedAccessToken;
  }

  /**
   * ค้นหาหรือสร้างโฟลเดอร์บน Google Drive
   */
  private static async getOrCreateFolder(accessToken: string): Promise<string> {
    // 1. Search for existing folder
    const q = `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!searchRes.ok) {
      const errJson = await searchRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'ค้นหาโฟลเดอร์ Google Drive ไม่สำเร็จ');
    }

    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // 2. Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'โฟลเดอร์เก็บข้อมูลระบบติดตามยอดส่งเบิก สปสช. โรงพยาบาลท่าคันโท',
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'สร้างโฟลเดอร์บน Google Drive ไม่สำเร็จ');
    }

    const createdData = await createRes.json();
    return createdData.id;
  }

  /**
   * ค้นหาไฟล์ฐานข้อมูลที่มีอยู่แล้วในโฟลเดอร์
   */
  private static async findDatabaseFile(
    accessToken: string,
    folderId: string
  ): Promise<string | null> {
    const q = `'${folderId}' in parents and name='${DRIVE_FILE_NAME}' and trashed=false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }

  /**
   * รวบรวมข้อมูลทั้งหมดในระบบเพื่อแปลงเป็น JSON สำหรับบันทึกขึ้น Cloud
   */
  public static getAllSystemData() {
    return {
      version: 2,
      exportDate: new Date().toISOString(),
      hospitalName: 'โรงพยาบาลท่าคันโท',
      fiscalYear: 2570,
      services: StorageService.getServices(),
      rates: StorageService.getRates(),
      rounds: StorageService.getRounds(),
      entries: StorageService.getEntries(),
      closings: StorageService.getClosings(),
      auditLogs: StorageService.getAuditLogs(),
      settings: StorageService.getSettings(),
    };
  }

  /**
   * บันทึกข้อมูลขึ้น Google Drive (Sync to Drive)
   */
  public static async syncToDrive(): Promise<{ success: boolean; fileId: string }> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('ยังไม่ได้เชื่อมต่อ Google Drive กรุณากดปุ่มเชื่อมต่อ Google ด้านบน');
    }

    currentSyncStatus = { ...currentSyncStatus, isSyncing: true, error: null };
    notifyListeners();

    try {
      const folderId = await this.getOrCreateFolder(token);
      let fileId = currentSyncStatus.driveFileId;
      if (!fileId) {
        fileId = await this.findDatabaseFile(token, folderId);
      }

      const payload = this.getAllSystemData();
      const fileContent = JSON.stringify(payload, null, 2);

      if (fileId) {
        // Update existing file content
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: fileContent,
          }
        );

        if (!updateRes.ok) {
          throw new Error('อัปเดตไฟล์ข้อมูลบน Google Drive ไม่สำเร็จ');
        }
      } else {
        // Create new multipart file
        const metadata = {
          name: DRIVE_FILE_NAME,
          parents: [folderId],
          description: 'ฐานข้อมูลระบบติดตามส่งเบิก สปสช. ปีงบประมาณ 2570 โรงพยาบาลท่าคันโท',
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          fileContent +
          closeDelimiter;

        const createRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          }
        );

        if (!createRes.ok) {
          throw new Error('สร้างไฟล์ข้อมูลบน Google Drive ไม่สำเร็จ');
        }

        const resData = await createRes.json();
        fileId = resData.id;
      }

      const nowStr = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, nowStr);

      currentSyncStatus = {
        ...currentSyncStatus,
        isSyncing: false,
        lastSyncedAt: nowStr,
        driveFileId: fileId,
        error: null,
      };
      notifyListeners();

      // Update central server drive status
      try {
        await fetch('/api/drive-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: {
              isPermanentlyLinked: true,
              userEmail: currentSyncStatus.userEmail || 'hmlr11082@gmail.com',
              userName: currentSyncStatus.userName || 'โรงพยาบาลท่าคันโท (ศูนย์ข้อมูล สปสช.)',
              folderName: DRIVE_FOLDER_NAME,
              fileName: DRIVE_FILE_NAME,
              lastSyncedAt: nowStr,
            },
          }),
        });
      } catch {}

      return { success: true, fileId: fileId! };
    } catch (err: any) {
      console.error('Error syncing to Drive:', err);
      currentSyncStatus = {
        ...currentSyncStatus,
        isSyncing: false,
        error: err.message || 'บันทึกข้อมูลเข้า Google Drive ล้มเหลว',
      };
      notifyListeners();
      throw err;
    }
  }

  /**
   * ดึงข้อมูลล่าสุดจาก Google Drive ลงสู่อุปกรณ์นี้ (Pull from Drive)
   */
  public static async pullFromDrive(): Promise<{
    servicesCount: number;
    roundsCount: number;
    entriesCount: number;
  }> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('ยังไม่ได้เชื่อมต่อ Google Drive กรุณากดปุ่มเชื่อมต่อ Google ด้านบน');
    }

    currentSyncStatus = { ...currentSyncStatus, isSyncing: true, error: null };
    notifyListeners();

    try {
      const folderId = await this.getOrCreateFolder(token);
      let fileId = currentSyncStatus.driveFileId;
      if (!fileId) {
        fileId = await this.findDatabaseFile(token, folderId);
      }

      if (!fileId) {
        throw new Error('ยังไม่พบไฟล์ฐานข้อมูลบน Google Drive ของคุณ');
      }

      // Download file content
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!downloadRes.ok) {
        throw new Error('ไม่สามารถดาวน์โหลดไฟล์ข้อมูลจาก Google Drive ได้');
      }

      const data = await downloadRes.json();
      if (!data || !data.services || !data.rounds) {
        throw new Error('รูปแบบไฟล์บน Google Drive ไม่ถูกต้อง');
      }

      // Restore data to StorageService and push to central server
      StorageService.restoreFromCloudData(data, true);

      const nowStr = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, nowStr);

      currentSyncStatus = {
        ...currentSyncStatus,
        isSyncing: false,
        lastSyncedAt: nowStr,
        driveFileId: fileId,
        error: null,
      };
      notifyListeners();

      return {
        servicesCount: data.services?.length || 0,
        roundsCount: data.rounds?.length || 0,
        entriesCount: data.entries?.length || 0,
      };
    } catch (err: any) {
      console.error('Error pulling from Drive:', err);
      currentSyncStatus = {
        ...currentSyncStatus,
        isSyncing: false,
        error: err.message || 'ดึงข้อมูลจาก Google Drive ล้มเหลว',
      };
      notifyListeners();
      throw err;
    }
  }
}
