/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { AnnualSummaryPage } from './pages/AnnualSummaryPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ClaimTrackingPage } from './pages/ClaimTrackingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExportImportPage } from './pages/ExportImportPage';
import { MonthlySummaryPage } from './pages/MonthlySummaryPage';
import { RoundEntryPage } from './pages/RoundEntryPage';
import { SettingsPage } from './pages/SettingsPage';
import { StorageService } from './services/storage';
import { User } from './types';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    StorageService.init();
    return StorageService.getCurrentUser();
  });
  const [activeTab, setActiveTab] = useState<TabKey>('monthly'); // default to monthly summary matching Excel screenshot
  const [currentMonthKey, setCurrentMonthKey] = useState<string>('2569-10'); // ตุลาคม 2569
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    StorageService.init();
    setCurrentUser(StorageService.getCurrentUser());
    setIsReady(true);
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    handleRefresh();
  };

  const handleSelectMonthFromAnywhere = (monthKey: string) => {
    setCurrentMonthKey(monthKey);
    setActiveTab('monthly');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">กำลังโหลดระบบติดตามยอดส่งเบิก สปสช. ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Sarabun',sans-serif] selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header with Hospital branding & role switcher */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onRefreshData={handleRefresh}
      />

      {/* Navigation Bar */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            key={refreshKey}
            onSelectMonth={handleSelectMonthFromAnywhere}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'entry' && (
          <RoundEntryPage
            key={refreshKey}
            currentMonthKey={currentMonthKey}
            onSelectMonth={setCurrentMonthKey}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlySummaryPage
            key={refreshKey}
            currentMonthKey={currentMonthKey}
            onSelectMonth={setCurrentMonthKey}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'annual' && (
          <AnnualSummaryPage
            key={refreshKey}
            onSelectMonth={handleSelectMonthFromAnywhere}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'claims' && (
          <ClaimTrackingPage
            key={refreshKey}
            currentUser={currentUser}
            onSelectMonth={setCurrentMonthKey}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'export' && (
          <ExportImportPage
            key={refreshKey}
            currentMonthKey={currentMonthKey}
            onSelectMonth={setCurrentMonthKey}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogPage key={refreshKey} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            key={refreshKey}
            currentUser={currentUser}
            onRefreshData={handleRefresh}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>ระบบติดตามยอดส่งเบิกบริการสุขภาพ สปสช. ปีงบประมาณ 2570</strong> (1 ต.ค. 2569 – 30 ก.ย. 2570)
          </div>
          <div className="text-slate-400">
            มาตรฐานการส่งเบิก e-Claim สำนักงานหลักประกันสุขภาพแห่งชาติ
          </div>
        </div>
      </footer>
    </div>
  );
}
