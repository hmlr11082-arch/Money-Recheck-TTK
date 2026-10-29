import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  Edit3,
  FileText,
  Filter,
  Plus,
  Receipt,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { GoogleDriveService } from '../services/googleDriveService';
import { StorageService } from '../services/storage';
import { ConditionCItem, MonthlyClosing, MonthStatus, User } from '../types';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatCount,
  formatMoney,
  formatThaiFullDate,
  formatThaiShortDate,
  getMonthInfo,
  STATUS_CONFIG,
} from '../utils/formatters';

interface ClaimTrackingPageProps {
  currentUser: User;
  onSelectMonth: (monthKey: string) => void;
  onNavigateTab: (tabKey: any) => void;
}

export const ClaimTrackingPage: React.FC<ClaimTrackingPageProps> = ({
  currentUser,
  onSelectMonth,
  onNavigateTab,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2569-10');
  const [filterCStatus, setFilterCStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal for adding / editing a single Condition C row
  const [showCModal, setShowCModal] = useState(false);
  const [editingCItem, setEditingCItem] = useState<ConditionCItem | null>(null);
  const [cFormHn, setCFormHn] = useState('');
  const [cFormService, setCFormService] = useState('');
  const [cFormCode, setCFormCode] = useState('C01');
  const [cFormDetail, setCFormDetail] = useState('');
  const [cFormAmount, setCFormAmount] = useState('0');
  const [cFormStatus, setCFormStatus] = useState<'pending' | 'resolved' | 'rejected'>('pending');

  const closings = StorageService.getClosings();
  const selectedClosing = closings.find(c => c.monthKey === selectedMonthKey) || closings[0];
  const monthInfo = getMonthInfo(selectedMonthKey);
  const services = StorageService.getServices().filter(s => s.isActive);

  // Editable fields state for selected month
  const [claimedCount, setClaimedCount] = useState<number>(0);
  const [claimedAmount, setClaimedAmount] = useState<number>(0);
  const [paidCount, setPaidCount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [conditionCCount, setConditionCCount] = useState<number>(0);
  const [conditionCAmount, setConditionCAmount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [claimDate, setClaimDate] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>('');
  const [monthStatus, setMonthStatus] = useState<MonthStatus>('draft');
  const [conditionCList, setConditionCList] = useState<ConditionCItem[]>([]);

  // Load selected month data into form
  useEffect(() => {
    const currentCls = StorageService.getClosing(selectedMonthKey);
    const d = currentCls.claimDetails || {
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
    };

    setClaimedCount(d.claimedCount || 0);
    setClaimedAmount(d.claimedAmount || 0);
    setPaidCount(d.paidCount || 0);
    setPaidAmount(d.paidAmount || 0);
    setConditionCCount(d.conditionCCount || 0);
    setConditionCAmount(d.conditionCAmount || 0);
    setPendingCount(d.pendingCount || 0);
    setPendingAmount(d.pendingAmount || 0);
    setBatchNumber(d.batchNumber || '');
    setClaimDate(d.claimDate || '');
    setPaidDate(d.paidDate || '');
    setMonthStatus(currentCls.status || 'draft');
    setConditionCList(d.conditionCList || []);
    setIsSavedSuccess(false);
  }, [selectedMonthKey, refreshTrigger]);

  // Overall NHSO Claim Stats across all months
  let totalClaimedPeople = 0;
  let totalClaimedMoney = 0;
  let totalPaidPeople = 0;
  let totalPaidMoney = 0;
  let totalConditionCPeople = 0;
  let totalConditionCMoney = 0;
  let totalPendingPeople = 0;
  let totalPendingMoney = 0;

  closings.forEach(c => {
    if (c.monthKey === selectedMonthKey) {
      // Use current live values for selected month
      totalClaimedPeople += claimedCount;
      totalClaimedMoney += claimedAmount;
      totalPaidPeople += paidCount;
      totalPaidMoney += paidAmount;
      totalConditionCPeople += conditionCCount;
      totalConditionCMoney += conditionCAmount;
      totalPendingPeople += pendingCount;
      totalPendingMoney += pendingAmount;
    } else if (c.claimDetails) {
      totalClaimedPeople += c.claimDetails.claimedCount || 0;
      totalClaimedMoney += c.claimDetails.claimedAmount || 0;
      totalPaidPeople += c.claimDetails.paidCount || 0;
      totalPaidMoney += c.claimDetails.paidAmount || 0;
      totalConditionCPeople += c.claimDetails.conditionCCount || 0;
      totalConditionCMoney += c.claimDetails.conditionCAmount || 0;
      totalPendingPeople += c.claimDetails.pendingCount || 0;
      totalPendingMoney += c.claimDetails.pendingAmount || 0;
    }
  });

  const remainingBalance = totalClaimedMoney - totalPaidMoney;

  // Filter Condition C cases
  const filteredCList = conditionCList.filter(item => {
    if (filterCStatus !== 'all' && item.status !== filterCStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.patientCode.toLowerCase().includes(q) ||
        item.serviceName.toLowerCase().includes(q) ||
        item.errorCode.toLowerCase().includes(q) ||
        item.errorDetail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Auto-calculate pending values
  const handleAutoCalculate = () => {
    const calcPendingPeople = Math.max(0, claimedCount - paidCount - conditionCCount);
    const calcPendingMoney = Math.max(0, claimedAmount - paidAmount - conditionCAmount);
    setPendingCount(calcPendingPeople);
    setPendingAmount(calcPendingMoney);
  };

  // Save Claim & Statement Details
  const handleSaveClaimDetails = () => {
    const updatedDetails: MonthlyClosing['claimDetails'] = {
      claimedCount: Number(claimedCount) || 0,
      claimedAmount: Number(claimedAmount) || 0,
      paidCount: Number(paidCount) || 0,
      paidAmount: Number(paidAmount) || 0,
      conditionCCount: Number(conditionCCount) || 0,
      conditionCAmount: Number(conditionCAmount) || 0,
      pendingCount: Number(pendingCount) || 0,
      pendingAmount: Number(pendingAmount) || 0,
      batchNumber: batchNumber.trim(),
      claimDate,
      paidDate,
      conditionCList,
    };

    StorageService.updateClaimDetails(selectedMonthKey, updatedDetails);
    StorageService.updateClosingStatus(selectedMonthKey, monthStatus);

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);

    // Auto-sync in background
    if (GoogleDriveService.getStatus().isConnected) {
      GoogleDriveService.syncToDrive().catch(console.warn);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  // Toggle resolve status of a single Condition C row
  const handleToggleResolveConditionC = (cId: string) => {
    const updated = conditionCList.map(item => {
      if (item.id === cId) {
        return {
          ...item,
          status: (item.status === 'resolved' ? 'pending' : 'resolved') as 'pending' | 'resolved',
        };
      }
      return item;
    });

    const activeCCount = updated.filter(i => i.status === 'pending').length;
    const activeCAmount = updated
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    setConditionCList(updated);
    setConditionCCount(activeCCount);
    setConditionCAmount(activeCAmount);

    StorageService.updateClaimDetails(selectedMonthKey, {
      conditionCList: updated,
      conditionCCount: activeCCount,
      conditionCAmount: activeCAmount,
    });
  };

  // Delete a Condition C item
  const handleDeleteConditionC = (cId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายการติด C นี้?')) {
      const updated = conditionCList.filter(item => item.id !== cId);
      const activeCCount = updated.filter(i => i.status === 'pending').length;
      const activeCAmount = updated
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + (i.amount || 0), 0);

      setConditionCList(updated);
      setConditionCCount(activeCCount);
      setConditionCAmount(activeCAmount);

      StorageService.updateClaimDetails(selectedMonthKey, {
        conditionCList: updated,
        conditionCCount: activeCCount,
        conditionCAmount: activeCAmount,
      });
    }
  };

  // Open modal to add a new Condition C item
  const handleOpenAddCModal = () => {
    setEditingCItem(null);
    setCFormHn(`HN-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`);
    setCFormService(services[0]?.name || 'บริการฝากครรภ์');
    setCFormCode('C01');
    setCFormDetail('เลขประจำตัว 13 หลักไม่ตรงกับฐานข้อมูลทะเบียนราษฎร์ (DOPA)');
    setCFormAmount('60');
    setCFormStatus('pending');
    setShowCModal(true);
  };

  // Open modal to edit existing Condition C item
  const handleOpenEditCModal = (item: ConditionCItem) => {
    setEditingCItem(item);
    setCFormHn(item.patientCode);
    setCFormService(item.serviceName);
    setCFormCode(item.errorCode);
    setCFormDetail(item.errorDetail);
    setCFormAmount(item.amount.toString());
    setCFormStatus(item.status);
    setShowCModal(true);
  };

  // Save the Condition C modal
  const handleSaveCModal = () => {
    if (!cFormHn.trim()) {
      alert('กรุณากรอกรหัสผู้ป่วย (HN)');
      return;
    }

    const amt = parseFloat(cFormAmount) || 0;
    let updatedList: ConditionCItem[] = [];

    if (editingCItem) {
      updatedList = conditionCList.map(item =>
        item.id === editingCItem.id
          ? {
              ...item,
              patientCode: cFormHn.trim(),
              serviceName: cFormService.trim(),
              errorCode: cFormCode.trim(),
              errorDetail: cFormDetail.trim(),
              amount: amt,
              status: cFormStatus,
            }
          : item
      );
    } else {
      const newItem: ConditionCItem = {
        id: `c-${Date.now()}`,
        patientCode: cFormHn.trim(),
        serviceName: cFormService.trim(),
        errorCode: cFormCode.trim(),
        errorDetail: cFormDetail.trim(),
        amount: amt,
        status: cFormStatus,
      };
      updatedList = [newItem, ...conditionCList];
    }

    const activeCCount = updatedList.filter(i => i.status === 'pending').length;
    const activeCAmount = updatedList
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    setConditionCList(updatedList);
    setConditionCCount(activeCCount);
    setConditionCAmount(activeCAmount);

    StorageService.updateClaimDetails(selectedMonthKey, {
      conditionCList: updatedList,
      conditionCCount: activeCCount,
      conditionCAmount: activeCAmount,
    });

    setShowCModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                ระบบ e-Claim สปสช.
              </span>
              <span className="text-xs text-slate-500">ปีงบประมาณ 2570</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-[#1F4E79]" /> ศูนย์ติดตามสถานะการส่งเบิกและรายการติด C
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              แก้ไขตัวเลขผลการส่งเบิก บันทึกยอดเงินโอน และจัดการรายการติดเงื่อนไข (ติด C) ได้โดยตรง
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveClaimDetails}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {isSavedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>บันทึกเรียบร้อยแล้ว!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>บันทึกตัวเลขและสถานะส่งเบิก</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isSavedSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>บันทึกตัวเลขผลส่งเบิกและรายการติด C งวดเดือน {monthInfo.name} เรียบร้อยแล้ว ข้อมูลซิงค์เข้าฐานข้อมูลกลางทันที</span>
          </div>
        )}
      </div>

      {/* 4 Grand Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. ส่งเบิกกี่คน */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-blue-200/80 bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              1. ส่งเบิกแล้วทั้งหมด
            </span>
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1F4E79]">
              {formatCount(totalClaimedPeople)} <span className="text-sm font-normal text-slate-500">คน</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">
              ยอดส่งเบิก: ฿{formatMoney(totalClaimedMoney)}
            </div>
          </div>
        </div>

        {/* 2. ได้รับเงินแล้วกี่คน */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              2. ได้รับเงินชดเชยแล้ว
            </span>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {formatCount(totalPaidPeople)} <span className="text-sm font-normal text-slate-500">คน</span>
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">
              โอนเงินแล้ว: ฿{formatMoney(totalPaidMoney)}
            </div>
          </div>
        </div>

        {/* 3. สถานะติด C */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border-2 border-red-300 bg-gradient-to-br from-white to-red-50/60 shadow-red-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" /> 3. สถานะติด C (รอแก้ไข)
            </span>
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600">
              {formatCount(totalConditionCPeople)} <span className="text-sm font-normal text-red-400">คน</span>
            </div>
            <div className="text-xs text-red-700 font-bold mt-1">
              ยอดเงินติด C: ฿{formatMoney(totalConditionCMoney)}
            </div>
          </div>
        </div>

        {/* 4. รอตรวจสอบ / ยอดคงเหลือค้างรับ */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              4. รอตรวจสอบ / ยอดค้างรับ
            </span>
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-800">
              {formatCount(totalPendingPeople)} <span className="text-sm font-normal text-slate-500">คน</span>
            </div>
            <div className="text-xs text-amber-900 font-bold mt-1">
              ยอดคงเหลือค้างรับ: ฿{formatMoney(remainingBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Interactive Editor for Selected Month */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-[#1F4E79] rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                แก้ไขตัวเลขและสถานะส่งเบิกรายเดือน
              </h3>
              <p className="text-xs text-slate-500">
                สามารถพิมพ์แก้ไขตัวเลขจำนวนคน ยอดเงิน และสถานะได้ทันที พร้อมกดบันทึก
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">เลือกงวดเดือน:</span>
            <select
              value={selectedMonthKey}
              onChange={e => setSelectedMonthKey(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-sm text-[#1F4E79] bg-white shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {FISCAL_YEAR_2570_MONTHS.map(m => (
                <option key={m.key} value={m.key}>
                  งวดเดือน {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Direct Number Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. ส่งเบิก */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">1. ยอดส่งเบิก สปสช.</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Claimed</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">จำนวนคนส่งเบิก (คน)</label>
              <input
                type="number"
                min="0"
                value={claimedCount === 0 ? '' : claimedCount}
                onChange={e => setClaimedCount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ยอดเงินส่งเบิก (บาท)</label>
              <input
                type="number"
                min="0"
                value={claimedAmount === 0 ? '' : claimedAmount}
                onChange={e => setClaimedAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-sm text-blue-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 2. ได้รับเงินชดเชยแล้ว */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">2. ยอดโอนชดเชยแล้ว</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Paid</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ได้รับเงินแล้ว (คน)</label>
              <input
                type="number"
                min="0"
                value={paidCount === 0 ? '' : paidCount}
                onChange={e => setPaidCount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ยอดเงินที่ได้รับโอน (บาท)</label>
              <input
                type="number"
                min="0"
                value={paidAmount === 0 ? '' : paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-bold text-sm text-emerald-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 3. สถานะติด C */}
          <div className="p-4 rounded-xl border border-red-300 bg-red-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900">3. รายการติด C</span>
              <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">Cond C</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">จำนวนคนติด C (คน)</label>
              <input
                type="number"
                min="0"
                value={conditionCCount === 0 ? '' : conditionCCount}
                onChange={e => setConditionCCount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg font-bold text-sm text-red-700 focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ยอดเงินติด C (บาท)</label>
              <input
                type="number"
                min="0"
                value={conditionCAmount === 0 ? '' : conditionCAmount}
                onChange={e => setConditionCAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg font-bold text-sm text-red-700 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* 4. รอตรวจสอบ / ยอดค้างรับ */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">4. รอตรวจสอบ/ค้างรับ</span>
              <button
                type="button"
                onClick={handleAutoCalculate}
                className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="คลิกเพื่อคำนวณยอดคงเหลืออัตโนมัติ"
              >
                <Calculator className="w-3 h-3" /> คำนวณ
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">รอตรวจสอบ (คน)</label>
              <input
                type="number"
                min="0"
                value={pendingCount === 0 ? '' : pendingCount}
                onChange={e => setPendingCount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ยอดเงินค้างรับ (บาท)</label>
              <input
                type="number"
                min="0"
                value={pendingAmount === 0 ? '' : pendingAmount}
                onChange={e => setPendingAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-bold text-sm text-amber-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Statement Metadata & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              เลขที่ Statement / หนังสือส่งเบิก:
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="เช่น STM-2570-10-001"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              วันที่ส่งข้อมูล e-Claim:
            </label>
            <input
              type="date"
              value={claimDate}
              onChange={e => setClaimDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              วันที่ สปสช. โอนเงินชดเชย:
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={e => setPaidDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-emerald-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              สถานะงวดเดือนนี้:
            </label>
            <select
              value={monthStatus}
              onChange={e => setMonthStatus(e.target.value as MonthStatus)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="draft">ร่าง (Draft) - กำลังบันทึก</option>
              <option value="submitted">ส่งตรวจแล้ว (Submitted)</option>
              <option value="approved">อนุมัติแล้ว (Approved)</option>
              <option value="claimed">ส่งเบิก สปสช. แล้ว (Claimed)</option>
              <option value="paid">ได้รับเงินโอนแล้ว (Paid)</option>
            </select>
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            * กดปุ่ม <strong>"บันทึกตัวเลขและสถานะส่งเบิก"</strong> เพื่ออัปเดตข้อมูลขึ้นระบบส่วนกลางและ Google Drive
          </div>
          <button
            onClick={handleSaveClaimDetails}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isSavedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>บันทึกตัวเลขงวดนี้เรียบร้อยแล้ว!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>บันทึกตัวเลขและสถานะส่งเบิกงวด {monthInfo.name}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Condition C Table for this Month */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>รายการผู้รับบริการที่ "ติด C" (Condition C) งวดเดือน {monthInfo.name}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              สามารถเพิ่ม แก้ไขตัวเลขยอดเงิน หรือลบรายการติด C ได้โดยตรง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหา HN / รหัส C..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-40 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterCStatus}
              onChange={e => setFilterCStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอแก้ไข (Pending)</option>
              <option value="resolved">แก้ไขแล้ว (Resolved)</option>
            </select>

            {/* Add Condition C Item Button */}
            <button
              onClick={handleOpenAddCModal}
              className="px-3.5 py-1.5 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการติด C</span>
            </button>
          </div>
        </div>

        {filteredCList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">ไม่พบรายการติด C ในเดือนนี้</p>
            <p className="text-slate-400 mt-0.5">
              สามารถคลิกปุ่ม <strong>"+ เพิ่มรายการติด C"</strong> เพื่อเริ่มบันทึกเคสที่ติดเงื่อนไข
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">รหัสผู้ป่วย (HN)</th>
                  <th className="py-2.5 px-3">รายการบริการ</th>
                  <th className="py-2.5 px-3">รหัส C</th>
                  <th className="py-2.5 px-4">สาเหตุข้อผิดพลาดจาก สปสช.</th>
                  <th className="py-2.5 px-3 text-right">ยอดเงิน (บาท)</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                  <th className="py-2.5 px-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {item.patientCode}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.serviceName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 font-mono font-bold rounded border border-red-200">
                        {item.errorCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {item.errorDetail}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#1F4E79]">
                      ฿{formatMoney(item.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleResolveConditionC(item.id)}
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border transition-colors cursor-pointer ${
                          item.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                        }`}
                        title="คลิกเพื่อสลับสถานะ"
                      >
                        {item.status === 'resolved' ? 'แก้ไขแล้ว ✓' : 'รอแก้ไข ⏳'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditCModal(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="แก้ไขรายการนี้"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteConditionC(item.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Common Condition C Guide Reference */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> คู่มือรหัสข้อผิดพลาดติด C ที่พบบ่อยของ สปสช.
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              C01
            </span>
            <h5 className="font-semibold text-slate-800 mt-1.5">ข้อมูลประชากรไม่ตรง (DOPA)</h5>
            <p className="text-slate-500 text-[11px] mt-0.5">
              เลขประจำตัว 13 หลัก, ชื่อ-สกุล หรือวันเกิดไม่ตรงกับฐานข้อมูลทะเบียนราษฎร์
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              C05
            </span>
            <h5 className="font-semibold text-slate-800 mt-1.5">เกินความถี่สิทธิประโยชน์</h5>
            <p className="text-slate-500 text-[11px] mt-0.5">
              ผู้รับบริการเคยรับบริการนี้แล้วในรอบปีงบประมาณเดียวกันจากหน่วยบริการอื่น
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              C12
            </span>
            <h5 className="font-semibold text-slate-800 mt-1.5">ขาดเอกสารแนบยืนยัน</h5>
            <p className="text-slate-500 text-[11px] mt-0.5">
              ไม่ได้แนบผล Lab ยืนยัน หรือไม่มีเอกสารระบุวันที่เข้ารับบริการในระบบ
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              C23
            </span>
            <h5 className="font-semibold text-slate-800 mt-1.5">รหัสโรคไม่สัมพันธ์กับหัตถการ</h5>
            <p className="text-slate-500 text-[11px] mt-0.5">
              รหัส ICD-10 หรือ ICD-9-CM ไม่ตรงกับเงื่อนไขการเบิกจ่ายชดเชยของบริการนั้น
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Condition C Item */}
      {showCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>{editingCItem ? 'แก้ไขรายการติด C' : 'เพิ่มรายการผู้ป่วยติด C'}</span>
              </h3>
              <button
                onClick={() => setShowCModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสผู้ป่วย (HN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cFormHn}
                  onChange={e => setCFormHn(e.target.value)}
                  placeholder="เช่น HN-6900123"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รายการบริการสุขภาพ
                </label>
                <select
                  value={cFormService}
                  onChange={e => setCFormService(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                  <option value="บริการส่งเสริมสุขภาพอื่นๆ">บริการส่งเสริมสุขภาพอื่นๆ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    รหัสข้อผิดพลาด C
                  </label>
                  <select
                    value={cFormCode}
                    onChange={e => setCFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="C01">C01 - ข้อมูลประชากรไม่ตรง (DOPA)</option>
                    <option value="C05">C05 - เกินความถี่สิทธิประโยชน์</option>
                    <option value="C12">C12 - ขาดเอกสารแนบยืนยัน</option>
                    <option value="C23">C23 - รหัสโรคไม่สัมพันธ์กับหัตถการ</option>
                    <option value="C99">C99 - ข้อผิดพลาดเงื่อนไขอื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ยอดเงินติด C (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cFormAmount}
                    onChange={e => setCFormAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-red-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สาเหตุและรายละเอียดข้อผิดพลาดจาก สปสช.
                </label>
                <textarea
                  rows={2}
                  value={cFormDetail}
                  onChange={e => setCFormDetail(e.target.value)}
                  placeholder="ระบุสาเหตุที่ สปสช. ปฏิเสธ หรือคำแนะนำการแก้ไข"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สถานะการแก้ไข
                </label>
                <select
                  value={cFormStatus}
                  onChange={e => setCFormStatus(e.target.value as 'pending' | 'resolved' | 'rejected')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="pending">รอแก้ไข (Pending)</option>
                  <option value="resolved">แก้ไขแล้ว (Resolved - พร้อมส่งซ้ำ)</option>
                  <option value="rejected">ปฏิเสธการจ่ายถาวร (Rejected)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveCModal}
                  className="px-5 py-2 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกรายการติด C</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
