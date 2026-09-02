import { useState, useEffect, useRef } from 'react';
import {
  ShieldOff, AlertTriangle, CheckCircle2,
  Eye, TrendingUp, Flame, Car, Droplets,
  User, Building2, FileSearch, ChevronRight, Radio,
  ArrowUpRight, ArrowDownRight,
  CreditCard, Activity, UploadCloud,
} from 'lucide-react';
import {
  scoreBankingFraud, scoreSinistreFraud,
  SCENARIOS_BANKING, SCENARIOS_SINISTRES,
  PAYS_LIST, WILAYAS_DZ,
  type TransactionInput, type SinistreInput,
  type FraudResult, type SinistreType,
} from '../data/fraudData';
import { useLang } from '../i18n/LangContext';
import BulkTestPanel from '../components/BulkTestPanel';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const decisionCfg = {
  approved: { label_fr: 'Approuvé',         label_ar: 'موافق عليه',    label_en: 'Approved',        color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/30',  ring: '#10b981' },
  review:   { label_fr: 'Revue manuelle',   label_ar: 'مراجعة يدوية',  label_en: 'Manual review',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  ring: '#f59e0b' },
  blocked:  { label_fr: 'Bloqué',           label_ar: 'محظور',         label_en: 'Blocked',          color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    ring: '#f43f5e' },
};
const severityCfg = {
  low:      { dot: 'bg-slate-500', label: 'Faible',   label_ar: 'منخفض',   label_en: 'Low' },
  medium:   { dot: 'bg-amber-500', label: 'Moyen',    label_ar: 'متوسط',   label_en: 'Medium' },
  high:     { dot: 'bg-orange-500',label: 'Élevé',    label_ar: 'عالٍ',    label_en: 'High' },
  critical: { dot: 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]', label: 'Critique', label_ar: 'حرج', label_en: 'Critical' },
};

// ── Score Ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      {/* Zone labels */}
      <text x="64" y="56" textAnchor="middle" fill="white"     fontSize="26" fontWeight="900">{score}</text>
      <text x="64" y="72" textAnchor="middle" fill="#64748b"   fontSize="9"  fontWeight="600">/ 100 RISK</text>
    </svg>
  );
}

