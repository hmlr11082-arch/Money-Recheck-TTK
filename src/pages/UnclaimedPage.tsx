import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Edit2,
  FileSpreadsheet,
  FileX2,
  Filter,
  FolderKanban,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TabKey } from '../components/Navigation';
import { GoogleDriveService } from '../services/googleDriveService';
import { StorageService } from '../services/storage';
import { UnclaimedItem, User } from '../types';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatCount as formatNumber,
  formatMoney,
  formatThaiFullDate as formatThaiDate,
  getMonthInfo,
} from '../utils/formatters';

function formatThaiDateTime(isoStr: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    const datePart = formatThaiDate(isoStr.split('T')[0]);
    const timePart = d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} ${timePart} น.`;
  } catch {
    return isoStr;
  }
}

interface UnclaimedPageProps {
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  currentUser: User;
  onNavigateTab: (tab: TabKey) => void;
}

const STANDARD_FUNDS = [
  'กองทุนหลักประกันสุขภาพแห่งชาติ (UC / บัตรทอง)',
  'กองทุนสร้างเสริมสุขภาพและป้องกันโรค (PP)',
  'กองทุนสวัสดิการรักษาพยาบาลข้าราชการ (OFC)',
  'กองทุนประกันสังคม (SSS)',
  'กองทุนองค์กรปกครองส่วนท้องถิ่น (LGO)',
  'กองทุนผู้มีปัญหาสถานะและสิทธิ / ต่างด้าว',
  'กองทุนอื่นๆ (ระบุเอง)',
];

const QUICK_REASONS = [
  'ข้อมูลไม่ครบถ้วนตามเกณฑ์ สปสช.',
  'เกินกำหนดระยะเวลาการส่งเบิก',
  'สิทธิซ้ำซ้อน / เบิกจ่ายจากกองทุนอื่นแล้ว',
  'อยู่นอกชุดสิทธิประโยชน์ที่เบิกได้',
  'รหัสวินิจฉัยหรือหัตถการไม่เข้าเกณฑ์',
  'ยอดค่าใช้จ่ายต่ำ / อนุโลมไม่เรียกเก็บ',
];

export const UnclaimedPage: React.FC<UnclaimedPageProps> = ({
  currentMonthKey,
  onSelectMonth,
  currentUser,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey || '2569-10');
  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');
  const [items, setItems] = useState<UnclaimedItem[]>(() => StorageService.getUnclaimedItems());

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMonthKey, setFormMonthKey] = useState<string>(currentMonthKey || '2569-10');
  const [formServiceDate, setFormServiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formHn, setFormHn] = useState<string>('');
  const [selectedFundOption, setSelectedFundOption] = useState<string>(STANDARD_FUNDS[0]);
  const [customFund, setCustomFund] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formReason, setFormReason] = useState<string>('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('all');

  // Save feedback states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedMonthKey(currentMonthKey);
    if (!editingId) {
      setFormMonthKey(currentMonthKey);
    }
  }, [currentMonthKey, editingId]);

  const reloadItems = () => {
    setItems(StorageService.getUnclaimedItems());
  };

  useEffect(() => {
    const unsubscribe = StorageService.subscribeToUpdates(() => {
      reloadItems();
    });
    return () => unsubscribe();
  }, []);

  const monthInfo = getMonthInfo(selectedMonthKey);

  const handleSelectMonth = (mKey: string) => {
    setSelectedMonthKey(mKey);
    onSelectMonth(mKey);
    if (!editingId) {
      setFormMonthKey(mKey);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormHn('');
    setSelectedFundOption(STANDARD_FUNDS[0]);
    setCustomFund('');
    setFormAmount('');
    setFormReason('');
    setFormError(null);
  };

  const handleEditItem = (item: UnclaimedItem) => {
    setEditingId(item.id);
    setFormMonthKey(item.monthKey);
    setFormServiceDate(item.serviceDate || new Date().toISOString().split('T')[0]);
    setFormHn(item.hn);

    if (STANDARD_FUNDS.slice(0, -1).includes(item.fund)) {
      setSelectedFundOption(item.fund);
      setCustomFund('');
    } else {
      setSelectedFundOption('กองทุนอื่นๆ (ระบุเอง)');
      setCustomFund(item.fund);
    }

    setFormAmount(item.amount.toString());
    setFormReason(item.reason);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const trimmedHn = formHn.trim();
    const finalFund =
      selectedFundOption === 'กองทุนอื่นๆ (ระบุเอง)'
        ? customFund.trim()
        : selectedFundOption.trim();
    const parsedAmount = parseFloat(formAmount);
    const trimmedReason = formReason.trim();

    if (!trimmedHn) {
      setFormError('กรุณากรอกเลขประจำตัวผู้ป่วย (HN)');
      return;
    }
    if (!finalFund) {
      setFormError('กรุณาเลือกหรือระบุชื่อกองทุน');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setFormError('กรุณากรอกยอดค่าใช้จ่ายเป็นตัวเลขที่ถูกต้อง (0 บาทขึ้นไป)');
      return;
    }
    if (!trimmedReason) {
      setFormError('กรุณาระบุเหตุผลที่ไม่ประสงค์เบิก');
      return;
    }

    setIsSaving(true);
    try {
      const record: UnclaimedItem = {
        id: editingId || `uncl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        monthKey: formMonthKey,
        serviceDate: formServiceDate,
        hn: trimmedHn,
        fund: finalFund,
        amount: parsedAmount,
        reason: trimmedReason,
        recordedBy: currentUser.name,
        recordedAt: new Date().toISOString(),
      };

      StorageService.saveUnclaimedItem(record);
      StorageService.pushToCentralServer();

      if (GoogleDriveService.hasValidToken()) {
        try {
          await GoogleDriveService.syncToDrive();
        } catch {
          // non-blocking drive sync
        }
      }

      reloadItems();
      setSelectedMonthKey(formMonthKey);
      onSelectMonth(formMonthKey);

      const actionLabel = editingId ? 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว' : 'บันทึกข้อมูลไม่ประสงค์เบิกเรียบร้อยแล้ว';
      setSaveMessage(`${actionLabel} (HN: ${trimmedHn} | ยอด ${formatMoney(parsedAmount)} บาท)`);
      resetForm();

      setTimeout(() => {
        setSaveMessage(null);
      }, 4500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSyncAll = async () => {
    setIsSaving(true);
    try {
      StorageService.pushToCentralServer();
      if (GoogleDriveService.hasValidToken()) {
        try {
          await GoogleDriveService.syncToDrive();
        } catch {
          // ignore
        }
      }
      setSaveMessage('บันทึกและซิงค์ข้อมูลไม่ประสงค์เบิกทั้งหมดลงฐานข้อมูลกลางเรียบร้อยแล้ว!');
      setTimeout(() => {
        setSaveMessage(null);
      }, 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (item: UnclaimedItem) => {
    if (
      window.confirm(
        `ต้องการลบรายการไม่ประสงค์เบิกของ HN: ${item.hn} ยอดค่าใช้จ่าย ${formatMoney(
          item.amount
        )} บาท ใช่หรือไม่?`
      )
    ) {
      StorageService.deleteUnclaimedItem(item.id);
      StorageService.pushToCentralServer();
      reloadItems();
      if (editingId === item.id) {
        resetForm();
      }
    }
  };

  // Monthly summary across all 12 months in FY 2570
  const monthlySummaries = useMemo(() => {
    return FISCAL_YEAR_2570_MONTHS.map(m => {
      const mItems = items.filter(i => i.monthKey === m.key);
      const totalAmount = mItems.reduce((sum, i) => sum + i.amount, 0);
      const uniqueFunds = Array.from(new Set(mItems.map(i => i.fund)));
      return {
        monthKey: m.key,
        monthName: m.name,
        shortName: m.shortName,
        count: mItems.length,
        totalAmount,
        uniqueFunds,
      };
    });
  }, [items]);

  // Totals for current selected month and full year
  const currentMonthSummary = useMemo(() => {
    return (
      monthlySummaries.find(m => m.monthKey === selectedMonthKey) || {
        monthKey: selectedMonthKey,
        monthName: monthInfo.name,
        shortName: monthInfo.shortName,
        count: 0,
        totalAmount: 0,
        uniqueFunds: [],
      }
    );
  }, [monthlySummaries, selectedMonthKey, monthInfo]);

  const annualTotalCount = useMemo(
    () => monthlySummaries.reduce((sum, m) => sum + m.count, 0),
    [monthlySummaries]
  );
  const annualTotalAmount = useMemo(
    () => monthlySummaries.reduce((sum, m) => sum + m.totalAmount, 0),
    [monthlySummaries]
  );

  // Filtered items for the detailed table
  const displayedItems = useMemo(() => {
    return items.filter(item => {
      if (viewMode === 'month' && item.monthKey !== selectedMonthKey) {
        return false;
      }
      if (fundFilter !== 'all' && item.fund !== fundFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHn = item.hn.toLowerCase().includes(q);
        const matchFund = item.fund.toLowerCase().includes(q);
        const matchReason = item.reason.toLowerCase().includes(q);
        const matchUser = item.recordedBy.toLowerCase().includes(q);
        return matchHn || matchFund || matchReason || matchUser;
      }
      return true;
    });
  }, [items, viewMode, selectedMonthKey, fundFilter, searchQuery]);

  const displayedTotalAmount = useMemo(
    () => displayedItems.reduce((sum, item) => sum + item.amount, 0),
    [displayedItems]
  );

  // Summary by Fund for the currently displayed items
  const fundBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    const sourceItems =
      viewMode === 'month' ? items.filter(i => i.monthKey === selectedMonthKey) : items;

    sourceItems.forEach(item => {
      const prev = map.get(item.fund) || { count: 0, amount: 0 };
      map.set(item.fund, {
        count: prev.count + 1,
        amount: prev.amount + item.amount,
      });
    });

    return Array.from(map.entries())
      .map(([fund, data]) => ({ fund, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [items, viewMode, selectedMonthKey]);

  const allAvailableFunds = useMemo(() => {
    const set = new Set<string>(STANDARD_FUNDS.slice(0, -1));
    items.forEach(i => set.add(i.fund));
    return Array.from(set);
  }, [items]);

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: รายละเอียดรายการไม่ประสงค์เบิก
    const detailRows = displayedItems.map((item, idx) => {
      const mInfo = getMonthInfo(item.monthKey);
      return {
        ลำดับ: idx + 1,
        เดือน: mInfo.name,
        วันที่รับบริการ: item.serviceDate ? formatThaiDate(item.serviceDate) : '-',
        HN: item.hn,
        กองทุน: item.fund,
        'ยอดค่าใช้จ่าย (บาท)': item.amount,
        เหตุผลที่ไม่ประสงค์เบิก: item.reason,
        ผู้บันทึก: item.recordedBy,
        วันเวลาที่บันทึก: formatThaiDateTime(item.recordedAt),
      };
    });

    detailRows.push({
      ลำดับ: '' as any,
      เดือน: 'รวมทั้งสิ้น',
      วันที่รับบริการ: '',
      HN: `${displayedItems.length} รายการ`,
      กองทุน: '',
      'ยอดค่าใช้จ่าย (บาท)': displayedTotalAmount,
      เหตุผลที่ไม่ประสงค์เบิก: '',
      ผู้บันทึก: '',
      วันเวลาที่บันทึก: '',
    });

    const wsDetail = XLSX.utils.json_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, wsDetail, 'รายการไม่ประสงค์เบิก');

    // Sheet 2: สรุปรายเดือน 12 เดือน
    const summaryRows = monthlySummaries.map((m, idx) => ({
      ลำดับ: idx + 1,
      ประจำเดือน: m.monthName,
      'จำนวนรายการ (HN)': m.count,
      'ยอดค่าใช้จ่ายรวม (บาท)': m.totalAmount,
      กองทุนที่พบ: m.uniqueFunds.join(', ') || '-',
    }));

    summaryRows.push({
      ลำดับ: '' as any,
      ประจำเดือน: 'รวมทั้งปีงบประมาณ 2570',
      'จำนวนรายการ (HN)': annualTotalCount,
      'ยอดค่าใช้จ่ายรวม (บาท)': annualTotalAmount,
      กองทุนที่พบ: '',
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปยอดรวมรายเดือน');

    const filename =
      viewMode === 'month'
        ? `รายงานไม่ประสงค์เบิก_${monthInfo.name}_รพ.ท่าคันโท.xlsx`
        : `รายงานไม่ประสงค์เบิก_รวมทั้งปี2570_รพ.ท่าคันโท.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <FileX2 className="w-3.5 h-3.5" /> ทะเบียนไม่ประสงค์เบิก
            </span>
            <span className="text-xs text-slate-500">
              โรงพยาบาลท่าคันโท | ปีงบประมาณ 2570
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            บันทึกข้อมูลไม่ประสงค์เบิก (HN / กองทุน / ยอดค่าใช้จ่าย / เหตุผล)
          </h2>
          <p className="text-xs text-slate-500">
            กรอกข้อมูลผู้รับบริการที่ไม่ประสงค์เบิกชดเชย แล้วกดปุ่ม{' '}
            <strong className="text-slate-700">"บันทึกข้อมูล"</strong>{' '}
            ระบบจะคำนวณสรุปยอดรวมรายเดือนให้อัตโนมัติ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-2 mr-1.5" />
            <select
              value={selectedMonthKey}
              onChange={e => handleSelectMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 py-1.5 pr-6 pl-1 focus:outline-none cursor-pointer"
            >
              {FISCAL_YEAR_2570_MONTHS.map(m => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>

          {/* Sync / Save All Button */}
          <button
            type="button"
            onClick={handleConfirmSyncAll}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F4E79] hover:bg-blue-900 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกข้อมูลทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Save Confirmation Toast Banner */}
      {saveMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-2xl p-4 shadow-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-950">{saveMessage}</h4>
              <p className="text-xs text-emerald-700">
                ข้อมูลถูกจัดเก็บลงฐานข้อมูลกลางของโรงพยาบาลท่าคันโท และอัปเดตยอดรวมประจำเดือนเรียบร้อยแล้ว
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveMessage(null)}
            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Entry Form Card */}
      <div
        className={`bg-white rounded-2xl shadow-sm border-2 transition-all p-6 ${
          editingId ? 'border-amber-400 bg-amber-50/10' : 'border-blue-200'
        }`}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
                editingId ? 'bg-amber-600' : 'bg-[#1F4E79]'
              }`}
            >
              {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingId
                  ? 'แก้ไขรายการไม่ประสงค์เบิก'
                  : 'แบบฟอร์มกรอกข้อมูล ไม่ประสงค์เบิก'}
              </h3>
              <p className="text-xs text-slate-500">
                กรอกข้อมูล HN / กองทุน / ยอดค่าใช้จ่าย / เหตุผลที่ไม่ประสงค์เบิก เมื่อครบถ้วนแล้วกดปุ่ม{' '}
                <strong className="text-[#1F4E79]">"บันทึกข้อมูล"</strong>
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> ยกเลิกการแก้ไข
            </button>
          )}
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveData} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. ประจำเดือน */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ประจำเดือน <span className="text-rose-500">*</span>
              </label>
              <select
                value={formMonthKey}
                onChange={e => {
                  setFormMonthKey(e.target.value);
                  setSelectedMonthKey(e.target.value);
                  onSelectMonth(e.target.value);
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {FISCAL_YEAR_2570_MONTHS.map(m => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. วันที่รับบริการ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                วันที่รับบริการ
              </label>
              <input
                type="date"
                value={formServiceDate}
                onChange={e => setFormServiceDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* 3. HN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                HN (เลขประจำตัวผู้ป่วย) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formHn}
                onChange={e => setFormHn(e.target.value)}
                placeholder="เช่น 6700125 หรือ HN-1024"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            {/* 4. กองทุน */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                กองทุน <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedFundOption}
                onChange={e => setSelectedFundOption(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                {STANDARD_FUNDS.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {selectedFundOption === 'กองทุนอื่นๆ (ระบุเอง)' && (
                <input
                  type="text"
                  value={customFund}
                  onChange={e => setCustomFund(e.target.value)}
                  placeholder="ระบุชื่อกองทุน..."
                  className="mt-2 w-full px-3 py-2 bg-white border border-blue-400 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
            </div>

            {/* 5. ยอดค่าใช้จ่าย */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ยอดค่าใช้จ่าย (บาท) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3.5 pr-12 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-rose-700 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-right"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  บาท
                </span>
              </div>
            </div>
          </div>

          {/* 6. เหตุผลที่ไม่ประสงค์เบิก */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              เหตุผลที่ไม่ประสงค์เบิก <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  placeholder="ระบุสาเหตุหรือเหตุผลที่ไม่ประสงค์เบิก..."
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
                {/* Quick select reason pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">
                    เลือกเหตุผลด่วน:
                  </span>
                  {QUICK_REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormReason(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        formReason === r
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      + {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit / Save Button */}
              <div className="flex items-start gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-7 py-3 rounded-xl text-sm font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-w-[190px] ${
                    editingId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* KPI Cards: Monthly & Annual Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Selected Month Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              จำนวนไม่ประสงค์เบิก ({monthInfo.shortName})
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatNumber(currentMonthSummary.count)}{' '}
            <span className="text-xs font-semibold text-slate-500">รายการ (HN)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ประจำเดือน{monthInfo.name}
          </p>
        </div>

        {/* Card 2: Selected Month Total Expense */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-gradient-to-br from-white to-rose-50/30 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800">
              รวมยอดค่าใช้จ่าย ({monthInfo.shortName})
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            {formatMoney(currentMonthSummary.totalAmount)}{' '}
            <span className="text-xs font-semibold text-rose-600">บาท</span>
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1">
            สรุปยอดไม่ประสงค์เบิกเดือน{monthInfo.name}
          </p>
        </div>

        {/* Card 3: Annual Total Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              รวมจำนวนรายการทั้งปี 2570
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatNumber(annualTotalCount)}{' '}
            <span className="text-xs font-semibold text-slate-500">รายการ (HN)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            สะสม 12 เดือน (ต.ค. 69 – ก.ย. 70)
          </p>
        </div>

        {/* Card 4: Annual Total Expense */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1F4E79]">
              รวมยอดค่าใช้จ่ายทั้งปี 2570
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1F4E79] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1F4E79]">
            {formatMoney(annualTotalAmount)}{' '}
            <span className="text-xs font-semibold text-blue-700">บาท</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ยอดรวมไม่ประสงค์เบิกตลอดปีงบประมาณ
          </p>
        </div>
      </div>

      {/* Detailed Table for Selected Month / All Months */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileX2 className="w-5 h-5 text-rose-600" />
              <span>
                รายการผู้รับบริการที่ไม่ประสงค์เบิก{' '}
                {viewMode === 'month' ? `ประจำเดือน${monthInfo.name}` : '(รวมทั้งหมด 12 เดือน)'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงรายละเอียด HN, กองทุน, ยอดค่าใช้จ่าย และเหตุผลที่ไม่ประสงค์เบิก พร้อมสรุปยอดรวมท้ายตาราง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Month vs All */}
            <div className="inline-flex rounded-xl bg-slate-200/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-[#1F4E79] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เฉพาะเดือน {monthInfo.shortName}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-white text-[#1F4E79] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ดูทั้งหมดทุกเดือน ({items.length})
              </button>
            </div>

            {/* Fund filter */}
            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={fundFilter}
                onChange={e => setFundFilter(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer max-w-[180px]"
              >
                <option value="all">ทุกกองทุน</option>
                {allAvailableFunds.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหา HN / กองทุน / เหตุผล..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Fund breakdown pills if items exist */}
        {fundBreakdown.length > 0 && (
          <div className="px-5 py-3 bg-blue-50/40 border-b border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">
              สรุปแยกตามกองทุน ({viewMode === 'month' ? monthInfo.shortName : 'ทั้งปี'}):
            </span>
            {fundBreakdown.map(fb => (
              <span
                key={fb.fund}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>{fb.fund}:</span>
                <strong className="text-slate-900">{fb.count} เคส</strong>
                <span className="text-rose-700 font-bold">({formatMoney(fb.amount)} บ.)</span>
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1F4E79] text-white text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold text-center w-14">#</th>
                <th className="py-3 px-4 font-bold">ประจำเดือน / วันที่</th>
                <th className="py-3 px-4 font-bold">HN</th>
                <th className="py-3 px-4 font-bold">กองทุน</th>
                <th className="py-3 px-4 font-bold text-right">ยอดค่าใช้จ่าย (บาท)</th>
                <th className="py-3 px-4 font-bold">เหตุผลที่ไม่ประสงค์เบิก</th>
                <th className="py-3 px-4 font-bold">ผู้บันทึก</th>
                <th className="py-3 px-4 font-bold text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileX2 className="w-10 h-10 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">
                        ยังไม่มีรายการไม่ประสงค์เบิกใน{viewMode === 'month' ? `เดือน${monthInfo.name}` : 'ระบบ'}
                      </p>
                      <p className="text-xs text-slate-400">
                        กรอกข้อมูล HN, กองทุน, ยอดค่าใช้จ่าย และเหตุผลที่แบบฟอร์มด้านบน แล้วกดปุ่ม "บันทึกข้อมูล"
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, idx) => {
                  const itemMonth = getMonthInfo(item.monthKey);
                  const isEditingThis = editingId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isEditingThis ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-semibold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{itemMonth.name}</div>
                        {item.serviceDate && (
                          <div className="text-[11px] text-slate-500">
                            วันที่รับบริการ: {formatThaiDate(item.serviceDate)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-sm text-[#1F4E79] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {item.hn}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{item.fund}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-sm text-rose-700">
                          {formatMoney(item.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {item.reason}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div className="font-semibold text-slate-700">{item.recordedBy}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatThaiDateTime(item.recordedAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                            title="แก้ไขรายการ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50/90 border-t-2 border-amber-300 font-bold text-slate-900">
                <td colSpan={4} className="py-3.5 px-4 text-right text-sm">
                  สรุปยอดรวม{viewMode === 'month' ? `ประจำเดือน${monthInfo.name}` : 'ทั้งหมดที่แสดง'} ({formatNumber(displayedItems.length)} รายการ):
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base text-rose-700">
                  {formatMoney(displayedTotalAmount)} บาท
                </td>
                <td colSpan={3} className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={handleConfirmSyncAll}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูล</span>
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 12-Month Summary Table (สรุปยอดรวมในแต่ละเดือน ปีงบประมาณ 2570) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1F4E79]" />
              <span>ตารางสรุปยอดรวมไม่ประสงค์เบิก ในแต่ละเดือน (ปีงบประมาณ 2570)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่แถวของแต่ละเดือนเพื่อดูหรือเพิ่มรายการไม่ประสงค์เบิกของเดือนนั้น
            </p>
          </div>
          <div className="text-xs font-bold text-[#1F4E79] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            รวมทั้งปี: {formatNumber(annualTotalCount)} รายการ | {formatMoney(annualTotalAmount)} บาท
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs border-b border-slate-200">
                <th className="py-3 px-4 font-bold text-center w-14">ลำดับ</th>
                <th className="py-3 px-4 font-bold">เดือน (ปีงบประมาณ 2570)</th>
                <th className="py-3 px-4 font-bold text-right">จำนวนรายการ (HN)</th>
                <th className="py-3 px-4 font-bold text-right">สรุปยอดค่าใช้จ่ายรวม (บาท)</th>
                <th className="py-3 px-4 font-bold">กองทุนที่มีรายการ</th>
                <th className="py-3 px-4 font-bold text-center w-32">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {monthlySummaries.map((m, index) => {
                const isSelected = m.monthKey === selectedMonthKey;
                return (
                  <tr
                    key={m.monthKey}
                    onClick={() => {
                      handleSelectMonth(m.monthKey);
                      setViewMode('month');
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 font-semibold'
                        : m.count > 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/30 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-semibold">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{m.monthName}</span>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F4E79] text-white font-bold">
                            กำลังเลือก
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {m.count > 0 ? `${formatNumber(m.count)} รายการ` : '0 รายการ'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={m.totalAmount > 0 ? 'text-rose-700 text-sm' : 'text-slate-400'}>
                        {formatMoney(m.totalAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {m.uniqueFunds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.uniqueFunds.map(f => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] border border-slate-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectMonth(m.monthKey);
                          setViewMode('month');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-[#1F4E79] border border-blue-200 transition-colors cursor-pointer"
                      >
                        เลือกเดือนนี้
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#1F4E79] text-white font-bold text-xs">
                <td colSpan={2} className="py-3.5 px-4 text-right text-sm">
                  รวมทั้งปีงบประมาณ 2570 (12 เดือน):
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-sm">
                  {formatNumber(annualTotalCount)} รายการ
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base text-amber-300">
                  {formatMoney(annualTotalAmount)} บาท
                </td>
                <td colSpan={2} className="py-3.5 px-4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
