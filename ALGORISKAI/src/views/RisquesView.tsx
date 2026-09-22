import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { type RisqueActif } from '../types';
import { ShieldAlert, TrendingDown, AlertTriangle, BarChart3, UploadCloud, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { motion } from 'framer-motion';

export default function RisquesView() {
  const { t, isRTL } = useLang();
  const [risquesPortefeuille, setRisquesPortefeuille] = useState<RisqueActif[]>([]);
  const [varData, setVarData] = useState<any[]>([]);
  const [riskStats, setRiskStats] = useState<any[]>([]);
  const [stressTests, setStressTests] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = () => {
    fetch('/api/risques/portfolio').then(r => r.json()).then(setRisquesPortefeuille);
    fetch('/api/risques/var-data').then(r => r.json()).then(setVarData);
    fetch('/api/risques/kpis').then(r => r.json()).then(setRiskStats);
    fetch('/api/risques/stress-tests').then(r => r.json()).then(setStressTests);
  };

  useEffect(() => {
    fetchData();
  }, []);



  const risqueColors: Record<string, any> = {
    "AAA": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "AA": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "A": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "BBB": { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    "BB": { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    "B": { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    "CCC": { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    "faible": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "moyen":  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    "élevé":  { bg: 'bg-rose-500/10',   text: 'text-rose-400',   border: 'border-rose-500/20' },
  };

  const totalEL = risquesPortefeuille.reduce((a, b) => a + (b.el || 0), 0);
  const avgPd = risquesPortefeuille.length ? (risquesPortefeuille.reduce((a, b) => a + (b.pd || 0), 0) / risquesPortefeuille.length) : 0;
  const avgLgd = risquesPortefeuille.length ? (risquesPortefeuille.reduce((a, b) => a + (b.lgd || 0), 0) / risquesPortefeuille.length) : 0;

  const itemsPerPage = 15;
  const totalPages = Math.ceil(risquesPortefeuille.length / itemsPerPage);
  const paginatedRisques = risquesPortefeuille.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const iconMap: Record<string, any> = { ShieldAlert, TrendingDown, AlertTriangle, BarChart3 };

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
      <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      {risquesPortefeuille.length === 0 ? (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-12 text-center flex flex-col items-center justify-center">
          <UploadCloud className="h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white tracking-tight mb-2">Aucune donnée de portefeuille</h3>
          <p className="text-[14px] font-medium text-slate-400 mb-6 max-w-md">
            Il n'y a pas de données sur les risques de crédit disponibles. L'analyse Monte Carlo nécessite un portefeuille de clients avec des métriques de crédit.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Risk KPIs */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {riskStats.map((s, i) => {
              const Icon = iconMap[s.icon] || ShieldAlert;
              const colorStr = s.color.replace('green', 'cyan').replace('red', 'rose').replace('teal', 'blue');
              const borderStr = s.border.replace('green', 'cyan').replace('red', 'rose').replace('teal', 'blue');
              const bgStr = s.bg.replace('green', 'cyan').replace('red', 'rose').replace('teal', 'blue');
              const colorName = colorStr.split('-')[1] || 'cyan';

              return (
                <div key={i} className={`rounded-2xl border ${borderStr} bg-slate-900/40 backdrop-blur-md bg-gradient-to-br ${bgStr} to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${colorName}-500/10`}>
                  <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-1.5 rounded-lg bg-${colorName}-500/10`}>
                      <Icon className={`h-4 w-4 ${colorStr}`} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-300">{t(s.label) || s.label}</span>
                  </div>
                  <p className={`mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-white`}>{s.value}</p>
                </div>
              );
            })}
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* VaR Chart */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
              <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h3 className="text-lg font-bold text-white tracking-tight">{t('var_title')}</h3>
                  <p className="text-[13px] font-medium text-slate-400 mt-0.5">{t('var_sub')}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={varData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis dataKey="jour" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} interval={7} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', color: '#f8fafc', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                  <ReferenceLine y={-3.2} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'VaR 95%', fill: '#f43f5e', fontSize: 11, fontWeight: 'bold' }} />
                  <Bar dataKey="perte" name="P&L %" radius={[4, 4, 0, 0]}>
                    {varData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.perte < -3.2 ? '#f43f5e' : '#047857'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Stress tests */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
              <div className={`mb-5 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="text-lg font-bold text-white tracking-tight">{t('stress_title')}</h3>
                <p className="text-[13px] font-medium text-slate-400 mt-0.5">Simulations de chocs — Portefeuille Crédit</p>
              </div>
              <div className="space-y-4">
                {stressTests.map((s, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: s.color.replace('#22c55e', '#047857').replace('#ef4444', '#f43f5e') }} />
                      <span className="text-[13px] font-bold text-slate-300">{s.scenario}</span>
                    </div>
                    <div className={`flex items-center gap-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-[14px] font-black ${s.impact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {s.impact > 0 ? '+' : ''}{s.impact}%
                      </span>
                      <div className="w-24">
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-500">{s.prob}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full" style={{ width: `${s.prob}%`, backgroundColor: s.color.replace('#22c55e', '#047857').replace('#ef4444', '#f43f5e'), opacity: 0.8 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Portefeuille table */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
            <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <h3 className="text-lg font-bold text-white tracking-tight">Portefeuille de Risques de Crédit</h3>
                <p className="text-[13px] font-medium text-slate-400 mt-0.5">
                  Perte Attendue Globale (EL): {totalEL.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DZD | PD Moyen: {(avgPd * 100).toFixed(2)}% | LGD Moyen: {(avgLgd * 100).toFixed(2)}%
                </p>
              </div>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 px-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <p className="text-2xl font-black text-emerald-400">{risquesPortefeuille.length}</p>
                  <p className="text-[11px] font-bold text-emerald-500/70 uppercase tracking-wider">Clients Analysés</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-800/30">
                    {['ID Client', 'Nom', 'Secteur', 'Exposition (EAD)', 'Prob. Défaut (PD)', 'Perte en Cas Défaut (LGD)', 'Perte Attendue (EL)', 'Rating / Risque'].map((h) => (
                      <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedRisques.map((a, i) => {
                    const rc = risqueColors[a.risque] || risqueColors["CCC"];
                    return (
                      <tr key={i} className="hover:bg-emerald-500/5 transition-colors group">
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[14px] font-bold text-emerald-400">{a.id?.substring(0, 10)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] font-medium text-slate-200">{a.nom}</td>
                        <td className="px-4 py-3.5 text-[13px] font-medium text-slate-400">{a.secteur}</td>
                        <td className="px-4 py-3.5 text-[13px] font-black text-cyan-400">{a.ead ? a.ead.toLocaleString('fr-DZ', { maximumFractionDigits: 0 }) : '0'} DZD</td>
                        <td className="px-4 py-3.5">
                          <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                              <div className={`h-full rounded-full bg-gradient-to-r ${(a.pd||0) > 0.1 ? 'from-rose-600 to-rose-400' : 'from-cyan-600 to-cyan-400'}`} style={{ width: `${(a.pd || 0) * 100}%` }} />
                            </div>
                            <span className={`text-[13px] font-bold ${(a.pd||0) > 0.1 ? 'text-rose-400' : 'text-slate-300'} w-8`}>{((a.pd || 0) * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] font-medium text-slate-300">{((a.lgd || 0) * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3.5 text-[13px] font-black text-rose-400">{a.el ? a.el.toLocaleString('fr-DZ', { maximumFractionDigits: 0 }) : '0'} DZD</td>
                        <td className="px-4 py-3.5">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${rc.bg} ${rc.text} border ${rc.border}`}>
                            {a.risque}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className={`flex justify-between items-center px-4 py-3 bg-slate-800/30 border-t border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-sm text-white disabled:opacity-50 transition-colors"
                  >
                    {isRTL ? 'السابق' : 'Précédent'}
                  </button>
                  <span className="text-sm text-slate-400 font-medium">
                    {isRTL ? 'صفحة' : 'Page'} {currentPage} {isRTL ? 'من' : 'sur'} {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-sm text-white disabled:opacity-50 transition-colors"
                  >
                    {isRTL ? 'التالي' : 'Suivant'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
