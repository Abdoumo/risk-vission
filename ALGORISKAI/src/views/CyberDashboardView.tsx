import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, Lock, BarChart3, Globe, ArrowRight } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const glowingOrbVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function CyberDashboardView() {
  const { t, isRTL } = useLang();

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-1/4 -right-64 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10">
        {/* Top Utility Bar */}
        <div className="h-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 text-[11px] font-medium tracking-widest uppercase text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              System Online
            </span>
            <span className="hidden sm:inline-block border-l border-white/10 pl-4">Latency: 12ms</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">EN</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">FR</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">AR</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          <motion.div
            className="flex flex-col lg:flex-row items-center gap-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Left Content */}
            <div className={`flex-1 text-center lg:text-left ${isRTL ? 'lg:text-right' : ''}`}>
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-cyan-500/20 backdrop-blur-md mb-6">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-[13px] font-medium tracking-wide text-cyan-50">v2.4 Neural Core Active</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                Predictive <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Intelligence</span> <br className="hidden lg:block" />
                for Modern Finance
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Harness the power of deep learning to detect fraud, assess credit risk, and optimize your financial operations in real-time with military-grade precision.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => onNavigate && onNavigate('predictions')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  Initialize Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-white font-semibold border border-white/5 backdrop-blur-md hover:border-white/10 transition-all duration-300">
                  View Architecture
                </button>
              </motion.div>
            </div>

            {/* Right Abstract Visual (Replacing 3D) */}
            <motion.div variants={itemVariants} className="flex-1 relative w-full aspect-square max-w-[500px] flex items-center justify-center">
              {/* Outer Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-slate-800/80 border-dashed"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[10%] rounded-full border border-cyan-500/20"
              />
              {/* Core Nodes */}
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div variants={glowingOrbVariants} animate="animate" className="absolute w-32 h-32 rounded-full bg-cyan-400/20 blur-xl" />
                <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl flex items-center justify-center backdrop-blur-xl">
                  <Activity className="w-10 h-10 text-cyan-400" />
                </div>

                {/* Floating Elements */}
                {[
                  { icon: ShieldCheck, color: "text-emerald-400", pos: "top-1/4 -left-4", delay: 0 },
                  { icon: Lock, color: "text-blue-400", pos: "bottom-1/4 -right-4", delay: 1 },
                  { icon: Globe, color: "text-purple-400", pos: "-top-8 right-1/4", delay: 2 },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
                    className={`absolute ${item.pos} w-16 h-16 rounded-xl bg-slate-800/80 border border-white/5 shadow-xl flex items-center justify-center backdrop-blur-md`}
                  >
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { title: "Real-time Fraud Detection", desc: "Sub-millisecond latency analyzing millions of transactions with our optimized AI models.", icon: Activity, color: "from-cyan-500 to-blue-500" },
              { title: "Predictive Credit Risk", desc: "Dynamic risk scoring utilizing alternative data streams and behavioral analytics.", icon: BarChart3, color: "from-blue-500 to-indigo-500" },
              { title: "Enterprise Security", desc: "Bank-grade encryption with Zero-Trust architecture built directly into the core.", icon: ShieldCheck, color: "from-emerald-500 to-cyan-500" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group relative p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm hover:-translate-y-2 hover:border-white/10 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`} />
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 border border-white/5 group-hover:border-white/10 transition-colors">
                  <feature.icon className="w-7 h-7 text-white/80 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
