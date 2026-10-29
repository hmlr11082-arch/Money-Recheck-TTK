import {
  AuditLog,
  ConditionCItem,
  MonthlyClosing,
  MonthStatus,
  Role,
  ServiceEntry,
  ServiceItem,
  ServiceRate,
  ServiceRound,
  User,
} from '../types';
import { FISCAL_YEAR_2570_MONTHS } from '../utils/formatters';

const STORAGE_KEYS = {
  SERVICES: 'nhso_services_v2',
  RATES: 'nhso_rates_v2',
  ROUNDS: 'nhso_rounds_v2',
  ENTRIES: 'nhso_entries_v2',
  CLOSINGS: 'nhso_closings_v2',
  AUDIT_LOGS: 'nhso_audit_logs_v2',
  CURRENT_USER: 'nhso_current_user_v2',
  SETTINGS: 'nhso_settings_v2',
};

export const MOCK_USERS: User[] = [
  {
    id: 'user-adm-natthanan',
    name: 'นางสาวณัฐนันท์ สีตะ',
    role: 'admin',
    roleTitle: 'เจ้าหน้าที่บันทึกข้อมูล (สิทธิ์ Admin)',
    department: 'งานเวชระเบียนและข้อมูลสุขภาพ / กลุ่มงานประกันสุขภาพ',
  },
  {
    id: 'user-chk-1',
    name: 'พว. นฤมล เก่งงาน',
    role: 'checker',
    roleTitle: 'ผู้ตรวจสอบ / หัวหน้างานประกันสุขภาพ',
    department: 'กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศ',
  },
  {
    id: 'user-adm-1',
    name: 'ภก. ธนพัฒน์ บริหารสุข',
    role: 'admin',
    roleTitle: 'ผู้ดูแลระบบโรงพยาบาล',
    department: 'ศูนย์เทคโนโลยีสารสนเทศทางการแพทย์',
  },
];

// Seed services matching specification & Excel screenshot
const SEED_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    code: 'ANC-01',
    name: 'บริการฝากครรภ์',
    unit: 'คน',
    order: 1,
    isActive: true,
    category: 'ส่งเสริมสุขภาพสตรีและเด็ก',
    description: 'การดูแลครรภ์ตามเกณฑ์มาตรฐาน สปสช.',
  },
  {
    id: 'srv-2',
    code: 'LAB-CBC',
    name: 'คัดกรองโลหิตจางจากการขาดธาตุเหล็ก (CBC)',
    unit: 'คน',
    order: 2,
    isActive: true,
    category: 'บริการตรวจทางห้องปฏิบัติการ',
    description: 'ตรวจความสมบูรณ์ของเม็ดเลือด CBC',
  },
  {
    id: 'srv-3',
    code: 'MED-FE',
    name: 'ยาน้ำเสริมธาตุเหล็กและกรดโฟลิค',
    unit: 'คน',
    order: 3,
    isActive: true,
    category: 'เวชภัณฑ์และยา',
    description: 'จ่ายยาน้ำเสริมธาตุเหล็กและโฟลิคตามสิทธิประโยชน์',
  },
  {
    id: 'srv-4',
    code: 'DEN-FL',
    name: 'บริการเคลือบฟลูออไรด์',
    unit: 'คน',
    order: 4,
    isActive: true,
    category: 'ทันตกรรมป้องกัน',
    description: 'เคลือบฟลูออไรด์วานิชหรือเจลในกลุ่มเป้าหมาย',
  },
  {
    id: 'srv-5',
    code: 'FIT-01',
    name: 'คัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (FIT Test)',
    unit: 'คน',
    order: 5,
    isActive: true,
    category: 'คัดกรองมะเร็ง',
    description: 'ตรวจคัดกรองเลือดแฝงในอุจจาระอายุ 50-70 ปี',
  },
  {
    id: 'srv-6',
    code: 'PNC-01',
    name: 'บริการตรวจหลังคลอด',
    unit: 'คน',
    order: 6,
    isActive: true,
    category: 'ส่งเสริมสุขภาพสตรีและเด็ก',
    description: 'ตรวจมารดาและทารกหลังคลอดตามเกณฑ์ สปสช.',
  },
  {
    id: 'srv-7',
    code: 'HERB-32',
    name: 'ยาสมุนไพร 32 รายการ',
    unit: 'คน',
    order: 7,
    isActive: true,
    category: 'การแพทย์แผนไทย',
    description: 'จ่ายยาสมุนไพรในบัญชียาหลักแห่งชาติ 32 รายการ',
  },
];

