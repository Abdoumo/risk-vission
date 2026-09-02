import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DonneeDistribution } from '../types';
import { useLang } from '../i18n/LangContext';

interface DistributionChartProps {
  data: DonneeDistribution[];
}

const colors = ['#047857', '#059669', '#10b981', '#34d399', '#14b8a6', '#ef4444', '#f59e0b', '#6ee7b7'];

export default function DistributionChart({ data }: DistributionChartProps) {
  const { t, isRTL } = useLang();
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
      <div className={`mb-5 ${isRTL ? 'text-right' : ''}`}>
        <h3 className="text-lg font-bold text-white tracking-tight">{t('chart_distribution_title')}</h3>
        <p className="text-[13px] font-medium text-slate-400 mt-1">{t('chart_distribution_sub')}</p>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="tranche" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', color: '#e2e8f0', backdropFilter: 'blur(8px)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Observations">
            {data.map((_, idx) => (
              <Cell key={idx} fill={colors[idx % colors.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
