import {
  LayoutDashboard, UserCheck, TrendingUp, Brain, AlertTriangle,
  Database, Settings, Activity, Search, ChevronLeft,
  ChevronRight, ShieldAlert, Network, Lightbulb, ShieldOff, LogOut,
  MessageSquare
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
  { id: 'kyc',          labelKey: 'nav_kyc',         icon: UserCheck },
  { id: 'predictions',  labelKey: 'nav_predictions', icon: TrendingUp },
  { id: 'modeles',      labelKey: 'nav_modeles',     icon: Brain },
  { id: 'anomalies',    labelKey: 'nav_anomalies',   icon: AlertTriangle },
  { id: 'risques',      labelKey: 'nav_risques',     icon: ShieldAlert },
  { id: 'credit_risk',  labelKey: 'nav_credit_risk', icon: Database },
  { id: 'fraude',       labelKey: 'nav_fraude',      icon: ShieldOff },
  { id: 'api',          labelKey: 'nav_api',         icon: Network },
  { id: 'xai',          labelKey: 'nav_xai',         icon: Lightbulb },
  { id: 'chatbot',      labelKey: 'nav_chatbot',     icon: MessageSquare },

  { id: 'monitoring',   labelKey: 'nav_monitoring',  icon: Activity },
  { id: 'parametres',   labelKey: 'nav_parametres',  icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }: SidebarProps) {
  const { t, isRTL } = useLang();
  const { logout } = useAuth();

  return (
    <aside
      className={`fixed top-0 z-40 flex h-screen flex-col border-[#1e293b] bg-[#070b12]/95 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      } ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[#1e293b] px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#006233]/20 to-transparent opacity-60" />
        <AlgoriskLogo size={38} className="shrink-0 relative z-10" />
        {!collapsed && (
          <div className="overflow-hidden relative z-10">
            <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#006233] drop-shadow-[0_0_10px_rgba(0,98,51,0.4)]">
              RiskVision<span className="text-white">AI</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#34d399]">
              {t('appTagline')}
            </p>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <div className="group flex items-center gap-2 rounded-xl border border-[#1e293b] bg-[#050811] px-3 py-2.5 transition-colors focus-within:border-[#10b981]/50 focus-within:bg-[#070b12]">
            <Search className="h-4 w-4 text-slate-500 shrink-0 group-focus-within:text-[#34d399] transition-colors" />
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
                  ? 'text-[#34d399] border border-[#006233]/60 bg-[#006233]/25 shadow-[0_0_15px_rgba(0,98,51,0.25)]'
                  : 'text-slate-400 hover:bg-[#0d1522] hover:text-slate-200'
              } ${isRTL ? 'flex-row-reverse text-right' : ''}`}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <Icon className={`h-5 w-5 shrink-0 relative z-10 transition-colors ${isActive ? 'text-[#34d399] drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'text-slate-500 group-hover:text-[#34d399]'}`} />
              {!collapsed && <span className="flex-1 truncate relative z-10 font-semibold">{t(item.labelKey)}</span>}
              {isActive && !collapsed && (
                <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.9)] relative z-10`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="border-t border-[#1e293b] p-3">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-slate-500 transition-all duration-300 hover:bg-slate-800/50 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
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
