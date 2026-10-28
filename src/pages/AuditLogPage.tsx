import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  History,
  RotateCcw,
  Search,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { AuditLog } from '../types';
import { formatThaiFullDate } from '../utils/formatters';

export const AuditLogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  const logs = StorageService.getAuditLogs();

  // Extract unique users and action types for filters
  const uniqueUsers = Array.from(new Set(logs.map(l => l.userName)));
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const filteredLogs = logs.filter(log => {
    if (selectedUserFilter !== 'all' && log.userName !== selectedUserFilter) return false;
    if (selectedActionFilter !== 'all' && log.action !== selectedActionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.entityName.toLowerCase().includes(q) ||
        log.oldValue.toLowerCase().includes(q) ||
        log.newValue.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                Audit Trail
              </span>
              <span className="text-xs text-slate-500">บันทึกความปลอดภัย</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <History className="w-6 h-6 text-[#1F4E79]" /> ประวัติการบันทึกและแก้ไขข้อมูล (Audit Log)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบย้อนหลังว่าใคร บันทึกหรือแก้ไขอะไร เมื่อไหร่ พร้อมค่าเดิมและค่าใหม่
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            เก็บบันทึกประวัติทั้งหมด <strong className="text-slate-900">{logs.length}</strong> รายการ
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหารายการ, ค่าเดิม, ค่าใหม่..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* User Filter */}
          <div className="flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <select
              value={selectedUserFilter}
              onChange={e => setSelectedUserFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ผู้ใช้ทั้งหมด ({uniqueUsers.length} คน)</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedActionFilter}
              onChange={e => setSelectedActionFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">กิจกรรมทั้งหมด</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || selectedUserFilter !== 'all' || selectedActionFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedUserFilter('all');
              setSelectedActionFilter('all');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" /> ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1F4E79] text-white">
              <tr>
                <th className="py-3 px-4 font-bold w-40">วัน-เวลา</th>
                <th className="py-3 px-4 font-bold w-48">ผู้ดำเนินการ</th>
                <th className="py-3 px-4 font-bold w-44">กิจกรรม</th>
                <th className="py-3 px-4 font-bold min-w-[200px]">เป้าหมาย / รายการ</th>
                <th className="py-3 px-4 font-bold w-36 text-slate-200 bg-blue-900/40">ค่าเดิม</th>
                <th className="py-3 px-4 font-bold w-36 text-amber-200 bg-blue-900/60">ค่าใหม่</th>
                <th className="py-3 px-4 font-bold">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลประวัติการแก้ไขตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const dateObj = new Date(log.timestamp);
                  const timeStr = dateObj.toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const dateStr = log.timestamp.split('T')[0];

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        <div>{formatThaiFullDate(dateStr)}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {timeStr} น.
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="text-[11px] text-slate-500">{log.userRole}</div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {log.entityName}
                      </td>

                      {/* Old Value */}
                      <td className="py-3 px-4 font-mono text-slate-500 bg-slate-50/50">
                        {log.oldValue}
                      </td>

                      {/* New Value */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1F4E79] bg-amber-50/30">
                        {log.newValue}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
