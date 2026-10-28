import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Receipt,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { GoogleDriveService } from '../services/googleDriveService';
import { StorageService } from '../services/storage';
import { ConditionCItem, MonthlyClosing, User } from '../types';
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
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2569-11');
  const [filterCStatus, setFilterCStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDetails, setEditingDetails] = useState<MonthlyClosing['claimDetails'] | null>(null);

  const closings = StorageService.getClosings();
  const selectedClosing = closings.find(c => c.monthKey === selectedMonthKey) || closings[0];
  const monthInfo = getMonthInfo(selectedMonthKey);

  // Overall NHSO Claim Stats
  let totalClaimedPeople = 0;
  let totalClaimedMoney = 0;
  let totalPaidPeople = 0;
  let totalPaidMoney = 0;
  let totalConditionCPeople = 0;
  let totalConditionCMoney = 0;
  let totalPendingPeople = 0;
  let totalPendingMoney = 0;

  closings.forEach(c => {
    if (c.claimDetails) {
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
  const cList: ConditionCItem[] = selectedClosing.claimDetails?.conditionCList || [];
  const filteredCList = cList.filter(item => {
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

  const handleOpenEdit = () => {
    setEditingDetails({ ...selectedClosing.claimDetails });
    setShowEditModal(true);
  };

  const handleSaveClaimDetails = () => {
    if (editingDetails) {
      StorageService.updateClaimDetails(selectedMonthKey, editingDetails);
      setShowEditModal(false);
      if (GoogleDriveService.getStatus().isConnected) {
        GoogleDriveService.syncToDrive().catch(console.warn);
      }
    }
  };

  const handleResolveConditionC = (cId: string) => {
    const updatedList = (selectedClosing.claimDetails.conditionCList || []).map(item => {
      if (item.id === cId) {
        return { ...item, status: 'resolved' as const };
      }
      return item;
    });

    const resolvedCount = updatedList.filter(i => i.status === 'resolved').length;
    const remainingC = updatedList.length - resolvedCount;

    StorageService.updateClaimDetails(selectedMonthKey, {
      conditionCList: updatedList,
      conditionCCount: remainingC,
    });

    if (GoogleDriveService.getStatus().isConnected) {
      GoogleDriveService.syncToDrive().catch(console.warn);
    }
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
              ติดตามผลตอบกลับจาก สปสช., ตรวจสอบยอดโอนชดเชย, รายการติดเงื่อนไข (ติด C), และยอดรอตรวจสอบ
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenEdit}
              className="px-4 py-2 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 min-h-[40px]"
            >
              <Edit className="w-4 h-4" />
              <span>อัปเดตผลตอบกลับ สปสช. (Statement)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Grand Summary Counters (The core requirement in user's prompt!) */}
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
            <div className="text-xs text-slate-500 mt-1">
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
              <ShieldAlert className="w-4 h-4 text-red-600 animate-bounce" /> 3. สถานะติด C (รอแก้ไข)
            </span>
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600">
              {formatCount(totalConditionCPeople)} <span className="text-sm font-normal text-red-400">คน</span>
            </div>
            <div className="text-xs text-red-700 font-medium mt-1">
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
            <div className="text-xs text-amber-900 font-semibold mt-1">
              ยอดคงเหลือค้างรับ: ฿{formatMoney(remainingBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Select Specific Month for Detailed Statement */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              รายละเอียดผลการส่งเบิกรายเดือน
            </h3>
            <p className="text-xs text-slate-500">
              เลือกเดือนเพื่อดูสถิติและเคสที่ติด C ของงวดนั้น
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedMonthKey}
              onChange={e => setSelectedMonthKey(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-sm text-[#1F4E79] bg-white shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              {FISCAL_YEAR_2570_MONTHS.map(m => (
                <option key={m.key} value={m.key}>
                  งวดเดือน {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Month Summary Card */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400">เลขที่ Statement / หนังสือส่งเบิก:</span>
            <div className="font-bold text-slate-800 text-sm mt-0.5">
              {selectedClosing.claimDetails?.batchNumber || 'ยังไม่มีเลขที่หนังสือ'}
            </div>
          </div>

          <div>
            <span className="text-slate-400">วันที่ส่งข้อมูล e-Claim:</span>
            <div className="font-semibold text-slate-700 text-sm mt-0.5">
              {selectedClosing.claimDetails?.claimDate
                ? formatThaiFullDate(selectedClosing.claimDetails.claimDate)
                : '-'}
            </div>
          </div>

          <div>
            <span className="text-slate-400">วันที่ สปสช. โอนเงินชดเชย:</span>
            <div className="font-semibold text-emerald-700 text-sm mt-0.5">
              {selectedClosing.claimDetails?.paidDate
                ? formatThaiFullDate(selectedClosing.claimDetails.paidDate)
                : 'รอโอน'}
            </div>
          </div>

          <div>
            <span className="text-slate-400">สถานะงวดเดือนนี้:</span>
            <div className="mt-0.5">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${
                  STATUS_CONFIG[selectedClosing.status].badgeBg
                } ${STATUS_CONFIG[selectedClosing.status].badgeText} ${
                  STATUS_CONFIG[selectedClosing.status].badgeBorder
                }`}
              >
                {STATUS_CONFIG[selectedClosing.status].label}
              </span>
            </div>
          </div>
        </div>

        {/* Condition C Table for this Month */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" /> รายการผู้รับบริการที่ "ติด C" (Condition C) ในเดือนนี้
              </h4>
              <p className="text-xs text-slate-500">
                ต้องแก้ไขข้อมูลและส่งอุทธรณ์ซ้ำ (Re-submit) เพื่อขอรับเงินชดเชย
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหา HN / รหัสข้อผิดพลาด..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Status filter */}
              <select
                value={filterCStatus}
                onChange={e => setFilterCStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="pending">รอแก้ไข (Pending)</option>
                <option value="resolved">แก้ไขแล้ว (Resolved)</option>
              </select>
            </div>
          </div>

          {filteredCList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">ไม่พบรายการติด C ในเดือนนี้</p>
              <p className="text-slate-400 mt-0.5">
                ข้อมูลการส่งเบิกผ่านเกณฑ์ สปสช. หรือยังไม่ได้บันทึกผล Statement
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
                        {item.status === 'resolved' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 text-[10px]">
                            แก้ไขแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold border border-red-200 text-[10px]">
                            รอแก้ไข
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.status !== 'resolved' ? (
                          <button
                            onClick={() => handleResolveConditionC(item.id)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded font-semibold text-[11px] transition-colors"
                          >
                            บันทึกว่าแก้ไขแล้ว
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">พร้อมส่งซ้ำ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

      {/* Modal: Edit Claim Statement Details */}
      {showEditModal && editingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" /> บันทึกผลตอบกลับ สปสช. (Statement)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              งวดเดือน {monthInfo.name}
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เลขที่หนังสือส่งเบิก / Statement No.
                  </label>
                  <input
                    type="text"
                    value={editingDetails.batchNumber || ''}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        batchNumber: e.target.value,
                      }))
                    }
                    placeholder="เช่น STM-2570-11-042"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันที่ส่งข้อมูล e-Claim
                  </label>
                  <input
                    type="date"
                    value={editingDetails.claimDate || ''}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        claimDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    จำนวนคนส่งเบิก (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingDetails.claimedCount}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        claimedCount: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ยอดเงินส่งเบิก (บาท)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingDetails.claimedAmount}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        claimedAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div>
                  <label className="block font-bold text-emerald-900 mb-1">
                    ได้รับเงินแล้ว (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingDetails.paidCount}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        paidCount: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-900 mb-1">
                    ยอดเงินโอนชดเชยแล้ว (บาท)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingDetails.paidAmount}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        paidAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-red-50 p-3 rounded-xl border border-red-200">
                <div>
                  <label className="block font-bold text-red-900 mb-1">
                    ติด C (คน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingDetails.conditionCCount}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        conditionCCount: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-red-900 mb-1">
                    ยอดเงินติด C (บาท)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingDetails.conditionCAmount}
                    onChange={e =>
                      setEditingDetails(prev => ({
                        ...prev!,
                        conditionCAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  วันที่ สปสช. โอนเงิน (ถ้ามี)
                </label>
                <input
                  type="date"
                  value={editingDetails.paidDate || ''}
                  onChange={e =>
                    setEditingDetails(prev => ({
                      ...prev!,
                      paidDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveClaimDetails}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg shadow-xs"
              >
                บันทึกผล Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
