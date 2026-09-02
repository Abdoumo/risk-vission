import { useState, useEffect } from 'react';
import AnomaliesChart from '../components/AnomaliesChart';
import { type AnomaliePoint } from '../types';
import { AlertTriangle, Shield, Eye, Filter, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnomaliesView() {
  const { t, isRTL } = useLang();
  const [anomalies, setAnomalies] = useState<AnomaliePoint[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [fraudVar, setFraudVar] = useState<any>(null);
  const [isCalculatingVar, setIsCalculatingVar] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/anomalies`)
      .then(r => r.json())
      .then(data => {
        setAnomalies(data);
        calculateVar(data);
      })
      .catch(e => console.error("Anomalies fetch error", e));
  }, []);

  const calculateVar = async (dataList: AnomaliePoint[]) => {
    if (dataList.length === 0) {
      setFraudVar(null);
      return;
    }

    setIsCalculatingVar(true);
    try {
      const txCount = dataList.length;
      const avgAmt = dataList.reduce((acc, a) => acc + (a.valeur || 0), 0) / dataList.length;
      const detectedCount = dataList.filter(a => a.score >= 0.5).length;
      const fProb = detectedCount / dataList.length;

      const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/calculate/fraud_var`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions_count: Math.round(txCount),
          average_amount: avgAmt,
          fraud_probability: fProb,
          iterations: 10000,
          confidence: 0.95
        })
      });
      if (response.ok) {
        const data = await response.json();
        setFraudVar(data);
      }
    } catch (e) {
      console.error("Monte Carlo Var fetch error", e);
    } finally {
      setIsCalculatingVar(false);
    }
  };

  // Define actual anomalies for KPI stats
  const detected = anomalies.filter((a) => a.score >= 0.5);

  const stats = [
    { labelKey: 'anomalies_detected',    value: detected.length.toString(),      icon: AlertTriangle, color: 'text-rose-400',   border: 'border-rose-500/20',   bg: 'from-rose-500/10' },
    { labelKey: 'anomalies_avg_score',   value: (detected.reduce((a,b)=>a+b.score,0)/Math.max(detected.length,1)).toFixed(2), icon: Eye,     color: 'text-amber-400', border: 'border-amber-500/20', bg: 'from-amber-500/10' },
    { labelKey: 'anomalies_normal_rate', value: `${(((anomalies.length-detected.length)/Math.max(anomalies.length, 1))*100).toFixed(1)}%`, icon: Shield,  color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'from-cyan-500/10' },
    { labelKey: 'anomalies_observations',value: anomalies.length.toString(),     icon: Filter,        color: 'text-blue-400',  border: 'border-blue-500/20',  bg: 'from-blue-500/10' },
  ];

  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      if (detected.length === 0) return;
      
      const headers = ['Date', 'Client/Entité', 'Valeur/Montant', 'Score', 'Sévérité', 'Décision', 'Détails Complets'];
      
      const csvRows = [headers.join(',')];
      
      anomalies.forEach(a => {
        let severity = t('severity_low');
        if (a.score >= 0.8) severity = t('severity_critical');
        else if (a.score >= 0.5) severity = t('severity_high');
        else if (a.score >= 0.25) severity = t('severity_medium');
        
        // Escape quotes and format details as JSON string
        const detailsStr = a.details ? JSON.stringify(a.details).replace(/"/g, '""') : '';
        
        const row = [
          `"${a.date}"`,
          `"${a.entite || '-'}"`,
          `"${a.valeur}"`,
          `"${a.score}"`,
          `"${severity}"`,
          `"${a.decision || '-'}"`,
          `"${detailsStr}"`
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Rapport_Anomalies_Complet.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 relative"
    >
      {/* Background glow effects */}
      <div className="absolute top-40 right-20 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-2xl border ${s.border} bg-slate-900/40 backdrop-blur-md bg-gradient-to-br ${s.bg} to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${s.color.split('-')[1]}-500/10`}>
              <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-1.5 rounded-lg bg-${s.color.split('-')[1]}-500/10`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <span className="text-[13px] font-bold text-slate-300">{t(s.labelKey as any)}</span>
              </div>
              <p className={`mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-white`}>{s.value}</p>
            </div>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants}>
        <AnomaliesChart data={anomalies} />
      </motion.div>

      {/* VaR Monte Carlo Panel */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 lg:col-span-1 flex flex-col justify-center">
          <div className={`mb-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
             <h3 className="text-lg font-bold text-white tracking-tight">Monte Carlo VaR</h3>
             <button onClick={() => calculateVar(anomalies)} disabled={isCalculatingVar} className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all">
                {isCalculatingVar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
             </button>
          </div>
          <p className="text-[13px] text-slate-400 mb-6">Simulation du risque de fraude maximal sur 10,000 scénarios (niveau de confiance 95%).</p>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">VaR 95% Estimée</p>
              <p className="text-3xl font-black text-rose-400">{fraudVar ? (fraudVar.var_value / 1000).toFixed(0) + 'k DZD' : '...'}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perte Attendue (EL)</p>
              <p className="text-2xl font-black text-amber-400">{fraudVar ? (fraudVar.expected_loss / 1000).toFixed(0) + 'k DZD' : '...'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 lg:col-span-2">
          <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
             <h3 className="text-[15px] font-bold text-white tracking-tight">Distribution des Pertes Simulées</h3>
          </div>
          <div className="h-[220px]">
            {fraudVar && fraudVar.distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fraudVar.distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="varGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis dataKey="loss" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', backdropFilter: 'blur(8px)' }}
                    formatter={(val: number) => [val, 'Fréquence']}
                    labelFormatter={(label) => `Perte: ${(Number(label)/1000).toFixed(1)}k DZD`}
                  />
                  <ReferenceLine x={fraudVar.var_value} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'VaR 95%', position: 'insideTopLeft', fill: '#f43f5e', fontSize: 11 }} />
                  <Area type="monotone" dataKey="frequency" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#varGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-500">
                {isCalculatingVar ? <Loader2 className="h-8 w-8 animate-spin text-cyan-400" /> : 'Aucune donnée'}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
        <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h3 className="text-lg font-bold text-white tracking-tight">{t('anomalies_log')}</h3>
          </div>
          <button 
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-[13px] font-bold text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Exporter CSV (Détails Complets)
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-800/30">
                {[t('anomalies_date'), 'Client/Entité', t('anomalies_value'),t('anomalies_score'),t('anomalies_severity'),t('anomalies_status'), 'Action'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {anomalies.map((a, i) => (
                <tr key={i} className="hover:bg-cyan-500/5 transition-colors group">
                  <td className="px-4 py-3.5 text-[13px] font-medium text-slate-300">{a.date}</td>
                  <td className="px-4 py-3.5 text-[13px] font-medium text-slate-300">{a.entite || '-'}</td>
                  <td className="px-4 py-3.5 text-[14px] font-bold text-slate-200">{a.valeur}</td>
                  <td className="px-4 py-3.5">
                    <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" style={{ width: `${a.score*100}%` }} />
                      </div>
                      <span className="text-[12px] font-bold text-rose-400">{a.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      a.score >= 0.8 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      a.score >= 0.5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      a.score >= 0.25 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {a.score >= 0.8 ? t('severity_critical') : a.score >= 0.5 ? t('severity_high') : a.score >= 0.25 ? t('severity_medium') : t('severity_low')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-medium text-slate-400 border border-slate-500/20">{t('investigated')}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button 
                      onClick={() => setSelectedDetails(a)} 
                      className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.1)] transition font-bold text-[11px]"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
              {anomalies.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm font-medium text-slate-500">{t('anomalies_none')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">Détails de l'anomalie : {selectedDetails.entite || 'Inconnue'}</h3>
              <button onClick={() => setSelectedDetails(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto max-h-[70vh]">
               {selectedDetails.details ? (
                  <div className="text-sm text-slate-300">
                    <pre className="whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-green-400">
                      {JSON.stringify(typeof selectedDetails.details === 'string' ? JSON.parse(selectedDetails.details) : selectedDetails.details, null, 2)}
                    </pre>
                  </div>
               ) : (
                 <div className="text-slate-500 text-center py-10 font-medium">Aucun détail disponible pour cette anomalie.</div>
               )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