// Seed rates matching specification
const SEED_RATES: ServiceRate[] = [
  {
    id: 'rate-1',
    serviceId: 'srv-1',
    rate: null, // ยังไม่กำหนด (รอกำหนดอัตรา)
    effectiveDate: '2026-10-01',
    note: 'รอประกาศหลักเกณฑ์อัตราจ่าย สปสช. ปี 2570',
  },
  {
    id: 'rate-2',
    serviceId: 'srv-2',
    rate: 65,
    effectiveDate: '2026-10-01',
    note: 'ตามประกาศอัตราจ่ายชดเชยบริการแล็บ สปสช.',
  },
  {
    id: 'rate-3',
    serviceId: 'srv-3',
    rate: 80,
    effectiveDate: '2026-10-01',
    note: 'อัตราจ่ายชดเชยยาน้ำเสริมธาตุเหล็ก',
  },
  {
    id: 'rate-4',
    serviceId: 'srv-4',
    rate: 100,
    effectiveDate: '2026-10-01',
    note: 'บริการทันตกรรมป้องกันกลุ่มเป้าหมาย',
  },
  {
    id: 'rate-5',
    serviceId: 'srv-5',
    rate: 60,
    effectiveDate: '2026-10-01',
    note: 'ชุดตรวจ FIT Test สปสช.',
  },
  {
    id: 'rate-6',
    serviceId: 'srv-6',
    rate: 285,
    effectiveDate: '2026-10-01',
    note: 'ตรวจดูแลหลังคลอด 3 ครั้งตามเกณฑ์',
  },
  {
    id: 'rate-7',
    serviceId: 'srv-7',
    rate: null, // ยังไม่กำหนด (รอกำหนดอัตรา)
    effectiveDate: '2026-10-01',
    note: 'รอกำหนดราคาตามรายการสมุนไพร',
  },
];

// Clean initial rounds: 0 rounds (user will record data fresh)
const SEED_ROUNDS: ServiceRound[] = [];

// Clean initial entries: 0 entries
const SEED_ENTRIES: ServiceEntry[] = [];

const SEED_CONDITION_C: ConditionCItem[] = [];

// Clean initial monthly closings: All 12 months in FY 2570 set to 0 and draft
const SEED_CLOSINGS: MonthlyClosing[] = FISCAL_YEAR_2570_MONTHS.map(m => ({
  id: `cls-${m.key}`,
  monthKey: m.key,
  fiscalYear: 2570,
  status: 'draft',
  totalCount: 0,
  totalAmount: 0,
  statusUpdatedAt: new Date().toISOString(),
  notes: '',
  claimDetails: {
    claimedCount: 0,
    claimedAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    conditionCCount: 0,
    conditionCAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    batchNumber: '',
    claimDate: '',
    paidDate: '',
    conditionCList: [],
  },
}));

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-30T16:32:00',
    userName: 'นางสาวณัฐนันท์ สีตะ',
    userRole: 'เจ้าหน้าที่บันทึกข้อมูล (สิทธิ์ Admin)',
    action: 'บันทึกจำนวนคนรับบริการ',
    entityType: 'entry',
    entityName: 'บริการฝากครรภ์ (ครั้งที่ 4 วันที่ 30/10/69)',
    oldValue: '0 คน',
    newValue: '13 คน',
    details: 'บันทึกยอดผู้รับบริการคลินิก ANC',
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-01T08:30:00',
    userName: 'ภก. ธนพัฒน์ บริหารสุข',
    userRole: 'ผู้ดูแลระบบโรงพยาบาล',
    action: 'ตั้งค่าระบบปีงบประมาณ 2570',
    entityType: 'service',
    entityName: 'รายการบริการและอัตราเบิก สปสช.',
    oldValue: '-',
    newValue: '7 รายการบริการ',
    details: 'นำเข้ารายการบริการสุขภาพประจำปีงบประมาณ 2570',
  },
];

