/**
 * Google Cloud Firestore Persistence & Real-time Synchronization Service
 * บันทึกข้อมูลระบบติดตามส่งเบิก สปสช. โรงพยาบาลท่าคันโท เข้า Google Cloud (Cloud Firestore) โดยอัตโนมัติ
 * รองรับการทำงานจากทุกอุปกรณ์แบบ Real-time
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StorageService } from './storage';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore with dedicated databaseId if available
const databaseId = (firebaseConfig as any).firestoreDatabaseId || undefined;
export const firestore: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export interface GoogleCloudStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  projectId: string;
  databaseId: string;
  collectionPath: string;
  recordCount: {
    services: number;
    rounds: number;
    entries: number;
    closings: number;
  };
}

const CLOUD_DOC_PATH = 'hospitals/thakantho/nhso_2570/main_database';
const LAST_CLOUD_SYNC_KEY = 'nhso_google_cloud_last_synced';

type CloudListener = (status: GoogleCloudStatus) => void;
const listeners: CloudListener[] = [];

let currentStatus: GoogleCloudStatus = {
  isConnected: true, // Firebase initialized
  isSyncing: false,
  lastSyncedAt: localStorage.getItem(LAST_CLOUD_SYNC_KEY),
  error: null,
  projectId: firebaseConfig.projectId || 'gen-lang-client-0980812519',
  databaseId: databaseId || '(default)',
  collectionPath: CLOUD_DOC_PATH,
  recordCount: {
    services: 0,
    rounds: 0,
    entries: 0,
    closings: 0,
  },
};

function notifyListeners() {
  listeners.forEach(fn => fn({ ...currentStatus }));
}

let syncTimeout: any = null;
let realtimeUnsubscribe: Unsubscribe | null = null;
let isApplyingRemoteChange = false;

export class GoogleCloudService {
  /**
   * Subscribe to Google Cloud status updates
   */
  public static subscribe(listener: CloudListener): () => void {
    listeners.push(listener);
    listener({ ...currentStatus });
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  public static getStatus(): GoogleCloudStatus {
    return { ...currentStatus };
  }

  /**
   * Initialize Google Cloud Firestore connection and start real-time listener
   */
  public static init(onRemoteDataChanged?: () => void): () => void {
    this.updateRecordCounts();

    // Start real-time Firestore listener
    try {
      const docRef = doc(firestore, CLOUD_DOC_PATH);
      
      realtimeUnsubscribe = onSnapshot(
        docRef,
        snapshot => {
          if (snapshot.exists()) {
            const cloudData = snapshot.data();
            
            // If this update came from our own local save in this tab, skip re-applying
            if (isApplyingRemoteChange) return;

            const cloudUpdatedAt = cloudData.updatedAt;
            const localLastSync = localStorage.getItem(LAST_CLOUD_SYNC_KEY);

            // If remote has newer data, apply it to local storage
            if (cloudUpdatedAt && cloudUpdatedAt !== localLastSync && cloudData.services) {
              isApplyingRemoteChange = true;
              try {
                StorageService.restoreFromCloudData(cloudData);
                localStorage.setItem(LAST_CLOUD_SYNC_KEY, cloudUpdatedAt);
                
                currentStatus = {
                  ...currentStatus,
                  isConnected: true,
                  lastSyncedAt: cloudUpdatedAt,
                  error: null,
                };
                this.updateRecordCounts();
                notifyListeners();

                if (onRemoteDataChanged) {
                  onRemoteDataChanged();
                }
              } catch (e) {
                console.warn('Error applying cloud snapshot:', e);
              } finally {
                isApplyingRemoteChange = false;
              }
            } else {
              currentStatus = {
                ...currentStatus,
                isConnected: true,
                error: null,
              };
              notifyListeners();
            }
          } else {
            // First time initialization in Google Cloud: push current seed/local data to Cloud
            this.saveToGoogleCloud(false).catch(err => {
              console.warn('Initial cloud seed save warning:', err);
            });
          }
        },
        error => {
          console.warn('Firestore snapshot listener notice:', error.message);
          currentStatus = {
            ...currentStatus,
            error: error.message,
          };
          notifyListeners();
        }
      );
    } catch (err: any) {
      console.warn('Google Cloud Firestore init warning:', err);
    }

    return () => {
      if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
        realtimeUnsubscribe = null;
      }
    };
  }

  /**
   * Update internal count metrics
   */
  private static updateRecordCounts() {
    try {
      const s = StorageService.getServices();
      const r = StorageService.getRounds();
      const e = StorageService.getEntries();
      const c = StorageService.getClosings();
      currentStatus = {
        ...currentStatus,
        recordCount: {
          services: s.length,
          rounds: r.length,
          entries: e.length,
          closings: c.length,
        },
      };
    } catch {
      // Ignore during bootstrap
    }
  }

  /**
   * Save all hospital data to Google Cloud Firestore
   */
  public static async saveToGoogleCloud(manual: boolean = false): Promise<boolean> {
    if (isApplyingRemoteChange) {
      return false;
    }

    try {
      currentStatus = { ...currentStatus, isSyncing: true, error: null };
      notifyListeners();

      const user = StorageService.getCurrentUser();
      const nowStr = new Date().toISOString();

      const payload = {
        version: 2,
        hospitalName: 'โรงพยาบาลท่าคันโท',
        hospitalCode: '10742',
        fiscalYear: 2570,
        updatedAt: nowStr,
        updatedBy: user?.name || 'นางสาวณัฐนันท์ สีตะ',
        updatedByRole: user?.roleTitle || 'admin',
        services: StorageService.getServices(),
        rates: StorageService.getRates(),
        rounds: StorageService.getRounds(),
        entries: StorageService.getEntries(),
        closings: StorageService.getClosings(),
        auditLogs: StorageService.getAuditLogs(),
        settings: StorageService.getSettings(),
      };

      const docRef = doc(firestore, CLOUD_DOC_PATH);
      await setDoc(docRef, payload, { merge: true });

      localStorage.setItem(LAST_CLOUD_SYNC_KEY, nowStr);

      currentStatus = {
        ...currentStatus,
        isConnected: true,
        isSyncing: false,
        lastSyncedAt: nowStr,
        error: null,
      };
      this.updateRecordCounts();
      notifyListeners();

      return true;
    } catch (err: any) {
      console.error('Save to Google Cloud Firestore failed:', err);
      currentStatus = {
        ...currentStatus,
        isSyncing: false,
        error: err.message || 'บันทึกเข้า Google Cloud ล้มเหลว',
      };
      notifyListeners();
      if (manual) {
        throw err;
      }
      return false;
    }
  }

  /**
   * Fetch latest data from Google Cloud Firestore
   */
  public static async fetchFromGoogleCloud(): Promise<{
    servicesCount: number;
    roundsCount: number;
    entriesCount: number;
  }> {
    try {
      currentStatus = { ...currentStatus, isSyncing: true, error: null };
      notifyListeners();

      const docRef = doc(firestore, CLOUD_DOC_PATH);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        // Upload initial data to Google Cloud first
        await this.saveToGoogleCloud(false);
        currentStatus = { ...currentStatus, isSyncing: false };
        notifyListeners();
        return {
          servicesCount: StorageService.getServices().length,
          roundsCount: StorageService.getRounds().length,
          entriesCount: StorageService.getEntries().length,
        };
      }

      const cloudData = snapshot.data();
      isApplyingRemoteChange = true;
      try {
        StorageService.restoreFromCloudData(cloudData);
        const cloudUpdatedAt = cloudData.updatedAt || new Date().toISOString();
        localStorage.setItem(LAST_CLOUD_SYNC_KEY, cloudUpdatedAt);

        currentStatus = {
          ...currentStatus,
          isConnected: true,
          isSyncing: false,
          lastSyncedAt: cloudUpdatedAt,
          error: null,
        };
        this.updateRecordCounts();
        notifyListeners();

        return {
          servicesCount: cloudData.services?.length || 0,
          roundsCount: cloudData.rounds?.length || 0,
          entriesCount: cloudData.entries?.length || 0,
        };
      } finally {
        isApplyingRemoteChange = false;
      }
    } catch (err: any) {
      console.error('Fetch from Google Cloud failed:', err);
      currentStatus = {
        ...currentStatus,
        isSyncing: false,
        error: err.message || 'ดึงข้อมูลจาก Google Cloud ล้มเหลว',
      };
      notifyListeners();
      throw err;
    }
  }

  /**
   * Queue debounced auto-sync to Google Cloud whenever local data is changed
   */
  public static queueAutoSync() {
    if (isApplyingRemoteChange) return;

    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(() => {
      this.saveToGoogleCloud(false).catch(e => {
        console.warn('Debounced Google Cloud sync notice:', e);
      });
    }, 1200); // 1.2s debounce
  }
}