// ── Signal row ────────────────────────────────────────────────────────────────
function SignalRow({ sig, lang, isRTL }: { sig: any; lang: string; isRTL: boolean }) {
  const sc = severityCfg[sig.severity as keyof typeof severityCfg];
  const label = lang === 'ar' ? sig.label_ar : lang === 'en' ? sig.label_en : sig.label;
  const expl  = lang === 'ar' ? sig.explanation_ar : lang === 'en' ? sig.explanation_en : sig.explanation_fr;
  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${sc.dot}`} />
      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className={`text-xs font-semibold ${sig.detected ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
          {sig.detected && (
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              sig.severity === 'critical' ? 'bg-red-500/15 text-red-400' :
              sig.severity === 'high'     ? 'bg-orange-500/15 text-orange-400' :
              sig.severity === 'medium'   ? 'bg-amber-500/15 text-amber-400' :
              'bg-slate-500/15 text-slate-500'
            }`}>
              {lang === 'ar' ? sc.label_ar : lang === 'en' ? sc.label_en : sc.label}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{expl}</p>
      </div>
      <div className="shrink-0">
        {sig.detected
          ? <ArrowUpRight   className="h-4 w-4 text-red-400" />
          : <ArrowDownRight className="h-4 w-4 text-green-400" />
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BANKING ENGINE PANEL
// ═══════════════════════════════════════════════════════
function BankingPanel({ lang, isRTL }: { lang: string; isRTL: boolean }) {
  const [inp, setInp] = useState<TransactionInput>({
    montant: 4500, heure: 14, velocite: 1,
    pays: 'DZ', canal: 'E-commerce',
    device: 'Appareil de confiance', typeCompte: 'Courant',
  });
  const [result,    setResult]    = useState<FraudResult | null>(null);
  const [running,   setRunning]   = useState(false);
  const [latency,   setLatency]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live scoring with debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(true);
    
    timerRef.current = setTimeout(async () => {
      try {
        const payload = {
          client_id: 0,
          amount: inp.montant,
          transaction_hour: inp.heure,
          transaction_type: "payment", 
          country: inp.pays,
          channel: inp.canal,
          amount_deviation: 0,
          daily_txn_count: inp.velocite
        };
        const res = await fetch('/api/predict/fraud/banking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const r = await res.json();
        setResult(r);
        setLatency(r.latencyMs || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setRunning(false);
      }
    }, 420);
    
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [inp]);

  const applyScenario = (sc: typeof SCENARIOS_BANKING[0]) => setInp({ ...sc.input } as TransactionInput);
  const dc = result ? decisionCfg[result.decision] : null;
  const ringColor = result ? dc!.ring : '#334155';

  const t = (fr: string, ar: string, en: string) => lang === 'ar' ? ar : lang === 'en' ? en : fr;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* ── LEFT: inputs ──────────────────────────────────── */}
      <div className="space-y-5">
        {/* Scenario buttons */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {t('Scénarios prédéfinis', 'سيناريوهات محددة مسبقاً', 'Preset scenarios')}
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS_BANKING.map(sc => (
              <button key={sc.id} onClick={() => applyScenario(sc)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${sc.border} ${sc.color} bg-slate-900/50 hover:bg-slate-800`}>
                <ChevronRight className="h-3 w-3" />
                {lang === 'ar' ? sc.label_ar : lang === 'en' ? sc.label_en : sc.label_fr}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs grid */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 space-y-4">
          {/* Montant */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('Montant (DZD)', 'المبلغ (دج)', 'Amount (DZD)')} · {inp.montant.toLocaleString('fr-DZ')}
            </label>
            <input type="number" value={inp.montant} min={100} max={5000000}
              onChange={e => setInp(p => ({ ...p, montant: +e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm font-mono text-green-400 outline-none focus:border-green-500 transition-colors" />
          </div>

          {/* Heure + Vélocité */}
          <div className="grid grid-cols-2 gap-3">
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('Heure (0-23)', 'الساعة (0-23)', 'Hour (0-23)')} · {inp.heure}h
              </label>
              <input type="range" min={0} max={23} value={inp.heure}
                onChange={e => setInp(p => ({ ...p, heure: +e.target.value }))}
                className="w-full h-2 accent-green-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>0h</span><span>12h</span><span>23h</span>
              </div>
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('Vélocité', 'التكرار', 'Velocity')} · {inp.velocite} tx/h
              </label>
              <input type="range" min={1} max={25} value={inp.velocite}
                onChange={e => setInp(p => ({ ...p, velocite: +e.target.value }))}
                className="w-full h-2 accent-green-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>1</span><span>12</span><span>25</span>
              </div>
            </div>
          </div>

          {/* Pays + Canal */}
          <div className="grid grid-cols-2 gap-3">
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('Pays d\'émission', 'بلد الإصدار', "Issuing country")}
              </label>
              <select value={inp.pays} onChange={e => setInp(p => ({ ...p, pays: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none focus:border-green-500">
                {PAYS_LIST.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('Canal', 'القناة', 'Channel')}
              </label>
              <select value={inp.canal} onChange={e => setInp(p => ({ ...p, canal: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none focus:border-green-500">
                {['E-commerce','Mobile Banking','ATM','Virement','Chèque','Paiement TPE'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Device */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('Empreinte Device', 'بصمة الجهاز', 'Device fingerprint')}
            </label>
            <select value={inp.device} onChange={e => setInp(p => ({ ...p, device: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none focus:border-green-500">
              {['Appareil de confiance','Nouveau device','Inconnu','VPN détecté','Emulateur détecté'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── RIGHT: output ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Score ring */}
        <div className={`rounded-2xl border ${dc?.border ?? 'border-white/5'} bg-slate-900/40 backdrop-blur-md p-6`}>
          <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="shrink-0 relative">
              <ScoreRing score={result?.score ?? 0} color={ringColor} />
              {running && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5">
                  <Radio className="h-2.5 w-2.5 text-green-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-green-400">LIVE INFERENCE</span>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('Risk Score · Output', 'درجة المخاطر · الناتج', 'Risk Score · Output')}
              </p>
              {result && dc && (
                <>
                  <div className={`flex items-center gap-2 rounded-lg border ${dc.border} ${dc.bg} px-3 py-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {result.decision === 'approved' && <CheckCircle2 className={`h-4 w-4 shrink-0 ${dc.color}`} />}
                    {result.decision === 'review'   && <AlertTriangle className={`h-4 w-4 shrink-0 ${dc.color}`} />}
                    {result.decision === 'blocked'  && <ShieldOff     className={`h-4 w-4 shrink-0 ${dc.color}`} />}
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className={`text-sm font-black ${dc.color}`}>
                        {lang === 'ar' ? dc.label_ar : lang === 'en' ? dc.label_en : dc.label_fr}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {t('Décision recommandée', 'القرار الموصى به', 'Recommended decision')} · {latency}ms
                      </p>
                    </div>
                  </div>
                  <div className={`mt-2 flex items-center gap-3 text-xs text-slate-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span>{result.modelUsed}</span>
                    <span>·</span>
                    <span className="text-green-500">{result.confidence}% {t('confiance','ثقة','confidence')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Signals XAI */}
        {result && (
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('Signaux détectés (XAI)', 'الإشارات المكتشفة (XAI)', 'Detected signals (XAI)')}
            </p>
            <div>
              {result.signals.map((sig, i) => (
                <SignalRow key={i} sig={sig} lang={lang} isRTL={isRTL} />
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {result && (
          <div className={`rounded-xl border border-slate-700 bg-slate-900/40 p-4 ${isRTL ? 'text-right' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t('Explication IA', 'تفسير الذكاء الاصطناعي', 'AI Explanation')}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {lang === 'ar' ? result.explanation_ar : lang === 'en' ? result.explanation_en : result.explanation_fr}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// INSURANCE / SINISTRES PANEL
// ═══════════════════════════════════════════════════════
function SinistresPanel({ lang, isRTL }: { lang: string; isRTL: boolean }) {
  const [inp, setInp] = useState<SinistreInput>({
    type: 'incendie', montantDeclare: 850000, delaiDeclaration: 2,
    nbSinistresAnt: 0, ancienneteContrat: 36, wilaya: 'Alger',
    heureSinistre: 15, temoins: true, expertDemande: true,
    docComplets: true, coherenceRecit: 9, valeurBienDeclare: 4200000,
    typeHabitation: 'Appartement', antecedentJudiciaire: false,
  });
  const [result,  setResult]  = useState<FraudResult | null>(null);
  const [latency, setLatency] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(true);
    
    timerRef.current = setTimeout(async () => {
      try {
        const payload = {
          montantDeclare: inp.montantDeclare,
          delaiDeclaration: inp.delaiDeclaration,
          type: inp.type,
          historiqueSinistres: inp.nbSinistresAnt,
          rapportPolice: inp.docComplets ? "oui" : "non"
        };
        const res = await fetch('/api/predict/fraud/insurance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const r = await res.json();
        setResult(r);
        setLatency(r.latencyMs || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setRunning(false);
      }
    }, 480);
    
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [inp]);

  const applyScenario = (sc: typeof SCENARIOS_SINISTRES[0]) => setInp({ ...sc.input });
  const dc = result ? decisionCfg[result.decision] : null;

  const typeIcons: Record<SinistreType, any> = {
    vol: ShieldOff, incendie: Flame, accident: Car, degat_eaux: Droplets, corporel: User,
  };
  const TypeIcon = typeIcons[inp.type];

  const t2 = (fr: string, ar: string, en: string) => lang === 'ar' ? ar : lang === 'en' ? en : fr;

  const Toggle = ({ val, onToggle, label }: { val: boolean; onToggle: () => void; label: string }) => (
    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
      <span className="text-xs text-slate-400">{label}</span>
      <button onClick={onToggle}
        className={`relative h-5 w-9 rounded-full transition-colors ${val ? 'bg-green-500' : 'bg-slate-700'}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* ── LEFT: inputs ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Scenario buttons */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {t2('Scénarios sinistres', 'سيناريوهات الحوادث', 'Claim scenarios')}
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS_SINISTRES.map(sc => (
              <button key={sc.id} onClick={() => applyScenario(sc)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${sc.border} ${sc.color} bg-slate-900/50 hover:bg-slate-800`}>
                <ChevronRight className="h-3 w-3" />
                {lang === 'ar' ? sc.label_ar : lang === 'en' ? sc.label_en : sc.label_fr}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 space-y-4">
          {/* Type sinistre */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t2('Type de sinistre', 'نوع الحادث', 'Claim type')}
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['vol','incendie','accident','degat_eaux','corporel'] as SinistreType[]).map(type => {
                const Icon = typeIcons[type];
                const labels: Record<SinistreType,string[]> = {
                  vol: ['Vol','سرقة','Theft'], incendie: ['Incendie','حريق','Fire'],
                  accident: ['Accident','حادث','Accident'], degat_eaux: ['Dégât eau','أضرار مائية','Water dmg'],
                  corporel: ['Corporel','جسدي','Bodily'],
                };
                return (
                  <button key={type} onClick={() => setInp(p => ({ ...p, type }))}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] font-medium transition-all ${
                      inp.type === type
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}>
                    <Icon className="h-4 w-4" />
                    {lang === 'ar' ? labels[type][1] : lang === 'en' ? labels[type][2] : labels[type][0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-3">
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t2('Montant déclaré (DZD)', 'المبلغ المطالب به', 'Claimed amount')}
              </label>
              <input type="number" value={inp.montantDeclare}
                onChange={e => setInp(p => ({ ...p, montantDeclare: +e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono text-green-400 outline-none focus:border-green-500" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t2('Valeur bien (DZD)', 'قيمة الأصل', 'Asset value')}
              </label>
              <input type="number" value={inp.valeurBienDeclare}
                onChange={e => setInp(p => ({ ...p, valeurBienDeclare: +e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono text-slate-300 outline-none focus:border-green-500" />
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t2('Délai déclaration', 'مهلة التصريح', 'Report delay')} · {inp.delaiDeclaration}j
              </label>
              <input type="range" min={0} max={30} value={inp.delaiDeclaration}
                onChange={e => setInp(p => ({ ...p, delaiDeclaration: +e.target.value }))}
                className="w-full h-2 accent-green-500" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t2('Sinistres antérieurs', 'سوابق الحوادث', 'Past claims')} · {inp.nbSinistresAnt}
              </label>
              <input type="range" min={0} max={6} value={inp.nbSinistresAnt}
                onChange={e => setInp(p => ({ ...p, nbSinistresAnt: +e.target.value }))}
                className="w-full h-2 accent-green-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t2('Ancienneté contrat', 'أقدمية العقد', 'Contract age')} · {inp.ancienneteContrat}m
              </label>
              <input type="range" min={1} max={120} value={inp.ancienneteContrat}
                onChange={e => setInp(p => ({ ...p, ancienneteContrat: +e.target.value }))}
                className="w-full h-2 accent-green-500" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t2('Cohérence récit', 'تماسك الرواية', 'Story coherence')} · {inp.coherenceRecit}/10
              </label>
              <input type="range" min={1} max={10} value={inp.coherenceRecit}
                onChange={e => setInp(p => ({ ...p, coherenceRecit: +e.target.value }))}
                className="w-full h-2 accent-green-500" />
            </div>
          </div>

          {/* Wilaya + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Wilaya</label>
              <select value={inp.wilaya} onChange={e => setInp(p => ({ ...p, wilaya: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none focus:border-green-500">
                {WILAYAS_DZ.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t2('Heure sinistre', 'ساعة الحادث', 'Incident time')} · {inp.heureSinistre}h
              </label>
              <input type="range" min={0} max={23} value={inp.heureSinistre}
                onChange={e => setInp(p => ({ ...p, heureSinistre: +e.target.value }))}
                className="w-full h-2 accent-green-500" />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-1 border-t border-slate-800">
            <Toggle val={inp.temoins}            onToggle={() => setInp(p=>({...p, temoins: !p.temoins}))}            label={t2('Témoins présents','شهود موجودون','Witnesses present')} />
            <Toggle val={inp.expertDemande}      onToggle={() => setInp(p=>({...p, expertDemande: !p.expertDemande}))} label={t2('Expert demandé','خبير مطلوب','Expert requested')} />
            <Toggle val={inp.docComplets}        onToggle={() => setInp(p=>({...p, docComplets: !p.docComplets}))}     label={t2('Documents complets','وثائق مكتملة','Complete documents')} />
            <Toggle val={inp.antecedentJudiciaire} onToggle={() => setInp(p=>({...p, antecedentJudiciaire: !p.antecedentJudiciaire}))} label={t2('Antécédent judiciaire','سوابق قضائية','Criminal record')} />
          </div>
        </div>
      </div>

      {/* ── RIGHT: output ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Score + decision */}
        <div className={`rounded-2xl border ${dc?.border ?? 'border-white/5'} bg-slate-900/40 backdrop-blur-md p-6`}>
          <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="shrink-0 relative">
              <ScoreRing score={result?.score ?? 0} color={dc?.ring ?? '#334155'} />
              {running && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 w-fit mb-2 ${isRTL ? 'flex-row-reverse ml-auto' : ''}`}>
                <Radio className="h-2.5 w-2.5 text-green-400 animate-pulse" />
                <span className="text-[10px] font-bold text-green-400">LIVE · ASSURANCE DZ</span>
              </div>
              <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <TypeIcon className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase">
                  {inp.type} — {inp.wilaya}
                </span>
              </div>
              {result && dc && (
                <>
                  <div className={`flex items-center gap-2 rounded-lg border ${dc.border} ${dc.bg} px-3 py-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {result.decision === 'approved' && <CheckCircle2 className={`h-4 w-4 shrink-0 ${dc.color}`} />}
                    {result.decision === 'review'   && <AlertTriangle className={`h-4 w-4 shrink-0 ${dc.color}`} />}
                    {result.decision === 'blocked'  && <ShieldOff     className={`h-4 w-4 shrink-0 ${dc.color}`} />}
                    <div>
                      <p className={`text-sm font-black ${dc.color}`}>
                        {lang === 'ar' ? dc.label_ar : lang === 'en' ? dc.label_en : dc.label_fr}
                      </p>
                      <p className="text-[10px] text-slate-500">{latency}ms · {result.confidence}% {t2('confiance','ثقة','confidence')}</p>
                    </div>
                  </div>
                  <p className={`mt-2 text-xs text-slate-500 ${isRTL ? 'text-right' : ''}`}>{result.modelUsed}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Signals */}
        {result && (
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t2('Facteurs de risque détectés (XAI)', 'عوامل الخطر المكتشفة', 'Detected risk factors (XAI)')}
            </p>
            {result.signals.map((sig, i) => <SignalRow key={i} sig={sig} lang={lang} isRTL={isRTL} />)}
          </div>
        )}

        {/* Explanation */}
        {result && (
          <div className={`rounded-xl border border-slate-700 bg-slate-900/40 p-4 ${isRTL ? 'text-right' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t2('Analyse IA du sinistre', 'تحليل الذكاء الاصطناعي للحادث', 'AI claim analysis')}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {lang === 'ar' ? result.explanation_ar : lang === 'en' ? result.explanation_en : result.explanation_fr}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════
interface FraudHistoryRecord {
  id: string;
  date: string;
  type: string;
  sousType: string;
  entite: string;
  score: number;
  decision: 'approved' | 'review' | 'blocked';
  montant: string;
  analyste: string;
  details?: any;
}

export default function FraudEngineView() {
  const { lang, isRTL } = useLang();
  const [activeTab, setActiveTab] = useState<'banking' | 'assurance' | 'historique' | 'bulk_test'>('banking');
  const [fraudHistory, setFraudHistory] = useState<FraudHistoryRecord[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState({ totalAnalyses: 0, blocked: 0, review: 0, detectionRate: '0%' });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/fraud-stats`)
      .then(r => r.json())
      .then(setGlobalStats)
      .catch(err => console.error("Error fetching global stats", err));
  }, []);

  useEffect(() => {
    if (activeTab === 'historique') {
      fetch(`${import.meta.env.VITE_API_URL}/api/fraud-history`)
        .then(r => r.json())
        .then(setFraudHistory)
        .catch(err => console.error("Error fetching history", err));
    }
  }, [activeTab]);

  const t = (fr: string, ar: string, en: string) => lang === 'ar' ? ar : lang === 'en' ? en : fr;

  const tabs = [
    { id: 'banking',    icon: CreditCard,  label_fr: 'Fraude Bancaire',   label_ar: 'الاحتيال البنكي',  label_en: 'Banking Fraud' },
    { id: 'assurance',  icon: Building2,   label_fr: 'Fraude Assurance',  label_ar: 'احتيال التأمين',   label_en: 'Insurance Fraud' },
    { id: 'historique', icon: FileSearch,  label_fr: 'Historique',        label_ar: 'السجل',            label_en: 'History' },
    { id: 'bulk_test',  icon: UploadCloud, label_fr: 'Test en Masse',     label_ar: 'اختبار جماعي',     label_en: 'Bulk Test' },
  ];

  // Live stats
  const stats = [
    { label: t('Analyses','تحليل','Analyses'), value: globalStats.totalAnalyses.toLocaleString(),  color: 'text-green-400',  border: 'border-green-500/20', bg: 'from-green-500/10',  icon: Activity },
    { label: t('Fraudes bloquées','احتيال محظور','Fraud blocked'),  value: globalStats.blocked.toLocaleString(),     color: 'text-red-400',    border: 'border-red-500/20',   bg: 'from-red-500/10',    icon: ShieldOff },
    { label: t('En investigation','قيد التحقيق','Under review'),    value: globalStats.review.toLocaleString(),      color: 'text-amber-400',  border: 'border-amber-500/20', bg: 'from-amber-500/10',  icon: Eye },
    { label: t('Taux détection','معدل الكشف','Detection rate'),    value: globalStats.detectionRate,  color: 'text-emerald-400',border: 'border-emerald-500/20',bg: 'from-emerald-500/10',icon: TrendingUp },
  ];

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

      {/* ── Header banner ───────────────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-8 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.05)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.15)_0%,_transparent_60%)] pointer-events-none" />
        <div className={`relative flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400">LIVE · INFÉRENCE EN TEMPS RÉEL</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {t('Moteur ', 'محرك ', 'Engine ')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{t('Anti-Fraude IA','مكافحة الاحتيال بالذكاء الاصطناعي','Anti-Fraud AI')}</span>
            </h1>
            <p className="mt-2 text-[15px] text-slate-300 max-w-lg leading-relaxed">
              {t(
                'Analyse en temps réel des transactions et sinistres. Le score de risque est calculé instantanément par notre moteur d\'inférence IA.',
                'تحليل في الوقت الفعلي للمعاملات وحوادث التأمين. يتم حساب درجة المخاطر فوراً بواسطة محرك الذكاء الاصطناعي.',
                'Real-time analysis of transactions and claims. The risk score is calculated instantly by our AI inference engine.'
              )}
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Powered by</span>
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">RiskVisionAI</span>
            <span className="text-[11px] font-medium text-slate-400">XGBoost · LSTM · Autoencodeur</span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI strip ────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          // map legacy colors
          const colorStr = s.color.replace('green', 'cyan').replace('red', 'rose').replace('emerald', 'emerald');
          const borderStr = s.border.replace('green', 'cyan').replace('red', 'rose').replace('emerald', 'emerald');
          const bgStr = s.bg.replace('green', 'cyan').replace('red', 'rose').replace('emerald', 'emerald');
          const colorName = colorStr.split('-')[1] || 'cyan';

          return (
            <div key={i} className={`rounded-2xl border ${borderStr} bg-slate-900/40 backdrop-blur-md bg-gradient-to-br ${bgStr} to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${colorName}-500/10`}>
              <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-1.5 rounded-lg bg-${colorName}-500/10`}>
                  <Icon className={`h-4 w-4 ${colorStr}`} />
                </div>
                <span className="text-[13px] font-bold text-slate-300">{s.label}</span>
              </div>
              <p className={`mt-3 text-3xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] text-white`}>{s.value}</p>
            </div>
          );
        })}
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className={`flex gap-2 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''} ${
                active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === 'ar' ? tab.label_ar : lang === 'en' ? tab.label_en : tab.label_fr}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Tab content ──────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {activeTab === 'banking'    && <BankingPanel   lang={lang} isRTL={isRTL} />}
        {activeTab === 'assurance'  && <SinistresPanel lang={lang} isRTL={isRTL} />}
        {activeTab === 'bulk_test'  && <BulkTestPanel  />}
      </motion.div>

      {/* ── Historique ───────────────────────────────────── */}
      {activeTab === 'historique' && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
          <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h3 className="text-lg font-bold text-white tracking-tight">{t('Historique des analyses','سجل التحليلات','Analysis history')}</h3>
            <div className={`flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)] ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400">Live</span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-800/30">
                  {['ID','Date','Type','Entité','Score','Recommandation','Montant','Analyste','Action'].map(h => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fraudHistory.map((item, i) => {
                  const dc2 = decisionCfg[item.decision as keyof typeof decisionCfg] || decisionCfg['review'];
                  return (
                    <tr key={i} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-[13px] font-bold text-emerald-400">{item.id}</td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-300 whitespace-nowrap">{item.date}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          item.type === 'banking' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                        }`}>{item.type === 'banking' ? (lang === 'ar' ? 'بنكي' : 'Bancaire') : (lang === 'ar' ? 'تأمين' : 'Assurance')}</span>
                        <p className="text-[11px] font-medium text-slate-400 mt-1.5">{item.sousType}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[14px] font-bold text-slate-200 max-w-[140px] truncate">{item.entite}</td>
                      <td className="px-4 py-3.5">
                        <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full" style={{ width:`${item.score}%`, backgroundColor: dc2.ring, boxShadow: `0 0 8px ${dc2.ring}80` }} />
                          </div>
                          <span className={`text-[13px] font-black ${dc2.color}`}>{item.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${dc2.bg} ${dc2.color} ${dc2.border}`}>
                          {lang === 'ar' ? dc2.label_ar : lang === 'en' ? dc2.label_en : dc2.label_fr}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-mono font-bold text-slate-300 whitespace-nowrap">{item.montant}</td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-slate-400">{item.analyste}</td>
                      <td className="px-4 py-3.5">
                        <button 
                          onClick={() => {
                            const parsedDetails = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
                            setSelectedDetails({ ...item, details: parsedDetails });
                          }} 
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.1)] transition font-bold text-[11px]"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">Profil Client : {selectedDetails.entite}</h3>
              <button onClick={() => setSelectedDetails(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto max-h-[70vh]">
               {selectedDetails.details ? (
                 <>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                     <h4 className="font-bold text-emerald-400 mb-3 uppercase text-[11px] tracking-wider">Informations Financières</h4>
                     <div className="space-y-1.5">
                       <p><span className="text-slate-400">Revenus:</span> <span className="font-medium text-slate-200">{selectedDetails.details.income} K DZD</span></p>
                       <p><span className="text-slate-400">Dette:</span> <span className="font-medium text-slate-200">{(parseFloat(selectedDetails.details.creddebt || '0') + parseFloat(selectedDetails.details.othdebt || '0')).toFixed(2)} K DZD</span></p>
                       <p><span className="text-slate-400">DTI:</span> <span className="font-medium text-slate-200">{selectedDetails.details.debtinc}%</span></p>
                       <p><span className="text-slate-400">Cashflow:</span> <span className="font-medium text-slate-200">{selectedDetails.details.cashflow || 'N/A'}</span></p>
                       <p><span className="text-slate-400">Historique bancaire:</span> <span className="font-medium text-slate-200">{selectedDetails.details.banking_history || 'N/A'}</span></p>
                       <p><span className="text-slate-400">Retard de paiement:</span> <span className="font-medium text-slate-200">{selectedDetails.details.default === '1' ? 'Oui' : 'Non'}</span></p>
                     </div>
                   </div>
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                     <h4 className="font-bold text-indigo-400 mb-3 uppercase text-[11px] tracking-wider">Données Cartes</h4>
                     <div className="space-y-1.5">
                       <p><span className="text-slate-400">Marque:</span> <span className="font-medium text-slate-200">{selectedDetails.details.card_brand}</span></p>
                       <p><span className="text-slate-400">Type:</span> <span className="font-medium text-slate-200">{selectedDetails.details.card_type}</span></p>
                       <p><span className="text-slate-400">Limite:</span> <span className="font-medium text-slate-200">{selectedDetails.details.credit_limit}</span></p>
                       <p><span className="text-slate-400">Puce Intégrée:</span> <span className="font-medium text-slate-200">{selectedDetails.details.has_chip}</span></p>
                       <p><span className="text-slate-400">Détectée Dark Web:</span> <span className={selectedDetails.details.card_on_dark_web === 'Yes' ? 'text-rose-400 font-bold' : 'font-medium text-slate-200'}>{selectedDetails.details.card_on_dark_web}</span></p>
                     </div>
                   </div>
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                     <h4 className="font-bold text-emerald-400 mb-3 uppercase text-[11px] tracking-wider">Situation Personnelle</h4>
                     <div className="space-y-1.5">
                       <p><span className="text-slate-400">Statut Marital:</span> <span className="font-medium text-slate-200">{selectedDetails.details.MaritalStatus}</span></p>
                       <p><span className="text-slate-400">Éducation:</span> <span className="font-medium text-slate-200">{selectedDetails.details.EducationLevel}</span></p>
                       <p><span className="text-slate-400">Emploi:</span> <span className="font-medium text-slate-200">{selectedDetails.details.EmploymentStatus}</span></p>
                       <p><span className="text-slate-400">Logement:</span> <span className="font-medium text-slate-200">{selectedDetails.details.HomeOwnershipStatus}</span></p>
                       <p><span className="text-slate-400">Faillite:</span> <span className="font-medium text-slate-200">{selectedDetails.details.BankruptcyHistory === '1' ? 'Oui' : 'Non'}</span></p>
                     </div>
                   </div>
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                     <h4 className="font-bold text-amber-400 mb-3 uppercase text-[11px] tracking-wider">Vérification Documents</h4>
                     <div className="space-y-1.5">
                       <p><span className="text-slate-400">Kashf Ratib:</span> <span className="font-medium text-slate-200">{selectedDetails.details.kashf_ratib === 'true' ? '✔' : '✘'}</span></p>
                       <p><span className="text-slate-400">Sijil Tijari:</span> <span className="font-medium text-slate-200">{selectedDetails.details.sijil_tijari === 'true' ? '✔' : '✘'}</span></p>
                       <p><span className="text-slate-400">Ouqoud:</span> <span className="font-medium text-slate-200">{selectedDetails.details.ouqoud === 'true' ? '✔' : '✘'}</span></p>
                       <p><span className="text-slate-400">Damanat:</span> <span className="font-medium text-slate-200">{selectedDetails.details.damanat === 'true' ? '✔' : '✘'}</span></p>
                       <p><span className="text-slate-400">Wathaiq Zoboun:</span> <span className="font-medium text-slate-200">{selectedDetails.details.wathaiq_zoboun === 'true' ? '✔' : '✘'}</span></p>
                     </div>
                   </div>
                 </div>
                 
                 {selectedDetails.details.ml_results && (
                   <div className="mt-5 bg-slate-900/60 p-5 rounded-xl border border-white/10">
                     <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                       <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                       Analyse IA (Python Engine)
                     </h4>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">Risque de Crédit</p>
                         <p className="font-medium text-slate-300">PD (Défaut): <span className={`font-black ${parseFloat(selectedDetails.details.ml_results.credit_risk.pd_percentage) > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedDetails.details.ml_results.credit_risk.pd_percentage}%</span></p>
                         <p className="font-medium text-slate-300">Perte Attendue: <span className="font-bold">{selectedDetails.details.ml_results.credit_risk.expected_loss.toLocaleString('fr-DZ')} DZD</span></p>
                       </div>
                       <div>
                         <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">Détection Fraude/Anomalie</p>
                         <p className="font-medium text-slate-300">Score de Fraude: <span className={`font-black ${selectedDetails.details.ml_results.fraud_analysis.overall_fraud_score >= 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedDetails.details.ml_results.fraud_analysis.overall_fraud_score}/100</span></p>
                       </div>
                     </div>
                     <div className="mt-4 p-4 bg-slate-950/50 rounded-xl border border-white/5">
                       <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">Décision Finale IA</p>
                       <p className={`font-black text-lg ${selectedDetails.details.ml_results.final_decision === 'REJECTED' || selectedDetails.details.ml_results.final_decision === 'HOLD_FOR_INVESTIGATION' ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]' : selectedDetails.details.ml_results.final_decision === 'APPROVED_WITH_CONDITIONS' ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]'}`}>
                         {selectedDetails.details.ml_results.final_decision.replace(/_/g, ' ')}
                       </p>
                       <p className="text-slate-400 text-[13px] mt-2 italic border-l-2 border-slate-700 pl-3">"{selectedDetails.details.ml_results.final_reason}"</p>
                     </div>
                   </div>
                 )}
               </>
               ) : (
                 <div className="text-slate-500 text-center py-10 font-medium">Aucun détail disponible pour cet enregistrement.</div>
               )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
