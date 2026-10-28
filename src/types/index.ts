/**
 * โครงสร้างข้อมูลสำหรับระบบติดตามยอดส่งเบิกบริการสุขภาพ สปสช. ปีงบประมาณ 2570
 */

export type Role = 'recorder' | 'checker' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  roleTitle: string;
  department: string;
}

export interface FiscalYear {
  id: string;
  yearBE: number; // 2570
  startDate: string; // 2026-10-01
  endDate: string; // 2027-09-30
}

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  order: number;
  isActive: boolean;
  category?: string;
  description?: string;
}

export interface ServiceRate {
  id: string;
  serviceId: string;
  rate: number | null; // null = ยังไม่กำหนด (รอกำหนดอัตรา)
  effectiveDate: string; // YYYY-MM-DD
  endDate?: string;
  note?: string;
}

export interface ServiceRound {
  id: string;
  fiscalYear: number;
  monthKey: string; // e.g. "2569-10"
  roundNumber: number; // 1, 2, 3, 4, ...
  roundName: string; // เช่น "ครั้งที่ 1"
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface ServiceEntry {
  id: string;
  roundId: string;
  serviceId: string;
  count: number;
  recordedBy: string;
  recordedAt: string;
}

export type MonthStatus = 
  | 'draft'       // ร่าง (เจ้าหน้าที่กำลังคีย์)
  | 'submitted'   // ส่งตรวจ (รอหัวหน้าตรวจสอบ)
  | 'approved'    // อนุมัติ (หัวหน้าอนุมัติแล้ว ข้อมูลถูกล็อก)
  | 'claimed'     // ส่งเบิกแล้ว (ส่งข้อมูลเข้า e-Claim สปสช.)
  | 'paid';       // ได้รับเงินแล้ว (สปสช. โอนชดเชยเรียบร้อย)

export interface ConditionCItem {
  id: string;
  patientCode: string;
  serviceName: string;
  errorCode: string; // เช่น C01, C05, C12
  errorDetail: string;
  amount: number;
  status: 'pending' | 'resolved' | 'rejected';
}

export interface MonthlyClosing {
  id: string;
  monthKey: string; // e.g. "2569-10"
  fiscalYear: number;
  status: MonthStatus;
  totalCount: number;
  totalAmount: number;
  approvedBy?: string;
  statusUpdatedAt: string;
  notes?: string;
  // ข้อมูลติดตามการส่งเบิก สปสช.
  claimDetails: {
    claimedCount: number;      // จำนวนคนส่งเบิก
    claimedAmount: number;     // ยอดเงินที่ส่งเบิก
    paidCount: number;         // ได้รับเงินแล้ว (คน)
    paidAmount: number;        // ยอดเงินที่ได้รับโอนแล้ว (บาท)
    conditionCCount: number;   // ติด C รอแก้ไข (คน)
    conditionCAmount: number;  // ยอดเงินที่ติด C (บาท)
    pendingCount: number;      // อยู่ระหว่างรอตรวจของ สปสช. (คน)
    pendingAmount: number;     // ยอดเงินรอตรวจสอบ
    batchNumber?: string;      // เลขที่หนังสือส่งเบิก / Statement No.
    claimDate?: string;        // วันที่ส่งเบิก สปสช.
    paidDate?: string;         // วันที่ สปสช. โอนเงิน
    conditionCList?: ConditionCItem[]; // รายละเอียดเคสที่ติด C
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string; // เช่น "บันทึกจำนวนคน", "เปลี่ยนสถานะ", "แก้ไขอัตราเบิก"
  entityType: 'entry' | 'round' | 'rate' | 'status' | 'service';
  entityName: string;
  oldValue: string;
  newValue: string;
  details?: string;
}

export interface MonthInfo {
  key: string; // "2569-10"
  name: string; // "ตุลาคม 2569"
  shortName: string; // "ต.ค. 69"
  yearBE: number; // 2569
  monthIndex: number; // 10 (1-12)
  orderInFiscalYear: number; // 1 to 12
  startDate: string;
  endDate: string;
}
