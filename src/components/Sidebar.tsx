import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Target,
  DollarSign,
  BellRing,
  FileBarChart,
  Settings,
  Sparkles,
  HeartHandshake,
  LogOut,
  Shield,
  Lock,
  X,
  ChevronRight
} from 'lucide-react';
import { TabType } from '../types';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { INFO_NIVEIS_ACESSO } from '../utils/authUtils';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen = false,
  onClose
}) => {
  const { state } = useClinic();
  const { currentUser, canAccessTab, logout, quickSwitchUser, usuarios } = useAuth();

  const hojeStr = new Date().toISOString().slice(0, 10);
  const agendaHojeCount = state.agenda.filter(a => a.data === hojeStr).length;
  const pendenciasFinCount = state.financeiro.filter(f => f.status !== 'Pago').length;
  const lembretesAtivosCount = state.lembretes.filter(l => !l.concluido).length;

  const allMenuItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'painel', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'pacientes', label: 'Pacientes', icon: Users, badge: state.pacientes.length },
    { id: 'agenda', label: 'Agenda', icon: Calendar, badge: agendaHojeCount, badgeColor: 'bg-emerald-600' },
    { id: 'sessoes', label: 'Sessões Clínicas', icon: FileText, badge: state.sessoes.length },
    { id: 'planos', label: 'Planos de Intervenção', icon: Target, badge: state.planos.length },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, badge: pendenciasFinCount > 0 ? pendenciasFinCount : undefined, badgeColor: 'bg-amber-600' },
    { id: 'lembretes', label: 'Lembretes & Alertas', icon: BellRing, badge: lembretesAtivosCount > 0 ? lembretesAtivosCount : undefined, badgeColor: 'bg-rose-600' },
    { id: 'relatorio', label: 'Relatórios & Laudos', icon: FileBarChart },
    { id: 'configuracoes', label: 'Configurações', icon: Settings }
  ];

  // Filter based on role permissions
  const menuItems = allMenuItems.filter(item => canAccessTab(item.id));

  const nivelInfo = currentUser?.nivelAcesso
    ? INFO_NIVEIS_ACESSO[currentUser.nivelAcesso]
    : INFO_NIVEIS_ACESSO.psicopedagogo;

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Desktop / Tablet Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col justify-between bg-stone-900 text-stone-100 p-4 border-r border-stone-800 flex-shrink-0 transition-colors select-none">
        <div>
          {/* Clinic Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-5 border-b border-stone-800/80">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-950/40">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                {state.configuracoes?.nomeClinica || 'Ninho Aprendiz'}
              </h1>
              <p className="text-[11px] text-stone-400 font-medium">
                Gestão Psicopedagógica
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-stone-400 group-hover:text-emerald-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-emerald-900'
                          : item.badgeColor || 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: User profile & Logout in sidebar */}
        <div className="pt-3 border-t border-stone-800/80 space-y-2">
          {currentUser && (
            <div className="p-2.5 rounded-2xl bg-stone-800/50 border border-stone-700/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl ${
                    currentUser.avatarColor || 'bg-emerald-600'
                  } text-white flex items-center justify-center font-bold text-xs flex-shrink-0`}
                >
                  {currentUser.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-200 truncate leading-tight">
                    {currentUser.nome}
                  </p>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium truncate">
                    <span>{nivelInfo.icone}</span>
                    <span>{nivelInfo.nome.split('/')[0].trim()}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors cursor-pointer"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="px-2 text-[10px] text-stone-500">
            <p className="font-medium text-stone-400 truncate">
              {state.configuracoes?.profissional || 'Ester Lopes'}
            </p>
            <p className="truncate">{state.configuracoes?.registroProfissional || 'ABPp 4821/SP'}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Slide-out Off-Canvas for All Smartphones) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className="relative w-full max-w-xs bg-stone-900 text-stone-100 flex flex-col justify-between p-4 shadow-2xl z-10 border-r border-stone-800 overflow-y-auto animate-in slide-in-from-left duration-200"
            style={{
              paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))'
            }}
          >
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-950/40">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-tight">
                      {state.configuracoes?.nomeClinica || 'Ninho Aprendiz'}
                    </h2>
                    <p className="text-[10px] text-stone-400">
                      Gestão Psicopedagógica
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current User Card inside Drawer */}
              {currentUser && (
                <div className="mb-4 p-3 rounded-2xl bg-stone-800/70 border border-stone-700/60">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl ${
                        currentUser.avatarColor || 'bg-emerald-600'
                      } text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0`}
                    >
                      {currentUser.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-stone-100 truncate">
                        {currentUser.nome}
                      </p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <span>{nivelInfo.icone}</span>
                        <span>{nivelInfo.nome}</span>
                      </span>
                    </div>
                  </div>

                  {/* Switch user quick chips on mobile */}
                  <div className="pt-2 border-t border-stone-700/50 flex flex-wrap gap-1">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block w-full mb-0.5">
                      Trocar perfil:
                    </span>
                    {usuarios.map(u => (
                      <button
                        key={u.id}
                        onClick={async () => {
                          await quickSwitchUser(u.username);
                          if (onClose) onClose();
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-stone-700/60 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {u.nome.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Drawer Menu Items */}
              <nav className="space-y-1">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Módulos do Sistema:
                </p>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-white text-emerald-950'
                                : item.badgeColor || 'bg-stone-800 text-stone-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions inside Drawer */}
            <div className="pt-4 mt-4 border-t border-stone-800 space-y-3">
              <button
                onClick={() => {
                  if (onClose) onClose();
                  logout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </button>

              <div className="text-center text-[10px] text-stone-500">
                <p>{state.configuracoes?.profissional || 'Ester Lopes'}</p>
                <p>{state.configuracoes?.registroProfissional || 'ABPp 4821/SP'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