export interface AppSettings {
  deadlineDay: number; // วันที่ของเดือนถัดไป เช่น วันที่ 5
  hospitalName: string;
  hospitalCode: string;
  enableAnomalyWarning: boolean;
  anomalyMultiplier: number; // 3 เท่า
}

const DEFAULT_SETTINGS: AppSettings = {
  deadlineDay: 5,
  hospitalName: 'โรงพยาบาลท่าคันโท',
  hospitalCode: '10742',
  enableAnomalyWarning: true,
  anomalyMultiplier: 3,
};

// Safe localStorage wrapper with Central Server real-time sync
export class StorageService {
  private static syncListeners: Array<() => void> = [];
  private static lastRemoteHash: string = '';
  private static syncTimeout: any = null;
  private static isSyncingWithServer: boolean = false;
  private static syncIntervalStarted: boolean = false;

  public static subscribeToUpdates(listener: () => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      const idx = this.syncListeners.indexOf(listener);
      if (idx !== -1) this.syncListeners.splice(idx, 1);
    };
  }

  private static notifyUpdate(): void {
    this.syncListeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public static getAllData(): any {
    return {
      version: 2,
      exportDate: new Date().toISOString(),
      hospitalName: 'โรงพยาบาลท่าคันโท',
      fiscalYear: 2570,
      services: this.getServices(),
      rates: this.getRates(),
      rounds: this.getRounds(),
      entries: this.getEntries(),
      closings: this.getClosings(),
      auditLogs: this.getAuditLogs(),
      settings: this.getSettings(),
    };
  }

  public static pushToCentralServer(): void {
    if (this.isSyncingWithServer) return;
    if (this.syncTimeout) clearTimeout(this.syncTimeout);

    this.syncTimeout = setTimeout(async () => {
      try {
        const payload = this.getAllData();
        const res = await fetch('/api/central-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload }),
        });
        if (res.ok) {
          this.lastRemoteHash = JSON.stringify({
            rounds: payload.rounds?.length,
            entries: payload.entries?.length,
            closings: payload.closings?.length,
            rates: payload.rates,
          });
        }
      } catch (e) {
        console.warn('Central server sync offline/skipped:', e);
      }
    }, 350);
  }

  public static async pullFromCentralServer(force = false): Promise<boolean> {
    try {
      const res = await fetch('/api/central-db');
      if (!res.ok) return false;
      const json = await res.json();
      if (!json.success) return false;

      // If server has no data yet, push local seed data to populate it!
      if (!json.data) {
        this.pushToCentralServer();
        return false;
      }

      const remoteData = json.data;
      const currentHash = JSON.stringify({
        rounds: remoteData.rounds?.length,
        entries: remoteData.entries?.length,
        closings: remoteData.closings?.length,
        rates: remoteData.rates,
        lastDate: remoteData.exportDate,
      });

      if (!force && currentHash === this.lastRemoteHash) {
        return false; // No changes detected
      }

      this.lastRemoteHash = currentHash;
      this.isSyncingWithServer = true;
      try {
        this.restoreFromCloudData(remoteData, false);
      } finally {
        this.isSyncingWithServer = false;
      }
      this.notifyUpdate();
      return true;
    } catch {
      return false;
    }
  }

  public static initCentralSync(): void {
    if (this.syncIntervalStarted) return;
    this.syncIntervalStarted = true;

    // Initial pull from central database
    this.pullFromCentralServer().then(updated => {
      if (updated) this.notifyUpdate();
    });

    // Regular polling every 5 seconds for cross-device shared updates
    setInterval(() => {
      this.pullFromCentralServer();
    }, 5000);

    // Pull when tab gets focus or becomes visible
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.pullFromCentralServer();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.pullFromCentralServer();
        }
      });
      window.addEventListener('storage', () => {
        this.notifyUpdate();
      });
    }
  }

  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T, sync = true): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (sync && key !== STORAGE_KEYS.CURRENT_USER) {
        this.pushToCentralServer();
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Initializer
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      this.setItem(STORAGE_KEYS.SERVICES, SEED_SERVICES, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RATES)) {
      this.setItem(STORAGE_KEYS.RATES, SEED_RATES, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROUNDS)) {
      this.setItem(STORAGE_KEYS.ROUNDS, SEED_ROUNDS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
      this.setItem(STORAGE_KEYS.ENTRIES, SEED_ENTRIES, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLOSINGS)) {
      this.setItem(STORAGE_KEYS.CLOSINGS, SEED_CLOSINGS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS, false);
    }
    const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!storedUser || storedUser.includes('สมชาย') || storedUser.includes('user-rec-1')) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0], false); // default to นางสาวณัฐนันท์ สีตะ (Admin)
    }
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!storedSettings || storedSettings.includes('ชุมชนโมเดล') || storedSettings.includes('ประจำตำบล')) {
      this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS, false);
    }

    // Start central server sync
    this.initCentralSync();
  }

  // Users & Role
  public static getCurrentUser(): User {
    return this.getItem<User>(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0]);
  }

  public static setCurrentUser(user: User): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Settings
  public static getSettings(): AppSettings {
    return this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  public static updateSettings(newSettings: Partial<AppSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);
  }

  // Services
  public static getServices(): ServiceItem[] {
    const items = this.getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    return items.sort((a, b) => a.order - b.order);
  }

  public static saveService(service: ServiceItem): void {
    const services = this.getServices();
    const idx = services.findIndex(s => s.id === service.id);
    const user = this.getCurrentUser();
    if (idx >= 0) {
      const old = services[idx];
      services[idx] = service;
      this.logAudit({
        userName: user.name,
        userRole: user.roleTitle,
        action: 'แก้ไขข้อมูลบริการ',
        entityType: 'service',
        entityName: service.name,
        oldValue: `${old.name} (${old.order})`,
        newValue: `${service.name} (${service.order})`,
      });
    } else {
      services.push(service);
      this.logAudit({
        userName: user.name,
        userRole: user.roleTitle,
        action: 'เพิ่มบริการใหม่',
        entityType: 'service',
        entityName: service.name,
        oldValue: '-',
        newValue: service.name,
      });
    }
    this.setItem(STORAGE_KEYS.SERVICES, services);
  }

  // Rates
  public static getRates(): ServiceRate[] {
    return this.getItem<ServiceRate[]>(STORAGE_KEYS.RATES, SEED_RATES);
  }

  public static getRateForService(serviceId: string, _dateStr?: string): ServiceRate | undefined {
    const rates = this.getRates();
    // Return the latest effective rate for the service
    return rates.find(r => r.serviceId === serviceId);
  }

  public static updateServiceRate(serviceId: string, newRate: number | null, note?: string): void {
    const rates = this.getRates();
    const services = this.getServices();
    const srv = services.find(s => s.id === serviceId);
    const srvName = srv ? srv.name : serviceId;

    const idx = rates.findIndex(r => r.serviceId === serviceId);
    const user = this.getCurrentUser();
    const oldVal = idx >= 0 ? (rates[idx].rate !== null ? `${rates[idx].rate} บาท` : 'รอกำหนดอัตรา') : 'ไม่มี';
    const newVal = newRate !== null ? `${newRate} บาท` : 'รอกำหนดอัตรา';

    if (idx >= 0) {
      rates[idx].rate = newRate;
      if (note !== undefined) rates[idx].note = note;
    } else {
      rates.push({
        id: `rate-${Date.now()}`,
        serviceId,
        rate: newRate,
        effectiveDate: '2026-10-01',
        note,
      });
    }
    this.setItem(STORAGE_KEYS.RATES, rates);

    this.logAudit({
      userName: user.name,
      userRole: user.roleTitle,
      action: 'แก้ไขอัตราเบิก',
      entityType: 'rate',
      entityName: srvName,
      oldValue: oldVal,
      newValue: newVal,
      details: note,
    });
  }

  // Rounds
  public static getRounds(monthKey?: string): ServiceRound[] {
    const rounds = this.getItem<ServiceRound[]>(STORAGE_KEYS.ROUNDS, SEED_ROUNDS);
    if (monthKey) {
      return rounds
        .filter(r => r.monthKey === monthKey)
        .sort((a, b) => a.roundNumber - b.roundNumber);
    }
    return rounds.sort((a, b) => a.date.localeCompare(b.date));
  }

  public static addRound(monthKey: string, date: string, roundName?: string): ServiceRound {
    const rounds = this.getRounds();
    const monthRounds = rounds.filter(r => r.monthKey === monthKey);
    const nextNumber = monthRounds.length + 1;
    const name = roundName || `ครั้งที่ ${nextNumber}`;

    const newRound: ServiceRound = {
      id: `rnd-${monthKey}-${Date.now()}`,
      fiscalYear: 2570,
      monthKey,
      roundNumber: nextNumber,
      roundName: name,
      date,
    };

    rounds.push(newRound);
    this.setItem(STORAGE_KEYS.ROUNDS, rounds);

    const user = this.getCurrentUser();
    this.logAudit({
      userName: user.name,
      userRole: user.roleTitle,
      action: 'เพิ่มรอบบริการ',
      entityType: 'round',
      entityName: `${name} (${date})`,
      oldValue: '-',
      newValue: `รอบที่ ${nextNumber} เดือน ${monthKey}`,
    });

    return newRound;
  }

  public static deleteRound(roundId: string): void {
    const rounds = this.getRounds().filter(r => r.id !== roundId);
    this.setItem(STORAGE_KEYS.ROUNDS, rounds);

    // Also remove entries for this round
    const entries = this.getEntries().filter(e => e.roundId !== roundId);
    this.setItem(STORAGE_KEYS.ENTRIES, entries);
  }

  // Entries
  public static getEntries(): ServiceEntry[] {
    return this.getItem<ServiceEntry[]>(STORAGE_KEYS.ENTRIES, SEED_ENTRIES);
  }

  public static getEntry(roundId: string, serviceId: string): ServiceEntry | undefined {
    const entries = this.getEntries();
    return entries.find(e => e.roundId === roundId && e.serviceId === serviceId);
  }

  public static saveEntry(roundId: string, serviceId: string, count: number): void {
    const entries = this.getEntries();
    const idx = entries.findIndex(e => e.roundId === roundId && e.serviceId === serviceId);
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    if (idx >= 0) {
      const oldVal = entries[idx].count;
      entries[idx].count = count;
      entries[idx].recordedBy = user.name;
      entries[idx].recordedAt = now;

      if (oldVal !== count) {
        this.logAudit({
          userName: user.name,
          userRole: user.roleTitle,
          action: 'บันทึกจำนวนคนรับบริการ',
          entityType: 'entry',
          entityName: `รอบ ${roundId} / บริการ ${serviceId}`,
          oldValue: `${oldVal} คน`,
          newValue: `${count} คน`,
        });
      }
    } else {
      entries.push({
        id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        roundId,
        serviceId,
        count,
        recordedBy: user.name,
        recordedAt: now,
      });

      this.logAudit({
        userName: user.name,
        userRole: user.roleTitle,
        action: 'บันทึกจำนวนคนรับบริการใหม่',
        entityType: 'entry',
        entityName: `รอบ ${roundId} / บริการ ${serviceId}`,
        oldValue: '0 คน',
        newValue: `${count} คน`,
      });
    }

    this.setItem(STORAGE_KEYS.ENTRIES, entries);
  }

  // Calculate historical average count for anomaly check (> 3x)
  public static getServiceAverageCount(serviceId: string): number {
    const entries = this.getEntries().filter(e => e.serviceId === serviceId && e.count > 0);
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + e.count, 0);
    return total / entries.length;
  }

  // Monthly Closings & NHSO Claim Details
  public static getClosings(): MonthlyClosing[] {
    const closings = this.getItem<MonthlyClosing[]>(STORAGE_KEYS.CLOSINGS, SEED_CLOSINGS);
    // Ensure all 12 months exist in closings
    for (const m of FISCAL_YEAR_2570_MONTHS) {
      if (!closings.some(c => c.monthKey === m.key)) {
        closings.push({
          id: `cls-${m.key}`,
          monthKey: m.key,
          fiscalYear: 2570,
          status: 'draft',
          totalCount: 0,
          totalAmount: 0,
          statusUpdatedAt: new Date().toISOString(),
          claimDetails: {
            claimedCount: 0,
            claimedAmount: 0,
            paidCount: 0,
            paidAmount: 0,
            conditionCCount: 0,
            conditionCAmount: 0,
            pendingCount: 0,
            pendingAmount: 0,
          },
        });
      }
    }
    return closings;
  }

  public static getClosing(monthKey: string): MonthlyClosing {
    const closings = this.getClosings();
    const found = closings.find(c => c.monthKey === monthKey);
    if (found) return found;

    return {
      id: `cls-${monthKey}`,
      monthKey,
      fiscalYear: 2570,
      status: 'draft',
      totalCount: 0,
      totalAmount: 0,
      statusUpdatedAt: new Date().toISOString(),
      claimDetails: {
        claimedCount: 0,
        claimedAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        conditionCCount: 0,
        conditionCAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
      },
    };
  }

  public static updateClosingStatus(
    monthKey: string,
    status: MonthStatus,
    notes?: string
  ): MonthlyClosing {
    const closings = this.getClosings();
    const idx = closings.findIndex(c => c.monthKey === monthKey);
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    let closing: MonthlyClosing;
    if (idx >= 0) {
      const oldStatus = closings[idx].status;
      closings[idx].status = status;
      closings[idx].statusUpdatedAt = now;
      if (notes) closings[idx].notes = notes;
      if (status === 'approved') {
        closings[idx].approvedBy = user.name;
      }
      closing = closings[idx];

      this.logAudit({
        userName: user.name,
        userRole: user.roleTitle,
        action: 'เปลี่ยนสถานะการส่งเบิก',
        entityType: 'status',
        entityName: `เดือน ${monthKey}`,
        oldValue: oldStatus,
        newValue: status,
        details: notes,
      });
    } else {
      closing = {
        id: `cls-${monthKey}`,
        monthKey,
        fiscalYear: 2570,
        status,
        totalCount: 0,
        totalAmount: 0,
        approvedBy: status === 'approved' ? user.name : undefined,
        statusUpdatedAt: now,
        notes,
        claimDetails: {
          claimedCount: 0,
          claimedAmount: 0,
          paidCount: 0,
          paidAmount: 0,
          conditionCCount: 0,
          conditionCAmount: 0,
          pendingCount: 0,
          pendingAmount: 0,
        },
      };
      closings.push(closing);
    }

    this.setItem(STORAGE_KEYS.CLOSINGS, closings);
    return closing;
  }

  public static updateClaimDetails(
    monthKey: string,
    details: Partial<MonthlyClosing['claimDetails']>
  ): void {
    const closings = this.getClosings();
    const idx = closings.findIndex(c => c.monthKey === monthKey);
    if (idx >= 0) {
      closings[idx].claimDetails = {
        ...closings[idx].claimDetails,
        ...details,
      };
      this.setItem(STORAGE_KEYS.CLOSINGS, closings);

      const user = this.getCurrentUser();
      this.logAudit({
        userName: user.name,
        userRole: user.roleTitle,
        action: 'อัปเดตผลการเบิกจ่าย สปสช.',
        entityType: 'status',
        entityName: `เดือน ${monthKey}`,
        oldValue: 'ข้อมูลก่อนหน้า',
        newValue: `โอนแล้ว ${details.paidCount ?? '-'} คน ติด C ${details.conditionCCount ?? '-'} คน`,
      });
    }
  }

  // Audit Logs
  public static getAuditLogs(): AuditLog[] {
    const logs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public static logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Restore from Cloud / Google Drive
  public static restoreFromCloudData(cloudData: any, shouldSync = false): void {
    if (cloudData.services) this.setItem(STORAGE_KEYS.SERVICES, cloudData.services, shouldSync);
    if (cloudData.rates) this.setItem(STORAGE_KEYS.RATES, cloudData.rates, shouldSync);
    if (cloudData.rounds) this.setItem(STORAGE_KEYS.ROUNDS, cloudData.rounds, shouldSync);
    if (cloudData.entries) this.setItem(STORAGE_KEYS.ENTRIES, cloudData.entries, shouldSync);
    if (cloudData.closings) this.setItem(STORAGE_KEYS.CLOSINGS, cloudData.closings, shouldSync);
    if (cloudData.auditLogs) this.setItem(STORAGE_KEYS.AUDIT_LOGS, cloudData.auditLogs, shouldSync);
    if (cloudData.settings) this.setItem(STORAGE_KEYS.SETTINGS, cloudData.settings, shouldSync);
  }

  // Reset and clear all numbers/counts across the system for fresh user entry
  public static clearAllNumbers(): void {
    this.setItem(STORAGE_KEYS.ENTRIES, [], true);
    this.setItem(STORAGE_KEYS.ROUNDS, [], true);

    const emptyClosings: MonthlyClosing[] = FISCAL_YEAR_2570_MONTHS.map(m => ({
      id: `cls-${m.key}`,
      monthKey: m.key,
      fiscalYear: 2570,
      status: 'draft',
      totalCount: 0,
      totalAmount: 0,
      statusUpdatedAt: new Date().toISOString(),
      notes: '',
      claimDetails: {
        claimedCount: 0,
        claimedAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        conditionCCount: 0,
        conditionCAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        conditionCList: [],
        batchNumber: '',
        claimDate: '',
        paidDate: '',
      },
    }));
    this.setItem(STORAGE_KEYS.CLOSINGS, emptyClosings, true);

    const user = this.getCurrentUser();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: user.name,
        userRole: user.roleTitle,
        action: 'ล้างข้อมูลตัวเลขทั้งหมดเพื่อเริ่มต้นคีย์ข้อมูลจริง',
        entityType: 'status',
        entityName: 'ระบบส่งเบิก สปสช. ปี 2570',
        oldValue: 'ข้อมูลตัวอย่างระบบ',
        newValue: '0 รายการ (พร้อมบันทึกข้อมูลจริง)',
        details: 'ล้างยอดผู้รับบริการและรายการติด C ทั้งหมดเพื่อเริ่มบันทึกข้อมูลจริง',
      },
    ], true);

    this.pushToCentralServer();
  }

  // Reset to initial seed
  public static resetToSeed(): void {
    this.clearAllNumbers();
  }
}
