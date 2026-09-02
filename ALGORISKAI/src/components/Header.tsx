import { Bell, User, RefreshCw, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Alerte } from '../types';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../AuthContext';
import type { Lang } from '../i18n/translations';
import AlertesList from './AlertesList';

interface HeaderProps {
  title: string;
  subtitle: string;
}

const langLabels: { code: Lang; label: string; flag: string }[] = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'عر', flag: '🇩🇿' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

export default function Header({ title, subtitle }: HeaderProps) {
  const { lang, setLang, t, isRTL } = useLang();
  const { user } = useAuth();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/alertes')
      .then(r => r.json())
      .then(data => setAlertes(Array.isArray(data) ? data : []))
      .catch(() => setAlertes([]));
  }, []);

  const alertesNonVues = Array.isArray(alertes) ? alertes.filter((a) => !a.vue).length : 0;

  return (
    <header className={`flex items-center justify-between border-b border-white/5 bg-[#020617]/80 px-6 py-4 backdrop-blur-xl sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={isRTL ? 'text-right' : ''}>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-[13px] font-medium text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Language switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-slate-900/50 p-1 backdrop-blur-sm">
          <Globe className="h-4 w-4 text-emerald-500/50 mx-2" />
          {langLabels.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-300 ${
                lang === l.code
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title={l.flag}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button className={`flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/40 px-3.5 py-2 text-[13px] font-semibold text-slate-300 transition-all duration-300 hover:bg-slate-800 hover:border-emerald-500/30 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]`}>
          <RefreshCw className="h-3.5 w-3.5" />
          {t('refresh')}
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`relative rounded-xl p-2.5 transition-all duration-300 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] ${isAlertsOpen ? 'bg-slate-800 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-emerald-400'}`}
          >
            <Bell className="h-5 w-5" />
            {alertesNonVues > 0 && (
              <span className="absolute 0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse">
                {alertesNonVues}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsAlertsOpen(false)}
              />
              <div className={`absolute top-full mt-3 w-80 md:w-96 z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-emerald-500/20">
                  <AlertesList alertes={alertes} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`ml-2 flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/40 px-3 py-1.5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-800/80 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className={`hidden sm:block ${isRTL ? 'text-right' : ''}`}>
            <p className="text-[13px] font-bold text-white capitalize tracking-wide">{user?.name || user?.role?.toLowerCase() || 'User'}</p>
            <p className="text-[10px] font-medium text-emerald-400/80">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
