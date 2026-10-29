import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudUpload,
  Edit2,
  HardDrive,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Trash2,
  Unlock,
  UserCheck,
  Users,
} from 'lucide-react';
import { GoogleDriveService, SyncStatus } from '../services/googleDriveService';
import { MOCK_USERS, StorageService } from '../services/storage';
import { ServiceItem, ServiceRate, User } from '../types';
import {
  FISCAL_YEAR_2570_MONTHS,
  formatMoney,
  formatThaiFullDate,
  STATUS_CONFIG,
} from '../utils/formatters';

interface SettingsPageProps {
  currentUser: User;
  onRefreshData?: () => void;
  onNavigateTab: (tabKey: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onRefreshData,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'drive' | 'rates' | 'services' | 'system' | 'users'>(
    'drive'
  );
  const [driveStatus, setDriveStatus] = useState<SyncStatus>(() => GoogleDriveService.getStatus());
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = GoogleDriveService.subscribe(status => {
      setDriveStatus(status);
    });
    return () => unsub();
  }, []);

  // Settings State
  const initialSettings = StorageService.getSettings();
  const [hospitalName, setHospitalName] = useState(initialSettings.hospitalName);
  const [hospitalCode, setHospitalCode] = useState(initialSettings.hospitalCode);
  const [deadlineDay, setDeadlineDay] = useState(initialSettings.deadlineDay);
  const [enableAnomaly, setEnableAnomaly] = useState(initialSettings.enableAnomalyWarning);
  const [multiplier, setMultiplier] = useState(initialSettings.anomalyMultiplier);
  const [isSavedSystem, setIsSavedSystem] = useState(false);

  // Services State
  const services = StorageService.getServices();
  const rates = StorageService.getRates();
  const closings = StorageService.getClosings();

  // Add / Edit Service Modal
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceFormName, setServiceFormName] = useState('');
  const [serviceFormCode, setServiceFormCode] = useState('');
  const [serviceFormUnit, setServiceFormUnit] = useState('คน');
  const [serviceFormCategory, setServiceFormCategory] = useState('');

  // Edit Rate Modal
  const [editingRate, setEditingRate] = useState<{
    serviceId: string;
    serviceName: string;
    rate: number | null;
    effectiveDate: string;
    note?: string;
  } | null>(null);

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateSettings({
      hospitalName,
      hospitalCode,
      deadlineDay: Number(deadlineDay),
      enableAnomalyWarning: enableAnomaly,
      anomalyMultiplier: Number(multiplier),
    });
    setIsSavedSystem(true);
    setTimeout(() => setIsSavedSystem(false), 2500);
    if (onRefreshData) onRefreshData();
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceFormName('');
    setServiceFormCode(`SRV-${services.length + 1}`);
    setServiceFormUnit('คน');
    setServiceFormCategory('บริการสร้างเสริมสุขภาพ');
    setShowServiceModal(true);
  };

  const handleOpenEditService = (srv: ServiceItem) => {
    setEditingService(srv);
    setServiceFormName(srv.name);
    setServiceFormCode(srv.code);
    setServiceFormUnit(srv.unit);
    setServiceFormCategory(srv.category || '');
    setShowServiceModal(true);
  };

  const handleSaveService = () => {
    if (!serviceFormName.trim()) {
      alert('กรุณากรอกชื่อรายการบริการ');
      return;
    }

    if (editingService) {
      StorageService.saveService({
        ...editingService,
        name: serviceFormName.trim(),
        code: serviceFormCode.trim(),
        unit: serviceFormUnit.trim(),
        category: serviceFormCategory.trim(),
      });
    } else {
      StorageService.saveService({
        id: `srv-${Date.now()}`,
        code: serviceFormCode.trim(),
        name: serviceFormName.trim(),
        unit: serviceFormUnit.trim(),
        category: serviceFormCategory.trim(),
        order: services.length + 1,
        isActive: true,
      });
    }

    setShowServiceModal(false);
    setRefreshKey(prev => prev + 1);
    if (onRefreshData) onRefreshData();
  };

  const handleToggleServiceActive = (srv: ServiceItem) => {
    StorageService.saveService({
      ...srv,
      isActive: !srv.isActive,
    });
    setRefreshKey(prev => prev + 1);
  };

  const handleMoveOrder = (srv: ServiceItem, direction: 'up' | 'down') => {
    const currentIndex = services.findIndex(s => s.id === srv.id);
    if (direction === 'up' && currentIndex > 0) {
      const prevSrv = services[currentIndex - 1];
      const tempOrder = srv.order;
      srv.order = prevSrv.order;
      prevSrv.order = tempOrder;
      StorageService.saveService(srv);
      StorageService.saveService(prevSrv);
    } else if (direction === 'down' && currentIndex < services.length - 1) {
      const nextSrv = services[currentIndex + 1];
      const tempOrder = srv.order;
      srv.order = nextSrv.order;
      nextSrv.order = tempOrder;
      StorageService.saveService(srv);
      StorageService.saveService(nextSrv);
    }
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveRate = () => {
    if (!editingRate) return;
    StorageService.updateServiceRate(
      editingRate.serviceId,
      editingRate.rate,
      editingRate.note
    );
    setEditingRate(null);
    setRefreshKey(prev => prev + 1);
    if (onRefreshData) onRefreshData();
  };

  const handleUnlockMonth = (monthKey: string) => {
    if (currentUser.role !== 'admin') {
      alert('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถปลดล็อกเดือนได้');
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะปลดล็อกเดือน ${monthKey} ให้กลับเป็นสถานะ "ร่าง"?`)) {
      StorageService.updateClosingStatus(monthKey, 'draft', 'ปลดล็อกโดยผู้ดูแลระบบ');
      setRefreshKey(prev => prev + 1);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleClearAllNumbers = () => {
    if (currentUser.role !== 'admin') {
      alert('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถล้างข้อมูลตัวเลขทั้งหมดได้');
      return;
    }
    if (
      window.confirm(
        '⚠️ คุณแน่ใจหรือไม่ที่จะล้างตัวเลขผู้รับบริการ รอบการบริการ และยอดเงินทั้งหมดในระบบให้เป็น 0?\n\nข้อมูลรอบบริการทั้งหมดจะถูกลบ และยอดปิดเดือนจะถูกรีเซ็ตเป็น 0 ทุกเดือน เพื่อให้คุณเริ่มบันทึกข้อมูลใหม่ด้วยตนเอง (รายการบริการและอัตราเบิกจะคงเดิม)'
      )
    ) {
      StorageService.clearAllNumbers();
      setRefreshKey(prev => prev + 1);
      alert('ล้างข้อมูลตัวเลขทั้งหมดเรียบร้อยแล้ว ทุกเดือนเริ่มต้นเป็น 0 พร้อมสำหรับการบันทึกข้อมูลใหม่ของคุณ');
      if (onRefreshData) onRefreshData();
    }
  };

  const handleDriveSignIn = async () => {
    try {
      setIsDriveSyncing(true);
      await GoogleDriveService.signInWithGoogle();
      await GoogleDriveService.syncToDrive();
      alert('เชื่อมต่อ Google Drive สำเร็จ และบันทึกข้อมูลตั้งต้นขึ้น Cloud เรียบร้อยแล้ว');
    } catch (err: any) {
      console.error(err);
      alert('การเชื่อมต่อ Google Drive ขัดข้อง: ' + (err?.message || 'โปรดตรวจสอบการอนุญาตแล้วลองใหม่อีกครั้ง'));
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleDriveSyncNow = async () => {
    try {
      setIsDriveSyncing(true);
      StorageService.pushToCentralServer();
      if (GoogleDriveService.hasValidToken()) {
        await GoogleDriveService.syncToDrive();
      }
      await StorageService.pullFromCentralServer(true);
      alert('บันทึกและซิงค์ข้อมูลส่วนกลางและ Google Drive เรียบร้อยแล้ว!');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      alert('การบันทึกข้อมูลล้มเหลว: ' + (err?.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleDrivePullNow = async () => {
    try {
      setIsDriveSyncing(true);
      await StorageService.pullFromCentralServer(true);
      if (GoogleDriveService.hasValidToken()) {
        const res = await GoogleDriveService.pullFromDrive();
        alert(`ดึงข้อมูลจาก Google Drive สำเร็จ: ${res.roundsCount} รอบบริการ, ${res.entriesCount} รายการย่อย ข้อมูลทุกตารางได้รับการอัปเดตเป็นปัจจุบันแล้ว`);
      } else {
        alert('ดึงข้อมูลล่าสุดจากฐานข้อมูลกลางเรียบร้อยแล้ว ทุกอุปกรณ์ใช้งานข้อมูลตรงกันทันที');
      }
      setRefreshKey(prev => prev + 1);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + (err?.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleDriveSignOut = async () => {
    if (window.confirm('คุณต้องการตัดการเชื่อมต่อบัญชี Google Drive จากเครื่องนี้ใช่หรือไม่?')) {
      await GoogleDriveService.signOut();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                Administration
              </span>
              <span className="text-xs text-slate-500">ปีงบประมาณ 2570</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-[#1F4E79]" /> การตั้งค่าระบบและการควบคุม
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดรายการบริการ, อัตราเบิกตามหลักเกณฑ์ สปสช., วันครบกำหนดส่งเบิก และสิทธิ์การใช้งาน
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex space-x-2 mt-5 border-t border-slate-100 pt-3 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('drive')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'drive'
                ? 'bg-[#1F4E79] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ☁️ ซิงค์ Google Cloud & Drive
          </button>
          <button
            onClick={() => setActiveSubTab('rates')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'rates'
                ? 'bg-[#1F4E79] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            💰 อัตราเบิกชดเชย (Service Rates)
          </button>
          <button
            onClick={() => setActiveSubTab('services')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'services'
                ? 'bg-[#1F4E79] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📋 รายการบริการสุขภาพ ({services.length})
          </button>
          <button
            onClick={() => setActiveSubTab('system')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'system'
                ? 'bg-[#1F4E79] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ⚙️ ค่ากำหนดระบบ & ปลดล็อกงวด
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'users'
                ? 'bg-[#1F4E79] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            👥 ผู้ใช้งานและบทบาทสิทธิ์
          </button>
        </div>
      </div>

      {/* SubTab 0: Google Cloud & Drive Sync */}
      {activeSubTab === 'drive' && (
        <div className="space-y-6">
          {/* Main Sync Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">บันทึกข้อมูลเข้า Google Cloud / Google Drive</h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    บันทึกข้อมูลของโรงพยาบาลท่าคันโทไว้ที่ Google Drive เพื่อให้สามารถคีย์และเปิดดูได้จากทุกอุปกรณ์
                  </p>
                </div>
              </div>

              {driveStatus.isConnected ? (
                <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 px-3.5 py-1.5 rounded-full text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>เชื่อมต่อ Google Drive แล้ว</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-amber-500/20 border border-amber-300/40 text-amber-100 px-3.5 py-1.5 rounded-full text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>ยังไม่ได้เชื่อมต่อ Google Account</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Account Connection Status Block */}
              {driveStatus.isConnected ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center space-x-3">
                    {driveStatus.userPhoto ? (
                      <img
                        src={driveStatus.userPhoto}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border border-emerald-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-base">
                        {driveStatus.userName ? driveStatus.userName.charAt(0) : 'G'}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {driveStatus.userName || 'บัญชี Google'}
                      </div>
                      <div className="text-xs font-mono text-emerald-800 font-semibold">
                        {driveStatus.userEmail || 'hmlr11082@gmail.com'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        สถานะ: บันทึกข้อมูลแบบเรียลไทม์เข้าบัญชีนี้
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isDriveSyncing}
                      onClick={handleDriveSignOut}
                      className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold transition-colors"
                    >
                      ตัดการเชื่อมต่อ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      เชื่อมต่อบัญชี Google (hmlr11082@gmail.com)
                    </h4>
                    <p className="text-xs text-slate-600">
                      คลิกปุ่มด้านขวาเพื่อเข้าสู่ระบบ Google และอนุญาตสิทธิ์เข้าถึง Google Drive
                      สำหรับการจัดเก็บฐานข้อมูล สปสช.
                    </p>
                  </div>
                  <button
                    disabled={isDriveSyncing}
                    onClick={handleDriveSignIn}
                    className="px-5 py-2.5 bg-[#1F4E79] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {isDriveSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> กำลังเชื่อมต่อ...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4" /> เข้าสู่ระบบ Google เพื่อเชื่อมต่อ Drive
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Drive Details & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                    <HardDrive className="w-4 h-4 text-blue-600" />
                    <span>ตำแหน่งจัดเก็บบน Google Drive</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">โฟลเดอร์ใน Drive:</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        โรงพยาบาลท่าคันโท_สปสช_2570
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ชื่อไฟล์ฐานข้อมูล:</span>
                      <span className="font-mono font-bold text-[#1F4E79] bg-white px-2 py-0.5 rounded border border-slate-200">
                        nhso_cloud_database_2570.json
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ซิงค์ล่าสุดเมื่อ:</span>
                      <span className="font-semibold text-slate-800">
                        {driveStatus.lastSyncedAt
                          ? formatThaiFullDate(driveStatus.lastSyncedAt)
                          : 'ยังไม่มีประวัติการซิงค์'}
                      </span>
                    </div>
                    {driveStatus.error && (
                      <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-200 mt-2">
                        ข้อผิดพลาด: {driveStatus.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Panel */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-1">
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                      <span>สั่งการซิงค์ข้อมูลด้วยตนเอง (Manual Sync)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ใช้ปุ่มด้านล่างเพื่อสำรองข้อมูลขึ้น Drive หรือดึงข้อมูลล่าสุดเมื่อใช้งานข้ามเครื่อง
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      disabled={!driveStatus.isConnected || isDriveSyncing}
                      onClick={handleDriveSyncNow}
                      className="py-2.5 px-3 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                    >
                      <CloudUpload className="w-4 h-4" />
                      <span>บันทึกขึ้น Drive ทันที</span>
                    </button>
                    <button
                      disabled={!driveStatus.isConnected || isDriveSyncing}
                      onClick={handleDrivePullNow}
                      className="py-2.5 px-3 bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                    >
                      <CloudDownload className="w-4 h-4 text-blue-700" />
                      <span>ดึงข้อมูลล่าสุดจาก Drive</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-Device Instructions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  📱 คำแนะนำการใช้งานได้จากทุกอุปกรณ์ (มือถือ, แท็บเล็ต, PC):
                </h4>
                <ul className="space-y-1 list-disc list-inside text-slate-600 pl-1 text-[11px] leading-relaxed">
                  <li>
                    <strong>บันทึกจากคอมพิวเตอร์:</strong> เมื่อเจ้าหน้าที่คีย์ข้อมูลรอบบริการหรือบันทึกผล Statement แล้วกด "บันทึก" ข้อมูลจะถูกจัดเก็บเข้า Google Drive ทันที
                  </li>
                  <li>
                    <strong>เปิดดูจากมือถือหรือแท็บเล็ต:</strong> ให้ล็อกอินด้วยบัญชี Google เดียวกัน (<span className="font-mono text-blue-700">hmlr11082@gmail.com</span>) แล้วกด "ดึงข้อมูลล่าสุดจาก Drive" ข้อมูลทั้งหมดจะปรากฏตรงกัน
                  </li>
                  <li>
                    <strong>ความปลอดภัย:</strong> ไฟล์ฐานข้อมูลจัดเก็บอยู่ใน Google Drive ส่วนบุคคลของท่าน ไม่มีการเปิดเผยสู่บุคคลภายนอก
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 1: Rates Management */}
      {activeSubTab === 'rates' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950">คำแนะนำการกำหนดอัตราเบิก สปสช.</h4>
              <p className="mt-0.5 text-amber-800">
                รายการที่ยังไม่มีอัตราเบิก เช่น <strong>บริการฝากครรภ์</strong> และ{' '}
                <strong>ยาสมุนไพร 32 รายการ</strong> สามารถคลิกปุ่ม "กำหนดอัตรา" เพื่อกรอกราคาชดเชยจริง
                ระบบจะคำนวณยอดเงินย้อนหลังในทุกรอบโดยอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                ตารางอัตราเบิกจ่ายชดเชย ปีงบประมาณ 2570
              </h3>
              <span className="text-xs text-slate-500">
                แยกตารางอัตราเพื่อไม่กระทบยอดย้อนหลัง
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-[#1F4E79] text-white">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-2.5 px-4">รายการบริการ</th>
                    <th className="py-2.5 px-4">หมวดหมู่</th>
                    <th className="py-2.5 px-4 text-right">อัตราเบิก (บาท/คน)</th>
                    <th className="py-2.5 px-4">มีผลตั้งแต่วันที่</th>
                    <th className="py-2.5 px-4">หมายเหตุ / เกณฑ์ สปสช.</th>
                    <th className="py-2.5 px-4 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {services.map((srv, idx) => {
                    const rateObj = rates.find(r => r.serviceId === srv.id);
                    const rate = rateObj?.rate ?? null;
                    const isMissing = rate === null;

                    return (
                      <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {srv.name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {srv.category || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isMissing ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              รอกำหนดอัตรา
                            </span>
                          ) : (
                            <span className="font-extrabold text-[#1F4E79] text-sm sm:text-base">
                              ฿{formatMoney(rate)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                          {rateObj?.effectiveDate ? formatThaiFullDate(rateObj.effectiveDate) : '1 ต.ค. 2569'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {rateObj?.note || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() =>
                              setEditingRate({
                                serviceId: srv.id,
                                serviceName: srv.name,
                                rate,
                                effectiveDate: rateObj?.effectiveDate || '2026-10-01',
                                note: rateObj?.note || '',
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isMissing
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-blue-50 text-blue-700'
                            }`}
                          >
                            {isMissing ? 'กำหนดอัตรา' : 'แก้ไขอัตรา'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Services Management */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              เพิ่ม แก้ไข ปิด/เปิดใช้งาน และจัดลำดับการแสดงผลของรายการบริการสุขภาพ
            </p>
            <button
              onClick={handleOpenAddService}
              className="px-4 py-2 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> เพิ่มบริการใหม่
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-[#1F4E79] text-white">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">ลำดับ</th>
                    <th className="py-2.5 px-4 w-28">รหัสบริการ</th>
                    <th className="py-2.5 px-4">ชื่อรายการบริการ</th>
                    <th className="py-2.5 px-4">หมวดหมู่</th>
                    <th className="py-2.5 px-4 text-center w-24">หน่วย</th>
                    <th className="py-2.5 px-4 text-center w-24">สถานะ</th>
                    <th className="py-2.5 px-4 text-center w-36">จัดลำดับ</th>
                    <th className="py-2.5 px-4 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {services.map((srv, idx) => (
                    <tr
                      key={srv.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        !srv.isActive ? 'opacity-50 bg-slate-100/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-600">
                        {srv.order}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {srv.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {srv.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {srv.category || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 font-medium">
                        {srv.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleServiceActive(srv)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            srv.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          {srv.isActive ? 'เปิดใช้' : 'ปิดใช้'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(srv, 'up')}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-700"
                            title="เลื่อนขึ้น"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            disabled={idx === services.length - 1}
                            onClick={() => handleMoveOrder(srv, 'down')}
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-700"
                            title="เลื่อนลง"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditService(srv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold"
                        >
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: System Settings & Month Unlock */}
      {activeSubTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General App Settings */}
          <form
            onSubmit={handleSaveSystemSettings}
            className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4"
          >
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">
                ข้อมูลหน่วยบริการและกฎการตรวจสอบ
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อหน่วยบริการ / โรงพยาบาล
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสหน่วยบริการ (5 หลัก)
              </label>
              <input
                type="text"
                value={hospitalCode}
                onChange={e => setHospitalCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันครบกำหนดส่งเบิกประจำเดือน (วันที่ของเดือนถัดไป)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={deadlineDay}
                onChange={e => setDeadlineDay(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                เช่น วันที่ 5 ของเดือนถัดไป เพื่อแสดงแจ้งเตือนนับถอยหลัง
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAnomaly}
                  onChange={e => setEnableAnomaly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  เปิดระบบเตือนเมื่อจำนวนคนสูงผิดสังเกต (Anomaly Warning)
                </span>
              </label>

              {enableAnomaly && (
                <div className="pl-6">
                  <label className="block text-xs text-slate-600 mb-1">
                    เตือนเมื่อจำนวนคนสูงกว่าค่าเฉลี่ยกี่เท่า
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={multiplier}
                    onChange={e => setMultiplier(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                  />
                  <span className="text-xs text-slate-500 ml-2">เท่า (ปัจจุบันกำหนด: 3 เท่า)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {isSavedSystem ? (
                <>
                  <Check className="w-4 h-4" /> บันทึกการตั้งค่าเรียบร้อย!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> บันทึกการตั้งค่าระบบ
                </>
              )}
            </button>
          </form>

          {/* Month Unlock Management (Admin Only) */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Unlock className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  การปลดล็อกเดือนที่ปิดยอดแล้ว (Admin Control)
                </h3>
                <p className="text-xs text-slate-500">
                  สำหรับกรณีต้องการแก้ไขข้อมูลเดือนที่ผ่านการอนุมัติหรือส่งเบิกไปแล้ว
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {FISCAL_YEAR_2570_MONTHS.map(m => {
                const cls = closings.find(c => c.monthKey === m.key);
                const status = cls?.status || 'draft';
                const isLocked = status !== 'draft';
                const statusCfg = STATUS_CONFIG[status];

                return (
                  <div
                    key={m.key}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-800">
                        {m.name}
                      </span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                        >
                          {statusCfg.label}
                        </span>
                        {cls?.approvedBy && (
                          <span className="text-[10px] text-slate-400">
                            (อนุมัติโดย: {cls.approvedBy})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isLocked ? (
                        <button
                          onClick={() => handleUnlockMonth(m.key)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5" /> ปลดล็อก
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">สถานะร่าง (แก้ไขได้)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Reset (Clear All Numbers to Zero) */}
          <div className="lg:col-span-2 bg-rose-50/70 border border-rose-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <h3>ล้างข้อมูลตัวเลขทั้งหมด เพื่อเริ่มบันทึกข้อมูลจริงด้วยตนเอง</h3>
                </div>
                <p className="text-xs text-rose-600/90 leading-relaxed max-w-2xl">
                  คำสั่งนี้จะรีเซ็ตยอดจำนวนคนและยอดเงินทั้งหมดในทุกเดือนให้เป็น 0 และลบประวัติรอบบริการเดิมออกทั้งหมด โดยยังคงรายการบริการสุขภาพ (7 รายการ) และอัตราเบิกไว้ เพื่อให้คุณเริ่มต้นบันทึกข้อมูลจริงของโรงพยาบาลท่าคันโทด้วยตนเอง
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearAllNumbers}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 shrink-0 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> ล้างตัวเลขทั้งหมด (เริ่มบันทึกใหม่)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Users and Roles */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> รายชื่อผู้ใช้งานและบทบาทหน้าที่
              </h3>
              <p className="text-xs text-slate-500">
                สามารถสลับบทบาทเพื่อทดสอบสิทธิ์ได้ที่ปุ่มมุมบนขวาของระบบ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_USERS.map(u => (
              <div
                key={u.id}
                className={`p-4 rounded-xl border ${
                  u.id === currentUser.id
                    ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                  {u.id === currentUser.id && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      คุณขณะนี้
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-[#1F4E79] mb-1">
                  {u.roleTitle}
                </div>
                <div className="text-xs text-slate-500 mb-3">{u.department}</div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">สิทธิ์ในระบบ:</p>
                  {u.role === 'recorder' && (
                    <>
                      <p>✓ เพิ่มรอบการให้บริการ และคีย์จำนวนคน</p>
                      <p>✓ แก้ไขข้อมูลในสถานะ "ร่าง"</p>
                      <p>✓ กดส่งตรวจให้หัวหน้าอนุมัติ</p>
                    </>
                  )}
                  {u.role === 'checker' && (
                    <>
                      <p>✓ ตรวจสอบความถูกต้องของยอดคนและยอดเงิน</p>
                      <p>✓ อนุมัติยอด / ส่งกลับแก้ไข</p>
                      <p>✓ เปลี่ยนสถานะส่งเบิก สปสช. และบันทึกผล Statement</p>
                    </>
                  )}
                  {u.role === 'admin' && (
                    <>
                      <p>✓ สิทธิ์เต็มทุกหน้าจอ</p>
                      <p>✓ เพิ่ม/แก้ไขบริการ และตั้งอัตราเบิก</p>
                      <p>✓ ปลดล็อกเดือนที่ปิดยอดแล้ว</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Edit Service Rate */}
      {editingRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" /> กำหนดอัตราเบิก สปสช.
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              รายการ: <strong className="text-slate-800">{editingRate.serviceName}</strong>
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  อัตราเบิกจ่ายชดเชย (บาท/คน)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingRate.rate === null ? '' : editingRate.rate}
                  onChange={e => {
                    const val = e.target.value.trim();
                    setEditingRate(prev => ({
                      ...prev!,
                      rate: val === '' ? null : parseFloat(val),
                    }));
                  }}
                  placeholder="เช่น 150.00 (เว้นว่างไว้เพื่อเป็น 'รอกำหนดอัตรา')"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  วันที่มีผลบังคับใช้
                </label>
                <input
                  type="date"
                  value={editingRate.effectiveDate}
                  onChange={e =>
                    setEditingRate(prev => ({
                      ...prev!,
                      effectiveDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หมายเหตุ / เลขที่ประกาศเกณฑ์
                </label>
                <input
                  type="text"
                  value={editingRate.note || ''}
                  onChange={e =>
                    setEditingRate(prev => ({
                      ...prev!,
                      note: e.target.value,
                    }))
                  }
                  placeholder="เช่น ประกาศหลักเกณฑ์ สปสช. ปี 2570"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditingRate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveRate}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg shadow-xs"
              >
                บันทึกอัตรา
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Service */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingService ? 'แก้ไขรายการบริการ' : 'เพิ่มรายการบริการสุขภาพใหม่'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ข้อมูลบริการสร้างเสริมสุขภาพและป้องกันโรค
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสบริการ
                </label>
                <input
                  type="text"
                  value={serviceFormCode}
                  onChange={e => setServiceFormCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อรายการบริการ (ภาษาไทย)
                </label>
                <input
                  type="text"
                  value={serviceFormName}
                  onChange={e => setServiceFormName(e.target.value)}
                  placeholder="เช่น คัดกรองเบาหวานและความดันโลหิต"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หมวดหมู่บริการ
                </label>
                <input
                  type="text"
                  value={serviceFormCategory}
                  onChange={e => setServiceFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หน่วยนับ
                </label>
                <input
                  type="text"
                  value={serviceFormUnit}
                  onChange={e => setServiceFormUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowServiceModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveService}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg shadow-xs"
              >
                บันทึกบริการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
