import {
  LayoutDashboard, TrendingUp, Brain, AlertTriangle,
  Database, Settings, Activity, Search, ChevronLeft,
  ChevronRight, ShieldAlert, Network, Lightbulb, ShieldOff, LogOut
} from 'lucide-react';
import AlgoriskLogo from './AlgoriskLogo';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../AuthContext';
import type { TranslationKey } from '../i18n/translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const menuItems: { id: string; labelKey: TranslationKey; icon: any }[] = [
  { id: 'dashboard',    labelKey: 'nav_dashboard',   icon: LayoutDashboard },
  { id: 'predictions',  labelKey: 'nav_predictions', icon: TrendingUp },
  { id: 'modeles',      labelKey: 'nav_modeles',     icon: Brain },
  { id: 'anomalies',    labelKey: 'nav_anomalies',   icon: AlertTriangle },
  { id: 'risques',      labelKey: 'nav_risques',     icon: ShieldAlert },
  { id: 'fraude',       labelKey: 'nav_fraude',      icon: ShieldOff },
  { id: 'api',          labelKey: 'nav_api',         icon: Network },
  { id: 'xai',          labelKey: 'nav_xai',         icon: Lightbulb },

  { id: 'monitoring',   labelKey: 'nav_monitoring',  icon: Activity },
  { id: 'parametres',   labelKey: 'nav_parametres',  icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }: SidebarProps) {
  const { t, isRTL } = useLang();
  const { logout } = useAuth();

  return (
    <aside
      className={`fixed top-0 z-40 flex h-screen flex-col border-white/5 bg-[#020617]/80 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      } ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-50" />
        <AlgoriskLogo size={38} className="shrink-0 relative z-10" />
        {!collapsed && (
          <div className="overflow-hidden relative z-10">
            <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              RiskVision<span className="text-white">AI</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/70">
              {t('appTagline')}
            </p>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <div className="group flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/50 px-3 py-2.5 transition-colors focus-within:border-cyan-500/30 focus-within:bg-slate-900/80">
            <Search className="h-4 w-4 text-slate-500 shrink-0 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder={t('search')}
              className="w-full border-0 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden ${
                isActive
                  ? 'text-cyan-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              } ${isRTL ? 'flex-row-reverse text-right' : ''}`}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/5 opacity-100" />
              )}
              <Icon className={`h-5 w-5 shrink-0 relative z-10 transition-colors ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-500 group-hover:text-cyan-400/70'}`} />
              {!collapsed && <span className="flex-1 truncate relative z-10">{t(item.labelKey)}</span>}
              {isActive && !collapsed && (
                <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] relative z-10`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status */}
      

      {/* Logout button */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={logout}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-red-400 transition-all duration-300 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-xs font-semibold tracking-wide uppercase">{t('logout', 'تسجيل خروج', 'Se déconnecter')}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-slate-500 transition-all duration-300 hover:bg-slate-800/50 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
        >
          {collapsed
            ? (isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
            : (isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)
          }
          {!collapsed && <span className="text-xs font-semibold tracking-wide uppercase">{t('reduce')}</span>}
        </button>
      </div>
    </aside>
  );
}
