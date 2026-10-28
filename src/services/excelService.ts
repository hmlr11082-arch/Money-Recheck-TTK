import * as XLSX from 'xlsx';
import { FISCAL_YEAR_2570_MONTHS, formatThaiShortDate, getMonthInfo } from '../utils/formatters';
import { StorageService } from './storage';

export interface MonthlyExportData {
  monthKey: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedRounds: number;
  importedEntries: number;
  warnings: string[];
}

export class ExcelService {
  /**
   * ส่งออกไฟล์ Excel ตารางสรุปรายเดือน แบบเหมือนไฟล์ต้นฉบับ
   */
  public static exportMonthlyExcel(monthKey: string): void {
    const month = getMonthInfo(monthKey);
    const services = StorageService.getServices().filter(s => s.isActive);
    const rounds = StorageService.getRounds(monthKey);
    const entries = StorageService.getEntries();
    const rates = StorageService.getRates();

    // Build worksheet data array
    const wsData: (string | number)[][] = [];

    // Title row
    wsData.push([`ตารางสรุปจำนวนผู้รับบริการและยอดการส่งเบิก เดือน${month.name}`]);
    wsData.push(['กรอกจำนวนคนในแต่ละรอบในช่องสีเหลือง / จำนวนรวมและยอดเงินคำนวณอัตโนมัติ']);
    wsData.push([]); // blank

    // Header row
    const headers: string[] = ['ลำดับ', 'รายการบริการ', 'อัตราเบิก (บาท/คน)'];
    rounds.forEach(r => {
      headers.push(`${r.roundName} (คน) ${formatThaiShortDate(r.date)}`);
    });
    headers.push('รวมจำนวน (คน/ครั้ง)', 'รวมเงิน (บาท)');
    wsData.push(headers);

    // Data rows
    let grandTotalCount = 0;
    let grandTotalAmount = 0;
    const roundTotals: number[] = new Array(rounds.length).fill(0);
    const missingRatesServices: string[] = [];

    services.forEach((srv, index) => {
      const rateObj = rates.find(r => r.serviceId === srv.id);
      const rate = rateObj?.rate ?? null;
      if (rate === null) {
        missingRatesServices.push(srv.name);
      }

      const row: (string | number)[] = [
        index + 1,
        srv.name,
        rate !== null ? rate : 'รอกำหนดอัตรา',
      ];

      let serviceTotalCount = 0;
      rounds.forEach((r, rIdx) => {
        const ent = entries.find(e => e.roundId === r.id && e.serviceId === srv.id);
        const count = ent ? ent.count : 0;
        row.push(count);
        serviceTotalCount += count;
        roundTotals[rIdx] += count;
      });

      row.push(serviceTotalCount);
      grandTotalCount += serviceTotalCount;

      const totalAmount = rate !== null ? serviceTotalCount * rate : 0;
      row.push(rate !== null ? totalAmount : 'รอกำหนดอัตรา');
      if (rate !== null) {
        grandTotalAmount += totalAmount;
      }

      wsData.push(row);
    });

    // Total Row
    const totalRow: (string | number)[] = ['', 'รวมทั้งสิ้น', ''];
    roundTotals.forEach(rt => totalRow.push(rt));
    totalRow.push(grandTotalCount, grandTotalAmount);
    wsData.push(totalRow);

    // Note row
    wsData.push([]);
    if (missingRatesServices.length > 0) {
      wsData.push([`หมายเหตุ: อัตราเบิกของ${missingRatesServices.join(' และ ')}ยังเว้นไว้ กรุณากรอกอัตราตามหลักเกณฑ์จริงในคอลัมน์ C`]);
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = [
      { wch: 8 },  // ลำดับ
      { wch: 45 }, // รายการบริการ
      { wch: 20 }, // อัตราเบิก
    ];
    rounds.forEach(() => colWidths.push({ wch: 18 })); // รอบ
    colWidths.push({ wch: 22 }, { wch: 20 }); // รวมจำนวน, รวมเงิน
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, month.shortName);

    // Save file
    const fileName = `ตารางติดตามยอดส่งเบิก_${month.name.replace(/\s+/g, '_')}_ปีงบประมาณ2570.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * ส่งออกสมุดงานทั้งปี 2570 (แท็บสรุปทั้งปี + 12 เดือน)
   */
  public static exportAnnualWorkbook(): void {
    const services = StorageService.getServices().filter(s => s.isActive);
    const rates = StorageService.getRates();
    const allRounds = StorageService.getRounds();
    const allEntries = StorageService.getEntries();
    const wb = XLSX.utils.book_new();

    // 1. Annual Summary Pivot Sheet
    const pivotData: (string | number)[][] = [];
    pivotData.push(['ตารางสรุปยอดส่งเบิกบริการสุขภาพ สปสช. ปีงบประมาณ 2570 (1 ต.ค. 2569 - 30 ก.ย. 2570)']);
    pivotData.push([]);

    // Headers: บริการ | อัตรา | 12 เดือน | รวมคนทั้งปี | รวมเงินทั้งปี
    const pivotHeaders: string[] = ['ลำดับ', 'รายการบริการ', 'อัตรา (บาท)'];
    FISCAL_YEAR_2570_MONTHS.forEach(m => pivotHeaders.push(m.shortName));
    pivotHeaders.push('รวมจำนวนคนทั้งปี', 'รวมยอดเงินทั้งปี (บาท)');
    pivotData.push(pivotHeaders);

    const monthCountTotals = new Array(12).fill(0);
    const monthAmountTotals = new Array(12).fill(0);
    let totalAllPeople = 0;
    let totalAllMoney = 0;

    services.forEach((srv, sIdx) => {
      const rateObj = rates.find(r => r.serviceId === srv.id);
      const rate = rateObj?.rate ?? null;
      const row: (string | number)[] = [sIdx + 1, srv.name, rate !== null ? rate : 'รอกำหนด'];

      let serviceYearCount = 0;
      let serviceYearAmount = 0;

      FISCAL_YEAR_2570_MONTHS.forEach((m, mIdx) => {
        const monthRounds = allRounds.filter(r => r.monthKey === m.key);
        const roundIds = monthRounds.map(r => r.id);
        const srvMonthEntries = allEntries.filter(
          e => roundIds.includes(e.roundId) && e.serviceId === srv.id
        );
        const count = srvMonthEntries.reduce((sum, e) => sum + e.count, 0);
        const amount = rate !== null ? count * rate : 0;

        row.push(count);
        serviceYearCount += count;
        serviceYearAmount += amount;

        monthCountTotals[mIdx] += count;
        monthAmountTotals[mIdx] += amount;
      });

      row.push(serviceYearCount, serviceYearAmount);
      totalAllPeople += serviceYearCount;
      totalAllMoney += serviceYearAmount;

      pivotData.push(row);
    });

    // Total people row
    const totalPeopleRow: (string | number)[] = ['', 'รวมผู้รับบริการ (คน)', ''];
    monthCountTotals.forEach(cnt => totalPeopleRow.push(cnt));
    totalPeopleRow.push(totalAllPeople, '');
    pivotData.push(totalPeopleRow);

    // Total money row
    const totalMoneyRow: (string | number)[] = ['', 'รวมยอดเงินส่งเบิก (บาท)', ''];
    monthAmountTotals.forEach(amt => totalMoneyRow.push(amt));
    totalMoneyRow.push('', totalAllMoney);
    pivotData.push(totalMoneyRow);

    const pivotWs = XLSX.utils.aoa_to_sheet(pivotData);
    pivotWs['!cols'] = [
      { wch: 8 },
      { wch: 45 },
      { wch: 15 },
      ...FISCAL_YEAR_2570_MONTHS.map(() => ({ wch: 12 })),
      { wch: 18 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, pivotWs, 'สรุปทั้งปี');

    // 2. Each month tabs
    FISCAL_YEAR_2570_MONTHS.forEach(month => {
      const rounds = allRounds.filter(r => r.monthKey === month.key);
      const wsData: (string | number)[][] = [];

      wsData.push([`ตารางสรุปจำนวนผู้รับบริการและยอดการส่งเบิก เดือน${month.name}`]);
      wsData.push(['กรอกจำนวนคนในแต่ละรอบในช่องสีเหลือง / จำนวนรวมและยอดเงินคำนวณอัตโนมัติ']);
      wsData.push([]);

      const headers: string[] = ['ลำดับ', 'รายการบริการ', 'อัตราเบิก (บาท/คน)'];
      rounds.forEach(r => {
        headers.push(`${r.roundName} (คน) ${formatThaiShortDate(r.date)}`);
      });
      headers.push('รวมจำนวน (คน/ครั้ง)', 'รวมเงิน (บาท)');
      wsData.push(headers);

      let grandTotalCount = 0;
      let grandTotalAmount = 0;
      const roundTotals: number[] = new Array(rounds.length).fill(0);

      services.forEach((srv, index) => {
        const rateObj = rates.find(r => r.serviceId === srv.id);
        const rate = rateObj?.rate ?? null;

        const row: (string | number)[] = [
          index + 1,
          srv.name,
          rate !== null ? rate : 'รอกำหนดอัตรา',
        ];

        let serviceTotalCount = 0;
        rounds.forEach((r, rIdx) => {
          const ent = allEntries.find(e => e.roundId === r.id && e.serviceId === srv.id);
          const count = ent ? ent.count : 0;
          row.push(count);
          serviceTotalCount += count;
          roundTotals[rIdx] += count;
        });

        row.push(serviceTotalCount);
        grandTotalCount += serviceTotalCount;

        const totalAmount = rate !== null ? serviceTotalCount * rate : 0;
        row.push(rate !== null ? totalAmount : 'รอกำหนดอัตรา');
        if (rate !== null) grandTotalAmount += totalAmount;

        wsData.push(row);
      });

      const totalRow: (string | number)[] = ['', 'รวมทั้งสิ้น', ''];
      roundTotals.forEach(rt => totalRow.push(rt));
      totalRow.push(grandTotalCount, grandTotalAmount);
      wsData.push(totalRow);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, month.name);
    });

    XLSX.writeFile(wb, 'ตารางติดตามยอดส่งเบิก_ปีงบประมาณ2570_ครบ12เดือน.xlsx');
  }

  /**
   * นำเข้าไฟล์ Excel เข้าสู่ระบบ
   */
  public static async parseExcelFile(
    file: File,
    targetMonthKey: string
  ): Promise<{
    previewRows: { serviceName: string; roundValues: number[]; total: number }[];
    roundHeaders: string[];
    rawRows: unknown[];
  }> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });

    const services = StorageService.getServices();
    const previewRows: { serviceName: string; roundValues: number[]; total: number }[] = [];
    const roundHeaders: string[] = [];

    // Find header row (usually contains 'รายการบริการ')
    let headerRowIdx = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row.some(cell => typeof cell === 'string' && cell.includes('รายการบริการ'))) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      throw new Error('ไม่พบคอลัมน์ "รายการบริการ" ในไฟล์ Excel กรุณาใช้เทมเพลตมาตรฐาน');
    }

    const headerRow = rawData[headerRowIdx] as string[];
    // Find round columns between 'อัตราเบิก' and 'รวมจำนวน'
    let serviceColIdx = 1;
    let rateColIdx = 2;
    let roundStartCol = 3;
    let roundEndCol = headerRow.length - 2;

    headerRow.forEach((col, idx) => {
      if (typeof col === 'string') {
        if (col.includes('รายการบริการ')) serviceColIdx = idx;
        if (col.includes('อัตรา')) rateColIdx = idx;
        if (col.includes('รวมจำนวน') || col.includes('รวมเงิน')) {
          if (idx < roundEndCol) roundEndCol = idx;
        }
      }
    });

    for (let c = roundStartCol; c < roundEndCol; c++) {
      roundHeaders.push(String(headerRow[c] || `รอบที่ ${c - roundStartCol + 1}`));
    }

    // Parse data rows
    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r] as (string | number)[];
      if (!row || row.length === 0) continue;
      const serviceName = String(row[serviceColIdx] || '').trim();
      if (!serviceName || serviceName.includes('รวมทั้งสิ้น') || serviceName.includes('หมายเหตุ')) {
        continue;
      }

      const roundVals: number[] = [];
      let rowTotal = 0;
      for (let c = roundStartCol; c < roundEndCol; c++) {
        const val = Number(row[c]) || 0;
        roundVals.push(val);
        rowTotal += val;
      }

      previewRows.push({
        serviceName,
        roundValues: roundVals,
        total: rowTotal,
      });
    }

    return {
      previewRows,
      roundHeaders,
      rawRows: rawData,
    };
  }

  /**
   * ยืนยันการนำเข้าข้อมูล
   */
  public static commitImport(
    targetMonthKey: string,
    roundDates: string[],
    previewRows: { serviceName: string; roundValues: number[] }[]
  ): ImportResult {
    const services = StorageService.getServices();
    const warnings: string[] = [];
    let importedEntries = 0;

    // 1. Create or match rounds
    const existingRounds = StorageService.getRounds(targetMonthKey);
    const roundObjects = roundDates.map((date, idx) => {
      if (existingRounds[idx]) {
        return existingRounds[idx];
      }
      return StorageService.addRound(targetMonthKey, date, `ครั้งที่ ${idx + 1}`);
    });

    // 2. Save entries
    previewRows.forEach(row => {
      // Find matching service by name
      const matchedSrv = services.find(
        s => s.name.trim() === row.serviceName.trim() || row.serviceName.includes(s.name)
      );

      if (!matchedSrv) {
        warnings.push(`ไม่พบบริการชื่อ "${row.serviceName}" ในระบบ (ข้ามข้อมูลรายการนี้)`);
        return;
      }

      row.roundValues.forEach((count, rIdx) => {
        if (roundObjects[rIdx]) {
          StorageService.saveEntry(roundObjects[rIdx].id, matchedSrv.id, count);
          importedEntries++;
        }
      });
    });

    return {
      success: true,
      message: `นำเข้าข้อมูลสำเร็จ: ${roundObjects.length} รอบการให้บริการ, ${importedEntries} รายการย่อย`,
      importedRounds: roundObjects.length,
      importedEntries,
      warnings,
    };
  }
}
