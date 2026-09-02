import { Activity, Cpu, HardDrive, Wifi, Clock, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/LangContext';
import type { TranslationKey } from '../i18n/translations';

interface MetricGauge {
  labelKey: TranslationKey;
  value: number;
  max: number;
  unit: string;
  icon: any;
  gradient: string;
}

export default function MonitoringView() {
  const { t, isRTL } = useLang();

  const [metrics, setMetrics] = useState<MetricGauge[]>([
    { labelKey: 'cpu',        value: 0,   max: 100,  unit: '%',    icon: Cpu,       gradient: 'from-cyan-500 to-cyan-300' },
    { labelKey: 'gpu',        value: 0,   max: 100,  unit: '%',    icon: Zap,       gradient: 'from-emerald-500 to-emerald-300' },
    { labelKey: 'memory',     value: 0,   max: 32,   unit: 'GB',   icon: HardDrive, gradient: 'from-cyan-600 to-cyan-400' },
    { labelKey: 'network',    value: 0,  max: 1000, unit: 'Mb/s', icon: Wifi,      gradient: 'from-emerald-600 to-emerald-400' },
    { labelKey: 'latency',    value: 0,   max: 200,  unit: 'ms',   icon: Clock,     gradient: 'from-cyan-500 to-emerald-400' },
    { labelKey: 'throughput', value: 0, max: 2000, unit: 'r/s',  icon: Activity,  gradient: 'from-emerald-500 to-cyan-400' },
  ]);

  // Keep a history of the last 20 ticks for the mini-chart
  const [history, setHistory] = useState<number[][]>(Array(6).fill(Array(20).fill(10)));
  const [logs, setLogs] = useState<{ time: string; level: string; msg: string }[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(prev => [
            { ...prev[0], value: data.cpu },
            { ...prev[1], value: data.gpu }, 
            { ...prev[2], value: parseFloat(data.usedRamGb), max: Math.ceil(parseFloat(data.totalRamGb)) },
            { ...prev[3], value: data.network, max: Math.max(1000, data.network * 1.5) }, 
            { ...prev[4], value: data.latency, max: Math.max(200, data.latency * 1.5) }, 
            { ...prev[5], value: data.throughput, max: Math.max(2000, data.throughput * 1.5) }
          ]);
          
          setHistory(prevHistory => {
            const nextHistory = [...prevHistory];
            nextHistory[0] = [...nextHistory[0].slice(1), data.cpu];
            nextHistory[1] = [...nextHistory[1].slice(1), data.gpu];
            nextHistory[2] = [...nextHistory[2].slice(1), (parseFloat(data.usedRamGb) / Math.ceil(parseFloat(data.totalRamGb))) * 100];
            nextHistory[3] = [...nextHistory[3].slice(1), Math.min(100, (data.network / 1000) * 100)];
            nextHistory[4] = [...nextHistory[4].slice(1), Math.min(100, (data.latency / 200) * 100)];
            nextHistory[5] = [...nextHistory[5].slice(1), Math.min(100, (data.throughput / 2000) * 100)];
            return nextHistory;
          });
        }
        
        const logsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/system/logs`);
        if (logsRes.ok) {
           const logsData = await logsRes.json();
           setLogs(logsData);
        }
      } catch (err) {}
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          const pct = (metric.value / metric.max) * 100;
          const isCritical = pct > 90;
          const isWarning = pct > 75;
          const color = isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-cyan-400';

          return (
            <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all hover:border-cyan-500/30 hover:bg-slate-900/60 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm font-medium text-slate-300">{t(metric.labelKey)}</span>
                </div>
                <span className={`text-xs font-medium ${color}`}>{pct.toFixed(0)}%</span>
              </div>
              <div className={`mt-4 flex items-baseline gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                <span className={`text-3xl font-black ${color}`}>
                  {metric.value % 1 !== 0 ? metric.value.toFixed(1) : Math.round(metric.value)}
                </span>
                <span className="text-sm text-slate-500">/ {metric.max} {metric.unit}</span>
              </div>
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${metric.gradient} ${isCritical ? 'animate-pulse' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-end gap-0.5 h-8">
                {history[i]?.map((val, j) => (
                  <div key={j} className={`flex-1 rounded-t-sm bg-gradient-to-t ${metric.gradient} opacity-25`} style={{ height: `${val}%` }} />
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
        <h3 className={`mb-5 text-lg font-bold text-white ${isRTL ? 'text-right' : ''}`}>{t('logs_title')}</h3>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg bg-slate-950 p-4 font-mono text-xs">
          {logs.length > 0 ? logs.map((log, i) => (
            <div key={i} className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="shrink-0 text-slate-600">{log.time}</span>
              <span className={`shrink-0 w-12 ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-green-400'}`}>
                {log.level}
              </span>
              <span className="text-slate-400">{log.msg}</span>
            </div>
          )) : (
            <div className="text-slate-500 text-center py-4">Aucun log récent...</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
