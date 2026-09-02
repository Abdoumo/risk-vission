import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { Alerte } from '../types';
import { useLang } from '../i18n/LangContext';

interface AlertesListProps {
  alertes: Alerte[];
}

export default function AlertesList({ alertes }: AlertesListProps) {
  const { lang, t, isRTL } = useLang();
  const [localAlertes, setLocalAlertes] = useState<Alerte[]>(alertes);

  useEffect(() => {
    setLocalAlertes(alertes);
  }, [alertes]);

  const iconMap = {
    critique:     { Icon: AlertCircle,  color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
    avertissement:{ Icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
    info:         { Icon: Info,          color: 'text-cyan-400',  bg: 'bg-cyan-500/10',  border: 'border-cyan-500/20' },
  };

  const getMessage = (alerte: Alerte) => {
    if (lang === 'ar') return alerte.message_ar;
    if (lang === 'en') return alerte.message_en;
    return alerte.message_fr;
  };

  const getTimestamp = (alerte: Alerte) => {
    if (lang === 'ar') return alerte.timestamp_ar;
    if (lang === 'en') return alerte.timestamp_en;
    return alerte.timestamp_fr;
  };

  const nonVues = localAlertes.filter((a) => !a.vue).length;

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 h-full transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)]">
      <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-lg font-bold text-white tracking-tight">{t('alerts_title')}</h3>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            {nonVues} {t('alerts_unread')} {localAlertes.length}
          </p>
        </div>
        <button 
          onClick={() => setLocalAlertes(prev => prev.map(a => ({ ...a, vue: true })))}
          className="text-[13px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap"
        >
          {t('alerts_markall')}
        </button>
      </div>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-hide">
        {localAlertes.map((alerte) => {
          const config = iconMap[alerte.type as keyof typeof iconMap] || iconMap.info;
          const Icon = config.Icon;
          return (
            <div
              key={alerte.id}
              className={`group flex items-start gap-3 rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${config.border} ${config.bg} ${
                !alerte.vue ? 'opacity-100 shadow-sm' : 'opacity-60'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${config.bg} border ${config.border} shrink-0`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className={`flex-1 min-w-0 pt-0.5 ${isRTL ? 'text-right' : ''}`}>
                <p className="text-sm font-medium text-slate-200 leading-snug">{getMessage(alerte)}</p>
                <div className={`mt-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">{alerte.modele}</span>
                  <span className="text-[10px] text-slate-600">•</span>
                  <span className="text-[11px] font-medium text-slate-500">{getTimestamp(alerte)}</span>
                </div>
              </div>
              <button 
                onClick={() => setLocalAlertes(prev => prev.filter(a => a.id !== alerte.id))}
                className="shrink-0 rounded-md p-1.5 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
