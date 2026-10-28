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

// Initial seed rounds for October 2569 (matching screenshot)
const SEED_ROUNDS: ServiceRound[] = [
  {
    id: 'rnd-2569-10-1',
    fiscalYear: 2570,
    monthKey: '2569-10',
    roundNumber: 1,
    roundName: 'ครั้งที่ 1',
    date: '2026-10-08', // 8/10/69
  },
  {
    id: 'rnd-2569-10-2',
    fiscalYear: 2570,
    monthKey: '2569-10',
    roundNumber: 2,
    roundName: 'ครั้งที่ 2',
    date: '2026-10-15', // 15/10/69
  },
  {
    id: 'rnd-2569-10-3',
    fiscalYear: 2570,
    monthKey: '2569-10',
    roundNumber: 3,
    roundName: 'ครั้งที่ 3',
    date: '2026-10-21', // 21/10/69
  },
  {
    id: 'rnd-2569-10-4',
    fiscalYear: 2570,
    monthKey: '2569-10',
    roundNumber: 4,
    roundName: 'ครั้งที่ 4',
    date: '2026-10-30', // 30/10/69
  },
  // Sample rounds for November 2569
  {
    id: 'rnd-2569-11-1',
    fiscalYear: 2570,
    monthKey: '2569-11',
    roundNumber: 1,
    roundName: 'ครั้งที่ 1',
    date: '2026-11-06',
  },
  {
    id: 'rnd-2569-11-2',
    fiscalYear: 2570,
    monthKey: '2569-11',
    roundNumber: 2,
    roundName: 'ครั้งที่ 2',
    date: '2026-11-13',
  },
  {
    id: 'rnd-2569-11-3',
    fiscalYear: 2570,
    monthKey: '2569-11',
    roundNumber: 3,
    roundName: 'ครั้งที่ 3',
    date: '2026-11-20',
  },
  {
    id: 'rnd-2569-11-4',
    fiscalYear: 2570,
    monthKey: '2569-11',
    roundNumber: 4,
    roundName: 'ครั้งที่ 4',
    date: '2026-11-27',
  },
  // Sample rounds for December 2569
  {
    id: 'rnd-2569-12-1',
    fiscalYear: 2570,
    monthKey: '2569-12',
    roundNumber: 1,
    roundName: 'ครั้งที่ 1',
    date: '2026-12-08',
  },
  {
    id: 'rnd-2569-12-2',
    fiscalYear: 2570,
    monthKey: '2569-12',
    roundNumber: 2,
    roundName: 'ครั้งที่ 2',
    date: '2026-12-15',
  },
  {
    id: 'rnd-2569-12-3',
    fiscalYear: 2570,
    monthKey: '2569-12',
    roundNumber: 3,
    roundName: 'ครั้งที่ 3',
    date: '2026-12-22',
  },
];

