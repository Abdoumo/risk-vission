import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLang } from '../i18n/LangContext';

interface PerformanceChartProps {
  data: Array<{ date: string; lstm: number; xgboost: number; rf: number; transformer: number }>;
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const { t, isRTL } = useLang();
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
      <div className={`mb-5 ${isRTL ? 'text-right' : ''}`}>
        <h3 className="text-lg font-bold text-white tracking-tight">{t('chart_performance_title')}</h3>
        <p className="text-[13px] font-medium text-slate-400 mt-1">{t('chart_performance_sub')}</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={20} />
          <YAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', color: '#e2e8f0', backdropFilter: 'blur(8px)' }} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Line type="monotone" dataKey="lstm"        stroke="#10b981" strokeWidth={2.5} dot={false} name="LSTM" />
          <Line type="monotone" dataKey="xgboost"     stroke="#34d399" strokeWidth={2.5} dot={false} name="XGBoost" />
          <Line type="monotone" dataKey="rf"          stroke="#ef4444" strokeWidth={2.5} dot={false} name="Random Forest" />
          <Line type="monotone" dataKey="transformer" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Transformer" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
