import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { PredictionPoint } from '../types';
import { useLang } from '../i18n/LangContext';

interface PredictionChartProps {
  data: PredictionPoint[];
  onPeriodChange?: (period: number) => void;
  activePeriod?: number;
}

export default function PredictionChart({ data, onPeriodChange, activePeriod = 30 }: PredictionChartProps) {
  const { t, isRTL } = useLang();
  const displayData = Array.isArray(data) ? data : [];

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
      <div className={`mb-6 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-lg font-bold text-white tracking-tight">{t('chart_predictions_title')}</h3>
          <p className="text-[13px] font-medium text-slate-400 mt-1">{t('chart_predictions_sub')}</p>
        </div>
        <div className="flex gap-1">
          {[{ label: t('period_7d'), val: 7 }, { label: t('period_30d'), val: 30 }, { label: t('period_90d'), val: 90 }].map((p) => (
            <button
              key={p.val}
              onClick={() => onPeriodChange && onPeriodChange(p.val)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${
                activePeriod === p.val
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-slate-500 border border-transparent hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradReel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#059669" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPredit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradConf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', color: '#e2e8f0', backdropFilter: 'blur(8px)' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '20px' }} />
          <Area type="monotone" dataKey="confMax"  stroke="none" fill="url(#gradConf)"   name={t('conf_max')} connectNulls={false} />
          <Area type="monotone" dataKey="confMin"  stroke="none" fill="url(#gradConf)"   name={t('conf_min')} connectNulls={false} />
          <Area type="monotone" dataKey="reel"     stroke="#059669" strokeWidth={3} fill="url(#gradReel)"   name={t('real')}      dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="predit"   stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="url(#gradPredit)" name={t('predicted')} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
