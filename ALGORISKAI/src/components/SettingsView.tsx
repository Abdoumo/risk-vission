import { Save, RotateCcw, Shield, Bell, Sliders, Calculator, DollarSign, TrendingDown, Percent, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/LangContext';

export default function SettingsView() {
  const { t, isRTL } = useLang();
  const [settings, setSettings] = useState({
    autoRetrain: true,
    driftDetection: true,
    anomalyThreshold: 0.85,
    batchSize: 256,
    retrainFreq: '24h',
    notifications: true,
    emailAlerts: true,
    slackAlerts: false,
    confidenceInterval: 95,
    gpuAllocation: 70,
    maxModels: 6,
  });

  // Financial State
  const [financialData, setFinancialData] = useState({
    totalAmountEvaluated: 0,
    totalExpectedLoss: 0,
    lossPerUser: [] as any[]
  });
  
  const remainingMoney = financialData.totalAmountEvaluated - financialData.totalExpectedLoss;
  const percentageLoss = financialData.totalAmountEvaluated > 0 ? (financialData.totalExpectedLoss / financialData.totalAmountEvaluated) * 100 : 0;

  useEffect(() => {
    const fetchFinancialOverview = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system/financial-overview`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('algorisk_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFinancialData(data);
        }
      } catch (error) {
        console.error('Failed to fetch financial overview:', error);
      }
    };
    fetchFinancialOverview();
  }, []);

  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer les anciennes données de test ?")) {
      return;
    }
    
    setIsResetting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system/reset-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('algorisk_token')}`
        }
      });
      if (response.ok) {
        alert("Données supprimées avec succès !");
      } else {
        alert("Erreur lors de la suppression des données.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression des données.");
    } finally {
      setIsResetting(false);
    }
  };

  const Toggle = ({ val, onToggle }: { val: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors ${val ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 border border-white/10'}`}
    >
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

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
      <div className="absolute top-0 right-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" />

      {/* Model params */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
        <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Sliders className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">{t('settings_models')}</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Threshold slider */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings_threshold')}</label>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input type="range" min="0.5" max="1" step="0.01" value={settings.anomalyThreshold}
                onChange={(e) => setSettings({ ...settings, anomalyThreshold: parseFloat(e.target.value) })}
                className="flex-1 h-2 rounded-full bg-slate-800 accent-cyan-500" />
              <span className="text-sm font-bold text-emerald-400 w-12">{settings.anomalyThreshold}</span>
            </div>
          </div>
          {/* Batch size */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings_batch')}</label>
            <select value={settings.batchSize}
              onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) })}
              className="w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-emerald-500/50 focus:bg-slate-900/80 transition-colors">
              {[32, 64, 128, 256, 512, 1024].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {/* Retrain freq */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings_retrain_freq')}</label>
            <select value={settings.retrainFreq}
              onChange={(e) => setSettings({ ...settings, retrainFreq: e.target.value })}
              className="w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-emerald-500/50 focus:bg-slate-900/80 transition-colors">
              <option value="6h">6h</option>
              <option value="12h">12h</option>
              <option value="24h">24h</option>
              <option value="7d">7 jours</option>
              <option value="manual">Manuel</option>
            </select>
          </div>
          {/* Confidence */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings_confidence')}</label>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input type="range" min="80" max="99" step="1" value={settings.confidenceInterval}
                onChange={(e) => setSettings({ ...settings, confidenceInterval: parseInt(e.target.value) })}
                className="flex-1 h-2 rounded-full bg-slate-800 accent-cyan-500" />
              <span className="text-sm font-bold text-emerald-400 w-12">{settings.confidenceInterval}%</span>
            </div>
          </div>
          {/* GPU */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings_gpu')}</label>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input type="range" min="10" max="100" step="5" value={settings.gpuAllocation}
                onChange={(e) => setSettings({ ...settings, gpuAllocation: parseInt(e.target.value) })}
                className="flex-1 h-2 rounded-full bg-slate-800 accent-cyan-500" />
              <span className="text-sm font-bold text-emerald-400 w-12">{settings.gpuAllocation}%</span>
            </div>
          </div>
          {/* Max models */}
          <div className={isRTL ? 'text-right' : ''}>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings_max_models')}</label>
            <input type="number" value={settings.maxModels}
              onChange={(e) => setSettings({ ...settings, maxModels: parseInt(e.target.value) })}
              className="w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-emerald-500/50 focus:bg-slate-900/80 transition-colors" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Automation */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <div className={`flex items-center gap-3 mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">{t('settings_automation')}</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: 'autoRetrain' as const,     label: t('settings_auto_retrain', 'إعادة التدريب التلقائي', 'Auto-retrain'),  desc: t('settings_auto_retrain_desc', 'إعادة تدريب النماذج عند توفر بيانات جديدة', 'Retrain models when new data arrives') },
              { key: 'driftDetection' as const,  label: t('settings_drift', 'اكتشاف الانحراف', 'Drift detection'),          desc: t('settings_drift_desc', 'اكتشاف انحراف البيانات تلقائيًا', 'Automatically detect data drift') },
            ].map((item) => (
              <div key={item.key} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 ${isRTL ? 'text-right mr-4' : 'mr-4'}`}>
                  <p className="text-sm font-medium text-slate-300">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <Toggle val={settings[item.key]} onToggle={() => setSettings({ ...settings, [item.key]: !settings[item.key] })} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <div className={`flex items-center gap-3 mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Bell className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">{t('settings_notifs')}</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: 'notifications' as const,  label: t('settings_push'),  desc: t('settings_push_desc') },
              { key: 'emailAlerts' as const,     label: t('settings_email'), desc: t('settings_email_desc') },
              { key: 'slackAlerts' as const,     label: t('settings_slack'), desc: t('settings_slack_desc') },
            ].map((item) => (
              <div key={item.key} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 ${isRTL ? 'text-right mr-4' : 'mr-4'}`}>
                  <p className="text-sm font-medium text-slate-300">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <Toggle val={settings[item.key]} onToggle={() => setSettings({ ...settings, [item.key]: !settings[item.key] })} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Financial Overview (Equation for Loss) */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-red-500/10 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
        <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Calculator className="h-5 w-5 text-red-400" />
          <h3 className="text-base font-bold text-white">{isRTL ? 'المعادلة المالية والخسائر' : 'Financial & Loss Equation'}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total App Money */}
          <div className={`p-4 rounded-xl border border-white/5 bg-slate-800/50 flex flex-col gap-2 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-2 text-slate-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">{isRTL ? 'إجمالي أموال التطبيق' : 'Total App Money'}</span>
            </div>
            <input 
              type="number" 
              value={financialData.totalAmountEvaluated}
              readOnly
              className="bg-transparent text-xl font-bold text-white outline-none border-b border-dashed border-white/20 transition-colors w-full cursor-default"
            />
          </div>

          {/* Total Loss */}
          <div className={`p-4 rounded-xl border border-white/5 bg-slate-800/50 flex flex-col gap-2 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-2 text-slate-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium">{isRTL ? 'إجمالي خسائر العملاء' : 'Total Clients Loss'}</span>
              <a href="#user-loss-breakdown" title={isRTL ? 'رؤية التفاصيل بالأسفل' : 'See breakdown below'}>
                <Info className="w-4 h-4 text-slate-500 hover:text-emerald-400 cursor-pointer transition-colors" />
              </a>
            </div>
            <input 
              type="number" 
              value={financialData.totalExpectedLoss}
              readOnly
              className="bg-transparent text-xl font-bold text-red-400 outline-none border-b border-dashed border-white/20 transition-colors w-full cursor-default"
            />
          </div>

          {/* Remaining Money */}
          <div className={`p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex flex-col gap-2 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-2 text-emerald-400/80 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">{isRTL ? 'الأموال المتبقية' : 'Remaining Money'}</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {remainingMoney.toLocaleString()} <span className="text-sm opacity-50">DZD</span>
            </div>
          </div>

          {/* Percentage of Loss */}
          <div className={`p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex flex-col gap-2 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-2 text-red-400/80 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Percent className="w-4 h-4" />
              <span className="text-sm font-medium">{isRTL ? 'نسبة الخسارة' : 'Percentage of Loss'}</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {percentageLoss.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="w-full h-3 bg-emerald-500/20 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${100 - percentageLoss}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all duration-500" 
            style={{ width: `${percentageLoss}%` }}
          />
        </div>

        {/* Breakdown per user */}
        {financialData.lossPerUser.length > 0 && (
          <div className="mt-8" id="user-loss-breakdown">
            <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h4 className="text-sm font-bold text-white">{isRTL ? 'خسارة متوقعة لكل مستخدم (كل الوقت)' : 'Expected Loss Per User (All Time)'}</h4>
              <div title={isRTL ? 'محسوبة من مخاطر الائتمان والشذوذ المكتشف عبر جميع البيانات التاريخية.' : 'Calculated from credit risk and fraud anomalies detected across all historical data.'}>
                <Info className="w-4 h-4 text-slate-500 cursor-help hover:text-white transition-colors" />
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {financialData.lossPerUser.map((user, idx) => (
                <div key={idx} className={`p-4 rounded-xl border border-white/5 bg-slate-800/30 flex justify-between items-center ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div>
                    <p className="text-white font-bold">{user.entite}</p>
                    <p className="text-xs text-slate-400">{user.transactions} transactions • Status: <span className={user.status === 'blocked' ? 'text-red-400' : 'text-amber-400'}>{user.status}</span></p>
                  </div>
                  <div className={`text-lg font-bold text-red-400 ${isRTL ? 'text-left' : 'text-right'}`}>
                    {user.expectedLoss.toLocaleString()} DZD
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse justify-start' : 'justify-end'}`}>
        <button 
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-400 transition-colors bg-slate-950/50 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
        >
          <RotateCcw className={`h-4.5 w-4.5 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Suppression...' : t('settings_reset')}
        </button>
        <button 
          onClick={() => {
            window.location.reload();
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-400 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:from-emerald-500 hover:to-cyan-300">
          <Save className="h-4.5 w-4.5" />
          {t('settings_save')}
        </button>
      </motion.div>
    </motion.div>
  );
}
