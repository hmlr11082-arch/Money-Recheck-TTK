import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  RotateCcw,
  Shield,
  Stethoscope,
  UserCheck,
  UserCircle,
} from 'lucide-react';
import { MOCK_USERS, StorageService } from '../services/storage';
import { Role, User } from '../types';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onRefreshData,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const settings = StorageService.getSettings();
  const rates = StorageService.getRates();
  const services = StorageService.getServices().filter(s => s.isActive);

  // Missing rates count
  const missingRateCount = services.filter(s => {
    const r = rates.find(rate => rate.serviceId === s.id);
    return !r || r.rate === null;
  }).length;

  const handleSelectRole = (user: User) => {
    StorageService.setCurrentUser(user);
    onUserChange(user);
    setShowRoleMenu(false);
  };

  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตาม Seed Data หรือไม่?')) {
      StorageService.resetToSeed();
      if (onRefreshData) onRefreshData();
      alert('รีเซ็ตข้อมูลเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <Shield className="w-3.5 h-3.5 mr-1" />,
        };
      case 'checker':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1" />,
        };
      case 'recorder':
      default:
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <Stethoscope className="w-3.5 h-3.5 mr-1" />,
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="bg-gradient-to-r from-[#173B5D] via-[#1F4E79] to-[#2B6094] text-white shadow-md border-b border-blue-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Hospital Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
              <Building2 className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-500/30 text-blue-100 border border-blue-400/30">
                  สปสช. ปีงบประมาณ 2570
                </span>
                <span className="text-xs text-blue-200 hidden sm:inline">
                  (1 ต.ค. 69 – 30 ก.ย. 70)
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm flex items-center gap-1.5">
                ระบบติดตามยอดส่งเบิกบริการสุขภาพ
              </h1>
              <p className="text-xs text-blue-100/80 truncate max-w-xs sm:max-w-md">
                {settings.hospitalName} ({settings.hospitalCode})
              </p>
            </div>
          </div>

          {/* Right Controls: Notifications, Reset Demo, Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Warning indicator for missing rates */}
            {missingRateCount > 0 && (
              <div
                title={`มี ${missingRateCount} รายการบริการที่ยังไม่กำหนดอัตราเบิก`}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-400/40 text-xs font-medium animate-pulse"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>รอกำหนดอัตรา {missingRateCount} รายการ</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white focus:outline-none"
                title="การแจ้งเตือน"
              >
                <Bell className="w-5 h-5" />
                {missingRateCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {missingRateCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 p-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-blue-600" /> การแจ้งเตือนระบบ
                    </h4>
                    <span className="text-[11px] text-slate-400">เรียลไทม์</span>
                  </div>

                  <div className="mt-2.5 space-y-2 text-xs">
                    {missingRateCount > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">เตือน: รอกำหนดอัตราเบิก</p>
                          <p className="text-amber-800 text-[11px]">
                            บริการฝากครรภ์ และยาสมุนไพร 32 รายการ ยังไม่ได้กำหนดราคา กรุณาไปที่เมนูตั้งค่า
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">กำหนดส่งเบิก สปสช.</p>
                        <p className="text-blue-800 text-[11px]">
                          ส่งข้อมูลรอบเดือน ภายในวันที่ {settings.deadlineDay} ของเดือนถัดไป
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">สปสช. อนุมัติงวด พ.ย. 69</p>
                        <p className="text-emerald-800 text-[11px]">
                          โอนเงินชดเชยแล้ว 10,980.00 บาท (มีติด C 5 รายการ)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Demo button */}
            <button
              onClick={handleResetData}
              title="รีเซ็ตข้อมูลกลับเป็นตัวอย่างเดิม"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs hidden lg:flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>รีเซ็ต Demo</span>
            </button>

            {/* Role Switcher (Simulate Role) */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors focus:outline-none text-left"
              >
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold leading-tight text-white flex items-center justify-end gap-1.5">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'admin' && (
                      <span className="text-[10px] bg-purple-400 text-purple-950 px-1.5 py-0.2 rounded font-bold shadow-xs">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-blue-200 leading-tight">
                    {currentUser.roleTitle}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-400/30 flex items-center justify-center text-white border border-white/20">
                  <UserCircle className="w-6 h-6" />
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 p-2 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      สลับบทบาทผู้ใช้ (Demo Role Switcher)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ทดสอบสิทธิ์การกรอก อนุมัติ และตั้งค่า
                    </p>
                  </div>
                  <div className="mt-1 space-y-1">
                    {MOCK_USERS.map(user => {
                      const isSelected = user.id === currentUser.id;
                      const userBadge = getRoleBadge(user.role);
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleSelectRole(user)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start space-x-2.5 ${
                            isSelected
                              ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="mt-0.5">{userBadge.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold truncate">{user.name}</span>
                              {isSelected && (
                                <span className="text-[10px] text-blue-600 font-bold">กำลังใช้งาน</span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px]">{user.roleTitle}</div>
                            <div className="text-slate-400 text-[10px] truncate">{user.department}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
