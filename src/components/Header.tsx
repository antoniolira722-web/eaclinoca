import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudOff,
  Bell,
  Search,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Smartphone,
  SlidersHorizontal,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  KeyRound,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TabType } from '../types';
import { INFO_NIVEIS_ACESSO } from '../utils/authUtils';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onOpenSyncModal?: () => void;
  onOpenNewReminderModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  toggleSidebar,
  isSidebarOpen,
  onOpenSyncModal,
  onOpenNewReminderModal
}) => {
  const {
    state,
    syncState,
    lastSyncTime,
    syncCode,
    searchQuery,
    setSearchQuery,
    forcarSincronizacao,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,
    limparNotificacoes
  } = useClinic();

  const { currentUser, logout, quickSwitchUser, usuarios, hasPermission } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'todas' | 'naolidas'>('todas');
  const [isSyncingManual, setIsSyncingManual] = useState(false);

  const unreadCount = state.notificacoes.filter(n => !n.lida).length;

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    await forcarSincronizacao();
    setTimeout(() => setIsSyncingManual(false), 600);
  };

  const handleCloudClick = () => {
    if (onOpenSyncModal) {
      onOpenSyncModal();
    } else {
      setActiveTab('configuracoes');
    }
  };

  const filteredNotifs = state.notificacoes.filter(n => {
    if (notifFilter === 'naolidas') return !n.lida;
    return true;
  });

  const nivelInfo = currentUser?.nivelAcesso
    ? INFO_NIVEIS_ACESSO[currentUser.nivelAcesso]
    : INFO_NIVEIS_ACESSO.psicopedagogo;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF5EE]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-[#EFE7DC] dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Mobile Menu Toggle & Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md min-w-0">
          {/* Hamburger button on mobile */}
          <button
            id="btn-mobile-menu-toggle"
            onClick={toggleSidebar}
            className="md:hidden p-2 -ml-1 rounded-2xl text-stone-700 dark:text-stone-300 hover:bg-[#EFE7DC] dark:hover:bg-stone-800 transition-colors cursor-pointer flex-shrink-0"
            aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9181] dark:text-stone-500" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar paciente, sessão..."
              className="w-full pl-9 pr-7 sm:pr-8 py-2 text-xs sm:text-sm rounded-2xl bg-white dark:bg-stone-800/80 border border-[#E5DAC8] dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-[#9C9181] focus:outline-none focus:ring-2 focus:ring-[#5B826E]/30 focus:border-[#5B826E] transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status Indicator */}
          <button
            id="btn-cloud-sync-status"
            onClick={handleCloudClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-medium border shadow-xs transition-all ${
              syncState === 'synced'
                ? 'bg-white/90 dark:bg-stone-800/90 border-[#E5DAC8] dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-white'
                : syncState === 'syncing' || isSyncingManual
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 animate-pulse'
                : 'bg-white/90 dark:bg-stone-800 border-[#E5DAC8] dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-white'
            }`}
            title={`Sincronização em Nuvem: ${syncCode} - Clique para configurar`}
          >
            {syncState === 'synced' ? (
              <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : syncState === 'syncing' || isSyncingManual ? (
              <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
            ) : (
              <CloudOff className="w-4 h-4 text-stone-500" />
            )}
            <span className="hidden md:inline">
              {syncState === 'synced'
                ? 'Nuvem Sincronizada'
                : syncState === 'syncing' || isSyncingManual
                ? 'Sincronizando...'
                : 'Offline'}
            </span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="btn-toggle-theme"
            onClick={toggleTheme}
            className="p-2 rounded-2xl text-[#8C6D3B] dark:text-amber-400 bg-[#F4E8D7] dark:bg-stone-800 hover:bg-[#EBDEC8] dark:hover:bg-stone-700 border border-[#E5DAC8] dark:border-stone-700/80 shadow-xs transition-colors"
            title={`Alternar modo (${resolvedTheme === 'dark' ? 'Ativar Claro' : 'Ativar Escuro'})`}
            aria-label="Alternar modo escuro"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#8C6D3B]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-2xl text-stone-700 dark:text-stone-300 bg-white/90 hover:bg-white dark:bg-stone-800 dark:hover:bg-stone-700 border border-[#E5DAC8] dark:border-stone-700/80 shadow-xs transition-colors"
              title="Notificações & Lembretes"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#E54848] px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white dark:ring-stone-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Popover Header */}
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                        Notificações
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={marcarTodasNotificacoesLidas}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-0.5 font-medium"
                        >
                          Ler todas
                        </button>
                      )}
                      <button
                        onClick={limparNotificacoes}
                        className="text-stone-400 hover:text-rose-500 p-1 rounded-md"
                        title="Limpar histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="px-3 py-2 bg-stone-100/60 dark:bg-stone-800/30 border-b border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setNotifFilter('todas')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                          notifFilter === 'todas'
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                        }`}
                      >
                        Todas ({state.notificacoes.length})
                      </button>
                      <button
                        onClick={() => setNotifFilter('naolidas')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                          notifFilter === 'naolidas'
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                        }`}
                      >
                        Não lidas ({unreadCount})
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenNewReminderModal();
                      }}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Lembrete
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/50">
                    {filteredNotifs.length === 0 ? (
                      <div className="py-8 text-center text-stone-400 dark:text-stone-500 text-xs">
                        Nenhuma notificação {notifFilter === 'naolidas' ? 'não lida' : ''}.
                      </div>
                    ) : (
                      filteredNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            marcarNotificacaoLida(n.id);
                            if (n.linkTab) {
                              setActiveTab(n.linkTab);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60 ${
                            !n.lida
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'opacity-85'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                {!n.lida && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                )}
                                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                                  {n.titulo}
                                </p>
                              </div>
                              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2">
                                {n.mensagem}
                              </p>
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1.5 block">
                                {new Date(n.timestamp).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </span>
                            </div>
                            {n.linkTab && (
                              <span className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="p-2 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-200 dark:border-stone-800 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('lembretes');
                      }}
                      className="text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      Ver todos os lembretes e alertas →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Menu & Access Level */}
          <div className="relative pl-1 sm:pl-2 border-l border-[#E5DAC8] dark:border-stone-800">
            <button
              id="btn-user-profile-menu"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-2xl hover:bg-white/80 dark:hover:bg-stone-800 transition-colors cursor-pointer text-left"
              title="Perfil do Usuário e Nível de Acesso"
            >
              <div
                className="w-8 h-8 rounded-full bg-[#C07A60] text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0"
              >
                {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'E'}
              </div>

              <div className="hidden lg:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {currentUser?.nome || 'Ester Lopes (Admin)'}
                  </span>
                  <span className="text-[11px]">👑</span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block leading-tight">
                  {nivelInfo.nome.split('/')[0].trim()}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
            </button>

            {/* Dropdown Popover */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  {/* Card Top */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-stone-50 dark:from-emerald-950/40 dark:to-stone-900 border-b border-stone-100 dark:border-stone-800/80">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl ${
                          currentUser?.avatarColor || 'bg-emerald-600'
                        } text-white flex items-center justify-center font-bold text-base shadow-sm`}
                      >
                        {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {currentUser?.nome || 'Usuário Conectado'}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          @{currentUser?.username} {currentUser?.email ? `• ${currentUser.email}` : ''}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${nivelInfo.badgeBg} ${nivelInfo.badgeText} ${nivelInfo.badgeBorder}`}
                          >
                            <span>{nivelInfo.icone}</span>
                            <span>{nivelInfo.nome}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2 space-y-1 text-xs">
                    {hasPermission('gerenciarUsuarios') && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('configuracoes');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Gerenciar Usuários & Acessos</span>
                      </button>
                    )}

                    {/* Quick switch simulation section */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Alternar Usuário (Simulação):
                      </p>
                      <div className="space-y-0.5">
                        {usuarios.map((u) => {
                          const isCurrent = u.id === currentUser?.id;
                          const uNivel = INFO_NIVEIS_ACESSO[u.nivelAcesso] || INFO_NIVEIS_ACESSO.estagiario;
                          return (
                            <button
                              key={u.id}
                              disabled={isCurrent}
                              onClick={async () => {
                                await quickSwitchUser(u.username);
                                setShowUserMenu(false);
                              }}
                              className={`w-full px-3 py-1.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span>{uNivel.icone}</span>
                                <span className="truncate">{u.nome}</span>
                              </div>
                              {isCurrent ? (
                                <span className="text-[10px] font-bold">Ativo</span>
                              ) : (
                                <span className="text-[10px] text-stone-400">@{u.username}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Logout Button */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair do Sistema</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
