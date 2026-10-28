import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  Calendar,
  Coins,
  Download,
  FileSpreadsheet,
  Layers,
  Users,
} from 'lucide-react';
import { ExcelService } from '../services/excelService';
import { StorageService } from '../services/storage';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatCount,
  formatMoney,
} from '../utils/formatters';

interface AnnualSummaryPageProps {
  onSelectMonth: (monthKey: string) => void;
  onNavigateTab: (tabKey: any) => void;
}

export const AnnualSummaryPage: React.FC<AnnualSummaryPageProps> = ({
  onSelectMonth,
  onNavigateTab,
}) => {
  const [metricMode, setMetricMode] = useState<'count' | 'amount'>('count');

  const services = StorageService.getServices().filter(s => s.isActive);
  const rates = StorageService.getRates();
  const allRounds = StorageService.getRounds();
  const allEntries = StorageService.getEntries();

  // Pivot Calculations: Services × 12 Months
  const pivotData = useMemo(() => {
    const monthColumns = FISCAL_YEAR_2570_MONTHS.map(m => {
      const monthRounds = allRounds.filter(r => r.monthKey === m.key);
      const roundIds = monthRounds.map(r => r.id);
      return {
        month: m,
        roundIds,
      };
    });

    const rows = services.map(srv => {
      const rateObj = rates.find(r => r.serviceId === srv.id);
      const rate = rateObj?.rate ?? null;

      let rowYearCount = 0;
      let rowYearAmount = 0;

      const monthlyValues = monthColumns.map(col => {
        const matchingEntries = allEntries.filter(
          e => col.roundIds.includes(e.roundId) && e.serviceId === srv.id
        );
        const count = matchingEntries.reduce((sum, e) => sum + e.count, 0);
        const amount = rate !== null ? count * rate : null;

        rowYearCount += count;
        if (amount !== null) {
          rowYearAmount += amount;
        }

        return {
          monthKey: col.month.key,
          count,
          amount,
        };
      });

      return {
        service: srv,
        rate,
        monthlyValues,
        rowYearCount,
        rowYearAmount,
      };
    });

    // Vertical totals (per month)
    const monthTotals = monthColumns.map((col, colIdx) => {
      let mCount = 0;
      let mAmount = 0;
      let hasMissingRate = false;

      rows.forEach(r => {
        const val = r.monthlyValues[colIdx];
        mCount += val.count;
        if (val.amount !== null) {
          mAmount += val.amount;
        } else if (val.count > 0) {
          hasMissingRate = true;
        }
      });

      return {
        monthKey: col.month.key,
        monthName: col.month.shortName,
        totalCount: mCount,
        totalAmount: mAmount,
        hasMissingRate,
      };
    });

    // Grand totals
    const grandTotalCount = rows.reduce((sum, r) => sum + r.rowYearCount, 0);
    const grandTotalAmount = rows.reduce((sum, r) => sum + r.rowYearAmount, 0);

    return {
      rows,
      monthTotals,
      grandTotalCount,
      grandTotalAmount,
    };
  }, [services, rates, allRounds, allEntries]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Pivot Table
              </span>
              <span className="text-xs text-slate-500">ปีงบประมาณ 2570</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#1F4E79]" /> สรุปข้อมูลทั้งปี 2570 (บริการ × 12 เดือน)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามยอดผู้รับบริการและประมาณการส่งเบิก สปสช. ทั้งหมด 12 เดือน
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Toggle metric: Count vs Amount */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setMetricMode('count')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                  metricMode === 'count'
                    ? 'bg-[#1F4E79] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>จำนวนคน (คน/ครั้ง)</span>
              </button>
              <button
                onClick={() => setMetricMode('amount')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                  metricMode === 'amount'
                    ? 'bg-[#1F4E79] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>ยอดเงิน (บาท)</span>
              </button>
            </div>

            {/* Export full workbook */}
            <button
              onClick={() => ExcelService.exportAnnualWorkbook()}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด Excel 12 เดือน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grand Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            รวมผู้รับบริการทั้งปี 2570
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F4E79] mt-2">
            {formatCount(pivotData.grandTotalCount)} <span className="text-sm font-normal text-slate-500">คน</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">เฉลี่ยเดือนละ {formatCount(pivotData.grandTotalCount / 12)} คน</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            รวมยอดเงินส่งเบิกทั้งปี 2570
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            ฿{formatMoney(pivotData.grandTotalAmount)}
          </div>
          <div className="text-xs text-slate-400 mt-1">ยอดรวมที่สามารถคำนวณอัตราได้</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            จำนวนรายการบริการที่เปิดใช้
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">
            {services.length} <span className="text-sm font-normal text-slate-500">รายการ</span>
          </div>
          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {services.filter(s => rates.find(r => r.serviceId === s.id)?.rate === null).length} รายการรอกำหนดอัตรา
            </span>
          </div>
        </div>
      </div>

      {/* Pivot Spreadsheet Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
        <div className="bg-[#1F4E79] text-white py-3 px-6 flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base">
            ตาราง Pivot: {metricMode === 'count' ? 'จำนวนผู้รับบริการ (คน/ครั้ง)' : 'ยอดเงินที่ต้องส่งเบิก (บาท)'}
          </h3>
          <span className="text-xs text-blue-200">
            คลิกที่หัวเดือนเพื่อเปิดตารางรายเดือนนั้น ๆ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 divide-x divide-slate-200 text-slate-800">
                <th className="py-2.5 px-3 text-center font-bold w-12 shrink-0">ลำดับ</th>
                <th className="py-2.5 px-4 font-bold min-w-[220px]">รายการบริการ</th>
                <th className="py-2.5 px-3 text-right font-bold w-28 shrink-0">อัตรา (บาท)</th>

                {/* 12 Months Columns */}
                {FISCAL_YEAR_2570_MONTHS.map(m => (
                  <th
                    key={m.key}
                    onClick={() => onSelectMonth(m.key)}
                    className="py-2 px-2 text-center font-bold w-20 shrink-0 hover:bg-blue-100 cursor-pointer transition-colors"
                    title={`เปิดตารางสรุปเดือน${m.name}`}
                  >
                    <div>{m.shortName}</div>
                    <div className="text-[10px] text-blue-700 underline font-normal mt-0.5">เปิดดู</div>
                  </th>
                ))}

                {/* Total Column */}
                <th className="py-2.5 px-4 text-right font-extrabold w-36 shrink-0 bg-blue-50 text-blue-950">
                  {metricMode === 'count' ? 'รวมทั้งปี (คน)' : 'รวมทั้งปี (บาท)'}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {pivotData.rows.map((row, idx) => {
                const hasNoRate = row.rate === null;

                return (
                  <tr
                    key={row.service.id}
                    className="hover:bg-slate-50 transition-colors divide-x divide-slate-200"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {row.service.name}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {hasNoRate ? (
                        <span className="text-amber-600 font-bold text-xs">รอกำหนด</span>
                      ) : (
                        <span className="text-slate-700 font-medium">{formatMoney(row.rate)}</span>
                      )}
                    </td>

                    {/* 12 Month Values */}
                    {row.monthlyValues.map((mv, mIdx) => {
                      const displayVal =
                        metricMode === 'count'
                          ? mv.count === 0
                            ? '-'
                            : formatCount(mv.count)
                          : hasNoRate
                          ? mv.count > 0
                            ? 'รอกำหนด'
                            : '-'
                          : mv.amount === 0
                          ? '-'
                          : formatMoney(mv.amount);

                      const isHighlighted =
                        metricMode === 'count' ? mv.count > 0 : (mv.amount || 0) > 0;

                      return (
                        <td
                          key={mv.monthKey}
                          onClick={() => onSelectMonth(mv.monthKey)}
                          className={`py-2 px-2 text-center cursor-pointer hover:bg-amber-50/50 ${
                            isHighlighted ? 'font-semibold text-slate-900 bg-emerald-50/30' : 'text-slate-400'
                          }`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}

                    {/* Row Year Total */}
                    <td className="py-2.5 px-4 text-right font-extrabold bg-blue-50/70 text-[#1F4E79]">
                      {metricMode === 'count'
                        ? `${formatCount(row.rowYearCount)} คน`
                        : hasNoRate
                        ? 'รอกำหนดอัตรา'
                        : `฿${formatMoney(row.rowYearAmount)}`}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-[#1F4E79] text-white font-extrabold divide-x divide-blue-800 text-xs sm:text-sm">
                <td className="py-3 px-3 text-center">-</td>
                <td className="py-3 px-4 uppercase tracking-wider">
                  รวมทั้งสิ้น ({metricMode === 'count' ? 'คน' : 'บาท'})
                </td>
                <td className="py-3 px-3 text-right">-</td>

                {/* Month Totals */}
                {pivotData.monthTotals.map(mt => (
                  <td key={mt.monthKey} className="py-3 px-2 text-center text-amber-300">
                    {metricMode === 'count' ? formatCount(mt.totalCount) : formatMoney(mt.totalAmount)}
                  </td>
                ))}

                {/* Grand Total */}
                <td className="py-3 px-4 text-right text-emerald-300 font-extrabold text-sm sm:text-base bg-[#173B5D]">
                  {metricMode === 'count'
                    ? `${formatCount(pivotData.grandTotalCount)} คน`
                    : `฿${formatMoney(pivotData.grandTotalAmount)}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
