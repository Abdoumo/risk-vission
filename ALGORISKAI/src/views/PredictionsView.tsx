import { useMemo, useState, useEffect } from 'react';
import PredictionChart from '../components/PredictionChart';
import { type PredictionPoint } from '../types';
import {
  TrendingUp, Play, BarChart3, Calendar, Target,
  CheckCircle2, Loader2, Database, AlertTriangle, User, Search,
  ChevronDown, ShieldAlert, Sparkles, ArrowRight, Activity
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { motion } from 'framer-motion';

type RunStatus = 'idle' | 'running' | 'done' | 'error';

interface ClientItem {
  id: string;
  client_id: string;
  nom: string;
  prenom: string;
  type_client?: string;
  statut_client?: string;
  revenu_mensuel_dzd?: number;
  solde_compte_dzd?: number;
  dti?: number;
  score?: number;
  riskLevel?: string;
  jours_retard?: number;
  impayes_dzd?: number;
  projections?: {
    horizon30: { pd: number; cashflowExpected: number; liquidityRisk: string };
    horizon60: { pd: number; cashflowExpected: number; liquidityRisk: string };
    horizon90: { pd: number; cashflowExpected: number; liquidityRisk: string };
  };
}

export default function PredictionsView() {
  const { t, isRTL } = useLang();

  // Mode: 'client' (Dossier Client 30/60/90j) vs 'portfolio' (VaR Portefeuille Global)
  const [predictionMode, setPredictionMode] = useState<'client' | 'portfolio'>(() => {
    return sessionStorage.getItem('riskvision_selected_client_id') ? 'client' : 'client';
  });

  // Clients list for client mode
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return sessionStorage.getItem('riskvision_selected_client_id') || '';
  });
  const [clientSearch, setClientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Portfolio models
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
  const [activeClientInfo, setActiveClientInfo] = useState<any>(null);

  // Load clients list
  useEffect(() => {
    fetch('/api/predictions/clients')
      .then(r => r.json())
      .then((data: ClientItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setClients(data);
          const savedId = sessionStorage.getItem('riskvision_selected_client_id');
          if (savedId && data.some(c => c.client_id === savedId)) {
            setSelectedClientId(savedId);
          } else if (!selectedClientId) {
            setSelectedClientId(data[0].client_id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleRunAI = async (
    mode = predictionMode,
    clientId = selectedClientId,
    model = selectedModel,
    hor = horizon
  ) => {
    setRunStatus('running');
    setErrorMsg('');
    setResultData([]);
    setStats(null);

    try {
      let url = '';
      if (mode === 'client' && clientId) {
        url = `/api/predictions/real?clientId=${encodeURIComponent(clientId)}&horizon=${hor}`;
      } else {
        url = `/api/predictions/real?model=${model}&horizon=${hor}`;
      }

      const res = await fetch(url);
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
      if (data.client) {
        setActiveClientInfo(data.client);
      } else {
        setActiveClientInfo(null);
      }
      setRunStatus('done');

    } catch (err: any) {
      console.error(err);
      setRunStatus('error');
      setErrorMsg(err.message || 'Erreur lors du calcul des prédictions.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRunAI(predictionMode, selectedClientId, selectedModel, horizon);
    }, 350);
    return () => clearTimeout(timer);
  }, [predictionMode, selectedClientId, selectedModel, horizon]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.client_id.toLowerCase().includes(q) ||
      c.nom.toLowerCase().includes(q) ||
      (c.prenom && c.prenom.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.client_id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  const currentModel = modelOptions.find(m => m.value === selectedModel) || modelOptions[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 relative"
    >
      {/* Background glow effects */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-green-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      {/* ── Mode Selection Header ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Moteur Prédictif IA (30 / 60 / 90 Jours)</h2>
            <p className="text-xs text-slate-400">Projection stochastique & apprentissage supervisé du risque de défaut</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 bg-slate-950/60 rounded-xl border border-white/10">
          <button
            onClick={() => {
              setPredictionMode('client');
              setHorizon('30');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              predictionMode === 'client'
                ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            Dossier Client (30/60/90j)
          </button>
          <button
            onClick={() => {
              setPredictionMode('portfolio');
              setHorizon('30');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              predictionMode === 'portfolio'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-500 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Portefeuille Global (VaR)
          </button>
        </div>
      </motion.div>

      {/* ── Config Panel ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
        <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {predictionMode === 'client' ? 'Paramètres Dossier Client EWS' : t('pred_config')}
              </h3>
              <p className="text-[13px] font-medium text-slate-400 mt-1">
                {predictionMode === 'client'
                  ? 'Sélectionnez un client transmis de Core Banking / EWS pour simuler son risque sur 30, 60 ou 90 jours'
                  : 'Configurez les paramètres du modèle d\'intelligence artificielle pour le portefeuille global'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRunAI(predictionMode, selectedClientId, selectedModel, horizon)}
            disabled={runStatus === 'running'}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:hover:scale-100"
          >
            {runStatus === 'running' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Client Selection (If in Client Mode) */}
          {predictionMode === 'client' ? (
            <div className={`relative ${isRTL ? 'text-right' : ''}`}>
              <label className="mb-2 block text-[13px] font-semibold text-slate-300">
                Client Core Banking / EWS
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par ID ou nom..."
                  value={isDropdownOpen ? clientSearch : (selectedClient ? `${selectedClient.client_id} - ${selectedClient.nom} ${selectedClient.prenom || ''}` : '')}
                  onChange={e => {
                    setClientSearch(e.target.value);
                    if (!isDropdownOpen) setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setClientSearch('');
                    setIsDropdownOpen(true);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 pl-10 pr-10 py-2.5 text-sm font-medium text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <ChevronDown
                  className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                />
              </div>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(c => (
                        <div
                          key={c.client_id}
                          className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer text-sm border-b border-slate-800/80 last:border-0 transition-colors"
                          onClick={() => {
                            setSelectedClientId(c.client_id);
                            sessionStorage.setItem('riskvision_selected_client_id', c.client_id);
                            setIsDropdownOpen(false);
                            setClientSearch('');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{c.nom} {c.prenom}</span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">{c.client_id}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span>Score PD: <strong className={c.score && c.score >= 50 ? 'text-rose-400' : 'text-emerald-400'}>{c.score || 25}%</strong></span>
                            <span>•</span>
                            <span className={c.statut_client?.includes('HIGH') ? 'text-amber-400 font-bold' : 'text-slate-400'}>{c.statut_client || 'Actif'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">Aucun client trouvé</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Model Selection (If in Portfolio Mode) */
            <div className={isRTL ? 'text-right' : ''}>
              <label className="mb-2 block text-[13px] font-semibold text-slate-300">{t('pred_model')}</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                disabled={runStatus === 'running'}
                className="w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50 transition-all"
              >
                {modelOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Horizon Selection */}
          <div className={`lg:col-span-2 ${isRTL ? 'text-right' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-slate-300">
                {t('pred_horizon')} <span className="text-emerald-400 font-bold">— {horizon} jours</span>
              </label>
              <div className="flex gap-2">
                {['30', '60', '90'].map(d => (
                  <button
                    key={d}
                    onClick={() => setHorizon(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      horizon === d
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {d} Jours
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 mt-4 px-2">
              <input
                type="range"
                min="7" max="90" step="1"
                value={horizon}
                onChange={e => setHorizon(e.target.value)}
                disabled={runStatus === 'running'}
                className="w-full h-1.5 rounded-full bg-slate-800 accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                {[7, 30, 60, 90].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setHorizon(val.toString())}
                    disabled={runStatus === 'running'}
                    className={`hover:text-emerald-400 transition-colors ${horizon === val.toString() ? 'text-emerald-400 scale-110' : ''}`}
                  >
                    {val}j
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Client Details Summary Card (If in Client Mode) */}
        {predictionMode === 'client' && activeClientInfo && (
          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-xl">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Dossier Client</p>
              <p className="text-sm font-bold text-white mt-0.5">{activeClientInfo.nom} {activeClientInfo.prenom}</p>
              <p className="text-xs text-slate-500 font-mono">{activeClientInfo.client_id}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Score PD Actuel</p>
              <p className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                <span className={activeClientInfo.score >= 50 ? 'text-rose-400' : 'text-emerald-400'}>
                  {activeClientInfo.score}%
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeClientInfo.riskBandLabel || activeClientInfo.riskLevel}
                </span>
              </p>
              <p className="text-xs text-slate-500">Ratio DTI: {activeClientInfo.dti}%</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Trajectoire Projetée</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {stats?.avg ? `${stats.avg}%` : '—'}
                <span className="text-xs font-normal text-slate-400 ml-1.5">à {horizon}j</span>
              </p>
              <p className="text-xs text-slate-500">Variation: <strong className={Number(stats?.trend) > 0 ? 'text-rose-400' : 'text-emerald-400'}>{stats?.trend}%</strong></p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Action Recommandée</p>
              <p className="text-xs font-semibold text-amber-300 mt-1 line-clamp-2">
                {activeClientInfo.policyAction}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Progress Panel ─────────────────── */}
      {runStatus === 'running' && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-10 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-emerald-400 animate-spin mb-4" />
          <h4 className="text-white font-bold text-lg">Inférence IA en cours...</h4>
          <p className="text-slate-400 text-sm mt-2 max-w-md">
            Le modèle de prédiction projette la probabilité de défaut sur l'horizon temporel de {horizon} jours.
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
              label: predictionMode === 'client' ? `PD Projetée à ${stats.horizon}j` : t('pred_avg'),
              value: stats.isPercentage ? `${stats.avg}%` : Number(stats.avg).toLocaleString('fr-DZ'),
              sub: predictionMode === 'client' ? 'Probabilité de défaut moyenne' : 'Valeur moyenne projetée',
              icon: BarChart3,
              color: 'text-emerald-400',
              border: 'border-emerald-500/20',
              bg: 'from-emerald-500/10',
            },
            {
              label: t('pred_trend'),
              value: `${Number(stats.trend) > 0 ? '+' : ''}${stats.trend}%`,
              sub: `sur ${stats.horizon} jours`,
              icon: TrendingUp,
              color: Number(stats.trend) <= 0 ? 'text-emerald-400' : 'text-rose-400',
              border: Number(stats.trend) <= 0 ? 'border-emerald-500/20' : 'border-rose-500/20',
              bg: Number(stats.trend) <= 0 ? 'from-emerald-500/10' : 'from-rose-500/10',
            },
            {
              label: t('pred_horizon_label'),
              value: `${stats.horizon} j`,
              sub: 'Horizon temporel',
              icon: Calendar,
              color: 'text-green-400',
              border: 'border-green-500/20',
              bg: 'from-green-500/10',
            },
            {
              label: predictionMode === 'client' ? 'Risque Liquidité' : t('pred_confidence'),
              value: predictionMode === 'client' ? (stats.liquidityRisk || 'NORMAL') : `${stats.confidence}%`,
              sub: predictionMode === 'client' ? 'Diagnostic Trésorerie' : currentModel.label,
              icon: Target,
              color: predictionMode === 'client' && stats.liquidityRisk !== 'NORMAL' && stats.liquidityRisk !== 'CONFORME' ? 'text-amber-400' : 'text-indigo-400',
              border: 'border-indigo-500/20',
              bg: 'from-indigo-500/10',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`rounded-2xl border ${item.border} bg-slate-900/40 backdrop-blur-md bg-gradient-to-br ${item.bg} to-transparent p-5 transition-all duration-300 hover:-translate-y-1`}>
                <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <span className="text-[13px] font-bold text-slate-300">{item.label}</span>
                </div>
                <p className={`mt-3 text-2xl font-black tracking-tight text-white`}>{item.value}</p>
                <p className={`text-[11px] font-medium mt-1 ${item.color}`}>{item.sub}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ── Chart ────────────────────────────────────────────────────── */}
      {runStatus === 'done' && (
        <motion.div variants={itemVariants} className={`transition-all duration-500 ring-1 ring-emerald-500/20 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.05)]`}>
          <PredictionChart 
            data={resultData} 
            activePeriod={parseInt(horizon)}
            onPeriodChange={(val) => setHorizon(val.toString())}
          />
        </motion.div>
      )}

      {/* ── Result table ─────────────────── */}
      {runStatus === 'done' && resultData.length > 0 && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
          <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-lg font-bold text-white tracking-tight">{t('pred_detail')}</h3>
              <p className="text-[13px] font-medium text-slate-400 mt-1">
                {predictionMode === 'client' ? `Trajectoire du Client ${activeClientInfo?.nom || ''}` : currentModel.label}
                <span className="mx-1.5 text-slate-600">•</span> Horizon {horizon}j
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-[12px] font-bold text-emerald-400 tracking-wide">
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
                    <tr key={i} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-300">{d.date}</td>
                      <td className="px-4 py-3.5 text-[14px] font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
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
                              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-bold text-emerald-400">
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
