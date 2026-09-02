import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Brain, Eye, AlertTriangle, CheckCircle2, Info,
  TrendingUp, TrendingDown, User, Clock, ChevronRight,
  Lightbulb, BarChart3, Scale, MessageSquare, ShieldCheck,
  ArrowUpRight, ArrowDownRight, RefreshCw, Zap, Loader2,
} from 'lucide-react';
import {
  type XaiDecision, type ShapFeature,
  type GlobalFeatureImportance, type ModelFairness, type DecisionHistoryItem
} from '../data/xaiData';
import { useLang } from '../i18n/LangContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const riskConfig = {
  faible:   { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25',  bar: '#22c55e', badge: 'bg-green-500/15 text-green-300' },
  moyen:    { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  bar: '#f59e0b', badge: 'bg-amber-500/15 text-amber-300' },
  élevé:    { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25', bar: '#f97316', badge: 'bg-orange-500/15 text-orange-300' },
  critique: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25',    bar: '#ef4444', badge: 'bg-red-500/15 text-red-300' },
};

const categoryColors: Record<string, string> = {
  financier:      '#22c55e',
  comportemental: '#f59e0b',
  marché:         '#3b82f6',
  macro:          '#8b5cf6',
  client:         '#14b8a6',
};



// ── SHAP Waterfall ─────────────────────────────────────────────────────────────
function ShapWaterfall({ features, isRTL }: { features: ShapFeature[]; isRTL: boolean }) {
  const sorted = [...features].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
  const baseScore = 50;

  return (
    <div className="space-y-2">
      {/* Baseline */}
      <div className={`flex items-center gap-3 text-xs text-slate-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="w-44 shrink-0 text-right">Score de base</span>
        <div className="flex-1 flex items-center">
          <div className="relative h-6 flex-1 rounded bg-slate-800">
            <div className="absolute inset-y-0 flex items-center" style={{ left: `${baseScore}%`, transform: 'translateX(-50%)' }}>
              <div className="h-full w-0.5 bg-slate-500" />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-slate-500 text-[10px]">Base: {baseScore}</span>
          </div>
        </div>
      </div>

      {sorted.map((f, i) => {
        const barWidth = Math.abs(f.shapValue) * 200; // scale
        const isPos = f.shapValue > 0;
        const label = isRTL ? f.feature_ar : f.feature;
        return (
          <div key={i} className={`flex items-center gap-3 group ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-44 shrink-0 ${isRTL ? 'text-left' : 'text-right'}`}>
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-tight">{label}</span>
              <div className={`flex items-center gap-1 mt-0.5 ${isRTL ? 'flex-row-reverse' : 'justify-end'}`}>
                <span className="text-[10px] rounded-full border px-1.5 py-px font-medium" style={{ color: categoryColors[f.category] || '#22c55e', borderColor: (categoryColors[f.category] || '#22c55e') + '33', backgroundColor: (categoryColors[f.category] || '#22c55e') + '15' }}>
                  {f.category}
                </span>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              {/* Bar */}
              <div className="relative h-7 flex-1 rounded bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="absolute top-0 h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.min(barWidth, 100)}%`,
                    left: isPos ? '50%' : `calc(50% - ${Math.min(barWidth, 50)}%)`,
                    backgroundColor: isPos ? '#ef4444' : '#22c55e',
                    opacity: 0.75,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold ${isPos ? 'text-red-300' : 'text-green-300'}`}>
                    {isPos ? '+' : ''}{f.shapValue.toFixed(3)}
                  </span>
                </div>
              </div>
              {/* Actual value */}
              <div className="w-28 shrink-0">
                <span className="text-xs text-slate-400 font-mono">{f.actualValue}</span>
              </div>
              {/* Impact icon */}
              {isPos
                ? <ArrowUpRight className="h-4 w-4 text-red-400 shrink-0" />
                : <ArrowDownRight className="h-4 w-4 text-green-400 shrink-0" />
              }
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className={`mt-3 flex items-center gap-4 text-xs ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
        <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-3 w-6 rounded-sm bg-red-500/60" />
          <span className="text-slate-500">Augmente le risque</span>
        </div>
        <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-3 w-6 rounded-sm bg-green-500/60" />
          <span className="text-slate-500">Réduit le risque</span>
        </div>
      </div>
    </div>
  );
}

// ── Score Gauge ────────────────────────────────────────────────────────────────
function ScoreGauge({ score, riskLevel }: { score: number; riskLevel: XaiDecision['riskLevel'] }) {
  const rc = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.moyen;
  const angle = (score / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-48">
        {/* Background arc */}
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {/* Risk zones */}
        <path d="M 10 65 A 50 50 0 0 1 43 25" fill="none" stroke="#22c55e40" strokeWidth="10" strokeLinecap="round" />
        <path d="M 43 25 A 50 50 0 0 1 77 25" fill="none" stroke="#f59e0b40" strokeWidth="10" strokeLinecap="round" />
        <path d="M 77 25 A 50 50 0 0 1 110 65" fill="none" stroke="#ef444440" strokeWidth="10" strokeLinecap="round" />
        {/* Needle */}
        <g transform={`rotate(${angle - 90}, 60, 65)`}>
          <line x1="60" y1="65" x2="60" y2="22" stroke={rc.bar} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="65" r="4" fill={rc.bar} />
        </g>
        {/* Score text */}
        <text x="60" y="58" textAnchor="middle" fill={rc.bar} fontSize="14" fontWeight="bold">{score}</text>
        <text x="60" y="68" textAnchor="middle" fill="#64748b" fontSize="5">/100</text>
      </svg>
      <div className="mt-1 flex gap-3 text-[9px] text-slate-600">
        <span className="text-green-600">Faible</span>
        <span className="text-amber-600">Moyen</span>
        <span className="text-red-600">Critique</span>
      </div>
    </div>
  );
}

// ── Decision Card ──────────────────────────────────────────────────────────────
function DecisionCard({ decision, isSelected, onSelect, lang, isRTL }: {
  decision: XaiDecision; isSelected: boolean; onSelect: () => void; lang: string; isRTL: boolean;
}) {
  const rc = riskConfig[decision.riskLevel as keyof typeof riskConfig] || riskConfig.moyen;
  const typeIcons: Record<string, any> = { credit: User, fraude: AlertTriangle, marche: TrendingUp, liquidite: BarChart3 };
  const TypeIcon = typeIcons[decision.type] || Brain;
  const label = lang === 'ar' ? decision.label_ar : lang === 'en' ? decision.label_en : decision.label_fr;
  const decisionText = lang === 'ar' ? decision.decision_ar : lang === 'en' ? decision.decision_en : decision.decision_fr;

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border p-5 text-left transition-all ${isRTL ? 'text-right' : ''} ${
        isSelected ? `${rc.border} ${rc.bg} shadow-[0_0_20px_rgba(0,0,0,0.3)]` : 'border-white/5 bg-slate-900/40 backdrop-blur-sm hover:border-white/10 hover:bg-slate-900/60'
      }`}
    >
      <div className={`flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-start gap-3 flex-1 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${rc.bg} border ${rc.border}`}>
            <TypeIcon className={`h-4 w-4 ${rc.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className="text-sm font-semibold text-white">{label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${rc.badge} ${rc.border}`}>
                {decision.riskLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{decision.entity}</p>
            <p className={`text-xs mt-1 font-medium ${rc.color}`}>{decisionText}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-2xl font-black ${rc.color}`}>{decision.score}</p>
          <p className="text-[10px] text-slate-600">/ 100</p>
          <ChevronRight className={`h-4 w-4 text-slate-600 mx-auto mt-1 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
        </div>
      </div>
    </button>
  );
}

// ── Main XAI View ──────────────────────────────────────────────────────────────
export default function XaiView() {
  const { lang, isRTL } = useLang();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'shap' | 'counterfactual' | 'global' | 'fairness' | 'history'>('shap');

  const [xaiDecisions, setXaiDecisions] = useState<XaiDecision[]>([]);
  const [globalFeatureImportance, setGlobalFeatureImportance] = useState<GlobalFeatureImportance[]>([]);
  const [modelFairness, setModelFairness] = useState<ModelFairness[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistoryItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const fetchXaiData = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/xai/decisions`).then(r => r.json()).then(data => {
      setXaiDecisions(data);
      if (data.length > 0 && !selectedDecisionId) {
        setSelectedDecisionId(data[0].id);
      }
    }).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/api/xai/feature-importance`).then(r => r.json()).then(setGlobalFeatureImportance).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/api/xai/model-fairness`).then(r => r.json()).then(setModelFairness).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/api/xai/decision-history`).then(r => r.json()).then(setDecisionHistory).catch(() => {});
  };

  useEffect(() => {
    fetchXaiData();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/xai/generate`, { method: 'POST' });
      const result = await resp.json();
      if (result.status === 'ok' || result.decisions > 0) {
        setLastGenerated(new Date().toLocaleTimeString());
        // Re-fetch all data
        fetchXaiData();
      }
    } catch (err) {
      console.error('XAI generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const t = (fr: string, ar: string, en: string) => lang === 'ar' ? ar : lang === 'en' ? en : fr;

  const selected = xaiDecisions.find(d => d.id === selectedDecisionId) || xaiDecisions[0];
  const rc = selected ? (riskConfig[selected.riskLevel as keyof typeof riskConfig] || riskConfig.moyen) : riskConfig.moyen;

  const getExplanation = (d: XaiDecision) =>
    lang === 'ar' ? d.naturalExplanation_ar : lang === 'en' ? d.naturalExplanation_en : d.naturalExplanation_fr;

  const tabs = [
    { id: 'shap',          icon: BarChart3,     label_fr: 'SHAP Values',       label_ar: 'قيم SHAP',        label_en: 'SHAP Values' },
    { id: 'counterfactual',icon: Lightbulb,     label_fr: 'Contre-Factuels',   label_ar: 'السيناريوهات',    label_en: 'Counter-Factuals' },
    { id: 'global',        icon: Eye,           label_fr: 'Importance Globale', label_ar: 'الأهمية العامة',  label_en: 'Global Importance' },
    { id: 'fairness',      icon: Scale,         label_fr: 'Équité du Modèle',  label_ar: 'عدالة النموذج',   label_en: 'Model Fairness' },
    { id: 'history',       icon: Clock,         label_fr: 'Historique',        label_ar: 'السجل',           label_en: 'History' },
  ];

  const getLabel = (item: { label_fr: string; label_ar: string; label_en: string }) =>
    lang === 'ar' ? item.label_ar : lang === 'en' ? item.label_en : item.label_fr;

  // Format explanation text with **bold** support
  const formatExplanation = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-green-400 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });

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
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      {/* ── Header banner ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 border border-green-500/30">
            <Brain className="h-5 w-5 text-green-400" />
          </div>
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <h2 className="text-lg font-bold text-white">
              {t('Tableau de Bord XAI — Intelligence Artificielle Explicable', 'لوحة الذكاء الاصطناعي القابل للتفسير (XAI)', 'Explainable AI (XAI) Dashboard')}
            </h2>
            <p className="text-sm text-slate-400">
              {t('Explications claires et transparentes pour les Risk Managers — Conformité BCBS 239 & CRD V',
                'تفسيرات شفافة وواضحة لمديري المخاطر — متوافق مع BCBS 239 و CRD V',
                'Clear, transparent explanations for Risk Managers — BCBS 239 & CRD V compliant')}
            </p>
          </div>
          <div className={`flex items-center gap-2 shrink-0 flex-wrap ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                generating
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:from-green-500 hover:to-emerald-400'
              }`}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t('Analyse en cours...', 'جاري التحليل...', 'Analyzing...')}</>
              ) : (
                <><Zap className="h-4 w-4" />{t('Générer l\'analyse XAI', 'توليد تحليل XAI', 'Generate XAI Analysis')}</>
              )}
            </button>
            {lastGenerated && (
              <span className="text-[10px] text-slate-500">{t('Dernière analyse', 'آخر تحليل', 'Last analysis')}: {lastGenerated}</span>
            )}
            <div className={`flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs font-medium text-green-400">BCBS 239</span>
            </div>
            <div className={`flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs font-medium text-green-400">CRD V</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Empty state */}
      {xaiDecisions.length === 0 && !generating && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-12 text-center">
          <Brain className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            {t('Aucune analyse XAI disponible', 'لا يوجد تحليل XAI متاح', 'No XAI analysis available')}
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {t(
              'Cliquez sur "Générer l\'analyse XAI" pour analyser vos données de fraude et de risque portefeuille en temps réel.',
              'انقر على "توليد تحليل XAI" لتحليل بيانات الاحتيال ومخاطر المحفظة في الوقت الفعلي.',
              'Click "Generate XAI Analysis" to analyze your fraud and portfolio risk data in real-time.'
            )}
          </p>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 mx-auto rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:from-green-500 hover:to-emerald-400 transition-all"
          >
            <Zap className="h-5 w-5" />
            {t('Générer l\'analyse XAI', 'توليد تحليل XAI', 'Generate XAI Analysis')}
          </button>
        </motion.div>
      )}

      {/* Loading state */}
      {generating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md p-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            <div className="text-left">
              <p className="text-sm font-bold text-emerald-400">
                {t('Moteur XAI en cours d\'exécution...', 'محرك XAI قيد التشغيل...', 'XAI Engine running...')}
              </p>
              <p className="text-xs text-slate-400">
                {t(
                  'Lecture des données de fraude et risque → Calcul SHAP → Génération des explications',
                  'قراءة بيانات الاحتيال والمخاطر → حساب SHAP → توليد التفسيرات',
                  'Reading fraud & risk data → Computing SHAP → Generating explanations'
                )}
              </p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </motion.div>
      )}

      {/* Main content — only show when we have data */}
      {selected && xaiDecisions.length > 0 && (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── LEFT: Decision selector ─────────────────────────────────── */}
        <motion.div variants={itemVariants} className="space-y-4">
          <p className={`text-xs font-semibold uppercase tracking-wider text-slate-500 px-1 ${isRTL ? 'text-right' : ''}`}>
            {t('Décisions Analysées', 'القرارات المحللة', 'Analyzed Decisions')}
            <span className="ml-2 text-emerald-400">({xaiDecisions.length})</span>
          </p>
          <div className="max-h-[600px] overflow-y-auto space-y-3 pr-1 scrollbar-hide">
          {xaiDecisions.map(d => (
            <DecisionCard
              key={d.id}
              decision={d}
              isSelected={selectedDecisionId === d.id}
              onSelect={() => setSelectedDecisionId(d.id)}
              lang={lang}
              isRTL={isRTL}
            />
          ))}
          </div>

          {/* Model info */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5">
            <p className={`mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : ''}`}>
              {t('Info Modèle', 'معلومات النموذج', 'Model Info')}
            </p>
            <div className="space-y-2">
              {[
                { label: t('Modèle', 'النموذج', 'Model'), value: selected.model },
                { label: t('Confiance', 'الثقة', 'Confidence'), value: `${selected.confidence}%` },
                { label: t('Date', 'التاريخ', 'Date'), value: selected.timestamp },
                { label: t('Source', 'المصدر', 'Source'), value: selected.type === 'fraude' ? t('Détection Fraude', 'كشف الاحتيال', 'Fraud Detection') : t('Portefeuille Risques', 'محفظة المخاطر', 'Risk Portfolio') },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className="text-xs font-medium text-slate-300 text-right max-w-[60%] truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: XAI Details ──────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="xl:col-span-2 space-y-6">
          {/* Score + Decision */}
          <div className={`flex items-center gap-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(0,0,0,0.2)] ${isRTL ? 'flex-row-reverse' : ''}`}>
            <ScoreGauge score={selected.score} riskLevel={selected.riskLevel} />
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${rc.badge} ${rc.border}`}>{selected.riskLevel.toUpperCase()}</span>
                <span className="text-xs text-slate-500">{selected.entity}</span>
              </div>
              <p className={`mt-2 text-lg font-bold ${rc.color}`}>
                {lang === 'ar' ? selected.decision_ar : lang === 'en' ? selected.decision_en : selected.decision_fr}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t('Confiance du modèle', 'ثقة النموذج', 'Model confidence')}: <span className="font-bold text-green-400">{selected.confidence}%</span>
              </p>
            </div>
          </div>

          {/* Natural language explanation */}
          <div className={`rounded-2xl border border-emerald-500/10 bg-emerald-500/5 backdrop-blur-md p-6 shadow-[0_0_15px_rgba(16,185,129,0.05)]`}>
            <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MessageSquare className="h-4 w-4 text-green-400" />
              <p className="text-sm font-semibold text-white">
                {t('Explication en langage naturel', 'التفسير الطبيعي للنموذج', 'Model Natural Language Explanation')}
              </p>
            </div>
            <div className={`text-sm text-slate-300 leading-relaxed ${isRTL ? 'text-right' : ''}`}>
              {formatExplanation(getExplanation(selected))}
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex flex-wrap gap-1.5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all min-w-fit ${isRTL ? 'flex-row-reverse' : ''} ${
                    isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{getLabel(tab)}</span>
                </button>
              );
            })}
          </div>

          {/* ── SHAP WATERFALL ──────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
          {activeTab === 'shap' && (
            <motion.div 
              key="shap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <div className={`mb-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h3 className="text-sm font-semibold text-white">
                    {t('Contribution de chaque variable (SHAP Waterfall)', 'مساهمة كل متغير (SHAP Waterfall)', 'Feature Contribution (SHAP Waterfall)')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('Valeurs positives = augmente le risque, négatives = réduit le risque', 'القيم الإيجابية تزيد المخاطر، السلبية تخفضها', 'Positive values increase risk, negative decrease it')}
                  </p>
                </div>
              </div>
              {selected.shapFeatures && selected.shapFeatures.length > 0 ? (
                <ShapWaterfall features={selected.shapFeatures} isRTL={isRTL} />
              ) : (
                <p className="text-center text-sm text-slate-500 py-8">{t('Aucune donnée SHAP disponible pour cette décision', 'لا توجد بيانات SHAP متاحة لهذا القرار', 'No SHAP data available for this decision')}</p>
              )}
            </motion.div>
          )}

          {/* ── COUNTER-FACTUALS ─────────────────────────────────────────── */}
          {activeTab === 'counterfactual' && (
            <motion.div 
              key="counterfactual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="text-sm font-semibold text-white">
                  {t('Et si ? — Scénarios Contre-Factuels', 'ماذا لو؟ — السيناريوهات المضادة', 'What-If? — Counter-Factual Scenarios')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Actions concrètes pour améliorer le score de risque', 'الإجراءات التي يمكن اتخاذها لتحسين نتيجة القرار', 'Actions that could improve the decision outcome')}
                </p>
              </div>
              {(!selected.counterFactuals || selected.counterFactuals.length === 0) ? (
                <div className={`flex items-center gap-3 rounded-xl bg-green-500/5 border border-green-500/20 p-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                  <p className={`text-sm text-green-300 ${isRTL ? 'text-right' : ''}`}>
                    {t('Score de risque faible — aucune action corrective nécessaire', 'درجة المخاطر منخفضة — لا حاجة لإجراءات تصحيحية', 'Low risk score — no corrective actions needed')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selected.counterFactuals.map((cf, i) => {
                    const action = lang === 'ar' ? cf.action_ar : lang === 'en' ? cf.action_en : cf.action_fr;
                    const feasColors: Record<string, string> = { facile: 'text-green-400 bg-green-500/10 border-green-500/20', moyen: 'text-amber-400 bg-amber-500/10 border-amber-500/20', difficile: 'text-red-400 bg-red-500/10 border-red-500/20' };
                    return (
                      <div key={i} className={`flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/40 p-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-300">
                          {i + 1}
                        </div>
                        <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                          <p className="text-sm font-medium text-slate-200">{action}</p>
                          <div className={`mt-1.5 flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${feasColors[cf.feasibility] || feasColors.moyen}`}>
                              {lang === 'ar' ? (cf.feasibility === 'facile' ? 'سهل' : cf.feasibility === 'moyen' ? 'متوسط' : 'صعب') : lang === 'en' ? (cf.feasibility === 'facile' ? 'Easy' : cf.feasibility === 'moyen' ? 'Moderate' : 'Difficult') : cf.feasibility}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xl font-black text-green-400">{cf.impact} pts</p>
                          <p className="text-[10px] text-slate-500">
                            {t('réduction score', 'تخفيض النقاط', 'score reduction')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── GLOBAL IMPORTANCE ─────────────────────────────────────── */}
          {activeTab === 'global' && (
            <motion.div 
              key="global"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="text-sm font-semibold text-white">
                  {t('Importance Globale des Variables', 'الأهمية العالمية للمتغيرات', 'Global Feature Importance')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Variables les plus influentes sur l\'ensemble des décisions', 'المتغيرات الأكثر تأثيراً عبر جميع القرارات', 'Most impactful features across all decisions')}
                </p>
              </div>
              {globalFeatureImportance.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">{t('Aucune donnée disponible', 'لا توجد بيانات متاحة', 'No data available')}</p>
              ) : (
              <div className="space-y-2.5">
                {globalFeatureImportance.map((f, i) => {
                  const featureName = lang === 'ar' ? f.feature_ar : f.feature;
                  return (
                    <div key={i} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-36 shrink-0 ${isRTL ? 'text-left' : 'text-right'}`}>
                        <span className="text-xs text-slate-300 leading-tight">{featureName}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-6 rounded bg-slate-900 border border-slate-800 overflow-hidden relative">
                          <div
                            className="absolute inset-y-0 left-0 rounded transition-all duration-700"
                            style={{ width: `${f.importance}%`, backgroundColor: categoryColors[f.category.toLowerCase()] || '#22c55e', opacity: 0.7 }}
                          />
                          <div className="absolute inset-0 flex items-center px-2">
                            <span className="text-xs font-bold text-white">{f.importance}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 w-20 shrink-0">
                          <span className="rounded-full border px-1.5 py-px text-[9px] font-medium" style={{ color: categoryColors[f.category.toLowerCase()] || '#22c55e', borderColor: (categoryColors[f.category.toLowerCase()] || '#22c55e') + '33' }}>
                            {f.category}
                          </span>
                          {f.trend === 'up' ? <TrendingUp className="h-3 w-3 text-red-400" /> : f.trend === 'down' ? <TrendingDown className="h-3 w-3 text-green-400" /> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </motion.div>
          )}

          {/* ── FAIRNESS ──────────────────────────────────────────────── */}
          {activeTab === 'fairness' && (
            <motion.div 
              key="fairness"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="text-sm font-semibold text-white">
                  {t('Équité du Modèle — Analyse des Biais', 'عدالة النموذج — تحليل التحيز', 'Model Fairness — Bias Analysis')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Performance du modèle selon les segments', 'أداء النموذج عبر مختلف الفئات', 'Model performance across different groups')}
                </p>
              </div>
              {modelFairness.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">{t('Aucune donnée disponible', 'لا توجد بيانات متاحة', 'No data available')}</p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Segment', 'Précision', 'Faux Positifs', 'Faux Négatifs', 'Volume', 'Équité'].map(h => (
                        <th key={h} className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modelFairness.map((g, i) => {
                      const groupName = lang === 'ar' ? g.group_ar : g.group;
                      const fairnessScore = 100 - (g.falsePositiveRate + g.falseNegativeRate);
                      const fairColor = fairnessScore > 90 ? 'text-green-400' : fairnessScore > 85 ? 'text-amber-400' : 'text-red-400';
                      return (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className={`px-3 py-2.5 text-sm font-medium text-slate-200 ${isRTL ? 'text-right' : ''}`}>{groupName}</td>
                          <td className="px-3 py-2.5">
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
                                <div className="h-full rounded-full bg-green-500" style={{ width: `${g.accuracy}%` }} />
                              </div>
                              <span className={`text-sm font-bold ${g.accuracy >= 93 ? 'text-green-400' : g.accuracy >= 90 ? 'text-amber-400' : 'text-red-400'}`}>{g.accuracy}%</span>
                            </div>
                          </td>
                          <td className={`px-3 py-2.5 text-sm font-mono ${g.falsePositiveRate > 6 ? 'text-red-400' : 'text-amber-400'}`}>{g.falsePositiveRate}%</td>
                          <td className={`px-3 py-2.5 text-sm font-mono ${g.falseNegativeRate > 6 ? 'text-red-400' : 'text-amber-400'}`}>{g.falseNegativeRate}%</td>
                          <td className="px-3 py-2.5 text-sm text-slate-400">{g.count.toLocaleString()}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-sm font-black ${fairColor}`}>{fairnessScore.toFixed(1)}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </motion.div>
          )}

          {/* ── HISTORY ───────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6"
            >
              <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="text-sm font-semibold text-white">
                  {t('Historique des Décisions', 'سجل القرارات', 'Decision History')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Toutes les décisions IA avec piste d\'audit complète', 'جميع قرارات الذكاء الاصطناعي مع إمكانية المراجعة', 'All AI decisions with audit trail')}
                </p>
              </div>
              {decisionHistory.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">{t('Aucun historique disponible', 'لا يوجد سجل متاح', 'No history available')}</p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['ID', 'Date', 'Entité', 'Type', 'Score', 'Décision', 'Analyste', 'Statut'].map(h => (
                        <th key={h} className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {decisionHistory.map((d, i) => {
                      const rc2 = riskConfig[d.riskLevel as keyof typeof riskConfig] || riskConfig.moyen;
                      return (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer">
                          <td className="px-3 py-2.5 font-mono text-xs text-green-400 max-w-[100px] truncate">{d.id}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{d.date}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-200 max-w-[140px] truncate">{d.entity}</td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400">{d.type}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-sm font-black ${rc2.color}`}>{d.score}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${rc2.badge} ${rc2.border}`}>{d.decision}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{d.analyst}</td>
                          <td className="px-3 py-2.5">
                            {d.validated ? (
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                <span className="text-[10px] text-green-400">{t('Validé', 'مُراجع', 'Validated')}</span>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Clock className="h-3.5 w-3.5 text-amber-400" />
                                <span className="text-[10px] text-amber-400">{t('En attente', 'في الانتظار', 'Pending')}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </div>
      )}
    </motion.div>
  );
}
