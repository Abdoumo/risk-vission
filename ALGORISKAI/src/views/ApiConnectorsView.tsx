import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2,
  Loader2, Server, Zap, Database, Globe, Clock,
  ChevronDown, ChevronUp, Play, Settings,
  ArrowRight, Activity, Lock, FileJson,
  Plus, X, UploadCloud, FileText, DownloadCloud
} from 'lucide-react';
import { type BankConnector, type ApiLog, type DataFlow, type ApiMetricPoint } from '../data/bankingData';
import { useLang } from '../i18n/LangContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const statusConfig = {
  connected:    { label_fr: 'Connecté',     label_ar: 'متصل',       label_en: 'Connected',    icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  dot: 'bg-green-400 animate-pulse' },
  degraded:     { label_fr: 'Dégradé',      label_ar: 'متدهور',     label_en: 'Degraded',     icon: AlertTriangle,color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  dot: 'bg-amber-400' },
  disconnected: { label_fr: 'Déconnecté',   label_ar: 'منقطع',      label_en: 'Disconnected', icon: WifiOff,      color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    dot: 'bg-red-400' },
  syncing:      { label_fr: 'Synchro...',   label_ar: 'مزامنة...',  label_en: 'Syncing...',   icon: Loader2,      color: 'text-emerald-400',   bg: 'bg-emerald-500/10',   border: 'border-emerald-500/30',   dot: 'bg-emerald-400 animate-pulse' },
};

