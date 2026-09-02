import { useState, useRef, useEffect } from 'react';
import {
  Brain, Play, Pause, RotateCcw, MoreVertical, X,
  CheckCircle2, Loader2, Trash2, Eye,
  Download, Settings, Plus, ChevronUp, ChevronDown,
  Clock, BarChart3, TrendingUp, TrendingDown,
  Activity,
} from 'lucide-react';
import type { ModelPerformance } from '../types';
import { useLang } from '../i18n/LangContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type ModelStatus = ModelPerformance['status'];
type TrainStatus = 'idle' | 'running' | 'done' | 'error';

interface ModelState {
  status: ModelStatus;
  precision: number;
  f1Score: number;
  mae: number;
  rmse: number;
  dernierEntrainement: string;
  trainStatus: TrainStatus;
  trainProgress: number;
  trainLog: string[];
  epoch: number;
  totalEpochs: number;
}

interface ModelesTableProps {
  modeles: ModelPerformance[];
}

// ─── Training logs per step ────────────────────────────────────────────────────
function buildLogs(nom: string): string[] {
  return [
    `[INIT]  Chargement du dataset SGBV — observations récupérées`,
    `[PREP]  Normalisation MinMax des features financières`,
    `[SPLIT] Train/Val/Test: 70% / 15% / 15%`,
    `[MODEL] Architecture ${nom} initialisée`,
    `[TRAIN] Epoch 1/50 — Début de l'entraînement...`,
    `[TRAIN] Epoch 10/50 — Optimisation en cours...`,
    `[TRAIN] Epoch 20/50 — Convergence atteinte...`,
    `[OPTIM] Early stopping déclenché — meilleure epoch sauvegardée`,
    `[EVAL]  Calcul métriques sur le jeu de test…`,
    `[DONE]  Ré-entraînement terminé avec succès ✓`,
  ];
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({
  nom, state, onClose, isRTL,
}: { nom: string; state: ModelState; onClose: () => void; isRTL: boolean }) {
  const metrics = [
    { label: 'Précision', value: `${state.precision}%`, icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Score F1',  value: `${state.f1Score}%`,  icon: Activity,   color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'MAE',       value: state.mae.toString(), icon: TrendingDown,color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'RMSE',      value: state.rmse.toString(),icon: TrendingUp,  color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className={`w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_0_50px_rgba(16,185,129,0.1)] backdrop-blur-xl overflow-hidden ${isRTL ? 'text-right' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Brain className="h-5 w-5 text-emerald-400" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-lg font-bold text-white tracking-tight">{nom}</h3>
              <p className="text-[13px] font-medium text-slate-400">{isRTL ? 'تفاصيل النموذج' : 'Détails du modèle'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="rounded-xl border border-white/5 bg-slate-900/50 p-4 transition-all hover:bg-slate-800/80 hover:border-white/10">
                  <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-1.5 rounded-lg ${m.bg}`}>
                      <Icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <span className="text-[13px] font-medium text-slate-400">{m.label}</span>
                  </div>
                  <p className={`mt-2.5 text-2xl font-black ${m.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>{m.value}</p>
                </div>
              );
            })}
          </div>

          {/* Training log if available */}
          {state.trainLog.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {isRTL ? 'سجل التدريب' : 'Journal d\'entraînement'}
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-950 border border-white/5 p-3.5 font-mono text-[11px] space-y-1.5 shadow-inner">
                {state.trainLog.map((line, i) => (
                  <div key={i} className={`text-slate-400 ${line.includes('DONE') ? 'text-emerald-400 font-bold' : line.includes('ERROR') ? 'text-rose-400' : ''}`}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last train */}
          <div className={`flex items-center gap-2 text-[12px] font-medium text-slate-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-4 w-4" />
            <span>{isRTL ? 'آخر تدريب' : 'Dernier entraînement'} : {state.dernierEntrainement}</span>
          </div>
        </div>

        <div className="border-t border-white/5 p-5 bg-slate-900/30">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 bg-slate-800/50 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            {isRTL ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({
  x, y, nom, onAction, onClose, isRTL,
}: {
  x: number; y: number; nom: string;
  onAction: (action: string) => void; onClose: () => void; isRTL: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { id: 'detail',    label: isRTL ? 'عرض التفاصيل'      : 'Voir les détails',       icon: Eye,      color: 'text-slate-300' },
    { id: 'export',    label: isRTL ? 'تصدير النموذج'      : 'Exporter le modèle',     icon: Download,  color: 'text-slate-300' },
    { id: 'config',    label: isRTL ? 'إعدادات النموذج'    : 'Configurer',              icon: Settings,  color: 'text-slate-300' },
    { id: 'separator', label: '', icon: null, color: '' },
    { id: 'delete',    label: isRTL ? 'حذف النموذج'        : 'Supprimer le modèle',    icon: Trash2,    color: 'text-red-400' },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden py-1.5"
      style={{ top: y, left: isRTL ? 'auto' : x, right: isRTL ? `calc(100vw - ${x}px)` : 'auto' }}
    >
      <div className="px-4 py-2 border-b border-white/5 mb-1.5">
        <p className="text-[11px] font-bold text-slate-500 truncate">{nom}</p>
      </div>
      {items.map((item, i) => {
        if (item.id === 'separator') return <div key={i} className="h-px bg-slate-800 my-1" />;
        const Icon = item.icon!;
        return (
          <button
            key={item.id}
            onClick={() => { onAction(item.id); onClose(); }}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-800 ${item.color} ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ModelesTable({ modeles: initialModeles }: ModelesTableProps) {
  const { t, isRTL } = useLang();

  // Local list of models (mutable)
  const [modeles, setModeles] = useState<ModelPerformance[]>(initialModeles);

  // Per-model runtime state
  const [modelStates, setModelStates] = useState<Record<string, ModelState>>(() => {
    const init: Record<string, ModelState> = {};
    initialModeles.forEach(m => {
      init[m.nom] = {
        status: m.status,
        precision: m.precision,
        f1Score: m.f1Score,
        mae: m.mae,
        rmse: m.rmse,
        dernierEntrainement: m.dernierEntrainement,
        trainStatus: 'idle',
        trainProgress: 0,
        trainLog: [],
        epoch: 0,
        totalEpochs: 0,
      };
    });
    return init;
  });

  useEffect(() => {
    setModeles(initialModeles);
    setModelStates(prev => {
      const next = { ...prev };
      initialModeles.forEach(m => {
        if (!next[m.nom]) {
          next[m.nom] = {
            status: m.status,
            precision: m.precision,
            f1Score: m.f1Score,
            mae: m.mae,
            rmse: m.rmse,
            dernierEntrainement: m.dernierEntrainement,
            trainStatus: 'idle',
            trainProgress: 0,
            trainLog: [],
            epoch: 0,
            totalEpochs: 0,
          };
        }
      });
      return next;
    });
  }, [initialModeles]);

  // UI state
  const [detailModelNom,  setDetailModelNom]  = useState<string | null>(null);
  const [contextMenu,     setContextMenu]     = useState<{ x: number; y: number; nom: string } | null>(null);
  const [sortField,       setSortField]       = useState<'precision' | 'f1Score' | 'mae'>('precision');
  const [sortDir,         setSortDir]         = useState<'asc' | 'desc'>('desc');

  // Timer refs for training simulations
  const trainTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const getState = (nom: string): ModelState =>
    modelStates[nom] ?? {
      status: 'inactif', precision: 0, f1Score: 0, mae: 0, rmse: 0,
      dernierEntrainement: '—', trainStatus: 'idle', trainProgress: 0,
      trainLog: [], epoch: 0, totalEpochs: 0,
    };

  const updateState = (nom: string, patch: Partial<ModelState>) => {
    setModelStates(prev => ({ ...prev, [nom]: { ...prev[nom], ...patch } }));
  };

  // ── TOGGLE Pause / Play ───────────────────────────────────────────────────
  const handleToggle = (nom: string) => {
    const st = getState(nom);
    if (st.trainStatus === 'running') return; // can't toggle during training

    const next: ModelStatus = st.status === 'actif' ? 'inactif' : 'actif';
    fetch(`/api/modeles/${encodeURIComponent(nom)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next })
    }).then(res => {
      if (res.ok) {
        updateState(nom, { status: next });
        setModeles(prev => prev.map(m => m.nom === nom ? { ...m, status: next } : m));
      }
    });
  };

  // ── RE-TRAIN ──────────────────────────────────────────────────────────────
  const handleRetrain = (nom: string) => {
    const st = getState(nom);
    if (st.trainStatus === 'running') return;

    const logs   = buildLogs(nom);
    const total  = 50;
    const stepMs = 280; // ms per progress tick

    updateState(nom, {
      trainStatus:  'running',
      trainProgress: 0,
      trainLog:     [logs[0]],
      status:       'entraînement',
      epoch:        0,
      totalEpochs:  total,
    });
    setModeles(prev => prev.map(m => m.nom === nom ? { ...m, status: 'entraînement' } : m));

    let progress = 0;
    let logIdx   = 1;

    const interval = setInterval(() => {
      progress += 2;
      const newEpoch = Math.round((progress / 100) * total);

      // Drip logs proportionally
      const targetLog = Math.floor((progress / 100) * (logs.length - 1));
      const newLogs = logs.slice(0, Math.max(logIdx, targetLog + 1));
      logIdx = Math.max(logIdx, targetLog + 1);

      // Update the running log line for epochs
      const withEpoch = newLogs.map(l =>
        l.includes('Epoch 1') ? l.replace('Epoch 1/', `Epoch ${Math.max(1, newEpoch)}/`) : l
      );

      updateState(nom, {
        trainProgress: progress,
        epoch:         newEpoch,
        trainLog:      withEpoch,
      });

      if (progress >= 100) {
        clearInterval(interval);
        delete trainTimers.current[nom];

        fetch(`/api/modeles/train/${encodeURIComponent(nom)}`, {
          method: 'POST'
        }).then(res => res.json()).then(updatedModel => {
          if (updatedModel && updatedModel.precision) {
            updateState(nom, {
              trainStatus:          'done',
              trainProgress:        100,
              trainLog:             [...logs],
              precision:            updatedModel.precision,
              f1Score:              updatedModel.f1Score,
              mae:                  updatedModel.mae,
              rmse:                 updatedModel.rmse,
              status:               'actif',
              dernierEntrainement:  updatedModel.dernierEntrainement
            });
            setModeles(prev => prev.map(m => m.nom === nom ? { ...m, ...updatedModel, status: 'actif' } : m));
          }
        });
      }
    }, stepMs);

    trainTimers.current[nom] = interval;
  };

  // ── CONTEXT MENU ACTIONS ──────────────────────────────────────────────────
  const handleContextAction = (action: string, nom: string) => {
    if (action === 'detail')  { setDetailModelNom(nom); return; }
    if (action === 'export')  { alert(`Export du modèle "${nom}" — fichier .pkl généré (simulation)`); return; }
    if (action === 'config')  { alert(`Configuration avancée de "${nom}" — (simulation)`); return; }
    if (action === 'delete') {
      fetch(`/api/modeles/${encodeURIComponent(nom)}`, { method: 'DELETE' }).then(res => {
        if (res.ok) {
          setModeles(prev => prev.filter(m => m.nom !== nom));
          setModelStates(prev => { const next = { ...prev }; delete next[nom]; return next; });
        }
      });
    }
  };

  // ── SORT ──────────────────────────────────────────────────────────────────
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = [...modeles].sort((a, b) => {
    const av = getState(a.nom)[sortField] as number;
    const bv = getState(b.nom)[sortField] as number;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  // ── STATUS CONFIG ─────────────────────────────────────────────────────────
  const statusConfig: Record<ModelStatus, { bg: string; text: string; dot: string }> = {
    actif:          { bg: 'bg-emerald-500/10',  text: 'text-emerald-400',  dot: 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    'entraînement': { bg: 'bg-emerald-500/10',     text: 'text-emerald-400',     dot: 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    inactif:        { bg: 'bg-slate-500/10',    text: 'text-slate-400',    dot: 'bg-slate-500' },
  };

  const getStatusLabel = (s: ModelStatus) => {
    if (s === 'actif')         return t('status_actif');
    if (s === 'entraînement')  return t('status_training');
    return t('status_inactif');
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 inline-flex flex-col">
      {sortField === field && sortDir === 'asc'  && <ChevronUp   className="h-2.5 w-2.5 text-emerald-400" />}
      {sortField === field && sortDir === 'desc' && <ChevronDown  className="h-2.5 w-2.5 text-emerald-400" />}
      {sortField !== field && <ChevronDown className="h-2.5 w-2.5 text-slate-600" />}
    </span>
  );

  return (
    <>
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Brain className="h-5 w-5 text-emerald-400" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-lg font-bold text-white tracking-tight">{t('models_title')}</h3>
              <p className="text-[13px] font-medium text-slate-400 mt-0.5">
                {sorted.length} {isRTL ? 'نموذج' : 'modèles'} —&nbsp;
                <span className="text-emerald-400 font-bold">{sorted.filter(m => getState(m.nom).status === 'actif').length} {t('status_actif')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('model_name')}
                </th>
                <th className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('model_status')}
                </th>
                <th
                  className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-300 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  onClick={() => handleSort('precision')}
                >
                  {t('model_precision')}<SortIcon field="precision" />
                </th>
                <th
                  className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-300 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  onClick={() => handleSort('f1Score')}
                >
                  {t('model_f1')}<SortIcon field="f1Score" />
                </th>
                <th
                  className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-300 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  onClick={() => handleSort('mae')}
                >
                  {t('model_mae')}<SortIcon field="mae" />
                </th>
                <th className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>{t('model_rmse')}</th>
                <th className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>{t('model_last')}</th>
                <th className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>{t('model_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const st   = getState(m.nom);
                const sc   = statusConfig[st.status.toLowerCase() as ModelStatus] || statusConfig.inactif;
                const isTr = st.trainStatus === 'running';

                return (
                  <tr
                    key={m.nom}
                    className={`border-b border-white/5 transition-colors hover:bg-emerald-500/5 group ${isTr ? 'bg-emerald-500/5' : ''}`}
                  >
                    {/* Name */}
                    <td className={`px-4 py-3.5 ${isRTL ? 'text-right' : ''}`}>
                      <div>
                        <span className="text-[14px] font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">{m.nom}</span>
                        {/* Training progress bar */}
                        {isTr && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                                Epoch {st.epoch}/{st.totalEpochs}
                              </span>
                              <span className="text-[11px] text-emerald-400 font-mono font-bold">{st.trainProgress}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-300"
                                style={{ width: `${st.trainProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {st.trainStatus === 'done' && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[11px] font-bold text-emerald-400">
                              {isRTL ? 'اكتمل التدريب' : 'Ré-entraînement terminé'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text} ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {isTr
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        }
                        {getStatusLabel(st.status)}
                      </span>
                    </td>

                    {/* Precision */}
                    <td className="px-4 py-3.5">
                      <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500"
                            style={{ width: `${st.precision}%` }}
                          />
                        </div>
                        <span className="text-[13px] font-black text-emerald-400 w-10">{st.precision}%</span>
                      </div>
                    </td>

                    {/* F1 */}
                    <td className="px-3 py-3 text-sm font-medium text-slate-300">{st.f1Score}%</td>

                    {/* MAE */}
                    <td className="px-3 py-3 text-sm text-slate-400">{st.mae}</td>

                    {/* RMSE */}
                    <td className="px-3 py-3 text-sm text-slate-400">{st.rmse}</td>

                    {/* Last train */}
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{st.dernierEntrainement}</td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>

                        {/* Play / Pause */}
                        <button
                          onClick={() => handleToggle(m.nom)}
                          disabled={isTr}
                          title={st.status === 'actif'
                            ? (isRTL ? 'إيقاف النموذج' : 'Mettre en pause')
                            : (isRTL ? 'تفعيل النموذج' : 'Activer le modèle')}
                          className={`rounded-lg p-2 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${
                            st.status === 'actif'
                              ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-400'
                              : 'text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                          }`}
                        >
                          {st.status === 'actif'
                            ? <Pause className="h-4 w-4" />
                            : <Play  className="h-4 w-4" />
                          }
                        </button>

                        {/* Re-train */}
                        <button
                          onClick={() => handleRetrain(m.nom)}
                          disabled={isTr}
                          title={isRTL ? 'إعادة التدريب' : 'Ré-entraîner'}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-500/10 hover:text-emerald-400 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isTr
                            ? <Loader2  className="h-4 w-4 animate-spin text-emerald-400" />
                            : <RotateCcw className="h-4 w-4" />
                          }
                        </button>

                        {/* Detail shortcut */}
                        <button
                          onClick={() => setDetailModelNom(m.nom)}
                          title={isRTL ? 'عرض التفاصيل' : 'Voir les détails'}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-700 hover:text-white active:scale-90"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Context menu */}
                        <button
                          onClick={e => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setContextMenu({ x: rect.left, y: rect.bottom + 4, nom: m.nom });
                          }}
                          title={isRTL ? 'المزيد' : 'Plus d\'options'}
                          className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-slate-700 hover:text-slate-300 active:scale-90"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="py-12 text-center">
              <Brain className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {isRTL ? 'لا توجد نماذج. أنشئ نموذجاً جديداً.' : 'Aucun modèle. Créez-en un nouveau.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals & Overlays ─────────────────────────────────────────── */}
      {detailModelNom && (
        <DetailModal
          nom={detailModelNom}
          state={getState(detailModelNom)}
          onClose={() => setDetailModelNom(null)}
          isRTL={isRTL}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nom={contextMenu.nom}
          onAction={(action) => handleContextAction(action, contextMenu.nom)}
          onClose={() => setContextMenu(null)}
          isRTL={isRTL}
        />
      )}
    </>
  );
}