// Seed entries: exactly matches the screenshot for Oct 2569!
// In Oct 2569:
// Service 1 (ฝากครรภ์) in round 4 has 13 people, all other services 0
const SEED_ENTRIES: ServiceEntry[] = [
  // October 2569
  { id: 'ent-1', roundId: 'rnd-2569-10-1', serviceId: 'srv-1', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-08T10:00:00' },
  { id: 'ent-2', roundId: 'rnd-2569-10-1', serviceId: 'srv-2', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-08T10:00:00' },
  { id: 'ent-3', roundId: 'rnd-2569-10-1', serviceId: 'srv-3', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-08T10:00:00' },
  { id: 'ent-4', roundId: 'rnd-2569-10-1', serviceId: 'srv-4', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-08T10:00:00' },
  { id: 'ent-5', roundId: 'rnd-2569-10-1', serviceId: 'srv-5', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-08T10:00:00' },
  { id: 'ent-6', roundId: 'rnd-2569-10-1', serviceId: 'srv-6', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-08T10:00:00' },
  { id: 'ent-7', roundId: 'rnd-2569-10-1', serviceId: 'srv-7', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-08T10:00:00' },

  { id: 'ent-8', roundId: 'rnd-2569-10-2', serviceId: 'srv-1', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-15T10:00:00' },
  { id: 'ent-9', roundId: 'rnd-2569-10-2', serviceId: 'srv-2', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-15T10:00:00' },
  { id: 'ent-10', roundId: 'rnd-2569-10-2', serviceId: 'srv-3', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-15T10:00:00' },
  { id: 'ent-11', roundId: 'rnd-2569-10-2', serviceId: 'srv-4', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-15T10:00:00' },
  { id: 'ent-12', roundId: 'rnd-2569-10-2', serviceId: 'srv-5', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-15T10:00:00' },
  { id: 'ent-13', roundId: 'rnd-2569-10-2', serviceId: 'srv-6', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-15T10:00:00' },
  { id: 'ent-14', roundId: 'rnd-2569-10-2', serviceId: 'srv-7', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-15T10:00:00' },

  { id: 'ent-15', roundId: 'rnd-2569-10-3', serviceId: 'srv-1', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-21T10:00:00' },
  { id: 'ent-16', roundId: 'rnd-2569-10-3', serviceId: 'srv-2', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-21T10:00:00' },
  { id: 'ent-17', roundId: 'rnd-2569-10-3', serviceId: 'srv-3', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-21T10:00:00' },
  { id: 'ent-18', roundId: 'rnd-2569-10-3', serviceId: 'srv-4', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-21T10:00:00' },
  { id: 'ent-19', roundId: 'rnd-2569-10-3', serviceId: 'srv-5', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-21T10:00:00' },
  { id: 'ent-20', roundId: 'rnd-2569-10-3', serviceId: 'srv-6', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-21T10:00:00' },
  { id: 'ent-21', roundId: 'rnd-2569-10-3', serviceId: 'srv-7', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-21T10:00:00' },

  // Round 4 (30/10/69) has 13 for srv-1
  { id: 'ent-22', roundId: 'rnd-2569-10-4', serviceId: 'srv-1', count: 13, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-30T16:30:00' },
  { id: 'ent-23', roundId: 'rnd-2569-10-4', serviceId: 'srv-2', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-30T16:30:00' },
  { id: 'ent-24', roundId: 'rnd-2569-10-4', serviceId: 'srv-3', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-30T16:30:00' },
  { id: 'ent-25', roundId: 'rnd-2569-10-4', serviceId: 'srv-4', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-30T16:30:00' },
  { id: 'ent-26', roundId: 'rnd-2569-10-4', serviceId: 'srv-5', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-30T16:30:00' },
  { id: 'ent-27', roundId: 'rnd-2569-10-4', serviceId: 'srv-6', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-30T16:30:00' },
  { id: 'ent-28', roundId: 'rnd-2569-10-4', serviceId: 'srv-7', count: 0, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-10-30T16:30:00' },

  // Sample data for November 2569
  { id: 'ent-29', roundId: 'rnd-2569-11-1', serviceId: 'srv-2', count: 25, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-11-06T15:00:00' },
  { id: 'ent-30', roundId: 'rnd-2569-11-1', serviceId: 'srv-3', count: 20, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-11-06T15:00:00' },
  { id: 'ent-31', roundId: 'rnd-2569-11-1', serviceId: 'srv-4', count: 18, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-11-06T15:00:00' },
  { id: 'ent-32', roundId: 'rnd-2569-11-2', serviceId: 'srv-5', count: 32, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-11-13T15:00:00' },
  { id: 'ent-33', roundId: 'rnd-2569-11-2', serviceId: 'srv-6', count: 8, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-11-13T15:00:00' },
  { id: 'ent-34', roundId: 'rnd-2569-11-3', serviceId: 'srv-2', count: 28, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-11-20T15:00:00' },
  { id: 'ent-35', roundId: 'rnd-2569-11-4', serviceId: 'srv-4', count: 22, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-11-27T15:00:00' },

  // Sample data for December 2569
  { id: 'ent-36', roundId: 'rnd-2569-12-1', serviceId: 'srv-2', count: 30, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-12-08T15:00:00' },
  { id: 'ent-37', roundId: 'rnd-2569-12-1', serviceId: 'srv-5', count: 40, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-12-08T15:00:00' },
  { id: 'ent-38', roundId: 'rnd-2569-12-2', serviceId: 'srv-6', count: 12, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-12-15T15:00:00' },
  { id: 'ent-39', roundId: 'rnd-2569-12-3', serviceId: 'srv-4', count: 35, recordedBy: 'นางสาวณัฐนันท์ สีตะ', recordedAt: '2026-12-22T15:00:00' },
];

const SEED_CONDITION_C: ConditionCItem[] = [
  {
    id: 'c-1',
    patientCode: 'HN-6900241',
    serviceName: 'คัดกรองมะเร็งลำไส้ใหญ่และลำไส้ตรง (FIT Test)',
    errorCode: 'C01',
    errorDetail: 'เลขประจำตัวประชาชนไม่ตรงกับฐานข้อมูลทะเบียนราษฎร์ (DOPA)',
    amount: 60,
    status: 'pending',
  },
  {
    id: 'c-2',
    patientCode: 'HN-6900389',
    serviceName: 'บริการเคลือบฟลูออไรด์',
    errorCode: 'C05',
    errorDetail: 'เกินเกณฑ์ความถี่ที่กำหนด (เคยรับบริการแล้วในปีงบประมาณเดียวกัน)',
    amount: 100,
    status: 'pending',
  },
  {
    id: 'c-3',
    patientCode: 'HN-6900512',
    serviceName: 'บริการตรวจหลังคลอด',
    errorCode: 'C12',
    errorDetail: 'ไม่มีเอกสารแนบยืนยันวันคลอดของทารกในเวชระเบียน',
    amount: 285,
    status: 'pending',
  },
  {
    id: 'c-4',
    patientCode: 'HN-6900673',
    serviceName: 'คัดกรองโลหิตจาง (CBC)',
    errorCode: 'C23',
    errorDetail: 'รหัสการวินิจฉัยโรคเบิกจ่ายไม่สอดคล้องกับระเบียบ สปสช.',
    amount: 65,
    status: 'resolved',
  },
];

// Seed monthly closings
const SEED_CLOSINGS: MonthlyClosing[] = [
  {
    id: 'cls-2569-10',
    monthKey: '2569-10',
    fiscalYear: 2570,
    status: 'draft', // October is draft as user is editing
    totalCount: 13,
    totalAmount: 0, // rate not set for pregnancy service
    statusUpdatedAt: '2026-10-30T17:00:00',
    notes: 'รอผู้ดูแลระบบกำหนดอัตราเบิกบริการฝากครรภ์',
    claimDetails: {
      claimedCount: 13,
      claimedAmount: 0,
      paidCount: 0,
      paidAmount: 0,
      conditionCCount: 0,
      conditionCAmount: 0,
      pendingCount: 13,
      pendingAmount: 0,
      batchNumber: 'STM-2570-10-001',
      claimDate: '2026-11-02',
    },
  },
  {
    id: 'cls-2569-11',
    monthKey: '2569-11',
    fiscalYear: 2570,
    status: 'paid', // November is paid
    totalCount: 153,
    totalAmount: 11525,
    approvedBy: 'พว. นฤมล เก่งงาน',
    statusUpdatedAt: '2026-12-15T14:30:00',
    notes: 'สปสช. โอนชดเชยแล้ว หักยอดติด C รอแก้ไข',
    claimDetails: {
      claimedCount: 153,
      claimedAmount: 11525,
      paidCount: 145,
      paidAmount: 10980,
      conditionCCount: 5,
      conditionCAmount: 345,
      pendingCount: 3,
      pendingAmount: 200,
      batchNumber: 'STM-2570-11-042',
      claimDate: '2026-12-05',
      paidDate: '2026-12-28',
      conditionCList: SEED_CONDITION_C.slice(0, 2),
    },
  },
  {
    id: 'cls-2569-12',
    monthKey: '2569-12',
    fiscalYear: 2570,
    status: 'claimed', // December is claimed, waiting for NHSO payment
    totalCount: 117,
    totalAmount: 11270,
    approvedBy: 'พว. นฤมล เก่งงาน',
    statusUpdatedAt: '2027-01-08T11:00:00',
    notes: 'ส่งเบิกเข้าระบบ e-Claim สปสช. งวดที่ 12/2569',
    claimDetails: {
      claimedCount: 117,
      claimedAmount: 11270,
      paidCount: 0,
      paidAmount: 0,
      conditionCCount: 4,
      conditionCAmount: 510,
      pendingCount: 113,
      pendingAmount: 10760,
      batchNumber: 'STM-2570-12-019',
      claimDate: '2027-01-05',
      conditionCList: SEED_CONDITION_C.slice(2, 4),
    },
  },
];

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

// Safe localStorage wrapper
export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Initializer
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      this.setItem(STORAGE_KEYS.SERVICES, SEED_SERVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RATES)) {
      this.setItem(STORAGE_KEYS.RATES, SEED_RATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROUNDS)) {
      this.setItem(STORAGE_KEYS.ROUNDS, SEED_ROUNDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
      this.setItem(STORAGE_KEYS.ENTRIES, SEED_ENTRIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLOSINGS)) {
      this.setItem(STORAGE_KEYS.CLOSINGS, SEED_CLOSINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    }
    const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!storedUser || storedUser.includes('สมชาย') || storedUser.includes('user-rec-1')) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0]); // default to นางสาวณัฐนันท์ สีตะ (Admin)
    }
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!storedSettings || storedSettings.includes('ชุมชนโมเดล') || storedSettings.includes('ประจำตำบล')) {
      this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
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

  // Reset to initial seed demo
  public static resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.RATES);
    localStorage.removeItem(STORAGE_KEYS.ROUNDS);
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.CLOSINGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.init();
  }
}
