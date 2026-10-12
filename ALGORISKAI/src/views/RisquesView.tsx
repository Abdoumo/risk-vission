import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { type RisqueActif } from '../types';
import { 
  ShieldAlert, TrendingDown, AlertTriangle, BarChart3, UploadCloud, Loader2,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw,
  ExternalLink, Filter, Database, Globe, CheckCircle2
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { motion } from 'framer-motion';

export default function RisquesView() {
  const { t, isRTL } = useLang();
  const [risquesPortefeuille, setRisquesPortefeuille] = useState<RisqueActif[]>([]);
  const [varData, setVarData] = useState<any[]>([]);
  const [riskStats, setRiskStats] = useState<any[]>([]);
  const [stressTests, setStressTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data source toggle: 'api' (Core Banking SIB 10,500 clients) vs 'bna' (BNA reference 5,000 clients)
  const [dataSource, setDataSource] = useState<'api' | 'bna'>('api');

  // Search, filter & pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('');

  const fetchData = (source: 'api' | 'bna' = dataSource) => {
    setIsLoading(true);
    Promise.all([
      fetch(`/api/risques/portfolio?source=${source}`).then(r => r.json()),
      fetch('/api/risques/var-data').then(r => r.json()).catch(() => []),
      fetch('/api/risques/kpis').then(r => r.json()).catch(() => []),
      fetch('/api/risques/stress-tests').then(r => r.json()).catch(() => [])
    ])
      .then(([portfolio, vData, kpis, stress]) => {
        if (Array.isArray(portfolio)) {
          setRisquesPortefeuille(portfolio);
        }
        if (Array.isArray(vData) && vData.length > 0) setVarData(vData);
        if (Array.isArray(kpis) && kpis.length > 0) setRiskStats(kpis);
        if (Array.isArray(stress) && stress.length > 0) setStressTests(stress);
      })
      .catch(e => console.error('Fetch error in RisquesView:', e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData(dataSource);
  }, [dataSource]);

  // Handle source switch
  const handleSourceChange = (newSource: 'api' | 'bna') => {
    if (newSource === dataSource) return;
    setDataSource(newSource);
    setCurrentPage(1);
  };

  const risqueColors: Record<string, any> = {
    "AAA": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "AA": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "A": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "BBB": { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    "BB": { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    "B": { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    "CCC": { bg: 'bg-rose-600/15', text: 'text-rose-500', border: 'border-rose-600/30' },
    "faible": { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    "moyen":  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    "élevé":  { bg: 'bg-rose-500/10',   text: 'text-rose-400',   border: 'border-rose-500/20' },
  };

  // Filter & Search Logic
  const filteredRisques = useMemo(() => {
    return risquesPortefeuille.filter(item => {
      // Risk category filter
      if (selectedRiskFilter === 'low') {
        if (!['AAA', 'AA', 'A', 'faible'].includes(item.risque)) return false;
      } else if (selectedRiskFilter === 'medium') {
        if (!['BBB', 'BB', 'moyen'].includes(item.risque)) return false;
      } else if (selectedRiskFilter === 'high') {
        if (!['B', 'CCC', 'élevé'].includes(item.risque)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = item.id?.toLowerCase().includes(q);
        const matchesNom = item.nom?.toLowerCase().includes(q);
        const matchesSecteur = item.secteur?.toLowerCase().includes(q);
        const matchesRisque = item.risque?.toLowerCase().includes(q);
        return matchesId || matchesNom || matchesSecteur || matchesRisque;
      }

      return true;
    });
  }, [risquesPortefeuille, selectedRiskFilter, searchQuery]);

  // Overall Portfolio Aggregates
  const totalEL = useMemo(() => risquesPortefeuille.reduce((a, b) => a + (b.el || 0), 0), [risquesPortefeuille]);
  const avgPd = useMemo(() => risquesPortefeuille.length ? (risquesPortefeuille.reduce((a, b) => a + (b.pd || 0), 0) / risquesPortefeuille.length) : 0, [risquesPortefeuille]);
  const avgLgd = useMemo(() => risquesPortefeuille.length ? (risquesPortefeuille.reduce((a, b) => a + (b.lgd || 0), 0) / risquesPortefeuille.length) : 0, [risquesPortefeuille]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRisques.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRisques.length);
  const paginatedRisques = filteredRisques.slice(startIndex, endIndex);

  // Jump to page handler
  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  // Navigate to XAI / 360 view
  const handleInspectClient = (clientId: string) => {
    window.dispatchEvent(new CustomEvent('riskvision:navigate', {
      detail: { tab: 'xai', clientId }
    }));
  };

  const iconMap: Record<string, any> = { ShieldAlert, TrendingDown, AlertTriangle, BarChart3 };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  // Generate page numbers for pagination toolbar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validCurrentPage > 3) pages.push('...');

      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (validCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
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

      {/* Header with Source Selection & Live Sync */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-black text-white tracking-tight">Portefeuille de Risques de Crédit</h2>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {dataSource === 'api' ? 'Live API Core Banking SIB' : 'Jeu Référence BNA'}
            </span>
          </div>
          <p className="text-[13px] text-slate-400 mt-1 font-medium">
            Analyse quantitative Bâle II/III — Calcul automatique de l'Exposition (EAD), PD, LGD & Perte Attendue (EL)
          </p>
        </div>

        {/* Source Toggle Controls */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => handleSourceChange('api')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              dataSource === 'api' 
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Core Banking SIB (10 500 Clients)
          </button>
          <button
            onClick={() => handleSourceChange('bna')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              dataSource === 'bna' 
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Référence BNA (5 000 Clients)
          </button>
          <button
            onClick={() => fetchData(dataSource)}
            disabled={isLoading}
            title="Actualiser les données"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Risk KPIs */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-md bg-gradient-to-br from-cyan-500/10 to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
          <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-1.5 rounded-lg bg-cyan-500/10">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-[13px] font-bold text-slate-300">Exposition Globale (EAD)</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-white">
            {(risquesPortefeuille.reduce((a, b) => a + (b.ead || 0), 0) / 1000000).toLocaleString('fr-DZ', { maximumFractionDigits: 1 })}M DZD
          </p>
          <p className="text-[11px] text-cyan-400 font-semibold mt-1">Total crédits & engagements</p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-slate-900/40 backdrop-blur-md bg-gradient-to-br from-rose-500/10 to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10">
          <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-1.5 rounded-lg bg-rose-500/10">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            </div>
            <span className="text-[13px] font-bold text-slate-300">Perte Attendue Globale (EL)</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-rose-400">
            {totalEL.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DZD
          </p>
          <p className="text-[11px] text-rose-400/80 font-semibold mt-1">Calcul Bâle : EAD × PD × LGD</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-slate-900/40 backdrop-blur-md bg-gradient-to-br from-amber-500/10 to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10">
          <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <TrendingDown className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-[13px] font-bold text-slate-300">PD Moyen Pondéré</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-amber-400">
            {(avgPd * 100).toFixed(2)}%
          </p>
          <p className="text-[11px] text-amber-400/80 font-semibold mt-1">Probabilité de défaut moyenne</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/40 backdrop-blur-md bg-gradient-to-br from-emerald-500/10 to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10">
          <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-[13px] font-bold text-slate-300">Taux de Recouvrement LGD</span>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-emerald-400">
            {(avgLgd * 100).toFixed(2)}%
          </p>
          <p className="text-[11px] text-emerald-400/80 font-semibold mt-1">Perte en cas de défaut moyenne</p>
        </div>
      </motion.div>

      {/* VaR & Stress Tests Visuals */}
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
            <p className="text-[13px] font-medium text-slate-400 mt-0.5">Simulations de chocs macro-prudentiels — Portefeuille Crédit</p>
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

      {/* Main Portefeuille Table with Complete Pagination & Filter Tools */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
        <div className={`mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Liste Détaillée des Dossiers Crédit</h3>
              <span className="px-2 py-0.5 text-xs font-black rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {risquesPortefeuille.length.toLocaleString('fr-DZ')} Dossiers
              </span>
            </div>
            <p className="text-[13px] font-medium text-slate-400 mt-0.5">
              Perte Attendue Globale : <span className="text-white font-bold">{totalEL.toLocaleString('fr-DZ')} DZD</span> | 
              PD Moyen : <span className="text-amber-400 font-bold">{(avgPd * 100).toFixed(2)}%</span> | 
              LGD Moyen : <span className="text-cyan-400 font-bold">{(avgLgd * 100).toFixed(2)}%</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 px-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <p className="text-2xl font-black text-emerald-400">{filteredRisques.length.toLocaleString('fr-DZ')}</p>
              <p className="text-[11px] font-bold text-emerald-500/70 uppercase tracking-wider">Clients Filtrés</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Risk Filters, Page Size */}
        <div className="mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par ID client (C-000001), nom, secteur..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Risque:
            </span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'low', label: 'Faible (AAA-A)' },
              { id: 'medium', label: 'Modéré (BBB-BB)' },
              { id: 'high', label: 'Élevé (B-CCC)' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedRiskFilter(f.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedRiskFilter === f.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-800/40 border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Lignes:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-950/70 border border-white/10 rounded-lg text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-800/40">
                {['ID Client', 'Nom & Entreprise', 'Secteur d\'Activité', 'Exposition (EAD)', 'Prob. Défaut (PD)', 'Perte Cas Défaut (LGD)', 'Perte Attendue (EL)', 'Rating Bâle', 'Action'].map((h) => (
                  <th key={h} className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedRisques.map((a, i) => {
                const rc = risqueColors[a.risque] || risqueColors["CCC"];
                return (
                  <tr key={i} className="hover:bg-emerald-500/5 transition-colors group">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] font-bold text-emerald-400">{a.id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-bold text-slate-200">
                      {a.nom}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-slate-400">
                      {a.secteur || 'Commerce & PME'}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-black text-cyan-400">
                      {a.ead ? a.ead.toLocaleString('fr-DZ', { maximumFractionDigits: 0 }) : '0'} DZD
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${(a.pd || 0) > 0.25 ? 'from-rose-600 to-rose-400' : (a.pd || 0) > 0.10 ? 'from-amber-600 to-amber-400' : 'from-emerald-600 to-emerald-400'}`} 
                            style={{ width: `${Math.min(100, (a.pd || 0) * 100)}%` }} 
                          />
                        </div>
                        <span className={`text-[13px] font-bold ${(a.pd || 0) > 0.25 ? 'text-rose-400' : (a.pd || 0) > 0.10 ? 'text-amber-400' : 'text-slate-300'} w-12`}>
                          {((a.pd || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-slate-300">
                      {((a.lgd || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-black text-rose-400">
                      {a.el ? a.el.toLocaleString('fr-DZ', { maximumFractionDigits: 0 }) : '0'} DZD
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black tracking-wider ${rc.bg} ${rc.text} border ${rc.border}`}>
                        {a.risque}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleInspectClient(a.id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Examiner
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedRisques.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm font-medium text-slate-400">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                        Chargement des dossiers depuis le Core Banking...
                      </div>
                    ) : (
                      'Aucun client trouvé pour cette recherche ou filtre de risque.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination Controls */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-900/80 rounded-xl border border-white/5">
          {/* Status Counter */}
          <div className="text-xs text-slate-400 font-medium">
            Affichage de <span className="font-bold text-white">{filteredRisques.length ? startIndex + 1 : 0}</span> à{' '}
            <span className="font-bold text-white">{endIndex}</span> sur{' '}
            <span className="font-bold text-emerald-400">{filteredRisques.length.toLocaleString('fr-DZ')}</span> clients
            {filteredRisques.length !== risquesPortefeuille.length && (
              <span className="text-slate-500 ml-1">
                (filtré sur {risquesPortefeuille.length.toLocaleString('fr-DZ')} au total)
              </span>
            )}
          </div>

          {/* Page Buttons Toolbar */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage === 1}
              title="Première page"
              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              title="Page précédente"
              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return <span key={`dots-${idx}`} className="px-2 text-xs text-slate-500">...</span>;
                }
                const pageNum = Number(p);
                const isActive = pageNum === validCurrentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              title="Page suivante"
              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage === totalPages}
              title="Dernière page"
              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

          {/* Direct Page Jump Form */}
          <form onSubmit={handleJumpPage} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Aller à :</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={`${validCurrentPage}/${totalPages}`}
              className="w-16 px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-center text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors"
            >
              OK
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