const typeColors: Record<string, string> = {
  SIB:         'bg-green-500/10 text-green-400 border-green-500/20',
  GED:         'bg-violet-500/10 text-violet-400 border-violet-500/20',
  CoreBanking: 'bg-green-500/10 text-green-400 border-green-500/20',
  SWIFT:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CTP:         'bg-slate-500/10 text-slate-400 border-slate-500/20',
  RTGS:        'bg-teal-500/10 text-teal-400 border-teal-500/20',
  REST:        'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

const flowStatusConfig = {
  active: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400 animate-pulse' },
  paused: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-400' },
  error:  { color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20',   dot: 'bg-red-400 animate-pulse' },
};

function ConnectorCard({ connector, isRTL, lang }: { connector: BankConnector; isRTL: boolean; lang: string }) {
  const [expanded, setExpanded] = useState(false);
  const st = statusConfig[connector.status as keyof typeof statusConfig] || statusConfig.disconnected;
  const StatusIcon = st.icon;

  return (
    <div className={`rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 transition-all overflow-hidden`}>
      <div
        className={`flex cursor-pointer items-center justify-between p-4 ${isRTL ? 'flex-row-reverse' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative shrink-0">
            <div className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className="text-sm font-semibold text-white">{connector.name}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeColors[connector.type] || typeColors.REST}`}>
                {connector.type}
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500 border border-slate-700">
                {connector.environment}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{connector.bank}</p>
          </div>
        </div>

        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
              <p className="font-mono font-bold text-green-400">{connector.latency > 0 ? `${connector.latency}ms` : '—'}</p>
              <p className="text-slate-600">Latence</p>
            </div>
            <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
              <p className={`font-mono font-bold ${connector.uptime >= 99 ? 'text-green-400' : connector.uptime >= 97 ? 'text-amber-400' : 'text-red-400'}`}>
                {connector.uptime}%
              </p>
              <p className="text-slate-600">Uptime</p>
            </div>
            <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
              <p className="font-mono font-bold text-slate-300">{connector.requestsPerMin > 0 ? connector.requestsPerMin.toLocaleString() : '0'}</p>
              <p className="text-slate-600">req/min</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.bg} ${st.color}`}>
            <StatusIcon className={`h-3 w-3 ${connector.status === 'syncing' ? 'animate-spin' : ''}`} />
            {lang === 'ar' ? st.label_ar : lang === 'en' ? st.label_en : st.label_fr}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-slate-900/30 px-4 pb-4 pt-3"
          >
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 ${isRTL ? 'text-right' : ''}`}>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Endpoint</p>
                <p className="mt-1 font-mono text-xs text-slate-300 truncate">{connector.endpoint}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Version API</p>
                <p className="mt-1 font-mono text-xs text-slate-300">{connector.version}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Taux d'erreur</p>
                <p className={`mt-1 font-mono text-xs ${connector.errorRate === 0 ? 'text-green-400' : 'text-amber-400'}`}>{connector.errorRate}%</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Dernière Synchro</p>
                <p className="mt-1 font-mono text-xs text-slate-300">{connector.lastSync}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Flux de données actifs</p>
              <div className="space-y-2">
                {connector.flows.map((flow, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-800 px-3 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${flow.status === 'ok' ? 'bg-green-400' : flow.status === 'warn' ? 'bg-amber-400' : 'bg-red-400'}`} />
                      <span className="text-xs text-slate-300">{flow.label}</span>
                    </div>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="font-mono text-xs font-medium text-slate-400">{flow.count.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-600">{flow.lastRun}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ApiConnectorsView() {
  const { lang, isRTL } = useLang();
  const [activeSection, setActiveSection] = useState<'connectors' | 'flows' | 'logs' | 'metrics' | 'uploads'>('connectors');
  const [bankConnectors, setBankConnectors] = useState<BankConnector[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);
  const [metrics, setMetrics] = useState<ApiMetricPoint[]>([]);
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connectorsRes, logsRes, flowsRes, metricsRes] = await Promise.all([
          fetch('/api/banking/connectors'),
          fetch('/api/banking/logs'),
          fetch('/api/banking/flows'),
          fetch('/api/banking/metrics')
        ]);
        
        setBankConnectors(await connectorsRes.json());
        setApiLogs(await logsRes.json());
        setDataFlows(await flowsRes.json());
        setMetrics(await metricsRes.json());
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };
    fetchData();
  }, []);

  const connected    = bankConnectors.filter(c => c.status === 'connected').length;
  const degraded     = bankConnectors.filter(c => c.status === 'degraded').length;
  const disconnected = bankConnectors.filter(c => c.status === 'disconnected').length;
  const syncing      = bankConnectors.filter(c => c.status === 'syncing').length;
  const totalReq     = bankConnectors.reduce((a, b) => a + b.requestsPerMin, 0);

  const tabs = [
    { id: 'connectors', label_fr: 'Connecteurs', label_ar: 'الموصلات',    label_en: 'Connectors', icon: Wifi },
    { id: 'flows',      label_fr: 'Flux Données', label_ar: 'تدفق البيانات',label_en: 'Data Flows',  icon: ArrowRight },
    { id: 'metrics',    label_fr: 'Métriques',    label_ar: 'المقاييس',    label_en: 'Metrics',     icon: Activity },
    { id: 'logs',       label_fr: 'Logs API',     label_ar: 'سجلات API',   label_en: 'API Logs',    icon: FileJson },
    { id: 'uploads',    label_fr: 'Fichiers & Données', label_ar: 'ملفات وبيانات', label_en: 'Files & Data', icon: UploadCloud },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/risques/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      if (response.ok) {
        alert('Upload réussi et pipeline déclenchée !');
      } else {
        alert('Échec de l\'upload');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleFraudUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/fraude/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      if (response.ok) {
        alert('Upload réussi ! Les modèles anti-fraude vont être ré-entraînés.');
      } else {
        alert('Échec de l\'upload');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const getLabel = (item: { label_fr: string; label_ar: string; label_en: string }) =>
    lang === 'ar' ? item.label_ar : lang === 'en' ? item.label_en : item.label_fr;

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
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-green-600/5 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: lang === 'ar' ? 'متصل' : lang === 'en' ? 'Connected' : 'Connectés',           value: connected,    color: 'text-emerald-400', bg: 'from-emerald-500/10' },
          { label: lang === 'ar' ? 'متدهور' : lang === 'en' ? 'Degraded' : 'Dégradés',            value: degraded,     color: 'text-amber-400', bg: 'from-amber-500/10' },
          { label: lang === 'ar' ? 'منقطع' : lang === 'en' ? 'Disconnected' : 'Déconnectés',     value: disconnected, color: 'text-rose-400',   bg: 'from-rose-500/10' },
          { label: lang === 'ar' ? 'مزامنة' : lang === 'en' ? 'Syncing' : 'En synchro',          value: syncing,      color: 'text-emerald-400',  bg: 'from-emerald-500/10' },
          { label: lang === 'ar' ? 'طلب/دقيقة' : lang === 'en' ? 'req/min' : 'req/min total',    value: totalReq.toLocaleString(), color: 'text-white', bg: 'from-slate-500/10' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md bg-gradient-to-br ${s.bg} to-transparent p-5 shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`mt-2 text-3xl font-black ${s.color} drop-shadow-md`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex gap-1.5 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''} ${
                  active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">{getLabel(tab)}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-green-700 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="h-4 w-4 fill-white/20" />
          {lang === 'ar' ? 'اتصال جديد' : lang === 'en' ? 'New Connection' : 'Nouvelle Connexion'}
        </button>
      </motion.div>

      {activeSection === 'connectors' && (
        <motion.div variants={itemVariants} className="space-y-4">
          {(['SIB', 'GED', 'CoreBanking', 'SWIFT', 'CTP'] as const).map(type => {
            const group = bankConnectors.filter(c => c.type === type);
            if (!group.length) return null;
            const groupLabels: Record<string, string> = {
              SIB:         'Système Interbancaire Bancaire (SIB)',
              GED:         'Gestion Électronique de Documents (GED)',
              CoreBanking: 'Core Banking Systems',
              SWIFT:       'SWIFT / Messagerie interbancaire',
              CTP:         'Comptabilité Trésor Public (CTP)',
            };
            return (
              <div key={type} className="space-y-2">
                <div className={`flex items-center gap-3 px-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-px flex-1 bg-slate-800`} />
                  <span className={`rounded-full border px-3 py-0.5 text-[11px] font-bold ${typeColors[type] || ''}`}>
                    {groupLabels[type]}
                  </span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                {group.map(c => (
                  <ConnectorCard key={c.id} connector={c} isRTL={isRTL} lang={lang} />
                ))}
              </div>
            );
          })}
        </motion.div>
      )}

      {activeSection === 'flows' && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
          <div className={`mb-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-base font-semibold text-white">
                {lang === 'ar' ? 'خطوط بيانات' : lang === 'en' ? 'Data Pipelines' : 'Pipelines de Données'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar' ? 'تدفق مستمر إلى RiskVisionAI' : lang === 'en' ? 'Continuous flow to RiskVisionAI' : 'Flux continu vers RiskVisionAI'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {dataFlows.map(flow => {
              const fc = flowStatusConfig[flow.status as keyof typeof flowStatusConfig] || flowStatusConfig.paused;
              return (
                <div key={flow.id} className={`flex items-center gap-4 rounded-xl border ${fc.border} ${fc.bg} p-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Server className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-200 truncate">{flow.source}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">{flow.type}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="h-px w-8 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                      <ArrowRight className={`h-4 w-4 ${fc.color} ${isRTL ? 'rotate-180' : ''}`} />
                      <div className="h-px w-8 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{flow.volume.toLocaleString()} enr/j</span>
                    <span className="text-[10px] text-slate-600">{flow.frequency}</span>
                  </div>
                  <div className={`min-w-0 flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <Zap className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-200 truncate">{flow.destination}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">{flow.transformation}</p>
                  </div>
                  <div className="shrink-0">
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${fc.bg} ${fc.color} border ${fc.border} ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${fc.dot}`} />
                      {flow.status === 'active' ? 'Actif' : flow.status === 'paused' ? 'Pausé' : 'Erreur'}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500 font-medium text-center">{flow.lastExec}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {activeSection === 'metrics' && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
            <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
              <h3 className="text-base font-semibold text-white">
                {lang === 'ar' ? 'طلبات API' : lang === 'en' ? 'API Requests' : 'Requêtes API dans le temps'}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad_api" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={9} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {bankConnectors.map((conn, idx) => {
                  const colors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
                  const color = colors[idx % colors.length];
                  return (
                    <Area key={conn.id} type="monotone" dataKey={conn.name} stroke={color} fill="url(#grad_api)" strokeWidth={2} dot={false} name={conn.name} />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {activeSection === 'logs' && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
          <div className={`mb-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <h3 className="text-base font-semibold text-white">Logs API</h3>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-400">Live</span>
              </div>
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-xs space-y-1.5">
            {apiLogs.map(log => (
              <div key={log.id} className={`group flex items-start gap-3 rounded-lg p-2 hover:bg-slate-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="shrink-0 text-slate-600 w-24">{log.timestamp}</span>
                <span className={`shrink-0 w-14 font-bold ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : log.level === 'DEBUG' ? 'text-slate-500' : 'text-green-400'}`}>
                  {log.level}
                </span>
                <span className={`shrink-0 w-12 font-bold ${log.method === 'POST' ? 'text-green-400' : log.method === 'GET' ? 'text-green-400' : log.method === 'PUT' ? 'text-amber-400' : 'text-red-400'}`}>
                  {log.method}
                </span>
                <span className={`shrink-0 w-10 font-bold ${log.statusCode >= 200 && log.statusCode < 300 ? 'text-green-400' : log.statusCode >= 400 ? 'text-red-400' : 'text-amber-400'}`}>
                  {log.statusCode}
                </span>
                <span className="shrink-0 w-12 text-slate-500">{log.latency > 0 ? `${log.latency}ms` : '—'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-green-600 truncate">{log.endpoint}</div>
                  <div className="text-slate-400 mt-0.5">{log.message}</div>
                </div>
                <span className="shrink-0 text-slate-700 text-[10px]">{log.requestId}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeSection === 'uploads' && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6">
          <div className={`mb-6 ${isRTL ? 'text-right' : ''}`}>
            <h3 className="text-lg font-bold text-white tracking-tight">Fichiers & Données</h3>
            <p className="text-[13px] text-slate-500 mt-1">Importation de données manuelles et fichiers de référence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-xl border border-white/5 bg-slate-800/30 p-6 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors`}>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Portefeuille de Risques (SGBV)</h4>
              <p className="text-[12px] text-slate-400 mb-6 max-w-[250px]">
                Uploadez votre CSV contenant les actifs pour évaluer le VaR et les risques de marché.
              </p>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500/10 px-5 py-2.5 text-[13px] font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 border border-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-[0.98]">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                <span>{isUploading ? 'Chargement...' : 'Importer CSV'}</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            <div className={`rounded-xl border border-white/5 bg-slate-800/30 p-6 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors`}>
              <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-rose-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Dataset Détection Fraude</h4>
              <p className="text-[12px] text-slate-400 mb-6 max-w-[250px]">
                Importez les historiques de transactions pour ré-entraîner les modèles anti-fraude  et anomalies.
              </p>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-500/10 px-5 py-2.5 text-[13px] font-bold text-rose-400 transition-all hover:bg-rose-500/20 border border-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-[0.98]">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                <span>{isUploading ? 'Chargement...' : 'Importer CSV'}</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFraudUpload} disabled={isUploading} />
              </label>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] backdrop-blur-xl ${isRTL ? 'text-right' : ''}`}
            >
              <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <Wifi className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Nouvelle Connexion</h3>
                </div>
                <button onClick={() => setShowNewModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fetch('/api/banking/connectors', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(Object.fromEntries(fd.entries()))
                }).then(res => res.json()).then(newConn => {
                  setBankConnectors([newConn, ...bankConnectors]);
                  setShowNewModal(false);
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-300 mb-2">Nom de l'API / Partenaire</label>
                  <input required name="name" type="text" placeholder="Ex: Stripe, SWIFT Gateway..." className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-300 mb-2">URL Endpoint</label>
                  <input required name="endpoint" type="url" placeholder="https://api.example.com/v1" className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-300 mb-2">API Key / Client ID</label>
                  <input required name="apiKey" type="text" placeholder="sk_live_..." className="w-full rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <button type="submit" className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-colors">
                    Connecter l'API
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
