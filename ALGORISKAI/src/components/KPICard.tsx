import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPI } from '../types';
import { useLang } from '../i18n/LangContext';
import type { TranslationKey } from '../i18n/translations';

interface KPICardProps {
  kpi: KPI;
  index: number;
}

const colors = [
  'from-cyan-500/10 to-blue-500/5 border-cyan-500/20 hover:shadow-cyan-500/20',
  'from-blue-500/10 to-indigo-500/5 border-blue-500/20 hover:shadow-blue-500/20',
  'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 hover:shadow-emerald-500/20',
  'from-purple-500/10 to-fuchsia-500/5 border-purple-500/20 hover:shadow-purple-500/20',
  'from-sky-500/10 to-cyan-500/5 border-sky-500/20 hover:shadow-sky-500/20',
  'from-indigo-500/10 to-blue-500/5 border-indigo-500/20 hover:shadow-indigo-500/20',
];

const valueColors = [
  'text-cyan-400',
  'text-blue-400',
  'text-emerald-400',
  'text-purple-400',
  'text-sky-400',
  'text-indigo-400',
];

export default function KPICard({ kpi, index }: KPICardProps) {
  const { t, isRTL } = useLang();

  return (
    <div className={`group rounded-2xl border bg-slate-900/50 backdrop-blur-md bg-gradient-to-br p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colors[index % colors.length]}`}>
      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {t(kpi.labelKey as TranslationKey)}
        </p>
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${
          kpi.tendance === 'hausse'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : kpi.tendance === 'baisse'
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}>
          {kpi.tendance === 'hausse' ? (
            <TrendingUp className="h-3 w-3" />
          ) : kpi.tendance === 'baisse' ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {kpi.variation !== 0 && `${kpi.variation > 0 ? '+' : ''}${kpi.variation}%`}
        </div>
      </div>
      <div className={`mt-4 flex items-baseline gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
        <span className={`text-4xl font-extrabold tracking-tight ${valueColors[index % valueColors.length]} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>
          {kpi.valeur}
        </span>
        {kpi.unite && <span className="text-sm font-medium text-slate-500">{kpi.unite}</span>}
      </div>
    </div>
  );
}
