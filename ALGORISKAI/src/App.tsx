import { useState } from 'react';
import { LangProvider, useLang } from './i18n/LangContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import PredictionsView from './views/PredictionsView';
import ModelesView from './views/ModelesView';
import AnomaliesView from './views/AnomaliesView';
import RisquesView from './views/RisquesView';
import ApiConnectorsView from './views/ApiConnectorsView';
import XaiView from './views/XaiView';
import FraudEngineView from './views/FraudEngineView';
import MonitoringView from './components/MonitoringView';
import SettingsView from './components/SettingsView';
import type { TranslationKey } from './i18n/translations';

const tabTitles: Record<string, { title: TranslationKey; subtitle: TranslationKey }> = {
  dashboard:   { title: 'nav_dashboard',   subtitle: 'sub_dashboard' },
  predictions: { title: 'nav_predictions', subtitle: 'sub_predictions' },
  modeles:     { title: 'nav_modeles',     subtitle: 'sub_modeles' },
  anomalies:   { title: 'nav_anomalies',   subtitle: 'sub_anomalies' },
  risques:     { title: 'nav_risques',     subtitle: 'sub_risques' },
  fraude:      { title: 'nav_fraude',      subtitle: 'sub_fraude' },
  api:         { title: 'nav_api',         subtitle: 'sub_api' },
  xai:         { title: 'nav_xai',         subtitle: 'sub_xai' },
  monitoring:  { title: 'nav_monitoring',  subtitle: 'sub_monitoring' },
  parametres:  { title: 'nav_parametres',  subtitle: 'sub_parametres' },
};

import { AuthProvider, useAuth } from './AuthContext';
import LoginView from './views/LoginView';

function AppInner() {
  const { t, isRTL } = useLang();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return <LoginView />;
  }

  const cfg = tabTitles[activeTab] || tabTitles.dashboard;

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardView />;
      case 'predictions': return <PredictionsView />;
      case 'modeles':     return <ModelesView />;
      case 'anomalies':   return <AnomaliesView />;
      case 'risques':     return <RisquesView />;
      case 'fraude':      return <FraudEngineView />;
      case 'api':         return <ApiConnectorsView />;
      case 'xai':         return <XaiView />;
      case 'monitoring':  return <MonitoringView />;
      case 'parametres':  return <SettingsView />;
      default:            return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div
        className={`transition-all duration-300 ${
          collapsed
            ? isRTL ? 'mr-[72px]' : 'ml-[72px]'
            : isRTL ? 'mr-64'    : 'ml-64'
        }`}
      >
        <Header title={t(cfg.title)} subtitle={t(cfg.subtitle)} />
        <main className="p-6">{renderView()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <AppInner />
      </LangProvider>
    </AuthProvider>
  );
}
