import React from 'react';
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  History,
  PenLine,
  Receipt,
  Settings,
  UploadCloud,
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'entry'
  | 'monthly'
  | 'annual'
  | 'claims'
  | 'export'
  | 'audit'
  | 'settings';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    {
      key: 'dashboard' as TabKey,
      label: 'แดชบอร์ด',
      sublabel: 'สรุปยอดและสถานะ',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      key: 'entry' as TabKey,
      label: 'บันทึกรายรอบ',
      sublabel: 'คีย์จำนวนคน/รอบ',
      icon: <PenLine className="w-4 h-4" />,
    },
    {
      key: 'monthly' as TabKey,
      label: 'สรุปรายเดือน',
      sublabel: 'ตารางแบบ Excel',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      key: 'annual' as TabKey,
      label: 'สรุปทั้งปี 2570',
      sublabel: 'ตาราง Pivot 12 เดือน',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      key: 'claims' as TabKey,
      label: 'ติดตามส่งเบิก สปสช.',
      sublabel: 'ติด C / ได้รับเงินแล้ว',
      icon: <Receipt className="w-4 h-4" />,
      badge: 'ติด C',
    },
    {
      key: 'export' as TabKey,
      label: 'นำเข้า / ส่งออก',
      sublabel: 'Excel & รายงาน PDF',
      icon: <UploadCloud className="w-4 h-4" />,
    },
    {
      key: 'audit' as TabKey,
      label: 'ประวัติการแก้ไข',
      sublabel: 'Audit Log',
      icon: <History className="w-4 h-4" />,
    },
    {
      key: 'settings' as TabKey,
      label: 'ตั้งค่าระบบ',
      sublabel: 'บริการ & อัตราเบิก',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto no-scrollbar py-1 space-x-1 sm:space-x-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 min-h-[44px] ${
                  isActive
                    ? 'bg-[#1F4E79] text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span className={isActive ? 'text-amber-300' : 'text-slate-500'}>
                  {tab.icon}
                </span>
                <div className="text-left">
                  <div className="leading-tight flex items-center gap-1.5">
                    {tab.label}
                    {tab.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-amber-400 text-slate-900' : 'bg-red-100 text-red-700'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
