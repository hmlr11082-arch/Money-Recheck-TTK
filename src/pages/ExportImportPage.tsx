import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileType,
  Printer,
  Sparkles,
  Upload,
} from 'lucide-react';
import { ExcelService, ImportResult } from '../services/excelService';
import { StorageService } from '../services/storage';
import { User } from '../types';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatCount,
  formatMoney,
  formatThaiFullDate,
  formatThaiShortDate,
  getMonthInfo,
} from '../utils/formatters';

interface ExportImportPageProps {
  currentMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  currentUser: User;
  onNavigateTab: (tabKey: any) => void;
}

export const ExportImportPage: React.FC<ExportImportPageProps> = ({
  currentMonthKey,
  onSelectMonth,
  currentUser,
  onNavigateTab,
}) => {
  const [importTargetMonth, setImportTargetMonth] = useState<string>(currentMonthKey);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    previewRows: { serviceName: string; roundValues: number[]; total: number }[];
    roundHeaders: string[];
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // PDF / Print View preview modal
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const month = getMonthInfo(currentMonthKey);
  const services = StorageService.getServices().filter(s => s.isActive);
  const rates = StorageService.getRates();
  const rounds = StorageService.getRounds(currentMonthKey);
  const entries = StorageService.getEntries();
  const closing = StorageService.getClosing(currentMonthKey);
  const settings = StorageService.getSettings();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParsedPreview(null);
    setImportResult(null);

    try {
      const res = await ExcelService.parseExcelFile(file, importTargetMonth);
      setParsedPreview(res);
    } catch (err: any) {
      setParseError(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedPreview) return;
    const targetMonthObj = getMonthInfo(importTargetMonth);

    // Generate round dates for new imported rounds
    const roundDates = parsedPreview.roundHeaders.map((_, idx) => {
      const day = Math.min(1 + idx * 7, 28);
      const dayStr = day.toString().padStart(2, '0');
      return `${targetMonthObj.startDate.slice(0, 8)}${dayStr}`;
    });

    const res = ExcelService.commitImport(
      importTargetMonth,
      roundDates,
      parsedPreview.previewRows
    );

    setImportResult(res);
    setParsedPreview(null);
    setSelectedFile(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-[#1F4E79]" /> นำเข้าและส่งออกข้อมูล (Excel / PDF)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          ดาวน์โหลดไฟล์ Excel (.xlsx) ตามแบบฟอร์มมาตรฐาน หรืออัปโหลดไฟล์ Excel เดิมเพื่อนำเข้ายอดผู้รับบริการ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Export Options */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                ส่งออกไฟล์ Excel (.xlsx)
              </h3>
              <p className="text-xs text-slate-500">
                รองรับโปรแกรม Microsoft Excel ทุกเวอร์ชัน
              </p>
            </div>
          </div>

          {/* Option A: Monthly Excel */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-800">
                1. ตารางสรุปรายเดือน (แบบฟอร์มดั้งเดิม)
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                .XLSX
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              ส่งออกตารางสรุปรายรอบ พร้อมอัตราเบิก ยอดรวมคน และยอดเงิน ตามรูปแบบในภาพตัวอย่าง
            </p>

            <div className="flex items-center space-x-2">
              <select
                value={currentMonthKey}
                onChange={e => onSelectMonth(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                {FISCAL_YEAR_2570_MONTHS.map(m => (
                  <option key={m.key} value={m.key}>
                    เดือน {m.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => ExcelService.exportMonthlyExcel(currentMonthKey)}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด Excel เดือน {month.shortName}</span>
              </button>
            </div>
          </div>

          {/* Option B: Full Year 12-Month Workbook */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-800">
                2. สมุดงานทั้งปี 2570 (ครบ 12 เดือน + สรุปทั้งปี)
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                13 Sheets
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              ไฟล์เดียวประกอบด้วยแท็บ "สรุปทั้งปี" (Pivot Table) และแท็บแยกย่อยของแต่ละเดือนตั้งแต่ ต.ค. 69 – ก.ย. 70
            </p>

            <button
              onClick={() => ExcelService.exportAnnualWorkbook()}
              className="w-full py-2.5 px-4 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดสมุดงานครบ 12 เดือน (.xlsx)</span>
            </button>
          </div>

          {/* Option C: Print / Save as PDF */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-800">
                3. พิมพ์รายงาน / บันทึกเป็น PDF (แบบฟอร์ม A4)
              </span>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                PDF / Print
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              แบบฟอร์มรายงานสรุปยอดส่งเบิกพร้อมลงนามผู้บันทึกและผู้อนุมัติ จัดหน้าแบบกระดาษ A4 แนวนอน
            </p>

            <button
              onClick={() => setShowPrintPreview(true)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>เปิดดูตัวอย่างหน้าพิมพ์รายงาน / บันทึก PDF</span>
            </button>
          </div>
        </div>

        {/* Section 2: Import from Excel */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                นำเข้าข้อมูลจากไฟล์ Excel เดิม (.xlsx)
              </h3>
              <p className="text-xs text-slate-500">
                อัปโหลดไฟล์เพื่อดึงจำนวนผู้รับบริการแต่ละรอบเข้าสู่ระบบ
              </p>
            </div>
          </div>

          {/* Target Month Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลือกเดือนเป้าหมายที่จะนำเข้าข้อมูล
            </label>
            <select
              value={importTargetMonth}
              onChange={e => setImportTargetMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm text-[#1F4E79] bg-white"
            >
              {FISCAL_YEAR_2570_MONTHS.map(m => (
                <option key={m.key} value={m.key}>
                  เดือน {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                คลิกเพื่อเลือกไฟล์ Excel หรือลากไฟล์มาวางที่นี่
              </span>
              <span className="text-xs text-slate-400 mt-1">
                รองรับไฟล์นามสกุล .xlsx หรือ .xls (ขนาดไม่เกิน 10MB)
              </span>
              {selectedFile && (
                <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{selectedFile.name}</span>
                </div>
              )}
            </label>
          </div>

          {isParsing && (
            <div className="text-center py-4 text-xs text-slate-500 animate-pulse">
              กำลังวิเคราะห์โครงสร้างไฟล์ Excel...
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{importResult.message}</span>
              </div>
              {importResult.warnings.length > 0 && (
                <div className="mt-2 text-amber-800 pl-4 border-l-2 border-amber-400">
                  <p className="font-semibold">ข้อความเตือน:</p>
                  {importResult.warnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  onSelectMonth(importTargetMonth);
                  onNavigateTab('monthly');
                }}
                className="mt-2 inline-flex items-center text-xs font-bold text-emerald-800 underline"
              >
                เปิดดูตารางสรุปเดือนนี้ทันที &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section before Commit */}
      {parsedPreview && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" /> ตรวจสอบความถูกต้องก่อนนำเข้าสู่ระบบ
              </h3>
              <p className="text-xs text-slate-500">
                พบข้อมูล {parsedPreview.previewRows.length} รายการบริการ และ{' '}
                {parsedPreview.roundHeaders.length} รอบการให้บริการ
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setParsedPreview(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันบันทึกข้อมูลเข้าสู่ระบบ</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#1F4E79] text-white">
                <tr>
                  <th className="py-2 px-3 w-10 text-center">#</th>
                  <th className="py-2 px-3">รายการบริการ</th>
                  {parsedPreview.roundHeaders.map((rh, idx) => (
                    <th key={idx} className="py-2 px-3 text-center">
                      {rh}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right bg-blue-900">รวมจำนวน (คน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parsedPreview.previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{row.serviceName}</td>
                    {row.roundValues.map((val, vIdx) => (
                      <td key={vIdx} className="py-2 px-3 text-center text-slate-700">
                        {val}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-[#1F4E79] bg-blue-50/50">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: PDF / Print Preview */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 print:hidden">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" /> ตัวอย่างแบบฟอร์มรายงานเสนอผู้บริหาร
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> สั่งพิมพ์ / บันทึก PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* Printable Document Sheet (A4 Landscape Feel) */}
            <div className="p-6 bg-white border border-slate-300 rounded-xl space-y-4 text-xs font-sans text-slate-900">
              {/* Official Header */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-slate-800">
                <h2 className="text-base font-bold uppercase tracking-wide">
                  รายงานสรุปยอดส่งเบิกบริการสร้างเสริมสุขภาพและป้องกันโรค สปสช.
                </h2>
                <h3 className="text-sm font-semibold">
                  หน่วยบริการ: {settings.hospitalName} (รหัสหน่วยบริการ {settings.hospitalCode})
                </h3>
                <p className="text-xs text-slate-600">
                  ประจำเดือน{month.name} ปีงบประมาณ 2570
                </p>
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400">
                    <th className="border border-slate-400 p-1.5 text-center w-10">ลำดับ</th>
                    <th className="border border-slate-400 p-1.5 text-left">รายการบริการ</th>
                    <th className="border border-slate-400 p-1.5 text-right w-24">อัตรา (บาท)</th>
                    {rounds.map(r => (
                      <th key={r.id} className="border border-slate-400 p-1.5 text-center w-20">
                        {r.roundName} <br />
                        <span className="font-normal text-[10px]">{formatThaiShortDate(r.date)}</span>
                      </th>
                    ))}
                    <th className="border border-slate-400 p-1.5 text-right w-20">รวมคน</th>
                    <th className="border border-slate-400 p-1.5 text-right w-28">รวมเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((srv, idx) => {
                    const rateObj = rates.find(r => r.serviceId === srv.id);
                    const rate = rateObj?.rate ?? null;
                    let srvTotalCount = 0;

                    return (
                      <tr key={srv.id} className="border-b border-slate-300">
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5">{srv.name}</td>
                        <td className="border border-slate-300 p-1.5 text-right">
                          {rate !== null ? formatMoney(rate) : 'รอกำหนด'}
                        </td>
                        {rounds.map(r => {
                          const ent = entries.find(
                            e => e.roundId === r.id && e.serviceId === srv.id
                          );
                          const count = ent ? ent.count : 0;
                          srvTotalCount += count;
                          return (
                            <td key={r.id} className="border border-slate-300 p-1.5 text-center">
                              {count}
                            </td>
                          );
                        })}
                        <td className="border border-slate-300 p-1.5 text-right font-semibold">
                          {formatCount(srvTotalCount)}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold">
                          {rate !== null ? formatMoney(srvTotalCount * rate) : 'รอกำหนดอัตรา'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-4">
                  <p>ลงชื่อ........................................................ ผู้บันทึกข้อมูล</p>
                  <p>( นางสาวณัฐนันท์ สีตะ )</p>
                  <p>ตำแหน่ง: เจ้าหน้าที่บันทึกข้อมูล / ผู้ดูแลระบบ (Admin)</p>
                </div>
                <div className="space-y-4">
                  <p>ลงชื่อ........................................................ ผู้ตรวจสอบ / ผู้อนุมัติ</p>
                  <p>( {closing.approvedBy || 'พว. นฤมล เก่งงาน'} )</p>
                  <p>ตำแหน่ง: หัวหน้ากลุ่มงานประกันสุขภาพและสารสนเทศ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
