import { useState, useEffect } from 'react';
import { ShieldAlert, User, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreditRiskView() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/credit-risk/clients')
      .then(r => r.json())
      .then(data => {
        setClients(data);
        if (data.length > 0) setSelectedClientId(data[0].client_id);
      })
      .catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/credit-risk/analyze/${selectedClientId}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ScoreRing = ({ score }: { score: number }) => {
    let color = '#10b981'; // faible
    if (score > 24) color = '#f59e0b'; // modere
    if (score > 49) color = '#f97316'; // eleve
    if (score > 74) color = '#f43f5e'; // critique

    const r = 52, cx = 64, cy = 64;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    return (
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="64" y="56" textAnchor="middle" fill="white" fontSize="26" fontWeight="900">{score}</text>
        <text x="64" y="72" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">SCORE</text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-400" /> Profils Clients
        </h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-sm">
            <label className="block text-xs text-slate-400 mb-1">Sélectionner un client</label>
            <select 
              value={selectedClientId} 
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {clients.map(c => (
                <option key={c.client_id} value={c.client_id}>
                  {c.client_id} - {c.nom} {c.prenom}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Analyse...' : 'Analyser le Risque'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Score de Risque (PD)</h3>
            <ScoreRing score={analysis.score} />
            <div className="mt-4 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-white border border-slate-700">
              Niveau: {analysis.riskLevel}
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-4">
             <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Facteurs Identifiés</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Facteurs Aggravants</h4>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {analysis.factors.aggravating.length ? analysis.factors.aggravating.map((f: string, i: number) => <li key={i}>• {f}</li>) : <li className="text-slate-500">Aucun</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Facteurs Atténuants</h4>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {analysis.factors.mitigating.length ? analysis.factors.mitigating.map((f: string, i: number) => <li key={i}>• {f}</li>) : <li className="text-slate-500">Aucun</li>}
                    </ul>
                  </div>
                </div>
             </div>
             
             <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 border-l-4 border-l-emerald-500">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Explication XAI (Natural Language)</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {analysis.explanation}
                </p>
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
