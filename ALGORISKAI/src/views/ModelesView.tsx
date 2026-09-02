import ModelesTable from '../components/ModelesTable';
import RadarComparison from '../components/RadarComparison';
import ConfusionMatrix from '../components/ConfusionMatrix';
import PerformanceChart from '../components/PerformanceChart';
import { useState, useEffect } from 'react';
import { type ModelPerformance } from '../types';
import { motion } from 'framer-motion';

export default function ModelesView() {
  const [modeles, setModeles] = useState<ModelPerformance[]>([]);
  const [comparaisonModeles, setComparaisonModeles] = useState<any[]>([]);
  const [matriceConfusion, setMatriceConfusion] = useState<any>({ labels: [], valeurs: [] });
  const [perf, setPerf] = useState<any[]>([]);

  useEffect(() => {
    const t = Date.now();
    fetch(`/api/modeles/list?t=${t}`).then(r => r.json()).then(setModeles);
    fetch(`/api/modeles/comparaison?t=${t}`).then(r => r.json()).then(setComparaisonModeles);
    fetch(`/api/modeles/confusion-matrix?t=${t}`).then(r => r.json()).then(setMatriceConfusion);
    fetch(`/api/modeles/performance?t=${t}`).then(r => r.json()).then(setPerf);
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
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-40 left-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      <motion.div variants={itemVariants}>
        <ModelesTable modeles={modeles} />
      </motion.div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <RadarComparison data={comparaisonModeles} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ConfusionMatrix data={matriceConfusion} />
        </motion.div>
      </div>
      <motion.div variants={itemVariants}>
        <PerformanceChart data={perf} />
      </motion.div>
    </motion.div>
  );
}
