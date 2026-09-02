import { useMemo, useState, useEffect, useRef } from 'react';
import PredictionChart from '../components/PredictionChart';
import { type PredictionPoint } from '../types';
import {
  TrendingUp, Play, BarChart3, Calendar, Target,
  CheckCircle2, Loader2, Database, AlertTriangle
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { motion } from 'framer-motion';

type RunStatus = 'idle' | 'running' | 'done' | 'error';

interface StepLog {
  id: number;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration?: string;
  detail?: string;
}

export default function PredictionsView() {
  const { t, isRTL } = useLang();

  // Model options mapping to backend
  const modelOptions = [
    { value: 'monte_carlo', label: 'Monte Carlo VaR', accuracy: 95 },
    { value: 'parametric', label: 'VaR Paramétrique', accuracy: 99 },
    { value: 'historical', label: 'VaR Historique', accuracy: 95 },
    { value: 'islamic_default', label: 'Probabilité de Défaut (Islamique)', accuracy: 90 }
  ];

  const [selectedModel, setSelectedModel] = useState('monte_carlo');
  const [horizon, setHorizon] = useState('30');

  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [resultData, setResultData] = useState<PredictionPoint[]>([]);
  const [stats, setStats] = useState<any>(null);

  const handleRunAI = async () => {
    if (runStatus === 'running') return;
    
    setRunStatus('running');
    setErrorMsg('');
    setResultData([]);
    setStats(null);

    try {
      const res = await fetch(`/api/predictions/real?model=${selectedModel}&horizon=${horizon}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'EMPTY_DB') {
          setRunStatus('error');
          setErrorMsg('EMPTY_DB');
          return;
        }
        throw new Error(data.error || 'Erreur API');
      }

      setResultData(data.results || []);
      setStats(data.stats || null);
      setRunStatus('done');

    } catch (err) {
      console.error(err);
      setRunStatus('error');
      setErrorMsg('Erreur lors du calcul des prédictions. Vérifiez la connexion au serveur AI.');
    }
  };

  const currentModel = modelOptions.find(m => m.value === selectedModel) || modelOptions[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  if (errorMsg === 'EMPTY_DB') {
    return (
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800/50 mb-6">
          <Database className="h-12 w-12 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Base de Données Vide</h2>
        <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-8">
          Le moteur de prédiction nécessite des données réelles pour générer des modèles de risques (VaR ou Probabilité de Défaut). 
          Veuillez d'abord charger un fichier CSV depuis l'outil d'importation.
        </p>
        <button
          onClick={() => { setErrorMsg(''); setRunStatus('idle'); }}
          className="rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors"
        >
          Retour à la Configuration
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 relative"
    >
      {/* Background glow effects */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      {/* ── Config Panel ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
        <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-xl font-bold text-white tracking-tight">{t('pred_config')}</h3>
              <p className="text-[13px] font-medium text-slate-400 mt-1">
                Configurez les paramètres du modèle d'intelligence artificielle
              </p>
            </div>
          </div>
          <button
            onClick={handleRunAI}
            disabled={runStatus === 'running'}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:hover:scale-100"
          >
            {runStatus === 'running' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            Lancer l'Inférence IA
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Model */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="mb-2 block text-[13px] font-semibold text-slate-300">{t('pred_model')}</label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                disabled={runStatus === 'running'}
                className="w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {modelOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Horizon */}
          <div className={`lg:col-span-2 ${isRTL ? 'text-right' : ''}`}>
            <label className="mb-2 block text-[13px] font-semibold text-slate-300">
              {t('pred_horizon')} <span className="text-cyan-400 font-bold">— {horizon} jours</span>
            </label>
            <div className="space-y-3 mt-4 px-2">
              <input
                type="range"
                min="7" max="90" step="1"
                value={horizon}
                onChange={e => setHorizon(e.target.value)}
                disabled={runStatus === 'running'}
                className="w-full h-1.5 rounded-full bg-slate-800 accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                {[7, 30, 60, 90].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setHorizon(val.toString())}
                    disabled={runStatus === 'running'}
                    className={`hover:text-cyan-400 transition-colors ${horizon === val.toString() ? 'text-cyan-400 scale-110' : ''}`}
                  >
                    {val}j
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Progress Panel ─────────────────── */}
      {runStatus === 'running' && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-10 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
          <h4 className="text-white font-bold text-lg">Inférence IA en cours...</h4>
          <p className="text-slate-400 text-sm mt-2 max-w-md">
            Le modèle analyse la volatilité du portefeuille et génère les trajectoires stochastiques.
          </p>
        </motion.div>
      )}

      {runStatus === 'error' && errorMsg !== 'EMPTY_DB' && (
        <motion.div variants={itemVariants} className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex gap-3 text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{errorMsg}</p>
        </motion.div>
      )}

      {/* ── Result KPIs ─────────────────── */}
      {runStatus === 'done' && stats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-in fade-in duration-700">
          {[
            {
              label: t('pred_avg'),
              value: stats.isPercentage ? `${stats.avg}%` : Number(stats.avg).toLocaleString('fr-DZ'),
              sub: stats.isPercentage ? 'Taux moyen projeté' : 'DZD projetés',
              icon: BarChart3,
              color: 'text-cyan-400',
              border: 'border-cyan-500/20',
              bg: 'from-cyan-500/10',
            },
            {
              label: t('pred_trend'),
              value: `${Number(stats.trend) > 0 ? '+' : ''}${stats.trend}%`,
              sub: `sur ${stats.horizon} jours`,
              icon: TrendingUp,
              color: Number(stats.trend) >= 0 ? 'text-emerald-400' : 'text-rose-400',
              border: Number(stats.trend) >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20',
              bg: Number(stats.trend) >= 0 ? 'from-emerald-500/10' : 'from-rose-500/10',
            },
            {
              label: t('pred_horizon_label'),
              value: `${stats.horizon} j`,
              sub: 'Horizon temporel',
              icon: Calendar,
              color: 'text-blue-400',
              border: 'border-blue-500/20',
              bg: 'from-blue-500/10',
            },
            {
              label: t('pred_confidence'),
              value: `${stats.confidence}%`,
              sub: currentModel.label,
              icon: Target,
              color: 'text-indigo-400',
              border: 'border-indigo-500/20',
              bg: 'from-indigo-500/10',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`rounded-2xl border ${item.border} bg-slate-900/40 backdrop-blur-md bg-gradient-to-br ${item.bg} to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${item.color.split('-')[1]}-500/10`}>
                <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-1.5 rounded-lg bg-${item.color.split('-')[1]}-500/10`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <span className="text-[13px] font-bold text-slate-300">{item.label}</span>
                </div>
                <p className={`mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-white`}>{item.value}</p>
                <p className={`text-[11px] font-medium mt-1 ${item.color}`}>{item.sub}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ── Chart ────────────────────────────────────────────────────── */}
      {runStatus === 'done' && (
        <motion.div variants={itemVariants} className={`transition-all duration-500 ring-1 ring-cyan-500/20 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.05)]`}>
          <PredictionChart data={resultData} />
        </motion.div>
      )}

      {/* ── Result table ─────────────────── */}
      {runStatus === 'done' && resultData.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
          <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-lg font-bold text-white tracking-tight">{t('pred_detail')}</h3>
              <p className="text-[13px] font-medium text-slate-400 mt-1">
                {currentModel.label} <span className="mx-1.5 text-slate-600">•</span> Horizon {horizon}j
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span className="text-[12px] font-bold text-cyan-400 tracking-wide">
                Généré par IA
              </span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-800/30">
                  {[
                    t('pred_date'), t('pred_value'), t('pred_min'),
                    t('pred_max'), t('pred_ecart'), t('pred_confidence'),
                  ].map(h => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {resultData.slice(0, 15).map((d, i) => {
                  const conf = Math.max(75, (stats?.confidence || 95) - (i/2));
                  const isPct = stats?.isPercentage;
                  const formatVal = (v: number | null) => v === null ? '—' : (isPct ? `${v}%` : v.toLocaleString('fr-DZ'));
                  
                  return (
                    <tr key={i} className="hover:bg-cyan-500/5 transition-colors group">
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-300">{d.date}</td>
                      <td className="px-4 py-3.5 text-[14px] font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                        {formatVal(d.predit)}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-400">
                        {formatVal(d.confMin)}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-400">
                        {formatVal(d.confMax)}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-500">
                        ±{d.confMax && d.confMin ? formatVal(Math.round(((d.confMax - d.confMin) / 2)*10)/10) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-bold text-cyan-400">
                            {conf.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
