import { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  Eye, TrendingUp, ChevronRight, Radio,
  ArrowUpRight, ArrowDownRight,
  CreditCard, Activity, UploadCloud, RefreshCw,
  GitBranch, Network, Smartphone, Clock, MapPin, UserCheck,
  Zap, Layers, Database, Lock, Search, Filter, AlertOctagon,
  FileText, ExternalLink, Cpu, BarChart3, HelpCircle
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import BulkTestPanel from '../components/BulkTestPanel';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════
// TYPES & INTERFACES (PDF Specification Alignment)
// ═══════════════════════════════════════════════════════
export type FraudDecisionCode = 'ALLOW' | 'VERIFY' | 'HOLD' | 'BLOCK';

export interface ComparativeRow {
  indicateur: string;
  indicateur_ar: string;
  indicateur_en: string;
  habituel: string;
  habituel_ar: string;
  habituel_en: string;
  observe: string;
  observe_ar: string;
  observe_en: string;
  ecart: string;
  ecart_ar: string;
  ecart_en: string;
  statut: 'normal' | 'attention' | 'critique';
}

export interface HybridLayers {
  layer_a_rules: {
    name: string;
    score: number;
    triggered_rules: string[];
    status: string;
  };
  layer_b_ml: {
    name: string;
    score: number;
    confidence: number;
    status: string;
  };
  layer_c_anomaly: {
    name: string;
    score: number;
    anomalies_detected: number;
    status: string;
  };
  layer_d_network: {
    name: string;
    score: number;
    mule_risk: boolean;
    cluster_type: string;
    status: string;
  };
}

export interface PipelineStepItem {
  step: number;
  name: string;
  name_ar: string;
  name_en: string;
  status: 'completed' | 'flagged' | 'passed';
  desc: string;
}

export interface FraudAnalysisResponse {
  fraud_score: number;
  risk_level: string;
  decision: FraudDecisionCode;
  recommendation: {
    fr: string;
    ar: string;
    en: string;
  };
  comparative_table: ComparativeRow[];
  layers_evaluation: HybridLayers;
  risk_factors: {
    fr: string[];
    ar: string[];
    en: string[];
  };
  pipeline_steps: PipelineStepItem[];
  raw_input: any;
}

export interface FraudHistoryRecord {
  id: string;
  date: string;
  type: string;
  sousType: string;
  entite: string;
  score: number;
  decision: string;
  montant: string;
  analyste: string;
  details?: any;
}

// ═══════════════════════════════════════════════════════
// DECISION & SEVERITY CONFIGURATIONS
// ═══════════════════════════════════════════════════════
const decisionTheme: Record<FraudDecisionCode, {
  label_fr: string;
  label_ar: string;
  label_en: string;
  action_label_fr: string;
  action_label_ar: string;
  action_label_en: string;
  color: string;
  bg: string;
  border: string;
  ring: string;
  badgeBg: string;
}> = {
  ALLOW: {
    label_fr: 'ALLOW (Autorisé)',
    label_ar: 'ALLOW (مسموح به)',
    label_en: 'ALLOW (Approved)',
    action_label_fr: 'La transaction passe normalement',
    action_label_ar: 'العملية تمر بشكل طبيعي وفوري',
    action_label_en: 'Transaction processes normally',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    ring: '#10b981',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  VERIFY: {
    label_fr: 'VERIFY (Vérification requise)',
    label_ar: 'VERIFY (تحقق إضافي مطلوب)',
    label_en: 'VERIFY (Additional Verification)',
    action_label_fr: 'Vérification additionnelle requise (SMS / SCA)',
    action_label_ar: 'يلزم التحقق بخاصية SMS / مصادقة إضافية',
    action_label_en: 'Additional verification required (Step-up)',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    ring: '#f59e0b',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  HOLD: {
    label_fr: 'HOLD (Mise en attente)',
    label_ar: 'HOLD (تعليق العملية)',
    label_en: 'HOLD (Manual / SCA Review)',
    action_label_fr: 'OTP / Strong Customer Authentication / Revue Agent',
    action_label_ar: 'OTP / مصادقة قوية للعميل (SCA) / مراجعة المحلل',
    action_label_en: 'OTP / Strong Customer Authentication / Agent Review',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    ring: '#f97316',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  BLOCK: {
    label_fr: 'BLOCK (Blocage immédiat)',
    label_ar: 'BLOCK (حظر فوري)',
    label_en: 'BLOCK (Immediate Halt)',
    action_label_fr: 'Blocage immédiat + Alerte de sécurité + Enquête LCB-FT',
    action_label_ar: 'حظر فوري + إشعار أمني + فتح تحقيق مكافحة غسل الأموال',
    action_label_en: 'Immediate Block + Security Alert + Investigation',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    ring: '#f43f5e',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  }
};

// ── Score Ring SVG Component ──────────────────────────
function ScoreRing({ score, ringColor, decision }: { score: number; ringColor: string; decision: FraudDecisionCode }) {
  const r = 58, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, score)) / 100) * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={ringColor} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-white tracking-tight drop-shadow-md">
          {score}
        </span>
        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          / 100 RISK
        </span>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 mt-1 rounded-full border ${decisionTheme[decision]?.badgeBg}`}>
          {decision}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function FraudEngineView() {
  const { lang, isRTL } = useLang();
  const [activeTab, setActiveTab] = useState<'detector' | 'rings' | 'ledger' | 'bulk'>('detector');

  // Transaction Inputs State (Defaulting to PDF Scenario 1 from Page 1 & 2)
  const [montant, setMontant] = useState<number>(700000);
  const [heure, setHeure] = useState<string>('02:17');
  const [hourSlider, setHourSlider] = useState<number>(2);
  const [canal, setCanal] = useState<string>('Mobile Banking');
  const [localisation, setLocalisation] = useState<string>('Mوقع غير معتاد (Localisation inhabituelle)');
  const [beneficiaire, setBeneficiaire] = useState<string>('Nouveau bénéficiaire (جديد)');
  const [transactions24h, setTransactions24h] = useState<number>(11);
  const [device, setDevice] = useState<string>('Nouvel appareil (جهاز جديد)');
  const [typeOperation, setTypeOperation] = useState<string>('Virement');
  const [soldeAvant, setSoldeAvant] = useState<number>(850000);
  const [tentatives, setTentatives] = useState<number>(1);

  // Analysis result state
  const [analysis, setAnalysis] = useState<FraudAnalysisResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [presets, setPresets] = useState<any[]>([]);

  // Real data state
  const [fraudHistory, setFraudHistory] = useState<FraudHistoryRecord[]>([]);
  const [selectedTx, setSelectedTx] = useState<FraudHistoryRecord | null>(null);
  const [networkData, setNetworkData] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState({ totalAnalyses: 250, blocked: 42, review: 68, detectionRate: '44.0%' });
  const [syncing, setSyncing] = useState<boolean>(false);

  // Search & Pagination in Ledger Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper for translations
  const t = (fr: string, ar: string, en: string) => lang === 'ar' ? ar : lang === 'en' ? en : fr;

  // 1. Fetch initial Presets & SIB Data
  useEffect(() => {
    // Fetch Presets from backend
    fetch('/api/fraude/presets')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.pdf_scenarios) setPresets(data.pdf_scenarios);
      })
      .catch(console.error);

    // Fetch Network Analysis
    fetch('/api/fraude/network-analysis')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setNetworkData(data);
      })
      .catch(console.error);

    // Fetch Stats & History
    fetchStatsAndHistory();
  }, []);

  const fetchStatsAndHistory = () => {
    fetch('/api/fraud-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setGlobalStats(d); })
      .catch(console.error);

    fetch('/api/fraud-history')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setFraudHistory(d); })
      .catch(console.error);
  };

  const handleSyncSIB = async () => {
    setSyncing(true);
    try {
      await fetch('/api/banking/sync', { method: 'POST' });
      fetchStatsAndHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSyncing(false), 900);
    }
  };

  // 2. Trigger Fraud Evaluation whenever inputs change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoadingAnalysis(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const payload = {
          montant,
          heure,
          canal,
          localisation,
          beneficiaire,
          transactions24h,
          device,
          type_operation: typeOperation,
          solde_avant: soldeAvant,
          tentatives_precedentes: tentatives,
          habitual_profile: {
            montant_moyen_min: 30000,
            montant_moyen_max: 80000,
            heures_habituelles: '08h–21h',
            localisation_habituelle: 'Algérie (Wilaya habituelle)',
            beneficiaires_habituels: 'Bénéficiaire connu (معروف)',
            transactions_jour_min: 2,
            transactions_jour_max: 4,
            device_habituel: 'Appareil de confiance (Android habituel)'
          }
        };

        const res = await fetch('/api/fraude/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          setAnalysis(result);
        }
      } catch (err) {
        console.error('Error analyzing fraud:', err);
      } finally {
        setLoadingAnalysis(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [montant, heure, canal, localisation, beneficiaire, transactions24h, device, typeOperation, soldeAvant, tentatives]);

  // Handle Preset selection
  const applyPreset = (preset: any) => {
    setMontant(preset.montant);
    setHeure(preset.heure);
    const parsedHour = parseInt(String(preset.heure).split(':')[0] || '12', 10);
    setHourSlider(isNaN(parsedHour) ? 12 : parsedHour);
    setCanal(preset.canal || 'Mobile Banking');
    setLocalisation(preset.localisation);
    setBeneficiaire(preset.beneficiaire);
    setTransactions24h(preset.transactions24h);
    setDevice(preset.device);
    setTypeOperation(preset.type_operation || 'Virement');
    if (preset.solde_avant) setSoldeAvant(preset.solde_avant);
    if (preset.tentatives_precedentes !== undefined) setTentatives(preset.tentatives_precedentes);
  };

  // Inspect Live Transaction from Ledger
  const inspectLiveTransaction = (item: FraudHistoryRecord) => {
    const rawMontant = parseFloat(item.montant.replace(/[^0-9.-]+/g, '')) || 120000;
    setMontant(rawMontant);
    setBeneficiaire(item.entite || 'Compte BNA');
    setCanal(item.sousType || 'Mobile Banking');
    setTypeOperation(item.type || 'Virement');
    setTransactions24h(item.score >= 80 ? 9 : 2);
    setHeure(item.score >= 80 ? '02:15' : '14:20');
    setHourSlider(item.score >= 80 ? 2 : 14);
    setDevice(item.score >= 80 ? 'Nouveau device' : 'Appareil de confiance');
    setLocalisation(item.score >= 80 ? 'Location unusual' : 'Algérie (Alger)');
    setSoldeAvant(Math.round(rawMontant * 1.6));
    setActiveTab('detector');
  };

  // Filtered ledger transactions
  const filteredHistory = fraudHistory.filter(item => {
    const matchesSearch = item.entite.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.montant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterDecision === 'ALL' ||
                          (filterDecision === 'BLOCK' && item.decision === 'blocked') ||
                          (filterDecision === 'HOLD' && (item.decision === 'review' || item.score >= 70)) ||
                          (filterDecision === 'ALLOW' && item.decision === 'approved');
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentDecision: FraudDecisionCode = analysis?.decision || (montant >= 700000 ? 'HOLD' : 'ALLOW');
  const currentTheme = decisionTheme[currentDecision] || decisionTheme.ALLOW;

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`}>
      {/* ── 1. HEADER BANNER (Specification Conformance & Live Ingestion) ────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-6 md:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.06)]">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />

        <div className={`relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <div className="space-y-2.5 max-w-2xl">
            <div className={`flex flex-wrap items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  {t('Flux Temps Réel · Core Banking SIB', 'تدفق فوري · النظام البنكي SIB', 'Real-Time Ingestion · SIB Core Banking')}
                </span>
              </div>
              <span className="rounded-full border border-slate-700/80 bg-slate-800/60 px-3 py-1 text-[11px] font-semibold text-slate-300">
                {t('Spécification PDF (8 Pages) Active', 'مواصفة ملف PDF (8 صفحات) مفعلة', 'PDF Spec (8 Pages) Active')}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {t("Détecteur de Fraude & ", "كاشف الاحتيال و ", "Fraud Detector & ")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                {t("Surveillance Comportementale", "المراقبة السلوكية الذكية", "Behavioral Surveillance")}
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {t(
                "Comparatif en temps réel : Profil Comportemental Dynamique (الوضع المعتاد) vs Opération Observée (العملية الجديدة). Architecture hybride 4 couches avec explicabilité XAI.",
                "مقارنة فورية بالذكاء الاصطناعي: السلوك المعتاد للعميل مقابل العملية الجديدة. محرك هجين بـ 4 طبقات (قواعد، تعلم الآلة، كشف الشذوذ، تحليل الشبكات).",
                "Real-time comparison: Dynamic Behavioral Baseline vs. Observed Operation. 4-Layer Hybrid Engine with XAI Explainability."
              )}
            </p>
          </div>

          <div className={`flex flex-col items-start md:items-end gap-2.5 shrink-0 ${isRTL ? 'md:items-start' : ''}`}>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>SIB: 69.57.163.97 · Inférence: <strong className="text-emerald-400">18ms</strong></span>
            </div>
            <button
              onClick={handleSyncSIB}
              disabled={syncing}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? t('Synchronisation...', 'جاري المزامنة...', 'Syncing SIB...') : t('Actualiser Flux Core Banking', 'تحديث تدفق SIB', 'Refresh SIB Feed')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. REAL-TIME PIPELINE ARCHITECTURE BAR (Page 6 of PDF) ──────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 md:p-5 backdrop-blur-md">
        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <GitBranch className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              {t("Pipeline d'Ingestion & Inférence (Page 6 du PDF)", "مخطط تدفق العمليات والاستيعاب الفوري (صفحة 6)", "Ingestion & Inference Pipeline (Page 6 Spec)")}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {t("Connexion directe Core Banking & SIB", "ربط مباشر مع النظام المصرفي", "Direct Core Banking & Payment System Hook")}
          </span>
        </div>

        {/* Scrollable Pipeline Breadcrumbs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {(analysis?.pipeline_steps || [
            { step: 1, name: 'TRANSACTION', name_ar: 'العملية', name_en: 'TX', status: 'completed', desc: 'Arrivée live' },
            { step: 2, name: 'REAL-TIME INGESTION', name_ar: 'استيعاب فوري', name_en: 'INGEST', status: 'completed', desc: 'Core Banking' },
            { step: 3, name: 'BEHAVIORAL PROFILE', name_ar: 'ملف سلوكي', name_en: 'PROFILE', status: 'completed', desc: 'Historique' },
            { step: 4, name: 'RULES ENGINE', name_ar: 'قواعد', name_en: 'RULES', status: 'flagged', desc: 'Layer A' },
            { step: 5, name: 'AI / ML MODELS', name_ar: 'تعلم آلة', name_en: 'ML', status: 'flagged', desc: 'Layer B' },
            { step: 6, name: 'ANOMALY DETECTION', name_ar: 'كشف شذوذ', name_en: 'ANOMALY', status: 'flagged', desc: 'Layer C' },
            { step: 7, name: 'FRAUD SCORE', name_ar: 'درجة الخطر', name_en: 'SCORE', status: 'completed', desc: '0-100' },
            { step: 8, name: 'EXPLAINABILITY (XAI)', name_ar: 'تفسير XAI', name_en: 'XAI', status: 'completed', desc: 'Facteurs' },
            { step: 9, name: 'DECISION ENGINE', name_ar: 'محرك القرار', name_en: 'DECISION', status: 'completed', desc: 'Action' },
            { step: 10, name: 'CORE BANKING ACTION', name_ar: 'تنفيذ القرار', name_en: 'ACTION', status: 'completed', desc: currentDecision }
          ]).map((step, idx) => {
            const isFlagged = step.status === 'flagged';
            const isLast = idx === 9;
            return (
              <div key={idx} className="flex items-center shrink-0">
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all ${
                  isLast
                    ? `${currentTheme.bg} ${currentTheme.border} ${currentTheme.color}`
                    : isFlagged
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                }`}>
                  <span className="text-[9px] font-mono text-slate-500">#{step.step}</span>
                  <span className="text-[11px] font-bold whitespace-nowrap">
                    {lang === 'ar' ? step.name_ar : step.name}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate max-w-[100px]">{step.desc}</span>
                </div>
                {idx < 9 && <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0 mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. PRESET BENCHMARKS FROM PDF ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4 backdrop-blur-md space-y-2">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t("Scénarios Référencés du PDF (Detecteur du fraude.PDF)", "السيناريوهات المرجعية من ملف PDF", "PDF Benchmark Scenarios")}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">
            {t("Test direct en un clic", "اختبار فوري بنقرة واحدة", "One-click test")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Preset 1 (Pages 1 & 2) */}
          <button
            onClick={() => applyPreset({
              montant: 700000,
              heure: '02:17',
              canal: 'Mobile Banking',
              localisation: 'Mوقع غير معتاد (Localisation inhabituelle)',
              beneficiaire: 'Nouveau bénéficiaire (جديد)',
              transactions24h: 11,
              device: 'Nouvel appareil (جهاز جديد)',
              type_operation: 'Virement',
              solde_avant: 850000,
              tentatives_precedentes: 1
            })}
            className="flex flex-col text-left p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 transition-all text-slate-200 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-rose-400">Page 1 & 2 · Virement 700k DA</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">Score 91</span>
            </div>
            <p className="text-xs font-bold text-white mt-1">700 000 DA · 02:17 Nocturne</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Mobile · Nouveau Bénéficiaire · 11 tx/24h · Nouvel Appareil</p>
          </button>

          {/* Preset 2 (Pages 7 & 8) */}
          <button
            onClick={() => applyPreset({
              montant: 1200000,
              heure: '02:13',
              canal: 'Mobile Banking',
              localisation: 'Location unusual (خارج النطاق المعتاد)',
              beneficiaire: 'New beneficiary (مستفيد جديد)',
              transactions24h: 9,
              device: 'New device (جهاز جديد)',
              type_operation: 'Transfert',
              solde_avant: 1400000,
              tentatives_precedentes: 0
            })}
            className="flex flex-col text-left p-3 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/15 transition-all text-slate-200 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-orange-400">Page 7 & 8 · Transfert 1.2M DA</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">Score 94 · HOLD</span>
            </div>
            <p className="text-xs font-bold text-white mt-1">1 200 000 DA · 02:13 AM</p>
            <p className="text-[10px] text-slate-400 mt-0.5">New device · New benef · Location unusual · 9 tx/h</p>
          </button>

          {/* Preset 3 (Page 4 Nominal) */}
          <button
            onClick={() => applyPreset({
              montant: 4500,
              heure: '14:30',
              canal: 'Paiement TPE',
              localisation: 'Algérie (Alger)',
              beneficiaire: 'Commerçant habituel (معروف)',
              transactions24h: 1,
              device: 'Appareil de confiance (هاتف معتاد)',
              type_operation: 'Paiement',
              solde_avant: 350000,
              tentatives_precedentes: 0
            })}
            className="flex flex-col text-left p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 transition-all text-slate-200 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-400">Page 4 · Paiement Nominal</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Score 18 · ALLOW</span>
            </div>
            <p className="text-xs font-bold text-white mt-1">4 500 DA · 14:30 TPE Alger</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Bénéficiaire habituel · Appareil habituel · 1 tx/jour</p>
          </button>

          {/* Preset 4 (Page 4 Medium Risk) */}
          <button
            onClick={() => applyPreset({
              montant: 85000,
              heure: '20:15',
              canal: 'Mobile Banking',
              localisation: 'Algérie (Oran)',
              beneficiaire: 'Nouveau bénéficiaire (جديد)',
              transactions24h: 3,
              device: 'Appareil de confiance (هاتف معتاد)',
              type_operation: 'Virement',
              solde_avant: 500000,
              tentatives_precedentes: 0
            })}
            className="flex flex-col text-left p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 transition-all text-slate-200 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-400">Page 4 · Risque Modéré</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Score 47 · VERIFY</span>
            </div>
            <p className="text-xs font-bold text-white mt-1">85 000 DA · 20:15 Mobile</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Nouveau bénéficiaire · Appareil habituel · 3 tx/j</p>
          </button>
        </div>
      </div>

      {/* ── 4. NAVIGATION TABS ─────────────────────────────────────────────────────── */}
      <div className={`flex gap-2 rounded-2xl border border-white/5 bg-slate-900/50 p-1.5 backdrop-blur-md ${isRTL ? 'flex-row-reverse' : ''}`}>
        {[
          { id: 'detector', icon: ShieldAlert, label_fr: 'Détecteur & Comparatif PDF', label_ar: 'الكاشف والجدول المقارن', label_en: 'Detector & PDF Comparison' },
          { id: 'rings',    icon: Network,     label_fr: 'Réseaux & Fraud Rings (Couche D)', label_ar: 'تحليل الشبكات والحلقات', label_en: 'Fraud Rings & Mules (Layer D)' },
          { id: 'ledger',   icon: Database,    label_fr: 'Transactions Live SIB (250+)', label_ar: 'سجل المعاملات الحية', label_en: 'Live SIB Ledger (250+)' },
          { id: 'bulk',     icon: UploadCloud, label_fr: 'Test en Masse (Bulk CSV)', label_ar: 'اختبار جماعي', label_en: 'Bulk CSV Test' },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs md:text-sm font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{lang === 'ar' ? tab.label_ar : lang === 'en' ? tab.label_en : tab.label_fr}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DETECTOR & BEHAVIORAL COMPARISON (Core PDF Specification) ──────── */}
      {activeTab === 'detector' && (
        <div className="space-y-6">
          {/* Top Grid: Simulation Controls (Left) vs Real-Time Output (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── LEFT: Transaction Simulation Inputs ── */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
                <div className={`flex items-center justify-between border-b border-slate-800 pb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      {t("Paramètres de l'Opération Observée", "معطيات العملية الجديدة الملاحظة", "Observed Transaction Parameters")}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    LIVE CORE BANKING
                  </span>
                </div>

                {/* Montant & Solde */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t("Montant (DZD)", "المبلغ (دج)", "Amount (DZD)")}
                    </label>
                    <input
                      type="number"
                      value={montant}
                      step={5000}
                      onChange={e => setMontant(Math.max(0, +e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t("Solde Avant Opération", "الرصيد قبل العملية", "Prior Balance")}
                    </label>
                    <input
                      type="number"
                      value={soldeAvant}
                      step={10000}
                      onChange={e => setSoldeAvant(Math.max(0, +e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-mono font-bold text-cyan-400 outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Heure (00h-23h) Slider */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    <span>{t("Heure de la transaction", "ساعة العملية", "Transaction Time")}</span>
                    <span className="text-emerald-400 font-mono text-xs">{heure}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={23}
                    value={hourSlider}
                    onChange={e => {
                      const h = +e.target.value;
                      setHourSlider(h);
                      setHeure(`${String(h).padStart(2, '0')}:15`);
                    }}
                    className="w-full h-2 rounded-lg accent-emerald-500 cursor-pointer bg-slate-700"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>00:00 (Nuit)</span>
                    <span>08:00</span>
                    <span>14:00</span>
                    <span>20:00</span>
                    <span>23:59</span>
                  </div>
                </div>

                {/* Vélocité & Tentatives */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      <span>{t("Vélocité (24h)", "التكرار (24 ساعة)", "Velocity (24h)")}</span>
                      <span className="text-emerald-400 font-mono text-xs">{transactions24h} tx</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={25}
                      value={transactions24h}
                      onChange={e => setTransactions24h(+e.target.value)}
                      className="w-full h-2 rounded-lg accent-emerald-500 cursor-pointer bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t("Échecs Authentification", "محاولات الدخول الفاشلة", "Failed Auth Attempts")}
                    </label>
                    <select
                      value={tentatives}
                      onChange={e => setTentatives(+e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value={0}>0 (Aucun échec)</option>
                      <option value={1}>1 échec</option>
                      <option value={3}>3 échecs (Suspect)</option>
                      <option value={5}>5 échecs (Brute-force)</option>
                    </select>
                  </div>
                </div>

                {/* Canal & Type d'opération */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t("Canal Bancaire", "القناة المصرفية", "Banking Channel")}
                    </label>
                    <select
                      value={canal}
                      onChange={e => setCanal(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="Mobile Banking">Mobile Banking (App)</option>
                      <option value="Web Banking">Web Banking (Portail)</option>
                      <option value="Paiement TPE">Paiement TPE (CIB/Edahabia)</option>
                      <option value="DAB / ATM">DAB / Guichet ATM</option>
                      <option value="Agence">Guichet Agence</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t("Type d'opération", "نوع العملية", "Operation Type")}
                    </label>
                    <select
                      value={typeOperation}
                      onChange={e => setTypeOperation(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="Virement">Virement Compte-à-Compte</option>
                      <option value="Transfert">Transfert Instantané</option>
                      <option value="Paiement">Paiement Commerçant</option>
                      <option value="Retrait">Retrait Espèces</option>
                    </select>
                  </div>
                </div>

                {/* Localisation, Bénéficiaire & Device */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {t("Localisation Géographique (IP / Wilaya)", "الموقع الجغرافي", "Geographical Location")}
                    </label>
                    <select
                      value={localisation}
                      onChange={e => setLocalisation(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="Algérie (Alger)">Algérie (Alger - Zone habituelle)</option>
                      <option value="Algérie (Oran)">Algérie (Oran - Région ouest)</option>
                      <option value="Algérie (Sétif)">Algérie (Sétif - Région est)</option>
                      <option value="Mوقع غير معتاد (Localisation inhabituelle)">Mوقع غير معتاد (Localisation inhabituelle / IP Suspecte)</option>
                      <option value="International (Hors Algérie)">International (Hors Algérie / Proxy VPN)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {t("Bénéficiaire de destination", "المستفيد", "Beneficiary")}
                      </label>
                      <select
                        value={beneficiaire}
                        onChange={e => setBeneficiaire(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500"
                      >
                        <option value="Nouveau bénéficiaire (جديد)">Nouveau bénéficiaire (جديد - Non répertorié)</option>
                        <option value="Bénéficiaire habituel (معروف)">Bénéficiaire habituel (معروف - Historique validé)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {t("Empreinte Appareil (Device)", "الجهاز المستعمل", "Device Fingerprint")}
                      </label>
                      <select
                        value={device}
                        onChange={e => setDevice(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500"
                      >
                        <option value="Nouvel appareil (جهاز جديد)">Nouvel appareil (جهاز جديد - Empreinte inconnue)</option>
                        <option value="Appareil de confiance (هاتف معتاد)">Appareil de confiance (هاتف معتاد - Certifié)</option>
                        <option value="Émulateur / Clone détecté">Émulateur / Clone détecté (Haut risque)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Fraud Risk Score & Explainable AI ── */}
            <div className="lg:col-span-6 space-y-4">
              {/* Score Card */}
              <div className={`rounded-2xl border ${currentTheme.border} ${currentTheme.bg} p-6 backdrop-blur-md relative overflow-hidden`}>
                <div className={`flex flex-col sm:flex-row items-center gap-6 ${isRTL ? 'sm:flex-row-reverse text-right' : ''}`}>
                  <ScoreRing
                    score={analysis?.fraud_score ?? 91}
                    ringColor={currentTheme.ring}
                    decision={currentDecision}
                  />

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        {t("Score de Risque de Fraude", "درجة مخاطر الاحتيال", "Fraud Risk Score")}
                      </span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <h2 className={`text-2xl font-black ${currentTheme.color}`}>
                        {currentDecision}
                      </h2>
                      <span className="text-xs text-slate-400 font-bold">
                        · {analysis?.risk_level || 'High Risk'}
                      </span>
                    </div>

                    {/* Action Callout Box */}
                    <div className={`rounded-xl border p-3 mt-2 text-left ${currentTheme.border} bg-slate-900/60`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {t("Action Bancaire Requise (Spécification PDF)", "الإجراء المصرفي المطلوب (مواصفة PDF)", "Required Banking Action (PDF Spec)")}
                      </span>
                      <p className={`text-xs font-extrabold ${currentTheme.color}`}>
                        {lang === 'ar'
                          ? analysis?.recommendation?.ar || currentTheme.action_label_ar
                          : analysis?.recommendation?.fr || currentTheme.action_label_fr}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainable AI (XAI) - Main Risk Factors (Page 5 & 8) */}
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md space-y-3">
                <div className={`flex items-center justify-between border-b border-slate-800 pb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Cpu className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      {t("Facteurs de Risque Majeurs (XAI)", "عوامل الخطر الرئيسية المكتشفة (XAI)", "Main Risk Factors (XAI Explainability)")}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t("Pour le Risk Officer", "لمسؤول المخاطر", "For Risk Officer")}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {(lang === 'ar'
                    ? analysis?.risk_factors?.ar
                    : lang === 'en'
                    ? analysis?.risk_factors?.en
                    : analysis?.risk_factors?.fr || [
                      "Montant = 14.0x supérieur à la moyenne du client",
                      "Nouveau bénéficiaire jamais contacté auparavant",
                      "Device jamais utilisé auparavant (Nouvelle empreinte digitale)",
                      "Transaction effectuée à une heure nocturne inhabituelle (02:17)",
                      "11 transactions supplémentaires durant les dernières 24h"
                    ]
                  )?.map((factor, i) => (
                    <div key={i} className={`flex items-start gap-2.5 text-xs text-slate-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span className="leading-snug font-medium">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM FULL-WIDTH: BEHAVIORAL COMPARATIVE TABLE (Page 2 of PDF) ─────── */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {t("Tableau Comparatif : Comportement Habituel vs Opération Observée", "الجدول المقارن: الوضع المعتاد vs العملية الجديدة", "Comparative Table: Habitual Profile vs Observed Operation")}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t(
                    "Conforme Page 2 du PDF : L'IA évalue si l'opération est naturelle pour CE client spécifique",
                    "مطابق تماماً لصفحة 2 من PDF: الذكاء الاصطناعي لا يكتفي بفحص المبلغ، بل يسأل: هل هو طبيعي لهذا العميل بالذات؟",
                    "Matches Page 2 Spec: AI assesses whether the operation is habitual for THIS specific client"
                  )}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400">
                {t("6 Indicateurs Clés", "6 مؤشرات أساسية", "6 Core Indicators")}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("Indicateur (مؤشر)", "مؤشر", "Indicator")}
                    </th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("Comportement Habituel (الوضع المعتاد)", "الوضع المعتاد", "Habitual Profile (Baseline)")}
                    </th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("Opération Observée (العملية الجديدة)", "العملية الجديدة", "Observed Operation")}
                    </th>
                    <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t("Écart / Diagnostic", "التشخيص والانحراف", "Deviation / Diagnosis")}
                    </th>
                    <th className={`px-4 py-3 text-center`}>
                      {t("Statut", "الحالة", "Status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {(analysis?.comparative_table || [
                    { indicateur: 'Montant', indicateur_ar: 'المبلغ', indicateur_en: 'Amount', habituel: '30 000–80 000 DA', habituel_ar: '30,000–80,000 دج', habituel_en: '30k-80k DZD', observe: '700 000 DA', observe_ar: '700,000 دج', observe_en: '700,000 DZD', ecart: '14.0x supérieur à la moyenne', ecart_ar: '14x أعلى من المعدل', ecart_en: '14x above average', statut: 'critique' },
                    { indicateur: 'Heure', indicateur_ar: 'الساعة', indicateur_en: 'Time', habituel: '08h–21h', habituel_ar: '08h–21h', habituel_en: '08h-21h', observe: '02:17', observe_ar: '02:17', observe_en: '02:17', ecart: 'Opération nocturne atypique (00h-05h)', ecart_ar: 'عملية ليلية غير معتادة', ecart_en: 'Atypical night operation', statut: 'critique' },
                    { indicateur: 'Localisation', indicateur_ar: 'الموقع الجغرافي', indicateur_en: 'Location', habituel: 'Algérie (Wilaya habituelle)', habituel_ar: 'الجزائر (المنطقة المعتادة)', habituel_en: 'Algeria (Usual area)', observe: 'Mوقع غير معتاد', observe_ar: 'موقع غير معتاد', observe_en: 'Unusual location', ecart: 'Hors zone habituelle (IP suspecte)', ecart_ar: 'خارج النطاق المعتاد', ecart_en: 'Outside usual zone', statut: 'critique' },
                    { indicateur: 'Bénéficiaire', indicateur_ar: 'المستفيد', indicateur_en: 'Beneficiary', habituel: 'Bénéficiaire connu', habituel_ar: 'معروف ومسجل', habituel_en: 'Known beneficiary', observe: 'Nouveau bénéficiaire', observe_ar: 'مستفيد جديد', observe_en: 'New beneficiary', ecart: 'Bénéficiaire non répertorié', ecart_ar: 'مستفيد غير مدرج مسبقاً', ecart_en: 'Unlisted beneficiary', statut: 'critique' },
                    { indicateur: 'Transactions (Vélocité)', indicateur_ar: 'العمليات (التكرار)', indicateur_en: 'Velocity', habituel: '2–4 / jour', habituel_ar: '2–4 / يوم', habituel_en: '2-4 / day', observe: '11 / 24h', observe_ar: '11 / 24 ساعة', observe_en: '11 / 24h', ecart: 'Vélocité critique: 11 tx / court intervalle', ecart_ar: 'تكرار حرج للعمليات', ecart_en: 'Critical velocity', statut: 'critique' },
                    { indicateur: 'Appareil (Device)', indicateur_ar: 'الجهاز المستعمل', indicateur_en: 'Device Fingerprint', habituel: 'Appareil de confiance (Android habituel)', habituel_ar: 'هاتف معتاد وموثوق', habituel_en: 'Trusted device', observe: 'Nouvel appareil', observe_ar: 'جهاز جديد', observe_en: 'New device', ecart: 'Nouvelle empreinte numérique', ecart_ar: 'بصمة رقمية جديدة', ecart_en: 'New digital fingerprint', statut: 'critique' }
                  ]).map((row, idx) => {
                    const isCritique = row.statut === 'critique';
                    const isAttention = row.statut === 'attention';

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className={`px-4 py-3.5 font-bold text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                          {lang === 'ar' ? row.indicateur_ar : lang === 'en' ? row.indicateur_en : row.indicateur}
                        </td>
                        <td className={`px-4 py-3.5 font-mono text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {lang === 'ar' ? row.habituel_ar : lang === 'en' ? row.habituel_en : row.habituel}
                        </td>
                        <td className={`px-4 py-3.5 font-mono font-bold ${isCritique ? 'text-rose-400' : isAttention ? 'text-amber-400' : 'text-emerald-400'} ${isRTL ? 'text-right' : 'text-left'}`}>
                          {lang === 'ar' ? row.observe_ar : lang === 'en' ? row.observe_en : row.observe}
                        </td>
                        <td className={`px-4 py-3.5 text-slate-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {lang === 'ar' ? row.ecart_ar : lang === 'en' ? row.ecart_en : row.ecart}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isCritique
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isAttention
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {isCritique ? t('Anomalie Forte', 'شذوذ حرج', 'High Anomaly') : isAttention ? t('Attention', 'تنبيه', 'Warning') : t('Normal', 'طبيعي', 'Nominal')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── HYBRID 4-LAYER FRAUD ENGINE CARDS (Pages 3 & 4 of PDF) ─────────────── */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>{t("Évaluation Hybride à 4 Couches (Pages 3 & 4 du PDF)", "تقييم المحرك الهجين ذي الطبقات الأربع (صفحة 3 و 4)", "Hybrid 4-Layer Engine Evaluation")}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Layer A: Rules Engine */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Layer A</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${analysis?.layers_evaluation?.layer_a_rules?.status === 'TRIGGERED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                    {analysis?.layers_evaluation?.layer_a_rules?.status || 'TRIGGERED'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Rules Engine (محرك القواعد)</h4>
                <p className="text-[11px] text-slate-400">
                  {t("Plafonds, vélocité brute, changement brutal de comportement.", "حدود المبالغ، التكرار السريع، التغير المفاجئ في السلوك.", "Limits, sudden behavioral shift, brute velocity.")}
                </p>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500">Règles Déclenchées:</span>
                  <span className="text-xs font-bold text-rose-400 ml-1.5">
                    {analysis?.layers_evaluation?.layer_a_rules?.triggered_rules?.length ?? 3}
                  </span>
                </div>
              </div>

              {/* Layer B: Machine Learning */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Layer B</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    XGBoost 94.8%
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Machine Learning (تعلم الآلة)</h4>
                <p className="text-[11px] text-slate-400">
                  {t("Apprentissage supervisé sur les fraudes historiques.", "النموذج يتعلم من البيانات التاريخية للعمليات الاحتيالية.", "Supervised classification on historical fraud datasets.")}
                </p>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500">Score de Motif ML:</span>
                  <span className="text-xs font-bold text-indigo-400 ml-1.5">
                    {analysis?.layers_evaluation?.layer_b_ml?.score ?? 98}/100
                  </span>
                </div>
              </div>

              {/* Layer C: Anomaly Detection */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Layer C</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Isolation Forest
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Anomaly Detection (كشف الشذوذ)</h4>
                <p className="text-[11px] text-slate-400">
                  {t("Détection non-supervisée de fraudes inédites vs profil.", "كشف الشذوذ غير الخاضع للإشراف حتى في الاحتيال غير المعروف.", "Unsupervised zero-day detection vs dynamic baseline.")}
                </p>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500">Déviation du profil:</span>
                  <span className="text-xs font-bold text-cyan-400 ml-1.5">
                    {analysis?.layers_evaluation?.layer_c_anomaly?.anomalies_detected ?? 6} anomalies
                  </span>
                </div>
              </div>

              {/* Layer D: Network & Pattern Analysis */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Layer D</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${analysis?.layers_evaluation?.layer_d_network?.mule_risk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                    {analysis?.layers_evaluation?.layer_d_network?.status || 'FLAGGED_RING'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Network & Rings (تحليل الشبكات)</h4>
                <p className="text-[11px] text-slate-400">
                  {t("Détection des comptes mules et anneaux de smurfing.", "اكتشاف الحلقات الاحتيالية والحسابات الوسيطة (Mules).", "Detects mule accounts and multi-party fraud rings.")}
                </p>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500">Risque Réseau Mule:</span>
                  <span className="text-xs font-bold text-rose-400 ml-1.5">
                    {analysis?.layers_evaluation?.layer_d_network?.mule_risk ? 'Élevé (Alert)' : 'Nominal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: NETWORK & FRAUD RINGS (Layer D) ─────────────────────────────────── */}
      {activeTab === 'rings' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md space-y-5">
            <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Network className="h-5 w-5 text-emerald-400" />
                  <span>{t("Analyse des Réseaux & Anneaux de Fraude (Layer D)", "تحليل الشبكات والحلقات الاحتيالية (الطبقة D)", "Network & Fraud Ring Analysis (Layer D)")}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t(
                    "Détection avancée des mules bancaires et transferts groupés anormaux vers les mêmes comptes ou appareils.",
                    "مستوى متقدم: كشف عدة عملاء يحولون الأموال إلى نفس الحسابات أو نفس المستفيدين بطريقة غير طبيعية (Fraud Rings).",
                    "Advanced detection of mule accounts and multi-client transfers converging onto shared beneficiaries."
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs">
                  {networkData?.summary?.active_fraud_rings || 2} Anneaux Actifs
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                  {networkData?.summary?.mule_accounts_detected || 4} Mules Détectées
                </div>
              </div>
            </div>

            {/* Network Nodes Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(networkData?.nodes || [
                { id: 'MULE-CORE-01', label: 'Compte Mule #440912 (Alger)', type: 'mule_account', risk: 'critical', transactions: 14, totalDzd: 4200000 },
                { id: 'BENEF-EXT-88', label: 'Bénéficiaire Suspect #DZ-9912', type: 'suspicious_beneficiary', risk: 'critical', transactions: 9, totalDzd: 3800000 },
                { id: 'ATM-ORAN-04', label: 'DAB Guichet #ORAN-HYDRA', type: 'atm_hotspot', risk: 'high', transactions: 22, totalDzd: 1850000 },
                { id: 'DEV-FP-X99', label: 'Device Clone #IMEI-88402', type: 'shared_device', risk: 'critical', transactions: 7, totalDzd: 2900000 }
              ]).map((node: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">{node.id}</span>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {node.risk.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{node.label}</h4>
                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span className="font-bold text-slate-200">{node.transactions} tx</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume cumulé:</span>
                      <span className="font-mono text-emerald-400 font-bold">{node.totalDzd.toLocaleString('fr-DZ')} DA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edge Connections Flow */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t("Flux des Transferts Suspects Interconnectés (Graphes Relationnels)", "تدفق التحويلات المشبوهة المترابطة (تحليل بياني)", "Interconnected Suspicious Transfer Graph")}
              </h4>
              <div className="space-y-2">
                {(networkData?.edges || [
                  { from: 'MULE-CORE-01', to: 'BENEF-EXT-88', label: 'Virements rapides (9 tx / 2h)', amount: '3 800 000 DA', alert: 'Fraud Ring Smurfing' },
                  { from: 'DEV-FP-X99', to: 'MULE-CORE-01', label: 'Authentification partagée', amount: 'Multi-comptes', alert: 'Account Takeover' },
                  { from: 'MULE-CORE-01', to: 'ATM-ORAN-04', label: 'Retraits séquentiels', amount: '1 850 000 DA', alert: 'Burst Cash-Out' }
                ]).map((edge: any, i: number) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-900/60 text-xs text-slate-300 gap-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-rose-400 font-bold">{edge.from}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-amber-400 font-bold">{edge.to}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{edge.label}</span>
                    <span className="font-mono font-bold text-emerald-400">{edge.amount}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/30">
                      {edge.alert}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LIVE SIB LEDGER TRANSACTIONS (250+ Genuine Records) ─────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span>{t("Journal des Transactions Live (Core Banking SIB)", "سجل العمليات الحية للنظام المصرفي", "Live Core Banking SIB Ledger")}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t("Données réelles synchronisées depuis le serveur 69.57.163.97 avec inférence Algorisk", "معاملات حقيقية مأخوذة من الخادم البنكي 69.57.163.97", "Genuine transactions with RiskVisionAI fraud scoring")}
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t("Rechercher (Compte, ID, Montant)...", "بحث...", "Search...")}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={filterDecision}
                  onChange={e => { setFilterDecision(e.target.value); setCurrentPage(1); }}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="BLOCK">BLOCK (Bloqués)</option>
                  <option value="HOLD">HOLD (En attente / Revue)</option>
                  <option value="ALLOW">ALLOW (Approuvés)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">ID Transaction</th>
                    <th className="px-4 py-3">Date & Heure</th>
                    <th className="px-4 py-3">Entité / Compte</th>
                    <th className="px-4 py-3">Canal & Type</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Décision</th>
                    <th className="px-4 py-3 text-center">Action Spécification PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {paginatedHistory.map((item, idx) => {
                    const dec = item.decision === 'blocked' ? 'BLOCK' : (item.decision === 'review' || item.score >= 68 ? 'HOLD' : 'ALLOW');
                    const theme = decisionTheme[dec] || decisionTheme.ALLOW;

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">{item.id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{item.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-200 max-w-[150px] truncate">{item.entite}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700">
                            {item.sousType || 'Mobile Banking'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-200">{item.montant}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black ${theme.color}`}>{item.score}</span>
                            <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: theme.ring }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${theme.badgeBg}`}>
                            {dec}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => inspectLiveTransaction(item)}
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                          >
                            {t("Inspecter selon PDF", "فحص وفق PDF", "Inspect in PDF View")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Précédent
                  </button>
                  <span>Page {currentPage} sur {totalPages} ({filteredHistory.length} transactions)</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: BULK TEST & BENCHMARK PANEL ────────────────────────────────────── */}
      {activeTab === 'bulk' && (
        <BulkTestPanel />
      )}
    </div>
  );
}
