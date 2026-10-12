import { useState, useEffect } from 'react';
import { LangProvider, useLang } from './i18n/LangContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import KycEngineView from './views/KycEngineView';
import PredictionsView from './views/PredictionsView';
import ModelesView from './views/ModelesView';
import AnomaliesView from './views/AnomaliesView';
import RisquesView from './views/RisquesView';
import CreditRiskView from './views/CreditRiskView';
import ApiConnectorsView from './views/ApiConnectorsView';
import XaiView from './views/XaiView';
import FraudEngineView from './views/FraudEngineView';
import ChatbotView from './views/ChatbotView';
import MonitoringView from './components/MonitoringView';
import SettingsView from './components/SettingsView';
import type { TranslationKey } from './i18n/translations';

const tabTitles: Record<string, { title: TranslationKey; subtitle: TranslationKey }> = {
  dashboard:   { title: 'nav_dashboard',   subtitle: 'sub_dashboard' },
  kyc:         { title: 'nav_kyc',         subtitle: 'sub_kyc' },
  predictions: { title: 'nav_predictions', subtitle: 'sub_predictions' },
  modeles:     { title: 'nav_modeles',     subtitle: 'sub_modeles' },
  anomalies:   { title: 'nav_anomalies',   subtitle: 'sub_anomalies' },
  risques:     { title: 'nav_risques',     subtitle: 'sub_risques' },
  credit_risk: { title: 'nav_credit_risk', subtitle: 'sub_credit_risk' },
  fraude:      { title: 'nav_fraude',      subtitle: 'sub_fraude' },
  api:         { title: 'nav_api',         subtitle: 'sub_api' },
  xai:         { title: 'nav_xai',         subtitle: 'sub_xai' },
  chatbot:     { title: 'nav_chatbot',     subtitle: 'sub_chatbot' },
  monitoring:  { title: 'nav_monitoring',  subtitle: 'sub_monitoring' },
  parametres:  { title: 'nav_parametres',  subtitle: 'sub_parametres' },
};

import { AuthProvider, useAuth } from './AuthContext';
import LoginView from './views/LoginView';

function AppInner() {
  const { t, isRTL } = useLang();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (path === 'kyc') return 'kyc';
    return 'dashboard';
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const expected = activeTab === 'dashboard' ? '/' : `/${activeTab}`;
    if (window.location.pathname !== expected) {
      window.history.pushState(null, '', expected);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePop = () => {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      if (path === 'kyc') setActiveTab('kyc');
      else if (path === '') setActiveTab('dashboard');
    };
    const handleCustomNav = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('popstate', handlePop);
    window.addEventListener('riskvision:navigate', handleCustomNav);
    return () => {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('riskvision:navigate', handleCustomNav);
    };
  }, []);

  if (!user) {
    return <LoginView />;
  }

  const cfg = tabTitles[activeTab] || tabTitles.dashboard;

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardView setActiveTab={setActiveTab} />;
      case 'kyc':         return <KycEngineView />;
      case 'predictions': return <PredictionsView />;
      case 'modeles':     return <ModelesView />;
      case 'anomalies':   return <AnomaliesView />;
      case 'risques':     return <RisquesView />;
      case 'credit_risk': return <CreditRiskView />;
      case 'fraude':      return <FraudEngineView />;
      case 'api':         return <ApiConnectorsView />;
      case 'xai':         return <XaiView />;
      case 'chatbot':     return <ChatbotView />;
      case 'monitoring':  return <MonitoringView />;
      case 'parametres':  return <SettingsView />;
      default:            return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 selection:bg-[#006233]/40 selection:text-emerald-200">
      <div className="flag-bar w-full fixed top-0 left-0 right-0 z-50" />
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
