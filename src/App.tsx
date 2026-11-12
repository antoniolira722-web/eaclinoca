/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TabType } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { PacientesView } from './components/PacientesView';
import { AgendaView } from './components/AgendaView';
import { SessoesView } from './components/SessoesView';
import { PlanosView } from './components/PlanosView';
import { FinanceiroView } from './components/FinanceiroView';
import { LembretesNotificacoesView } from './components/LembretesNotificacoesView';
import { RelatoriosView } from './components/RelatoriosView';
import { NuvemConfigView } from './components/NuvemConfigView';

const MainApp: React.FC = () => {
  const { isAuthenticated, currentUser, canAccessTab } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('painel');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState<string | null>(null);

  // If user does not have permission to active tab, redirect to permitted tab
  useEffect(() => {
    if (currentUser && !canAccessTab(activeTab)) {
      const tabsOrder: TabType[] = ['painel', 'agenda', 'pacientes', 'sessoes', 'planos', 'lembretes', 'relatorio', 'financeiro', 'configuracoes'];
      const firstAllowed = tabsOrder.find(t => canAccessTab(t)) || 'agenda';
      setActiveTab(firstAllowed);
    }
  }, [currentUser, activeTab, canAccessTab]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleOpenNewSession = (pacienteId?: string) => {
    if (pacienteId) setTargetPatientId(pacienteId);
    setActiveTab('sessoes');
  };

  const handleOpenNewAgenda = (pacienteId?: string) => {
    if (pacienteId) setTargetPatientId(pacienteId);
    setActiveTab('agenda');
  };

  const handleOpenFinanceiro = (pacienteId?: string) => {
    if (pacienteId) setTargetPatientId(pacienteId);
    setActiveTab('financeiro');
  };

  const handleOpenRelatorio = (pacienteId?: string) => {
    if (pacienteId) setTargetPatientId(pacienteId);
    setActiveTab('relatorio');
  };

  return (
    <div className="min-h-screen bg-[#FAF5EE] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 w-full max-w-[1700px] mx-auto overflow-hidden">
        {/* Left Sidebar & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto max-w-full">
          {activeTab === 'painel' && canAccessTab('painel') && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenNewSession={handleOpenNewSession}
              onOpenNewAgenda={handleOpenNewAgenda}
              onOpenRelatorio={handleOpenRelatorio}
            />
          )}

          {activeTab === 'pacientes' && canAccessTab('pacientes') && (
            <PacientesView
              setActiveTab={setActiveTab}
              onOpenNewSession={handleOpenNewSession}
              onOpenNewAgenda={handleOpenNewAgenda}
              onOpenFinanceiro={handleOpenFinanceiro}
              onOpenRelatorio={handleOpenRelatorio}
            />
          )}

          {activeTab === 'agenda' && canAccessTab('agenda') && (
            <AgendaView
              setActiveTab={setActiveTab}
              onOpenNewSessionWithPatient={handleOpenNewSession}
              initialPatientId={targetPatientId}
            />
          )}

          {activeTab === 'sessoes' && canAccessTab('sessoes') && (
            <SessoesView
              setActiveTab={setActiveTab}
              initialPatientId={targetPatientId}
            />
          )}

          {activeTab === 'planos' && canAccessTab('planos') && (
            <PlanosView
              setActiveTab={setActiveTab}
              initialPatientId={targetPatientId}
            />
          )}

          {activeTab === 'financeiro' && canAccessTab('financeiro') && (
            <FinanceiroView
              setActiveTab={setActiveTab}
              initialPatientId={targetPatientId}
            />
          )}

          {activeTab === 'lembretes' && canAccessTab('lembretes') && (
            <LembretesNotificacoesView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'relatorio' && canAccessTab('relatorio') && (
            <RelatoriosView
              setActiveTab={setActiveTab}
              initialPatientId={targetPatientId}
            />
          )}

          {(activeTab === 'configuracoes' || (activeTab as any) === 'nuvem') && canAccessTab('configuracoes') && (
            <NuvemConfigView
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for all smartphones) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        onOpenMenu={() => setIsSidebarOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ClinicProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ClinicProvider>
    </ThemeProvider>
  );
}
