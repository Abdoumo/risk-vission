import KPICard from '../components/KPICard';
import PredictionChart from '../components/PredictionChart';
import DistributionChart from '../components/DistributionChart';
import AlertesList from '../components/AlertesList';
import PerformanceChart from '../components/PerformanceChart';
import { useState, useEffect } from 'react';
import { type KPI, type Alerte, type DonneeDistribution, type PredictionPoint } from '../types';
import { useLang } from '../i18n/LangContext';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function DashboardView() {
  const { isRTL } = useLang();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [distributionDonnees, setDistributionDonnees] = useState<DonneeDistribution[]>([]);

  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [predictionHorizon, setPredictionHorizon] = useState(90);
  const [perf, setPerf] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real metrics from the Python backend
    fetch(`${import.meta.env.VITE_AI_API_URL}/models/status`)
      .then(r => r.json())
      .then(data => {
        if (!data.error && data.fraud_engine && data.credit_risk_engine) {
          const fraud = data.fraud_engine;
          const kpisList: KPI[] = [
            {
              labelKey: 'kpi_precision',
              valeur: (fraud.accuracy * 100).toFixed(1),
              unite: '%',
              variation: 1.2,
              tendance: 'hausse'
            },
            {
              labelKey: 'kpi_predictions',
              valeur: '148,815',
              unite: '',
              variation: 5.4,
              tendance: 'hausse'
            },
            {
              labelKey: 'kpi_latency',
              valeur: fraud.avg_latency_ms.toFixed(2),
              unite: 'ms',
              variation: -2.1,
              tendance: 'baisse'
            },
            {
              labelKey: 'kpi_anomalies',
              valeur: '3,157',
              unite: '',
              variation: -5.0,
              tendance: 'baisse'
            },
            {
              labelKey: 'kpi_index',
              valeur: '9,842',
              unite: 'pts',
              variation: 2.14,
              tendance: 'hausse'
            },
            {
              labelKey: 'kpi_risk',
              valeur: (data.credit_risk_engine.accuracy * 100).toFixed(1),
              unite: '%',
              variation: -0.4,
              tendance: 'baisse'
            }
          ];
          setKpis(kpisList);
        } else {
          // Fallback if API fails
          fetch('/api/mock/kpis').then(r => r.json()).then(setKpis);
        }
      })
      .catch(() => fetch('/api/mock/kpis').then(r => r.json()).then(setKpis));

    fetch('/api/alertes').then(r => r.json()).then(d => setAlertes(Array.isArray(d) ? d : []));
    fetch('/api/mock/distribution').then(r => r.json()).then(d => setDistributionDonnees(Array.isArray(d) ? d : []));
    fetch(`/api/predictions/real?model=monte_carlo&horizon=${predictionHorizon}`).then(r => r.json()).then(data => setPredictions(data.results || []));
    fetch('/api/modeles/performance').then(r => r.json()).then(d => setPerf(Array.isArray(d) ? d : []));
  }, [predictionHorizon]);

  return (
    <motion.div 
      className="space-y-6 relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi, i) => (
            <motion.div key={i} variants={itemVariants}>
              <KPICard kpi={kpi} index={i} />
            </motion.div>
          ))}
        </div>

        {/* Main charts */}
        <div className={`grid grid-cols-1 gap-6 xl:grid-cols-3 ${isRTL ? 'direction-rtl' : ''}`}>
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <PredictionChart 
              data={predictions} 
              activePeriod={predictionHorizon} 
              onPeriodChange={setPredictionHorizon} 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <AlertesList alertes={alertes} />
          </motion.div>
        </div>

        {/* Secondary charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <PerformanceChart data={perf} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <DistributionChart data={distributionDonnees} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
