import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AnomaliePoint } from '../types';
import { useLang } from '../i18n/LangContext';

interface AnomaliesChartProps {
  data: AnomaliePoint[];
}

export default function AnomaliesChart({ data }: AnomaliesChartProps) {
  const { t, isRTL } = useLang();
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
      <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : ''}>
          <h3 className="text-lg font-bold text-white tracking-tight">{t('chart_anomalies_title')}</h3>
          <p className="text-[13px] font-medium text-slate-400 mt-0.5">{t('chart_anomalies_sub')}</p>
        </div>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <span className="text-[12px] font-bold text-slate-300">Normal</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="text-[12px] font-bold text-slate-300">{t('anomalies_detected')}</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} interval={6} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', color: '#f8fafc', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            formatter={(value: any) => [Number(value).toFixed(2), '']}
          />
          <Area type="monotone" dataKey="valeur" stroke="#06b6d4" fill="url(#anomGrad)" strokeWidth={2} dot={false} name="Valeur" />
          <Bar dataKey="score" barSize={6} name="Score" radius={[4, 4, 0, 0]} opacity={0.8}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.anomalie ? '#f43f5e' : '#1e293b'} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
