import React, { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  PieChart as PieIcon,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatCount,
  formatMoney,
  STATUS_CONFIG,
} from '../utils/formatters';

interface DashboardPageProps {
  onSelectMonth: (monthKey: string) => void;
  onNavigateTab: (tabKey: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectMonth,
  onNavigateTab,
}) => {
  const services = StorageService.getServices().filter(s => s.isActive);
  const rates = StorageService.getRates();
  const allRounds = StorageService.getRounds();
  const allEntries = StorageService.getEntries();
  const closings = StorageService.getClosings();
  const settings = StorageService.getSettings();

  // Calculate annual metrics
  const {
    totalYearPeople,
    totalYearCalculatedAmount,
    missingRateCount,
    claimedTotalCount,
    claimedTotalAmount,
    paidTotalCount,
    paidTotalAmount,
    conditionCTotalCount,
    conditionCTotalAmount,
    pendingTotalCount,
    pendingTotalAmount,
    serviceStats,
    monthlyStats,
  } = useMemo(() => {
    let yearPeople = 0;
    let yearCalculatedAmount = 0;

    // Services breakdown
    const srvMap: Record<
      string,
      { id: string; name: string; count: number; amount: number; rate: number | null }
    > = {};

    services.forEach(srv => {
      const rObj = rates.find(r => r.serviceId === srv.id);
      srvMap[srv.id] = {
        id: srv.id,
        name: srv.name,
        count: 0,
        amount: 0,
        rate: rObj?.rate ?? null,
      };
    });

    // Monthly breakdown
    const mStats = FISCAL_YEAR_2570_MONTHS.map(m => {
      const monthRounds = allRounds.filter(r => r.monthKey === m.key);
      const roundIds = monthRounds.map(r => r.id);
      const closing = closings.find(c => c.monthKey === m.key);

      let mPeople = 0;
      let mAmount = 0;
      let hasMissingRate = false;

      services.forEach(srv => {
        const rate = srvMap[srv.id].rate;
        const count = allEntries
          .filter(e => roundIds.includes(e.roundId) && e.serviceId === srv.id)
          .reduce((sum, e) => sum + e.count, 0);

        mPeople += count;
        srvMap[srv.id].count += count;

        if (rate !== null) {
          const amt = count * rate;
          mAmount += amt;
          srvMap[srv.id].amount += amt;
        } else if (count > 0) {
          hasMissingRate = true;
        }
      });

      yearPeople += mPeople;
      yearCalculatedAmount += mAmount;

      return {
        month: m,
        roundCount: monthRounds.length,
        peopleCount: mPeople,
        amount: mAmount,
        hasMissingRate,
        closing,
      };
    });

    const missingCount = services.filter(s => srvMap[s.id].rate === null).length;

    // Claim stats from closings
    let claimedCount = 0;
    let claimedAmt = 0;
    let paidCount = 0;
    let paidAmt = 0;
    let cCount = 0;
    let cAmt = 0;
    let pendCount = 0;
    let pendAmt = 0;

    closings.forEach(c => {
      if (c.claimDetails) {
        claimedCount += c.claimDetails.claimedCount || 0;
        claimedAmt += c.claimDetails.claimedAmount || 0;
        paidCount += c.claimDetails.paidCount || 0;
        paidAmt += c.claimDetails.paidAmount || 0;
        cCount += c.claimDetails.conditionCCount || 0;
        cAmt += c.claimDetails.conditionCAmount || 0;
        pendCount += c.claimDetails.pendingCount || 0;
        pendAmt += c.claimDetails.pendingAmount || 0;
      }
    });

    return {
      totalYearPeople: yearPeople,
      totalYearCalculatedAmount: yearCalculatedAmount,
      missingRateCount: missingCount,
      claimedTotalCount: claimedCount,
      claimedTotalAmount: claimedAmt,
      paidTotalCount: paidCount,
      paidTotalAmount: paidAmt,
      conditionCTotalCount: cCount,
      conditionCTotalAmount: cAmt,
      pendingTotalCount: pendCount,
      pendingTotalAmount: pendAmt,
      serviceStats: Object.values(srvMap).sort((a, b) => b.count - a.count),
      monthlyStats: mStats,
    };
  }, [services, rates, allRounds, allEntries, closings]);

  // Max amount for bar chart scaling
  const maxMonthlyAmount = Math.max(...monthlyStats.map(m => m.amount), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Alert if services lack rate */}
      {missingRateCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                แจ้งเตือน: มี {missingRateCount} รายการบริการที่ "รอกำหนดอัตราเบิก"
              </h3>
              <p className="text-xs text-amber-800">
                บริการฝากครรภ์ และยาสมุนไพร 32 รายการ ยังไม่ได้รับการตั้งราคา ทำให้ยอดเงินรวมบางส่วนยังไม่สามารถคำนวณได้
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
          >
            ไปที่หน้าตั้งค่าอัตราเบิก &rarr;
          </button>
        </div>
      )}

      {/* KPI Cards Row 1: Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calculated Amount */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยอดส่งเบิกสะสมปี 2570
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1F4E79] tracking-tight">
              ฿{formatMoney(totalYearCalculatedAmount)}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold flex items-center mr-1.5">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> คำนวณอัตโนมัติ
              </span>
              <span>จากรอบบริการทั้งหมด</span>
            </div>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ผู้รับบริการสะสมทั้งปี
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {formatCount(totalYearPeople)} <span className="text-sm font-normal text-slate-500">คน/ครั้ง</span>
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span>ครอบคลุม 7 หมวดบริการหลัก</span>
            </div>
          </div>
        </div>

        {/* NHSO Paid Amount */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ได้รับเงินโอนชดเชยแล้ว
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              ฿{formatMoney(paidTotalAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>ชดเชยแล้ว {formatCount(paidTotalCount)} คน</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                โอนเรียบร้อย
              </span>
            </div>
          </div>
        </div>

        {/* Condition C Alert */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-red-200/80 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-red-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-red-500" /> สถานะติด C (รอแก้ไข)
            </span>
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
              {formatCount(conditionCTotalCount)} <span className="text-sm font-normal text-red-500">คน</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
              <span>ยอดเงินติด C: ฿{formatMoney(conditionCAmountTotal(conditionCTotalAmount))}</span>
              <button
                onClick={() => onNavigateTab('claims')}
                className="text-red-700 underline font-semibold hover:text-red-900"
              >
                ดูเคสติด C &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2: Secondary Quick Trackers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending NHSO Review */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500">อยู่ระหว่างรอตรวจสอบ สปสช.</div>
            <div className="text-lg font-bold text-slate-800">
              {formatCount(pendingTotalCount)} คน (฿{formatMoney(pendingTotalAmount)})
            </div>
          </div>
        </div>

        {/* Submission Progress */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500">ความคืบหน้าการส่งเบิกรายเดือน</div>
            <div className="text-lg font-bold text-[#1F4E79]">
              {closings.filter(c => c.status === 'claimed' || c.status === 'paid').length} / 12 เดือน
            </div>
          </div>
        </div>

        {/* Next Deadline */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500">กำหนดส่งเบิกรอบถัดไป</div>
            <div className="text-lg font-bold text-indigo-900">
              วันที่ {settings.deadlineDay} ของทุกเดือน
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Bar Chart (Custom clean SVG) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> แนวโน้มยอดเงินส่งเบิกรายเดือน ปีงบประมาณ 2570
              </h3>
              <p className="text-xs text-slate-500">
                ยอดรวมเงินที่คำนวณได้ในแต่ละเดือน (บาท)
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('annual')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              ดูตาราง Pivot เต็ม <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 flex items-end gap-2 pt-6 pb-2">
            {monthlyStats.map(m => {
              const heightPercent = maxMonthlyAmount > 0 ? (m.amount / maxMonthlyAmount) * 100 : 0;
              const hasData = m.peopleCount > 0;
              const statusCfg = STATUS_CONFIG[m.closing?.status || 'draft'];

              return (
                <div
                  key={m.month.key}
                  onClick={() => onSelectMonth(m.month.key)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  title={`${m.month.name}\nผู้รับบริการ: ${m.peopleCount} คน\nยอดเงิน: ฿${formatMoney(m.amount)}\nสถานะ: ${statusCfg.label}`}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 mb-1 pointer-events-none whitespace-nowrap shadow-md z-10">
                    ฿{formatMoney(m.amount)}
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-md relative flex items-end justify-center overflow-hidden h-44">
                    <div
                      style={{ height: `${Math.max(heightPercent, hasData ? 6 : 2)}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        m.amount > 0
                          ? 'bg-gradient-to-t from-[#1F4E79] to-blue-500 group-hover:to-blue-400'
                          : hasData
                          ? 'bg-amber-400' // has people but no rate set
                          : 'bg-slate-200'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-[11px] font-medium text-slate-600 group-hover:text-blue-700 truncate w-full text-center">
                    {m.month.shortName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {m.peopleCount > 0 ? `${m.peopleCount} คน` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Breakdown Donut / Proportion */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600" /> สัดส่วนผู้รับบริการตามรายการ
              </h3>
            </div>

            <div className="space-y-3.5">
              {serviceStats.map((srv, idx) => {
                const percentage = totalYearPeople > 0 ? (srv.count / totalYearPeople) * 100 : 0;
                const colors = [
                  'bg-blue-600',
                  'bg-indigo-600',
                  'bg-cyan-600',
                  'bg-emerald-600',
                  'bg-amber-600',
                  'bg-purple-600',
                  'bg-pink-600',
                ];
                const color = colors[idx % colors.length];

                return (
                  <div key={srv.id} className="text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-medium mb-1">
                      <span className="truncate max-w-[180px]" title={srv.name}>
                        {srv.name}
                      </span>
                      <span className="font-bold text-slate-900 ml-2">
                        {formatCount(srv.count)} คน ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                      <span>
                        อัตรา:{' '}
                        {srv.rate !== null ? (
                          `${srv.rate} บ.`
                        ) : (
                          <span className="text-amber-600 font-semibold">รอกำหนด</span>
                        )}
                      </span>
                      <span>
                        ยอดเงิน:{' '}
                        {srv.rate !== null ? (
                          `฿${formatMoney(srv.amount)}`
                        ) : (
                          <span className="text-amber-600">รอกำหนด</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              จัดการรายการบริการและอัตราเบิก &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 12 Months Status Overview Grid */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1F4E79]" /> แถบสถานะการส่งเบิก 12 เดือน ปีงบประมาณ 2570
            </h3>
            <p className="text-xs text-slate-500">
              คลิกที่การ์ดเพื่อเปิดตารางบันทึกข้อมูลและตรวจสอบของแต่ละเดือน
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> ร่าง
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> ส่งตรวจ
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-100 text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> อนุมัติ
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-100 text-indigo-800">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> ส่งเบิกแล้ว
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> ได้รับเงินแล้ว
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthlyStats.map(m => {
            const statusKey = m.closing?.status || 'draft';
            const statusCfg = STATUS_CONFIG[statusKey];

            return (
              <div
                key={m.month.key}
                onClick={() => onSelectMonth(m.month.key)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  statusKey === 'paid'
                    ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400'
                    : statusKey === 'claimed'
                    ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400'
                    : statusKey === 'approved'
                    ? 'border-blue-200 bg-blue-50/20 hover:border-blue-400'
                    : statusKey === 'submitted'
                    ? 'border-amber-200 bg-amber-50/20 hover:border-amber-400'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-800">
                    {m.month.name}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">รอบบริการ:</span>
                    <span className="font-medium text-slate-700">{m.roundCount} รอบ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">จำนวนผู้รับบริการ:</span>
                    <span className="font-medium text-slate-800">{formatCount(m.peopleCount)} คน</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ยอดเงินคำนวณ:</span>
                    <span className="font-bold text-[#1F4E79]">
                      ฿{formatMoney(m.amount)}
                      {m.hasMissingRate && (
                        <span className="text-amber-500 ml-1" title="มีบริการที่ยังไม่กำหนดอัตรา">
                          *
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Claim details if any */}
                {m.closing?.claimDetails && (m.closing.claimDetails.claimedCount > 0) && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                    <div className="flex justify-between text-emerald-700">
                      <span>โอนชดเชยแล้ว:</span>
                      <span className="font-semibold">{m.closing.claimDetails.paidCount} คน</span>
                    </div>
                    {m.closing.claimDetails.conditionCCount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>ติด C:</span>
                        <span className="font-bold">{m.closing.claimDetails.conditionCCount} คน</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold group-hover:text-blue-800">
                  <span>เปิดตารางคำนวณ</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function conditionCAmountTotal(amount: number) {
  return amount || 0;
}
