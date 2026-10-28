import { MonthInfo, MonthStatus } from '../types';

/**
 * รายการ 12 เดือนของปีงบประมาณ 2570
 * เริ่ม 1 ตุลาคม 2569 สิ้นสุด 30 กันยายน 2570
 */
export const FISCAL_YEAR_2570_MONTHS: MonthInfo[] = [
  {
    key: '2569-10',
    name: 'ตุลาคม 2569',
    shortName: 'ต.ค. 69',
    yearBE: 2569,
    monthIndex: 10,
    orderInFiscalYear: 1,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  },
  {
    key: '2569-11',
    name: 'พฤศจิกายน 2569',
    shortName: 'พ.ย. 69',
    yearBE: 2569,
    monthIndex: 11,
    orderInFiscalYear: 2,
    startDate: '2026-11-01',
    endDate: '2026-11-30',
  },
  {
    key: '2569-12',
    name: 'ธันวาคม 2569',
    shortName: 'ธ.ค. 69',
    yearBE: 2569,
    monthIndex: 12,
    orderInFiscalYear: 3,
    startDate: '2026-12-01',
    endDate: '2026-12-31',
  },
  {
    key: '2570-01',
    name: 'มกราคม 2570',
    shortName: 'ม.ค. 70',
    yearBE: 2570,
    monthIndex: 1,
    orderInFiscalYear: 4,
    startDate: '2027-01-01',
    endDate: '2027-01-31',
  },
  {
    key: '2570-02',
    name: 'กุมภาพันธ์ 2570',
    shortName: 'ก.พ. 70',
    yearBE: 2570,
    monthIndex: 2,
    orderInFiscalYear: 5,
    startDate: '2027-02-01',
    endDate: '2027-02-28',
  },
  {
    key: '2570-03',
    name: 'มีนาคม 2570',
    shortName: 'มี.ค. 70',
    yearBE: 2570,
    monthIndex: 3,
    orderInFiscalYear: 6,
    startDate: '2027-03-01',
    endDate: '2027-03-31',
  },
  {
    key: '2570-04',
    name: 'เมษายน 2570',
    shortName: 'เม.ย. 70',
    yearBE: 2570,
    monthIndex: 4,
    orderInFiscalYear: 7,
    startDate: '2027-04-01',
    endDate: '2027-04-30',
  },
  {
    key: '2570-05',
    name: 'พฤษภาคม 2570',
    shortName: 'พ.ค. 70',
    yearBE: 2570,
    monthIndex: 5,
    orderInFiscalYear: 8,
    startDate: '2027-05-01',
    endDate: '2027-05-31',
  },
  {
    key: '2570-06',
    name: 'มิถุนายน 2570',
    shortName: 'มิ.ย. 70',
    yearBE: 2570,
    monthIndex: 6,
    orderInFiscalYear: 9,
    startDate: '2027-06-01',
    endDate: '2027-06-30',
  },
  {
    key: '2570-07',
    name: 'กรกฎาคม 2570',
    shortName: 'ก.ค. 70',
    yearBE: 2570,
    monthIndex: 7,
    orderInFiscalYear: 10,
    startDate: '2027-07-01',
    endDate: '2027-07-31',
  },
  {
    key: '2570-08',
    name: 'สิงหาคม 2570',
    shortName: 'ส.ค. 70',
    yearBE: 2570,
    monthIndex: 8,
    orderInFiscalYear: 11,
    startDate: '2027-08-01',
    endDate: '2027-08-31',
  },
  {
    key: '2570-09',
    name: 'กันยายน 2570',
    shortName: 'ก.ย. 70',
    yearBE: 2570,
    monthIndex: 9,
    orderInFiscalYear: 12,
    startDate: '2027-09-01',
    endDate: '2027-09-30',
  },
];

export function getMonthInfo(monthKey: string): MonthInfo {
  const found = FISCAL_YEAR_2570_MONTHS.find(m => m.key === monthKey);
  if (found) return found;
  return FISCAL_YEAR_2570_MONTHS[0];
}

/**
 * จัดรูปแบบตัวเลขเงิน 1,234.00
 */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * จัดรูปแบบจำนวนคน (จำนวนเต็ม) 1,234
 */
export function formatCount(count: number | null | undefined): string {
  if (count === null || count === undefined || isNaN(count)) return '0';
  return Math.round(count).toLocaleString('th-TH');
}

/**
 * แปลงวันที่ YYYY-MM-DD เป็น วว/ดด/ปป (พ.ศ.) แบบใน Excel เช่น "8/10/69"
 */
export function formatThaiShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const yearBE = parseInt(year, 10) + 543;
    const shortYear = (yearBE % 100).toString().padStart(2, '0');
    const dayInt = parseInt(day, 10);
    const monthInt = parseInt(month, 10);
    return `${dayInt}/${monthInt}/${shortYear}`;
  } catch {
    return dateStr;
  }
}

/**
 * แปลงวันที่ YYYY-MM-DD เป็น "8 ต.ค. 2569" หรือ "8 ตุลาคม 2569"
 */
export function formatThaiFullDate(dateStr: string, fullMonth = false): string {
  if (!dateStr) return '';
  try {
    const thaiMonthsShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiMonthsFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const [year, month, day] = dateStr.split('-');
    const yearBE = parseInt(year, 10) + 543;
    const dayInt = parseInt(day, 10);
    const monthIdx = parseInt(month, 10) - 1;
    const mName = fullMonth ? thaiMonthsFull[monthIdx] : thaiMonthsShort[monthIdx];
    return `${dayInt} ${mName} ${yearBE}`;
  } catch {
    return dateStr;
  }
}

/**
 * รายละเอียดสถานะการปิดงวดและส่งเบิก
 */
export const STATUS_CONFIG: Record<
  MonthStatus,
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    step: number;
  }
> = {
  draft: {
    label: 'ร่าง',
    description: 'เจ้าหน้าที่กำลังบันทึกข้อมูลรอบบริการ',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    step: 1,
  },
  submitted: {
    label: 'ส่งตรวจ',
    description: 'รอหัวหน้า/ผู้ตรวจสอบ อนุมัติยอด',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    step: 2,
  },
  approved: {
    label: 'อนุมัติ',
    description: 'ตรวจสอบแล้ว ข้อมูลถูกล็อกพร้อมส่งเบิก',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    step: 3,
  },
  claimed: {
    label: 'ส่งเบิกแล้ว',
    description: 'ส่งข้อมูลเข้าระบบ e-Claim สปสช. แล้ว',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
    step: 4,
  },
  paid: {
    label: 'ได้รับเงินแล้ว',
    description: 'สปสช. โอนเงินชดเชยเรียบร้อย',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    step: 5,
  },
};
