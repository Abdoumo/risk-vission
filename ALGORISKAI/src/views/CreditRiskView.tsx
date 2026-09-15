import { useState, useEffect } from 'react';
import { ShieldAlert, User, CheckCircle2, AlertTriangle, ArrowRight, Search, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreditRiskView() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredClients = clients.filter(c => 
    `${c.client_id} ${c.nom} ${c.prenom}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedClient = clients.find(c => c.client_id === selectedClientId);

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
          <div className="flex-1 max-w-sm relative">
            <label className="block text-xs text-slate-400 mb-1">Sélectionner un client</label>
            <div 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white cursor-pointer flex justify-between items-center focus:border-emerald-500"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate text-sm">
                {selectedClient ? `${selectedClient.client_id} - ${selectedClient.nom} ${selectedClient.prenom}` : 'Sélectionner un client...'}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-700 flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    className="bg-transparent border-none text-white focus:outline-none w-full text-sm"
                    placeholder="Rechercher par ID ou nom..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredClients.length > 0 ? filteredClients.map(c => (
                    <div
                      key={c.client_id}
                      className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 transition-colors"
                      onClick={() => {
                        setSelectedClientId(c.client_id);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      {c.client_id} - {c.nom} {c.prenom}
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">Aucun résultat</div>
                  )}
                </div>
              </div>
            )}
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

             <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Données du Client (8 Variables Clés)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Revenu</p>
                    <p className="text-sm font-bold text-white">{analysis.clientData.revenu_mensuel_dzd?.toLocaleString()} DZD</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Solde Compte</p>
                    <p className="text-sm font-bold text-white">{analysis.clientData.solde_compte_dzd?.toLocaleString()} DZD</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">DTI (Endettement)</p>
                    <p className="text-sm font-bold text-white">
                      {analysis.clientData.revenu_mensuel_dzd > 0 
                        ? ((analysis.clientData.echeance_mensuelle_dzd / analysis.clientData.revenu_mensuel_dzd) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Impayés</p>
                    <p className="text-sm font-bold text-white">{analysis.clientData.impayes_dzd?.toLocaleString()} DZD</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Retards de Paiement</p>
                    <p className="text-sm font-bold text-white">{analysis.clientData.jours_retard} Jours</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Cashflow</p>
                    <p className="text-sm font-bold text-white">{analysis.clientData.cashflow_dzd ? `${analysis.clientData.cashflow_dzd.toLocaleString()} DZD` : 'Inconnu'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Historique Bancaire</p>
                    <p className="text-sm font-bold text-white">{analysis.clientData.classe_creance}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">Overdraft</p>
                    <p className="text-sm font-bold text-white">{analysis.clientData.overdraft || 'Inconnu'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Type Client</p>
                    <p className="text-sm font-bold text-slate-200">{analysis.clientData.type_client || 'Particulier'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Statut Client</p>
                    <p className="text-sm font-bold text-slate-200">{analysis.clientData.statut_client || 'Actif'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Type Compte</p>
                    <p className="text-sm font-bold text-slate-200">{analysis.clientData.type_compte || 'Courant'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Type Crédit</p>
                    <p className="text-sm font-bold text-slate-200">{analysis.clientData.type_credit || 'Consommation'}</p>
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
