import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  History,
  Lock,
  Minus,
  PenLine,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { ServiceItem, ServiceRound, User } from '../types';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatCount,
  formatMoney,
  formatThaiFullDate,
  formatThaiShortDate,
  getMonthInfo,
} from '../utils/formatters';

interface RoundEntryPageProps {
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  currentUser: User;
  onNavigateTab: (tabKey: any) => void;
}

export const RoundEntryPage: React.FC<RoundEntryPageProps> = ({
  currentMonthKey,
  onSelectMonth,
  currentUser,
  onNavigateTab,
}) => {
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [entriesState, setEntriesState] = useState<Record<string, number>>({});
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [newRoundDate, setNewRoundDate] = useState('');
  const [newRoundName, setNewRoundName] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [anomalyWarning, setAnomalyWarning] = useState<{
    serviceId: string;
    serviceName: string;
    val: number;
    avg: number;
  } | null>(null);

  const [roundsVersion, setRoundsVersion] = useState(0);
  const month = getMonthInfo(currentMonthKey);
  const services = useMemo<ServiceItem[]>(
    () => StorageService.getServices().filter(s => s.isActive),
    [roundsVersion]
  );
  const rates = StorageService.getRates();
  const rounds = useMemo<ServiceRound[]>(
    () => StorageService.getRounds(currentMonthKey),
    [currentMonthKey, roundsVersion]
  );
  const closing = StorageService.getClosing(currentMonthKey);
  const settings = StorageService.getSettings();

  const isLocked =
    (closing.status === 'approved' ||
      closing.status === 'claimed' ||
      closing.status === 'paid') &&
    currentUser.role !== 'admin';

  // Set default selected round when month or rounds change
  useEffect(() => {
    if (rounds.length > 0) {
      setSelectedRoundId(prev => {
        if (prev && rounds.some(r => r.id === prev)) {
          return prev;
        }
        return rounds[rounds.length - 1].id;
      });
    } else {
      setSelectedRoundId('');
    }
  }, [currentMonthKey, rounds]);

  // Load entries for selected round
  useEffect(() => {
    if (!selectedRoundId) {
      setEntriesState({});
      return;
    }
    const allEntries = StorageService.getEntries();
    const state: Record<string, number> = {};
    services.forEach(srv => {
      const ent = allEntries.find(
        e => e.roundId === selectedRoundId && e.serviceId === srv.id
      );
      state[srv.id] = ent ? ent.count : 0;
    });
    setEntriesState(state);
  }, [selectedRoundId]);

  const activeRound = rounds.find(r => r.id === selectedRoundId);

  const handleCountChange = (serviceId: string, delta: number) => {
    if (isLocked) return;
    const current = entriesState[serviceId] || 0;
    const newVal = Math.max(0, current + delta);
    setEntriesState(prev => ({ ...prev, [serviceId]: newVal }));
  };

  const handleDirectInput = (serviceId: string, valStr: string) => {
    if (isLocked) return;
    const val = valStr === '' ? 0 : parseInt(valStr, 10);
    if (!isNaN(val) && val >= 0) {
      setEntriesState(prev => ({ ...prev, [serviceId]: val }));
    }
  };

  const handleSaveAll = () => {
    if (!selectedRoundId) return;
    if (isLocked) {
      alert('เดือนนี้ถูกล็อกแล้ว ไม่สามารถแก้ไขได้');
      return;
    }

    // Check anomalies across all services
    if (settings.enableAnomalyWarning) {
      for (const srv of services) {
        const val = entriesState[srv.id] || 0;
        if (val > 0) {
          const avg = StorageService.getServiceAverageCount(srv.id);
          if (avg > 0 && val > avg * settings.anomalyMultiplier) {
            setAnomalyWarning({
              serviceId: srv.id,
              serviceName: srv.name,
              val,
              avg: Math.round(avg),
            });
            return;
          }
        }
      }
    }

    commitSave();
  };

  const commitSave = () => {
    if (!selectedRoundId) return;
    Object.entries(entriesState).forEach(([srvId, count]) => {
      StorageService.saveEntry(selectedRoundId, srvId, count);
    });

    setIsSavedSuccess(true);
    setAnomalyWarning(null);
    setTimeout(() => setIsSavedSuccess(false), 2500);
  };

  const handleAddRound = () => {
    if (!newRoundDate) {
      alert('กรุณาเลือกวันที่');
      return;
    }
    const newRnd = StorageService.addRound(
      currentMonthKey,
      newRoundDate,
      newRoundName || undefined
    );
    setShowAddRoundModal(false);
    setRoundsVersion(v => v + 1);
    setSelectedRoundId(newRnd.id);
    setNewRoundDate('');
    setNewRoundName('');
  };

  // Calculate live totals for this round
  const roundSummary = services.reduce(
    (acc, srv) => {
      const count = entriesState[srv.id] || 0;
      const rateObj = rates.find(r => r.serviceId === srv.id);
      const rate = rateObj?.rate ?? null;
      acc.totalCount += count;
      if (rate !== null) {
        acc.totalAmount += count * rate;
      } else if (count > 0) {
        acc.hasMissingRate = true;
      }
      return acc;
    },
    { totalCount: 0, totalAmount: 0, hasMissingRate: false }
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Month & Round Selector Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                เลือกเดือน
              </label>
              <select
                value={currentMonthKey}
                onChange={e => onSelectMonth(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm text-[#1F4E79] bg-white focus:ring-2 focus:ring-blue-500"
              >
                {FISCAL_YEAR_2570_MONTHS.map(m => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Round Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                เลือกรอบการให้บริการ ({rounds.length} รอบ)
              </label>
              <div className="flex items-center space-x-1.5">
                <select
                  value={selectedRoundId}
                  onChange={e => setSelectedRoundId(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                >
                  {rounds.length === 0 ? (
                    <option value="">ไม่มีรอบบริการ (คลิกเพื่อเพิ่ม)</option>
                  ) : (
                    rounds.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.roundName} ({formatThaiShortDate(r.date)})
                      </option>
                    ))
                  )}
                </select>

                {!isLocked && (
                  <button
                    onClick={() => {
                      setNewRoundDate(month.startDate);
                      setNewRoundName(`ครั้งที่ ${rounds.length + 1}`);
                      setShowAddRoundModal(true);
                    }}
                    className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                    title="เพิ่มรอบบริการใหม่"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* View Mode & Save Actions */}
          <div className="flex items-center space-x-2">
            {/* Toggle Cards / Table */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แบบการ์ด (มือถือ)
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แบบตารางเร็ว
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveAll}
              disabled={isLocked || !selectedRoundId}
              className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all min-h-[44px] ${
                isSavedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1F4E79] hover:bg-blue-900 text-white disabled:opacity-50'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>บันทึกเรียบร้อย!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>บันทึกยอดรอบนี้</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Round Date & Status Banner */}
        {activeRound && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1 font-semibold text-[#1F4E79]">
                <Calendar className="w-4 h-4" />
                วันที่จัดบริการ: {formatThaiFullDate(activeRound.date, true)}
              </span>
              {isLocked && (
                <span className="flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-3.5 h-3.5 mr-1" /> เดือนนี้อนุมัติแล้ว ข้อมูลถูกล็อก
                </span>
              )}
            </div>

            {/* Live Round Total Counter */}
            <div className="flex items-center space-x-4 font-medium mt-1 sm:mt-0">
              <span>
                รวมผู้รับบริการรอบนี้:{' '}
                <strong className="text-slate-900">{formatCount(roundSummary.totalCount)} คน</strong>
              </span>
              <span>
                ยอดเงินรอบนี้:{' '}
                <strong className="text-emerald-700">฿{formatMoney(roundSummary.totalAmount)}</strong>
                {roundSummary.hasMissingRate && (
                  <span className="text-amber-500 font-bold ml-1" title="มีบริการที่รอกำหนดอัตรา">*</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* No rounds state */}
      {rounds.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">ยังไม่มีรอบการให้บริการในเดือนนี้</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            กดปุ่มด้านล่างเพื่อเริ่มสร้างรอบการให้บริการ เช่น รอบครั้งที่ 1 พร้อมระบุวันที่
          </p>
          <button
            onClick={() => {
              setNewRoundDate(month.startDate);
              setNewRoundName('ครั้งที่ 1');
              setShowAddRoundModal(true);
            }}
            className="px-5 py-2.5 bg-[#1F4E79] text-white font-semibold text-xs rounded-xl shadow-xs"
          >
            + เพิ่มรอบการให้บริการแรก
          </button>
        </div>
      )}

      {/* Mode 1: Mobile-First Card View (Large + / - buttons >= 44px) */}
      {rounds.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((srv, idx) => {
            const count = entriesState[srv.id] || 0;
            const rateObj = rates.find(r => r.serviceId === srv.id);
            const rate = rateObj?.rate ?? null;
            const amount = rate !== null ? count * rate : null;

            return (
              <div
                key={srv.id}
                className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ลำดับ {idx + 1} • {srv.code}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {srv.name}
                      </h4>
                      {srv.category && (
                        <p className="text-xs text-slate-500 mt-0.5">{srv.category}</p>
                      )}
                    </div>

                    {/* Rate Badge */}
                    <div className="text-right shrink-0">
                      {rate !== null ? (
                        <div className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold">
                          {formatMoney(rate)} บ./{srv.unit}
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>รอกำหนดอัตรา</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculated Amount Indicator */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-slate-400" /> คำนวณยอดเงินรอบนี้:
                    </span>
                    <span className="font-extrabold text-[#1F4E79] text-sm">
                      {amount !== null ? `฿${formatMoney(amount)}` : 'รอกำหนดอัตรา'}
                    </span>
                  </div>
                </div>

                {/* Big Touch Controls (Min 44px) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Minus Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      disabled={isLocked || count === 0}
                      onClick={() => handleCountChange(srv.id, -10)}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs text-slate-700 flex items-center justify-center transition-colors shadow-xs active:scale-95"
                      title="ลด 10 คน"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      disabled={isLocked || count === 0}
                      onClick={() => handleCountChange(srv.id, -1)}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-slate-800 flex items-center justify-center transition-colors shadow-xs active:scale-95"
                      title="ลด 1 คน"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Direct Input */}
                  <div className="flex-1 max-w-[120px]">
                    <input
                      type="number"
                      min="0"
                      disabled={isLocked}
                      value={count === 0 ? '0' : count}
                      onChange={e => handleDirectInput(srv.id, e.target.value)}
                      className="w-full h-11 text-center font-extrabold text-lg bg-[#FEF9C3] text-slate-900 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Plus Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleCountChange(srv.id, 1)}
                      className="w-11 h-11 rounded-xl bg-[#1F4E79] hover:bg-blue-900 disabled:opacity-30 font-bold text-white flex items-center justify-center transition-colors shadow-xs active:scale-95"
                      title="เพิ่ม 1 คน"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleCountChange(srv.id, 10)}
                      className="w-11 h-11 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-30 font-bold text-xs text-blue-900 flex items-center justify-center transition-colors shadow-xs active:scale-95"
                      title="เพิ่ม 10 คน"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Quick Spreadsheet Table View */}
      {rounds.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-300 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1F4E79] text-white text-xs">
              <tr>
                <th className="py-3 px-4 w-12 text-center font-bold">ลำดับ</th>
                <th className="py-3 px-4 font-bold">รายการบริการ</th>
                <th className="py-3 px-4 text-right font-bold w-36">อัตราเบิก (บาท)</th>
                <th className="py-3 px-4 text-center font-bold w-48 bg-blue-900">
                  จำนวนคนรอบนี้ ({activeRound?.roundName})
                </th>
                <th className="py-3 px-4 text-right font-bold w-44 bg-blue-950">
                  รวมเงินรอบนี้ (บาท)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {services.map((srv, idx) => {
                const count = entriesState[srv.id] || 0;
                const rateObj = rates.find(r => r.serviceId === srv.id);
                const rate = rateObj?.rate ?? null;
                const amount = rate !== null ? count * rate : null;

                return (
                  <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {srv.name}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {rate !== null ? (
                        formatMoney(rate)
                      ) : (
                        <span className="text-amber-600 font-semibold text-xs">รอกำหนด</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center bg-[#FEF9C3]/70">
                      <input
                        type="number"
                        min="0"
                        disabled={isLocked}
                        value={count === 0 ? '0' : count}
                        onChange={e => handleDirectInput(srv.id, e.target.value)}
                        className="w-28 text-center py-1.5 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1F4E79] bg-[#DCFCE7]/70">
                      {amount !== null ? `฿${formatMoney(amount)}` : 'รอกำหนดอัตรา'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Sticky Action Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl flex items-center justify-between sm:hidden z-40">
        <div className="text-xs">
          <div className="font-semibold text-slate-800">
            รวม: {formatCount(roundSummary.totalCount)} คน
          </div>
          <div className="font-extrabold text-[#1F4E79]">
            ฿{formatMoney(roundSummary.totalAmount)}
          </div>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isLocked || !selectedRoundId}
          className="px-6 py-2.5 rounded-xl bg-[#1F4E79] text-white font-bold text-sm shadow-md flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" /> บันทึกยอด
        </button>
      </div>

      {/* Modal: Add Round */}
      {showAddRoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> เพิ่มรอบบริการใหม่
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              กำหนดวันที่และชื่อรอบของเดือน {month.name}
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
                  วันที่ให้บริการ
                </label>
                <input
                  type="date"
                  value={newRoundDate}
                  min={month.startDate}
                  max={month.endDate}
                  onChange={e => setNewRoundDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowAddRoundModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddRound}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg shadow-xs"
              >
                เพิ่มรอบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Anomaly Warning */}
      {anomalyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-400">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              คำเตือน: ยอดผู้รับบริการสูงกว่าปกติ 3 เท่า
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              คุณกำลังบันทึก <strong>{anomalyWarning.val} คน</strong> สำหรับบริการ{' '}
              <strong>"{anomalyWarning.serviceName}"</strong> (ค่าเฉลี่ยปกติ {anomalyWarning.avg} คน)
            </p>
            <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg mb-4">
              หากเป็นข้อมูลที่ถูกต้องจากการจัดกิจกรรมพิเศษ ให้กดยืนยันบันทึก
            </p>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setAnomalyWarning(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                กลับไปแก้ไข
              </button>
              <button
                onClick={commitSave}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                ยืนยันบันทึกยอดนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
