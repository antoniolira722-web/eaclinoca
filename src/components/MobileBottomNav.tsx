import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Menu,
  Sparkles,
  Plus
} from 'lucide-react';
import { TabType } from '../types';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenMenu: () => void;
  onQuickAdd?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
  onQuickAdd
}) => {
  const { state } = useClinic();
  const { canAccessTab } = useAuth();

  const hojeStr = new Date().toISOString().slice(0, 10);
  const agendaHojeCount = state.agenda.filter(a => a.data === hojeStr).length;

  const allMainTabs: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'painel' as TabType, label: 'Painel', icon: LayoutDashboard },
    { id: 'pacientes' as TabType, label: 'Pacientes', icon: Users, badge: state.pacientes.length },
    { id: 'agenda' as TabType, label: 'Agenda', icon: Calendar, badge: agendaHojeCount > 0 ? agendaHojeCount : undefined },
    { id: 'sessoes' as TabType, label: 'Sessões', icon: FileText }
  ];

  const mainTabs = allMainTabs.filter(t => canAccessTab(t.id));

  // Determine if active tab is in the main tabs or under "Mais"
  const isTabInMain = mainTabs.some(t => t.id === activeTab);

  return (
    <nav
      id="mobile-bottom-bar"
      aria-label="Navegação móvel"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-800 text-stone-300 shadow-2xl transition-all select-none"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl min-h-[46px] transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-stone-400 hover:text-stone-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] rounded-full bg-emerald-500 text-stone-950 font-black text-[9px] flex items-center justify-center px-0.5 ring-2 ring-stone-900">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Mais / Menu Drawer Button */}
        <button
          id="btn-mobile-more-menu"
          onClick={onOpenMenu}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl min-h-[46px] transition-all cursor-pointer ${
            !isTabInMain
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-stone-400 hover:text-stone-200 active:scale-95'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 ${!isTabInMain ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
            {!isTabInMain && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-stone-900" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">
            {!isTabInMain ? 'Módulos' : 'Mais'}
          </span>
          {!isTabInMain && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
