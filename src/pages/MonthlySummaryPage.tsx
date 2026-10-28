import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  FileSpreadsheet,
  Lock,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Undo2,
  Unlock,
} from 'lucide-react';
import { ExcelService } from '../services/excelService';
import { GoogleDriveService } from '../services/googleDriveService';
import { StorageService } from '../services/storage';
import { MonthStatus, ServiceRound, User } from '../types';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatCount,
  formatMoney,
  formatThaiFullDate,
  formatThaiShortDate,
  getMonthInfo,
  STATUS_CONFIG,
} from '../utils/formatters';

interface MonthlySummaryPageProps {
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  currentUser: User;
  onNavigateTab: (tabKey: any) => void;
}

export const MonthlySummaryPage: React.FC<MonthlySummaryPageProps> = ({
  currentMonthKey,
  onSelectMonth,
  currentUser,
  onNavigateTab,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [newRoundDate, setNewRoundDate] = useState('');
  const [newRoundName, setNewRoundName] = useState('');
  const [anomalyWarning, setAnomalyWarning] = useState<{
    serviceName: string;
    enteredCount: number;
    avgCount: number;
    roundId: string;
    serviceId: string;
  } | null>(null);

  // Quick edit rate modal
  const [editingRateService, setEditingRateService] = useState<{
    id: string;
    name: string;
    currentRate: number | null;
  } | null>(null);
  const [newRateValue, setNewRateValue] = useState<string>('');

  const month = getMonthInfo(currentMonthKey);
  const services = StorageService.getServices().filter(s => s.isActive);
  const rates = StorageService.getRates();
  const rounds = StorageService.getRounds(currentMonthKey);
  const entries = StorageService.getEntries();
  const closing = StorageService.getClosing(currentMonthKey);
  const settings = StorageService.getSettings();

  // Permission checks
  const isMonthLocked =
    (closing.status === 'approved' ||
      closing.status === 'claimed' ||
      closing.status === 'paid') &&
    currentUser.role !== 'admin';

  const canEditEntries =
    (currentUser.role === 'recorder' && closing.status === 'draft') ||
    currentUser.role === 'admin' ||
    (currentUser.role === 'checker' && closing.status === 'submitted');

  const canSubmitForReview =
    currentUser.role === 'recorder' && closing.status === 'draft';
  const canApprove =
    (currentUser.role === 'checker' || currentUser.role === 'admin') &&
    closing.status === 'submitted';
  const canReturnToDraft =
    (currentUser.role === 'checker' || currentUser.role === 'admin') &&
    closing.status === 'submitted';
  const canClaim =
    (currentUser.role === 'checker' || currentUser.role === 'admin') &&
    closing.status === 'approved';
  const canMarkPaid =
    (currentUser.role === 'checker' || currentUser.role === 'admin') &&
    closing.status === 'claimed';
  const canAdminUnlock =
    currentUser.role === 'admin' && closing.status !== 'draft';

  // Calculations for Excel view
  const tableData = useMemo(() => {
    let grandTotalCount = 0;
    let grandTotalAmount = 0;
    const roundTotals: number[] = new Array(rounds.length).fill(0);
    const missingRateServicesList: string[] = [];

    const rows = services.map(srv => {
      const rateObj = rates.find(r => r.serviceId === srv.id);
      const rate = rateObj?.rate ?? null;
      if (rate === null) {
        missingRateServicesList.push(srv.name);
      }

      let rowCount = 0;
      const roundCounts = rounds.map((r, rIdx) => {
        const ent = entries.find(e => e.roundId === r.id && e.serviceId === srv.id);
        const count = ent ? ent.count : 0;
        rowCount += count;
        roundTotals[rIdx] += count;
        return {
          roundId: r.id,
          count,
        };
      });

      grandTotalCount += rowCount;
      const rowAmount = rate !== null ? rowCount * rate : null;
      if (rowAmount !== null) {
        grandTotalAmount += rowAmount;
      }

      return {
        service: srv,
        rate,
        roundCounts,
        rowCount,
        rowAmount,
      };
    });

    return {
      rows,
      roundTotals,
      grandTotalCount,
      grandTotalAmount,
      missingRateServicesList,
    };
  }, [services, rates, rounds, entries, refreshTrigger]);

  const handleEntryChange = (roundId: string, serviceId: string, value: string) => {
    if (isMonthLocked) {
      alert('เดือนนี้ได้รับการอนุมัติแล้ว ข้อมูลถูกล็อก ไม่สามารถแก้ไขได้');
      return;
    }

    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num) || num < 0) return;

    // Check anomaly: count > 3x average
    if (settings.enableAnomalyWarning && num > 0) {
      const avg = StorageService.getServiceAverageCount(serviceId);
      if (avg > 0 && num > avg * settings.anomalyMultiplier) {
        const srv = services.find(s => s.id === serviceId);
        setAnomalyWarning({
          serviceName: srv ? srv.name : 'บริการ',
          enteredCount: num,
          avgCount: Math.round(avg),
          roundId,
          serviceId,
        });
        return;
      }
    }

    StorageService.saveEntry(roundId, serviceId, num);
    setRefreshTrigger(prev => prev + 1);
  };

  const confirmAnomalyEntry = () => {
    if (anomalyWarning) {
      StorageService.saveEntry(
        anomalyWarning.roundId,
        anomalyWarning.serviceId,
        anomalyWarning.enteredCount
      );
      setAnomalyWarning(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleAddRound = () => {
    if (!newRoundDate) {
      alert('กรุณาเลือกวันที่ให้บริการ');
      return;
    }

    // Validate that the date is inside the month
    if (!newRoundDate.startsWith(month.startDate.slice(0, 7))) {
      const confirmOutside = window.confirm(
        `วันที่ ${newRoundDate} อาจไม่ตรงกับเดือน ${month.name} คุณต้องการยืนยันเพิ่มรอบนี้หรือไม่?`
      );
      if (!confirmOutside) return;
    }

    StorageService.addRound(currentMonthKey, newRoundDate, newRoundName || undefined);
    setShowAddRoundModal(false);
    setNewRoundDate('');
    setNewRoundName('');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteRound = (round: ServiceRound) => {
    if (isMonthLocked) {
      alert('ข้อมูลถูกล็อก ไม่สามารถลบรอบบริการได้');
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${round.roundName}" (${formatThaiShortDate(round.date)})? ข้อมูลที่กรอกในรอบนี้จะถูกลบด้วย`)) {
      StorageService.deleteRound(round.id);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleUpdateStatus = (newStatus: MonthStatus, note?: string) => {
    StorageService.updateClosingStatus(currentMonthKey, newStatus, note);
    setRefreshTrigger(prev => prev + 1);
    if (GoogleDriveService.getStatus().isConnected) {
      GoogleDriveService.syncToDrive().catch(console.warn);
    }
  };

  const handleSaveRateQuick = () => {
    if (!editingRateService) return;
    const rateNum = newRateValue.trim() === '' ? null : parseFloat(newRateValue);
    if (rateNum !== null && (isNaN(rateNum) || rateNum < 0)) {
      alert('กรุณาระบุอัตราเบิกเป็นตัวเลขที่ถูกต้อง');
      return;
    }
    StorageService.updateServiceRate(editingRateService.id, rateNum);
    setEditingRateService(null);
    setNewRateValue('');
    setRefreshTrigger(prev => prev + 1);
    if (GoogleDriveService.getStatus().isConnected) {
      GoogleDriveService.syncToDrive().catch(console.warn);
    }
  };

  const statusConfig = STATUS_CONFIG[closing.status];

  // Month navigation
  const currentMonthIdx = FISCAL_YEAR_2570_MONTHS.findIndex(m => m.key === currentMonthKey);
  const prevMonth = currentMonthIdx > 0 ? FISCAL_YEAR_2570_MONTHS[currentMonthIdx - 1] : null;
  const nextMonth =
    currentMonthIdx < FISCAL_YEAR_2570_MONTHS.length - 1
      ? FISCAL_YEAR_2570_MONTHS[currentMonthIdx + 1]
      : null;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Bar with Month Switcher & Workflow Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Selector with Prev/Next */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => prevMonth && onSelectMonth(prevMonth.key)}
              disabled={!prevMonth}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <select
              value={currentMonthKey}
              onChange={e => onSelectMonth(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-base text-[#1F4E79] bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {FISCAL_YEAR_2570_MONTHS.map(m => (
                <option key={m.key} value={m.key}>
                  เดือน{m.name} (ปีงบ 2570)
                </option>
              ))}
            </select>

            <button
              onClick={() => nextMonth && onSelectMonth(nextMonth.key)}
              disabled={!nextMonth}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            {/* Status Badge */}
            <div className="flex items-center pl-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
              >
                สถานะ: {statusConfig.label}
              </span>
              {isMonthLocked && (
                <span className="ml-2 flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-3.5 h-3.5 mr-1" /> ล็อกแล้ว
                </span>
              )}
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Round Button */}
            {!isMonthLocked && (
              <button
                onClick={() => {
                  setNewRoundDate(month.startDate);
                  setNewRoundName(`ครั้งที่ ${rounds.length + 1}`);
                  setShowAddRoundModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรอบบริการ</span>
              </button>
            )}

            {/* Export Excel Button */}
            <button
              onClick={() => ExcelService.exportMonthlyExcel(currentMonthKey)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
              title="ส่งออกตารางเดือนนี้เป็นไฟล์ Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel</span>
            </button>

            {/* Role-based Workflow State Actions */}
            {canSubmitForReview && (
              <button
                onClick={() => {
                  if (tableData.missingRateServicesList.length > 0) {
                    if (
                      !window.confirm(
                        `มี ${tableData.missingRateServicesList.length} รายการที่ยังไม่กำหนดอัตราเบิก คุณต้องการส่งตรวจหรือไม่?`
                      )
                    )
                      return;
                  }
                  handleUpdateStatus('submitted');
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
              >
                <Send className="w-4 h-4" />
                <span>ส่งหัวหน้าตรวจ</span>
              </button>
            )}

            {canApprove && (
              <button
                onClick={() => handleUpdateStatus('approved')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
              >
                <Check className="w-4 h-4" />
                <span>อนุมัติยอด (ล็อกข้อมูล)</span>
              </button>
            )}

            {canReturnToDraft && (
              <button
                onClick={() => {
                  const reason = prompt('ระบุเหตุผลในการส่งกลับแก้ไข:', 'ข้อมูลไม่ครบถ้วน');
                  if (reason !== null) {
                    handleUpdateStatus('draft', reason);
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors min-h-[40px]"
              >
                <Undo2 className="w-4 h-4" />
                <span>ส่งกลับแก้ไข</span>
              </button>
            )}

            {canClaim && (
              <button
                onClick={() => handleUpdateStatus('claimed')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
              >
                <Send className="w-4 h-4" />
                <span>ส่งเบิก สปสช. (e-Claim)</span>
              </button>
            )}

            {canMarkPaid && (
              <button
                onClick={() => onNavigateTab('claims')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[40px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกผลการโอนเงิน สปสช.</span>
              </button>
            )}

            {canAdminUnlock && (
              <button
                onClick={() => {
                  if (window.confirm('คุณต้องการปลดล็อกข้อมูลเดือนนี้เพื่อให้แก้ไขได้หรือไม่?')) {
                    handleUpdateStatus('draft', 'ผู้ดูแลระบบปลดล็อกข้อมูล');
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold transition-colors min-h-[40px]"
                title="ผู้ดูแลระบบปลดล็อกข้อมูล"
              >
                <Unlock className="w-4 h-4" />
                <span>ปลดล็อกแก้ไข</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between max-w-2xl text-xs">
            {(['draft', 'submitted', 'approved', 'claimed', 'paid'] as MonthStatus[]).map(
              (st, idx) => {
                const cfg = STATUS_CONFIG[st];
                const isPassed = cfg.step <= statusConfig.step;
                const isCurrent = st === closing.status;
                return (
                  <div key={st} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#1F4E79] text-white ring-4 ring-blue-100 scale-110 shadow-sm'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isPassed && !isCurrent ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`mt-1 font-medium ${
                          isCurrent
                            ? 'text-[#1F4E79] font-bold'
                            : isPassed
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    {idx < 4 && (
                      <div
                        className={`w-10 sm:w-16 h-0.5 mx-1 sm:mx-2 ${
                          cfg.step < statusConfig.step ? 'bg-emerald-400' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Excel Sheet Presentation (Replicating exact user screenshot style) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
        {/* Title Bar - Dark Blue Header #1F4E79 */}
        <div className="bg-[#1F4E79] text-white py-3.5 px-6 text-center shadow-inner">
          <h2 className="text-lg sm:text-xl font-bold tracking-wide">
            ตารางสรุปจำนวนผู้รับบริการและยอดการส่งเบิก เดือน{month.name}
          </h2>
        </div>

        {/* Subtitle Bar - Pale Instruction text */}
        <div className="bg-slate-100/90 text-slate-700 text-xs py-2 px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="font-medium">
            กรอกจำนวนคนในแต่ละรอบในช่องสีเหลือง / จำนวนรวมและยอดเงินคำนวณอัตโนมัติ
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#FEF9C3] border border-amber-300 inline-block rounded-xs" /> ช่องกรอกข้อมูล
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#DCFCE7] border border-emerald-300 inline-block rounded-xs" /> คำนวณอัตโนมัติ
            </span>
          </div>
        </div>

        {/* Interactive Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-left">
            <thead>
              {/* Table Column Headers - Dark Blue Style */}
              <tr className="bg-[#1F4E79] text-white border-b border-blue-900 divide-x divide-blue-800 text-xs sm:text-sm">
                <th className="py-2.5 px-3 text-center font-bold w-12 shrink-0">ลำดับ</th>
                <th className="py-2.5 px-4 font-bold min-w-[240px]">รายการบริการ</th>
                <th className="py-2.5 px-3 text-right font-bold w-32 shrink-0">
                  อัตราเบิก <br className="hidden sm:inline" />
                  <span className="font-normal text-[11px] text-blue-200">(บาท/คน)</span>
                </th>

                {/* Dynamic Round Columns */}
                {rounds.map((r, rIdx) => (
                  <th
                    key={r.id}
                    className="py-2 px-2 text-center font-bold w-28 shrink-0 relative group"
                  >
                    <div className="truncate">{r.roundName} (คน)</div>
                    <div className="text-[11px] font-normal text-blue-200 mt-0.5">
                      {formatThaiShortDate(r.date)}
                    </div>

                    {/* Delete round button (if not locked) */}
                    {!isMonthLocked && rounds.length > 1 && (
                      <button
                        onClick={() => handleDeleteRound(r)}
                        className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-opacity"
                        title="ลบรอบนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </th>
                ))}

                <th className="py-2.5 px-3 text-right font-bold w-32 shrink-0 bg-[#173B5D]">
                  รวมจำนวน <br className="hidden sm:inline" />
                  <span className="font-normal text-[11px] text-blue-200">(คน/ครั้ง)</span>
                </th>
                <th className="py-2.5 px-4 text-right font-bold w-36 shrink-0 bg-[#173B5D]">
                  รวมเงิน <br className="hidden sm:inline" />
                  <span className="font-normal text-[11px] text-blue-200">(บาท)</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {tableData.rows.map((row, idx) => {
                const isEven = idx % 2 === 0;
                const hasNoRate = row.rate === null;

                return (
                  <tr
                    key={row.service.id}
                    className="hover:bg-blue-50/40 transition-colors divide-x divide-slate-200"
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center font-medium text-slate-500 bg-slate-50/70">
                      {idx + 1}
                    </td>

                    {/* Service Name */}
                    <td className="py-2 px-4 font-medium text-slate-800">
                      <div className="flex items-center justify-between">
                        <span>{row.service.name}</span>
                        {hasNoRate && (
                          <button
                            onClick={() => {
                              setEditingRateService({
                                id: row.service.id,
                                name: row.service.name,
                                currentRate: null,
                              });
                              setNewRateValue('');
                            }}
                            className="ml-2 text-amber-600 hover:text-amber-800 p-1 hover:bg-amber-50 rounded"
                            title="คลิกเพื่อกำหนดอัตราเบิกทันที"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-2 px-3 text-right">
                      {hasNoRate ? (
                        <div
                          onClick={() => {
                            setEditingRateService({
                              id: row.service.id,
                              name: row.service.name,
                              currentRate: null,
                            });
                            setNewRateValue('');
                          }}
                          className="inline-flex items-center text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer px-2 py-0.5 rounded text-xs font-semibold border border-amber-300"
                          title="คลิกเพื่อกรอกอัตราเบิก"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                          <span>รอกำหนด</span>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-700">
                          {formatMoney(row.rate)}
                        </span>
                      )}
                    </td>

                    {/* Input Cells for each Round (Pale Yellow #FEF9C3) */}
                    {row.roundCounts.map((rc, rIdx) => (
                      <td
                        key={rc.roundId}
                        className="p-1 bg-[#FEF9C3]/70 hover:bg-[#FEF9C3] text-center"
                      >
                        <input
                          type="number"
                          min="0"
                          disabled={isMonthLocked || !canEditEntries}
                          value={rc.count === 0 ? '0' : rc.count}
                          onChange={e =>
                            handleEntryChange(rc.roundId, row.service.id, e.target.value)
                          }
                          className="w-full text-center py-1.5 px-1 bg-transparent font-semibold text-slate-900 border-0 focus:ring-2 focus:ring-blue-600 focus:bg-white rounded transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}

                    {/* Auto-calculated Total Count (Pale Green #DCFCE7) */}
                    <td className="py-2 px-3 text-right font-bold text-slate-900 bg-[#DCFCE7]/70">
                      {formatCount(row.rowCount)}
                    </td>

                    {/* Auto-calculated Total Amount (Pale Green #DCFCE7) */}
                    <td className="py-2 px-4 text-right font-bold text-[#1F4E79] bg-[#DCFCE7]/70">
                      {row.rowAmount !== null ? (
                        formatMoney(row.rowAmount)
                      ) : (
                        <span
                          className="inline-flex items-center text-amber-700 font-semibold text-xs"
                          title="ไม่สามารถคิดเงินได้ เนื่องจากยังไม่กำหนดอัตราเบิก"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          รอกำหนดอัตรา
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row - Deep Blue Accent matching Excel screenshot */}
              <tr className="bg-[#1F4E79] text-white font-extrabold divide-x divide-blue-800 text-xs sm:text-sm">
                <td className="py-3 px-3 text-center">-</td>
                <td className="py-3 px-4 uppercase tracking-wider">รวมทั้งสิ้น</td>
                <td className="py-3 px-3 text-right">-</td>

                {/* Round Totals */}
                {tableData.roundTotals.map((rt, idx) => (
                  <td key={idx} className="py-3 px-2 text-center text-amber-300">
                    {formatCount(rt)}
                  </td>
                ))}

                {/* Grand Total Count */}
                <td className="py-3 px-3 text-right text-amber-300 text-sm sm:text-base">
                  {formatCount(tableData.grandTotalCount)}
                </td>

                {/* Grand Total Amount */}
                <td className="py-3 px-4 text-right text-emerald-300 text-sm sm:text-base">
                  ฿{formatMoney(tableData.grandTotalAmount)}
                  {tableData.missingRateServicesList.length > 0 && (
                    <span
                      className="ml-1 text-amber-400 font-bold"
                      title="มียอดเงินที่ยังไม่รวมรายการที่รอกำหนดอัตรา"
                    >
                      *
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Warning Note Bar at Footer - Matching user's Excel screenshot */}
        {tableData.missingRateServicesList.length > 0 && (
          <div className="bg-[#FEF9C3] text-amber-900 border-t-2 border-amber-300 px-6 py-3 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>หมายเหตุ:</strong> อัตราเบิกของ
                <span className="font-semibold underline ml-1">
                  {tableData.missingRateServicesList.join(' และ ')}
                </span>
                ยังเว้นไว้ กรุณากรอกอัตราตามหลักเกณฑ์จริงในคอลัมน์ C (อัตราเบิก)
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-xs font-bold text-amber-900 underline hover:text-amber-950 shrink-0"
            >
              แก้ไขอัตราในหน้าตั้งค่า &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Quick Summary Card Below Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">จำนวนรอบบริการในเดือนนี้</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{rounds.length} รอบ</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {rounds.map(r => formatThaiShortDate(r.date)).join(', ')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">ผู้รับบริการรวม (คน/ครั้ง)</div>
          <div className="text-xl font-bold text-[#1F4E79] mt-1">
            {formatCount(tableData.grandTotalCount)} คน
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            เฉลี่ยรอบละ {rounds.length > 0 ? (tableData.grandTotalCount / rounds.length).toFixed(1) : 0} คน
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">ยอดเงินที่ต้องส่งเบิก สปสช.</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ฿{formatMoney(tableData.grandTotalAmount)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {tableData.missingRateServicesList.length > 0
              ? 'ยังไม่รวมรายการที่รอกำหนดอัตรา'
              : 'คำนวณครบทุกรายการแล้ว'}
          </div>
        </div>
      </div>

      {/* Modal: Add Round */}
      {showAddRoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> เพิ่มรอบการให้บริการใหม่
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              เพิ่มรอบสำหรับเดือน {month.name} (ไม่จำกัดจำนวนรอบ)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อรอบบริการ
                </label>
                <input
                  type="text"
                  value={newRoundName}
                  onChange={e => setNewRoundName(e.target.value)}
                  placeholder={`ครั้งที่ ${rounds.length + 1}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ให้บริการ (วว/ดด/ปปปป)
                </label>
                <input
                  type="date"
                  value={newRoundDate}
                  min={month.startDate}
                  max={month.endDate}
                  onChange={e => setNewRoundDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  อยู่ในช่วง: {formatThaiFullDate(month.startDate)} - {formatThaiFullDate(month.endDate)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowAddRoundModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddRound}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg shadow-xs transition-colors"
              >
                เพิ่มรอบบริการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Anomaly Warning (> 3x Average) */}
      {anomalyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-400">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              คำเตือน: จำนวนผู้รับบริการสูงกว่าปกติผิดสังเกต
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              คุณกำลังกรอก <strong>{anomalyWarning.enteredCount} คน</strong> ในรายการ{' '}
              <strong>"{anomalyWarning.serviceName}"</strong> ซึ่งสูงกว่าค่าเฉลี่ยปกติ ({anomalyWarning.avgCount} คน) เกินกว่า 3 เท่า
            </p>

            <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-900 mb-4">
              โปรดตรวจสอบความถูกต้องของข้อมูลก่อนยืนยัน หากเป็นยอดจริงจากการจัดกิจกรรมคัดกรองเชิงรุก สามารถกดบันทึกต่อได้
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setAnomalyWarning(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                แก้ไขใหม่
              </button>
              <button
                onClick={confirmAnomalyEntry}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
              >
                ยืนยันบันทึกยอดนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Rate */}
      {editingRateService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" /> กำหนดอัตราเบิก สปสช.
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              บริการ: <strong>{editingRateService.name}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อัตราเบิกจ่ายชดเชย (บาท/คน)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRateValue}
                  onChange={e => setNewRateValue(e.target.value)}
                  placeholder="เช่น 150.00"
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ปล่อยว่างไว้หากยังไม่ทราบราคาแน่นอน
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditingRateService(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveRateQuick}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg shadow-xs transition-colors"
              >
                บันทึกอัตรา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
