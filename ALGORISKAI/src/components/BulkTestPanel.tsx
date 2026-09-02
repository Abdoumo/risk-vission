import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Play, CheckCircle2, AlertTriangle, ShieldOff, Loader2, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLang } from '../i18n/LangContext';

interface ParsedRow {
  client_name: string;
  data: any;
}

interface ProcessedRow extends ParsedRow {
  result?: {
    score: number;
    decision: 'approved' | 'review' | 'blocked';
    montant: string;
  };
}

export default function BulkTestPanel() {
  const { lang, isRTL } = useLang();
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [creditVar, setCreditVar] = useState<any>(null);
  const [isCalculatingVar, setIsCalculatingVar] = useState(false);

  const calculateVar = async () => {
    setIsCalculatingVar(true);
    try {
      const portfolio = rows.map(r => {
        const mlData = r.data.ml_results;
        const pdScore = mlData?.credit_risk?.pd ? mlData.credit_risk.pd : (r.result?.score ? r.result.score / 100 : 0.05);
        const ead = mlData?.credit_risk?.ead ? mlData.credit_risk.ead : (Number(r.data.income) * 1000 || 50000);
        const lgd = mlData?.credit_risk?.lgd ? mlData.credit_risk.lgd : 0.6;
        
        return { pd: pdScore, ead, lgd };
      });

      // If no portfolio yet, provide a dummy one so the chart isn't empty
      const finalPortfolio = portfolio.length > 0 ? portfolio : Array(100).fill(0).map(() => ({pd: 0.05 + Math.random()*0.1, ead: 50000 + Math.random()*10000, lgd: 0.6}));

      const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/calculate/credit_var`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio: finalPortfolio,
          iterations: 10000,
          confidence: 0.99
        })
      });
      if (response.ok) {
        const data = await response.json();
        setCreditVar(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculatingVar(false);
    }
  };

  const t = (fr: string, ar: string, en: string) => lang === 'ar' ? ar : lang === 'en' ? en : fr;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const headers = lines[0].split(',');
      const parsedClients: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx];
        });

        parsedClients.push({
          client_name: obj.client_name || `Client-${i}`,
          data: obj,
        });
      }

      try {
        // 1. Save directly to DB first
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clients: parsedClients })
        });
        const data = await res.json();
        
        // 2. Setup processing state with real DB IDs
        const mappedRows: ProcessedRow[] = data.clients.map((client: any) => ({
            client_name: client.client_name,
            profileId: client.id,
            data: client.data,
        }));
        
        setRows(mappedRows);
        setCurrentIndex(0);
        // We do not start automatically; the user will click "Lancer l'analyse"
      } catch (e) {
        console.error('Failed to upload', e);
      }
    };
    reader.readAsText(file);
  };

  const startProcessing = () => {
    if (rows.length === 0 || processing) return;
    setProcessing(true);
    setCurrentIndex(0);
    processNext(0, [...rows]);
  };

  const processNext = async (idx: number, currentRows: ProcessedRow[]) => {
    if (idx >= currentRows.length) {
      setProcessing(false);
      return;
    }

    const row = currentRows[idx];
    
    // Build payload for Python Engine
    const payload = {
      client: {
        age: Number(row.data.age) || 35,
        ed: Number(row.data.ed) || 1,
        employ: Number(row.data.employ) || 0,
        address: Number(row.data.address) || 0,
        income: Number(row.data.income) || 50,
        debtinc: Number(row.data.debtinc) || 0,
        creddebt: Number(row.data.creddebt) || 0,
        othdebt: Number(row.data.othdebt) || 0,
      },
      loan: {
        amount: (Number(row.data.income) || 50) * 1000,
        collateral_value: 0,
        amount_paid: 0,
        undrawn_commitment: 0,
        recovery_rate: 0.4
      },
      recent_transactions: [
        {
          client_id: 1,
          amount: (Number(row.data.income) || 50) * 500,
          transaction_hour: Number(row.data.transaction_hour) || 14, // normal daytime hour
          transaction_type: row.data.transaction_type || "payment",
          country: row.data.country || "DZ",
          channel: row.data.channel || "mobile_app",
          amount_deviation: row.data.card_on_dark_web === 'Yes' ? 9.5 : (Number(row.data.amount_deviation) || 0.5),
          daily_txn_count: Number(row.data.daily_txn_count) || 2
        }
      ]
    };

    try {
      // 1. Call Python ML API
      const mlResponse = await fetch(`${import.meta.env.VITE_AI_API_URL}/predict/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const mlResult = await mlResponse.json();

      // Extract results
      const pdScore = parseFloat(mlResult.credit_risk.pd_percentage || '0');
      const fraudScore = mlResult.fraud_analysis.overall_fraud_score || 0;
      const finalScore = Math.min(100, Math.round(Math.max(pdScore, fraudScore)));
      
      let decision: 'approved' | 'review' | 'blocked' = 'approved';
      if (mlResult.final_decision === 'REJECTED' || mlResult.final_decision === 'HOLD_FOR_INVESTIGATION') decision = 'blocked';
      else if (mlResult.final_decision === 'APPROVED_WITH_CONDITIONS' || finalScore > 40) decision = 'review';

      const montant = payload.loan.amount.toLocaleString('fr-DZ') + ' DZD';

      const result = { score: finalScore, decision, montant };
      currentRows[idx].result = result;
      setRows([...currentRows]);
      setCurrentIndex(idx + 1);

      // 2. Save full JSON payload to Postgres (including ML results)
      await fetch(`${import.meta.env.VITE_API_URL}/api/fraud-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Risque de Crédit',
          sousType: 'Analyse IA Unifiée',
          entite: row.client_name,
          score: finalScore,
          decision: decision,
          montant: montant,
          analyste: 'Python ML Engine',
          profileId: (row as any).profileId, // Passing profileId to update status to ANALYZED
          details: {
            ...row.data,
            ml_results: mlResult
          }
        })
      });
    } catch (e) {
      console.error('Failed to process row', e);
      // Fallback update so UI doesn't hang
      currentRows[idx].result = { score: 0, decision: 'review', montant: 'Erreur API' };
      setRows([...currentRows]);
      setCurrentIndex(idx + 1);
    }

    setTimeout(() => {
      processNext(idx + 1, currentRows);
    }, 200);
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
      <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-8 flex flex-col items-center justify-center border-dashed hover:border-cyan-500/30 hover:bg-slate-900/60 transition-all cursor-pointer group">
        <UploadCloud className="h-12 w-12 text-cyan-500/50 mb-4 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-500" />
        <h3 className="text-lg font-semibold text-white mb-1">
          {t('Importer Profils Complets (Sauvegarde & Analyse Automatique)', 'استيراد الملفات (حفظ وتحليل تلقائي)', 'Import Profiles (Auto-Save & Analyze)')}
        </h3>
        <p className="text-sm text-slate-400 mb-4 text-center">
          {t('Sélectionnez le fichier CSV. Il sera sauvegardé dans la BD puis analysé par l\'IA en temps réel.', 'حدد ملف CSV. سيتم حفظه ثم تحليله.', 'Select a CSV file. It will be saved to DB and analyzed in real-time.')}
        </p>
        <input 
          type="file" 
          accept=".csv"
          onChange={handleFileUpload}
          disabled={processing}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 max-w-xs cursor-pointer disabled:opacity-50 transition-colors"
        />
      </motion.div>

      <AnimatePresence>
      {rows.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5 shadow-[0_0_20px_rgba(0,0,0,0.2)] ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <div className="text-sm font-bold text-slate-300">
            {rows.length} {t('profils chargés', 'ملفات شخصية محملة', 'profiles loaded')}
          </div>
          <button 
            onClick={startProcessing}
            disabled={processing}
            className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-400 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all hover:from-cyan-500 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {processing ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Play className="h-4.5 w-4.5" />}
            {processing ? t('Analyse en cours...', 'جاري التحليل...', 'Analysis in progress...') : t('Lancer l\'analyse', 'بدء التحليل', 'Start Analysis')}
          </button>
          <button 
            onClick={calculateVar}
            disabled={isCalculatingVar}
            className={`flex items-center gap-2 rounded-xl bg-slate-800/80 border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-all hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isCalculatingVar ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
            {t('Simuler VaR (Monte Carlo)', 'محاكاة VaR', 'Simulate VaR (Monte Carlo)')}
          </button>
        </motion.div>
      )}

      {rows.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(0,0,0,0.2)] overflow-x-auto"
        >
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Montant / Income</th>
                <th className="px-3 py-3">Dark Web?</th>
                <th className="px-3 py-3">Score (Risque)</th>
                <th className="px-3 py-3">Decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const res = row.result;
                const dcColor = res?.decision === 'approved' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 
                                res?.decision === 'review' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 
                                res?.decision === 'blocked' ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-slate-500 border-slate-700';

                return (
                  <tr key={i} className={`border-b border-slate-800/50 transition-all ${i === currentIndex - 1 ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'}`}>
                    <td className="px-3 py-3 font-semibold text-sm text-slate-200">{row.client_name}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{res ? res.montant : '-'}</td>
                    <td className="px-3 py-3">
                      {row.data.card_on_dark_web === 'Yes' ? (
                         <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-bold">YES</span>
                      ) : (
                         <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold">NO</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {res ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${res.decision === 'blocked' ? 'bg-red-500' : res.decision === 'review' ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${res.score}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-200">{res.score}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {res ? (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${dcColor}`}>
                          {res.decision === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                          {res.decision === 'review' && <AlertTriangle className="h-3 w-3" />}
                          {res.decision === 'blocked' && <ShieldOff className="h-3 w-3" />}
                          {res.decision.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">{i === currentIndex && processing ? t('En cours...', 'جاري...', 'Processing...') : '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {creditVar && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 lg:col-span-1 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-white tracking-tight mb-2">Credit Risk VaR (Monte Carlo)</h3>
            <p className="text-[13px] text-slate-400 mb-6">Simulation des pertes de crédit sur {creditVar.iterations.toLocaleString()} scénarios (niveau de confiance {creditVar.confidence * 100}%).</p>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-center">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">VaR 99% Estimée</p>
                <p className="text-3xl font-black text-rose-400">{(creditVar.var_value / 1000).toFixed(0)}k DZD</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-center">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perte Attendue (EL)</p>
                <p className="text-2xl font-black text-amber-400">{(creditVar.expected_loss / 1000).toFixed(0)}k DZD</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 lg:col-span-2">
            <h3 className="text-[15px] font-bold text-white tracking-tight mb-4">Distribution des Pertes de Crédit Simulées</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={creditVar.distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="varCreditGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <ReferenceLine x={creditVar.var_value} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'VaR 99%', position: 'insideTopLeft', fill: '#f43f5e', fontSize: 11 }} />
                  <Area type="monotone" dataKey="frequency" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#varCreditGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
