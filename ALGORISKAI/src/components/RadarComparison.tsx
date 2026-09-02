import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLang } from '../i18n/LangContext';

interface RadarComparisonProps {
  data: Array<{ sujet: string; LSTM: number; XGBoost: number; RandomForest: number; Transformer: number }>;
}

export default function RadarComparison({ data }: RadarComparisonProps) {
  const { t, isRTL } = useLang();
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)] h-full">
      <div className={`mb-5 ${isRTL ? 'text-right' : ''}`}>
        <h3 className="text-lg font-bold text-white tracking-tight">{t('chart_radar_title')}</h3>
        <p className="text-[13px] font-medium text-slate-400 mt-1">{t('chart_radar_sub')}</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="sujet" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', color: '#e2e8f0', backdropFilter: 'blur(8px)' }} />
          <Radar name="LSTM"         dataKey="LSTM"         stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={2.5} />
          <Radar name="XGBoost"      dataKey="XGBoost"      stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1}  strokeWidth={2.5} />
          <Radar name="Random Forest" dataKey="RandomForest" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1}  strokeWidth={2.5} />
          <Radar name="Transformer"  dataKey="Transformer"  stroke="#a855f7" fill="#a855f7" fillOpacity={0.1}  strokeWidth={2.5} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType="circle" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
