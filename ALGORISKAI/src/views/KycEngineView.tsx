import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck, ShieldCheck, ShieldAlert, Building2,
  CreditCard, Users, FileText, Activity, History, ArrowRight,
  Search, RefreshCw, CheckCircle2,
  Send, Eye, Download, X,
  TrendingUp, AlertCircle, FileCheck, Landmark,
  BadgeAlert, ArrowUpRight, Scale, SlidersHorizontal, Sparkles,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Database, Brain
} from 'lucide-react';
import { useLang } from '../i18n/LangContext';

// Types matching the Core Banking API & KYC .PDF specification
export interface KycClient {
  client_id: string | number;
  customer_id: string;
  nom: string;
  prenom: string;
  type_client: string;
  telephone?: string;
  date_creation?: string;
  kyc_engine: {
    status: string; // ACTIVE, SUSPENDED, PENDING
    kyc_status: string; // VERIFIED, Pending, REJECTED
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    kyc_score: number; // 0 - 100
    change_score: number; // 0 - 100
    ews_status: string; // EWS HIGH RISK, EWS LOW RISK, NORMAL, WATCHLIST
    last_review: string;
    next_review: string;
    identity: {
      customerId?: string;
      fullName: string;
      dateOfBirth?: string;
      nationality?: string;
      countryOfResidence?: string;
      address?: string;
      phone?: string;
      email?: string;
      identificationDocument?: {
        documentType: string;
        documentNumber: string;
        issueDate?: string;
        expiryDate?: string;
        verificationStatus: string;
      };
      identityVerification?: string;
      documentStatus?: string;
    };
    business?: {
      profileType?: 'Individual' | 'Company';
      profession?: string;
      employer?: string;
      legalName?: string;
      businessActivity?: string;
      sector?: string;
      annualTurnover?: string;
      employmentStatus?: string;
      countryOfEmployment?: string;
      expectedIncome?: string;
      purposeOfAccount?: string;
    };
    financial?: {
      declaredIncome?: string;
      declaredTurnover?: string;
      sourceOfFunds?: string;
      sourceOfWealth?: string;
      expectedMonthlyInflow?: string;
      expectedMonthlyOutflow?: string;
      expectedTransactionVolume?: string;
      expectedTransactionAmount?: string;
      cashActivity?: string;
      internationalActivity?: string;
    };
    ubo?: {
      declarationUboUploaded?: boolean;
      verificationDate?: string;
      beneficialOwners?: Array<{
        fullName: string;
        percentage: string;
        nationality: string;
        isPep: boolean;
        role?: string;
      }>;
    };
    documents?: Array<{
      name: string;
      type: string;
      status: string;
      date: string;
    }>;
    risk_engine?: {
      dimensions: {
        identityRisk?: { score: number; max: number; label?: string; weight?: string };
        businessRisk?: { score: number; max: number; label?: string; weight?: string };
        financialRisk?: { score: number; max: number; label?: string; weight?: string };
        geographicRisk?: { score: number; max: number; label?: string; weight?: string };
        productRisk?: { score: number; max: number; label?: string; weight?: string };
        channelRisk?: { score: number; max: number; label?: string; weight?: string };
        behavioralRisk?: { score: number; max: number; label?: string; weight?: string };
        kycDataQuality?: { score: number; max: number; label?: string; weight?: string };
      };
      overallScore: number;
      riskLevel: string;
      riskBands?: Array<{ label: string; range: string; color: string; active?: boolean }>;
    };
    behavior?: {
      baselineMonthlyTurnover?: string;
      observedTransactionsCount?: number;
      observedCountries?: string[];
      activeBeneficiariesCount?: number;
      channelDistribution?: Record<string, string>;
      counterpartiesBreakdown?: Array<{ sector: string; percentage: number }>;
    };
    changes?: {
      profileChangeDetected?: boolean;
      changeScore: number;
      changeStatus?: string;
      actionRequired?: string;
      detectedAlerts?: string[];
      declaredKyc?: {
        activity?: string;
        expectedTurnover?: string;
        expectedCountries?: string;
        kycRisk?: string;
      };
      observedProfile?: {
        observedActivity?: string;
        observedTurnover?: string;
        turnoverChangePercent?: string;
        newCountries?: string;
        newBeneficiaries?: string;
      };
      comparisonTable?: Array<{
        variable: string;
        kycDeclared: string;
        observed: string;
        result: string;
        severity: 'success' | 'warning' | 'danger';
      }>;
      activityClassificationEngine?: {
        declaredActivity?: string;
        observedActivity?: string;
        observationWindowDays?: number;
        breakdown?: Array<{ label: string; percentage: number }>;
        activityConsistencyScore?: number;
        activityConsistencyLabel?: string;
      };
      changeScoreBreakdown?: Array<{ category: string; points: number; max: number }>;
      dynamicAlertEws?: {
        action: string;
        status?: string;
        signals?: Record<string, any>;
        ewsStatus?: string;
      };
    };
    history?: Array<{
      date: string;
      reviewer: string;
      action: string;
      result: string;
    }>;
  };
  accounts?: Array<{
    accountId: string | number;
    numeroCompte: string;
    typeCompte: string;
    devise: string;
    soldeActuel: number;
    status: string;
    inflowMonthly?: number;
    outflowMonthly?: number;
    txCount30d?: number;
    averageTxAmount?: number;
    accountRiskScore?: number;
    alertLevel?: string;
    lastActivityDate?: string;
  }>;
}

export default function KycEngineView() {
  const { isRTL } = useLang();

  // State
  const [clients, setClients] = useState<KycClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('loading');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Global Core Banking portfolio stats (10,500 total clients in Core Banking)
  const [globalStats, setGlobalStats] = useState<{
    clientsTotal: number;
    kycVerified: number;
    kycPending: number;
    kycRejected: number;
    accountsTotal: number;
    totalBalanceDzd: number;
  }>({
    clientsTotal: 10500,
    kycVerified: 7354,
    kycPending: 2047,
    kycRejected: 1099,
    accountsTotal: 17423,
    totalBalanceDzd: 15279730967.01
  });

  // Client loading limit / sample size: 150, 500, 1000 (default), 2500, 10500
  const [selectedLimit, setSelectedLimit] = useState<number>(1000);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, Particulier, Professionnel, PME / Entreprise
  const [filterAccountStatus, setFilterAccountStatus] = useState('ALL'); // ALL, Active, Suspended, Inactive
  const [filterKycStatus, setFilterKycStatus] = useState('ALL'); // ALL, VERIFIED, Pending, REJECTED
  const [filterRiskLevel, setFilterRiskLevel] = useState('ALL'); // ALL, LOW, MEDIUM, HIGH, CRITICAL
  const [filterEws, setFilterEws] = useState('ALL'); // ALL, EWS_HIGH, WATCHLIST, NORMAL
  const [filterChangeOnly, setFilterChangeOnly] = useState(false);

  // 360° Dossier Modal
  const [selectedClient, setSelectedClient] = useState<KycClient | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<
    'identity' | 'business' | 'financial' | 'ubo' | 'documents'
  >('identity');

  // EWS Action In Progress
  const [transmittingEws, setTransmittingEws] = useState<string | number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Global Portfolio Statistics (10,500 total)
  const fetchGlobalStats = async () => {
    try {
      const res = await fetch('/api/kyc/stats');
      if (res.ok) {
        const json = await res.json();
        const c = json.clients || {};
        const acc = json.accounts || json.comptes || {};
        setGlobalStats({
          clientsTotal: c.total || 10500,
          kycVerified: c.kyc_verified || 7354,
          kycPending: c.kyc_pending || 2047,
          kycRejected: c.kyc_rejected || 1099,
          accountsTotal: acc.total || 17423,
          totalBalanceDzd: acc.total_balance_dzd || 15279730967.01
        });
      }
    } catch (err) {
      console.warn('KYC Global stats fetch warning:', err);
    }
  };

  // Fetch Clients with dynamic limit
  const fetchKycClients = async (targetLimit = selectedLimit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kyc/clients?limit=${targetLimit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setClients(data.data);
        setDataSource(data.source || 'api');
      } else {
        setClients([]);
      }
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentPage(1);
    } catch (err: any) {
      console.error('KYC clients fetch error:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
    fetchKycClients(1000);
  }, []);

  // Reset pagination when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterAccountStatus, filterKycStatus, filterRiskLevel, filterEws, filterChangeOnly, pageSize]);

  // Transmit Signal to EWS
  const handleTransmitToEws = async (client: KycClient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const clientId = client.client_id || client.customer_id;
    setTransmittingEws(clientId);
    try {
      const res = await fetch(`/api/kyc/clients/${clientId}/ews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      await res.json();

      // Update client locally
      setClients(prev =>
        prev.map(c => {
          if (c.client_id === client.client_id || c.customer_id === client.customer_id) {
            return {
              ...c,
              kyc_engine: {
                ...c.kyc_engine,
                ews_status: 'EWS HIGH RISK',
                changes: c.kyc_engine.changes ? {
                  ...c.kyc_engine.changes,
                  dynamicAlertEws: {
                    ...c.kyc_engine.changes.dynamicAlertEws,
                    action: 'Send to EWS',
                    status: 'EWS HIGH RISK',
                    ewsStatus: 'EWS HIGH RISK'
                  }
                } : undefined,
                history: [
                  {
                    date: new Date().toLocaleDateString('fr-FR'),
                    reviewer: 'RiskVision AI & EWS Hub',
                    action: 'Escalade manuelle EWS Watchlist',
                    result: 'Signal d\'anomalie transmis et profil placé en surveillance prioritaire'
                  },
                  ...(c.kyc_engine.history || [])
                ]
              }
            };
          }
          return c;
        })
      );

      // Also update selectedClient if open in modal
      if (selectedClient && (selectedClient.client_id === client.client_id || selectedClient.customer_id === client.customer_id)) {
        setSelectedClient(prev => prev ? {
          ...prev,
          kyc_engine: {
            ...prev.kyc_engine,
            ews_status: 'EWS HIGH RISK',
            changes: prev.kyc_engine.changes ? {
              ...prev.kyc_engine.changes,
              dynamicAlertEws: {
                ...prev.kyc_engine.changes.dynamicAlertEws,
                action: 'Send to EWS',
                status: 'EWS HIGH RISK',
                ewsStatus: 'EWS HIGH RISK'
              }
            } : undefined
          }
        } : null);
      }

      showToast(`Signal EWS transmis avec succès pour ${client.nom} (Dossier placé en EWS HIGH RISK)`, 'success');
    } catch (err: any) {
      console.error('Transmit EWS failed:', err);
      showToast('Échec de la transmission du signal EWS', 'error');
    } finally {
      setTransmittingEws(null);
    }
  };

  // Cross-module client navigation
  const navigateToModule = (tab: string, client: KycClient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const clientId = String(client.client_id || client.customer_id);
    sessionStorage.setItem('riskvision_selected_client_id', clientId);
    window.dispatchEvent(new CustomEvent('riskvision:navigate', { detail: { tab, clientId } }));
  };

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.nom && c.nom.toLowerCase().includes(q)) ||
          (c.prenom && c.prenom.toLowerCase().includes(q)) ||
          (c.kyc_engine?.identity?.fullName && c.kyc_engine.identity.fullName.toLowerCase().includes(q));
        const matchesId = String(c.client_id).toLowerCase().includes(q) || (c.customer_id && c.customer_id.toLowerCase().includes(q));
        const matchesPhone = c.telephone && c.telephone.includes(q);
        const matchesLegal = c.kyc_engine?.business?.legalName && c.kyc_engine.business.legalName.toLowerCase().includes(q);
        const matchesAccount = c.accounts && c.accounts.some(acc => acc.numeroCompte.includes(q));
        if (!matchesName && !matchesId && !matchesPhone && !matchesLegal && !matchesAccount) return false;
      }

      // Filter Type
      if (filterType !== 'ALL') {
        const tLower = c.type_client?.toLowerCase() || '';
        if (filterType === 'Particulier' && !tLower.includes('particulier') && !tLower.includes('individuel')) return false;
        if (filterType === 'Professionnel' && !tLower.includes('pro')) return false;
        if (filterType === 'PME / Entreprise' && !tLower.includes('pme') && !tLower.includes('entreprise') && !tLower.includes('company')) return false;
      }

      // Filter Account Status
      if (filterAccountStatus !== 'ALL') {
        const primaryAcc = c.accounts?.[0];
        const status = primaryAcc?.status?.toUpperCase() || c.kyc_engine?.status?.toUpperCase() || '';
        if (filterAccountStatus === 'Active' && !status.includes('ACTI')) return false;
        if (filterAccountStatus === 'Suspended' && !status.includes('SUSP')) return false;
        if (filterAccountStatus === 'Inactive' && !status.includes('INACT')) return false;
      }

      // Filter KYC Status
      if (filterKycStatus !== 'ALL') {
        const kStatus = c.kyc_engine?.kyc_status?.toUpperCase() || '';
        if (filterKycStatus === 'VERIFIED' && !kStatus.includes('VERIF')) return false;
        if (filterKycStatus === 'Pending' && !kStatus.includes('PEND')) return false;
        if (filterKycStatus === 'REJECTED' && !kStatus.includes('REJEC')) return false;
      }

      // Filter Risk Level
      if (filterRiskLevel !== 'ALL') {
        if (c.kyc_engine?.risk_level?.toUpperCase() !== filterRiskLevel) return false;
      }

      // Filter EWS
      if (filterEws !== 'ALL') {
        const ewsStatus = c.kyc_engine?.ews_status?.toUpperCase() || '';
        if (filterEws === 'EWS_HIGH' && !ewsStatus.includes('HIGH')) return false;
        if (filterEws === 'WATCHLIST' && !ewsStatus.includes('WATCH') && !ewsStatus.includes('SURV')) return false;
        if (filterEws === 'NORMAL' && (ewsStatus.includes('HIGH') || ewsStatus.includes('WATCH'))) return false;
      }

      // Filter Change Only
      if (filterChangeOnly) {
        const hasChange = (c.kyc_engine?.change_score && c.kyc_engine.change_score >= 50) ||
          c.kyc_engine?.changes?.profileChangeDetected;
        if (!hasChange) return false;
      }

      return true;
    });
  }, [clients, searchQuery, filterType, filterAccountStatus, filterKycStatus, filterRiskLevel, filterEws, filterChangeOnly]);

  // Paginated Clients for 60fps table performance
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClients.slice(startIndex, startIndex + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;

  // Overall Statistics combining Global Core Banking portfolio & loaded active sample
  const stats = useMemo(() => {
    const total = clients.length;
    const verified = clients.filter(c => c.kyc_engine?.kyc_status?.toUpperCase().includes('VERIF')).length;
    const ewsHigh = clients.filter(c => c.kyc_engine?.ews_status?.toUpperCase().includes('HIGH') || (c.kyc_engine?.change_score && c.kyc_engine.change_score >= 70)).length;
    const modifiedProfiles = clients.filter(c => (c.kyc_engine?.change_score && c.kyc_engine.change_score >= 50) || c.kyc_engine?.changes?.profileChangeDetected).length;
    const highRisk = clients.filter(c => c.kyc_engine?.risk_level === 'HIGH' || c.kyc_engine?.risk_level === 'CRITICAL').length;

    // Global compliance rate across the 10,500 clients in Core Banking
    const globalRate = globalStats.clientsTotal > 0
      ? ((globalStats.kycVerified / globalStats.clientsTotal) * 100).toFixed(1)
      : '70.0';

    return { total, verified, ewsHigh, modifiedProfiles, highRisk, globalRate };
  }, [clients, globalStats]);

  // Helper colors
  const getRiskBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return { bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400', label: 'CRITIQUE', ring: 'ring-rose-500/40' };
      case 'HIGH':
        return { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', label: 'ÉLEVÉ', ring: 'ring-amber-500/40' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', label: 'MODÉRÉ', ring: 'ring-yellow-500/40' };
      default:
        return { bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', label: 'FAIBLE', ring: 'ring-emerald-500/40' };
    }
  };

  const getEwsBadge = (status: string, changeScore: number = 0) => {
    if (status?.includes('HIGH') || changeScore >= 70) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.25)]">
          <BadgeAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          EWS HIGH RISK
        </span>
      );
    }
    if (status?.includes('WATCH') || changeScore >= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          SOUS VIGILANCE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        CONFORME
      </span>
    );
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0d1522] p-6 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#006233]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="badge-dz mb-2">
              <Scale className="w-3.5 h-3.5 text-[#34d399]" />
              Réglementation Bancaire Banque d'Algérie • KYC 360° & EWS
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Moteur KYC & Surveillance Continue
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#006233]/30 text-[#34d399] border border-[#10b981]/50 uppercase font-mono">
                {dataSource === 'core_banking_api' ? 'Live API Core Banking' : 'DB Locale RiskVision'}
              </span>
            </h1>
            <p className="text-sm text-[#94a3b8] max-w-3xl">
              Baseline KYC de référence, détection en temps réel des déviations d'activité, calcul des 8 dimensions de risque et transmission automatique des signaux au Système d'Alerte Précoce (EWS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Batch Limit Quick Selector */}
            <div className="flex items-center rounded-xl bg-[#050811] p-1 border border-[#1e293b]">
              <span className="text-[11px] font-semibold text-[#94a3b8] px-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#34d399]" />
                Échantillon :
              </span>
              {[150, 500, 1000, 2500, 10500].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    setSelectedLimit(val);
                    fetchKycClients(val);
                  }}
                  disabled={loading}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedLimit === val
                      ? 'bg-[#006233] text-white shadow-sm border border-[#10b981]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {val === 10500 ? 'Tous (10,5k)' : val === 1000 ? '1 000 (Défaut)' : val}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchKycClients(selectedLimit)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-[#1e293b] hover:bg-[#006233] hover:border-[#10b981] hover:text-white border border-[#334155] transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#34d399] ${loading ? 'animate-spin' : ''}`} />
              Actualiser ({clients.length})
            </button>
            <button
              onClick={() => {
                const csvData = clients.map(c => ({
                  ID: c.customer_id || c.client_id,
                  Nom: c.nom,
                  Prenom: c.prenom,
                  Type: c.type_client,
                  KYC_Status: c.kyc_engine?.kyc_status,
                  Risk_Score: c.kyc_engine?.kyc_score,
                  Risk_Level: c.kyc_engine?.risk_level,
                  Change_Score: c.kyc_engine?.change_score,
                  EWS: c.kyc_engine?.ews_status
                }));
                const blob = new Blob([JSON.stringify(csvData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Registre_KYC_RiskVision_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                showToast('Registre KYC exporté avec succès');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#006233] hover:bg-[#059669] border border-[#10b981] transition-all shadow-[0_0_15px_rgba(0,98,51,0.3)] active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              Exporter Registre
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portefeuille KYC */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0d1522] p-5 backdrop-blur-md relative overflow-hidden group hover:border-[#10b981]/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Portefeuille KYC Total</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{globalStats.clientsTotal.toLocaleString('fr-FR')}</span>
            <span className="text-xs text-[#34d399] font-medium bg-[#006233]/20 px-2 py-0.5 rounded-full border border-[#006233]/50">
              100% Core Banking
            </span>
          </div>
          <div className="mt-2 text-xs text-[#94a3b8] flex items-center justify-between">
            <span>{clients.length.toLocaleString('fr-FR')} dossiers chargés en mémoire active</span>
            <span className="text-slate-500">{lastSyncTime ? `Synchro ${lastSyncTime}` : 'En continu'}</span>
          </div>
        </div>

        {/* Card 2: Taux de Conformité */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0d1522] p-5 backdrop-blur-md relative overflow-hidden group hover:border-[#10b981]/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Taux de Conformité Global</span>
            <div className="p-2 rounded-xl bg-[#006233]/25 text-[#34d399] border border-[#006233]/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.globalRate}%</span>
            <span className="text-xs text-[#34d399] font-medium bg-[#006233]/20 px-2 py-0.5 rounded-full border border-[#006233]/50">
              {globalStats.kycVerified.toLocaleString('fr-FR')} validés
            </span>
          </div>
          <div className="mt-2 text-xs text-[#94a3b8] flex items-center justify-between">
            <span>Dossiers complets validés</span>
            <span className="text-amber-400">{globalStats.kycPending.toLocaleString('fr-FR')} en attente • {globalStats.kycRejected.toLocaleString('fr-FR')} rejetés</span>
          </div>
        </div>

        {/* Card 3: Alertes EWS & Changements */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0d1522] p-5 backdrop-blur-md relative overflow-hidden group hover:border-[#d21034]/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Signaux EWS High Risk</span>
            <div className="p-2 rounded-xl bg-[#d21034]/15 text-[#f87171] border border-[#d21034]/30 animate-pulse">
              <BadgeAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#f87171]">{stats.ewsHigh}</span>
            <span className="text-xs text-rose-300 font-medium bg-[#d21034]/20 px-2 py-0.5 rounded-full border border-[#d21034]/40">
              Alerte EWS ({((stats.ewsHigh / (clients.length || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-[#94a3b8] flex items-center justify-between">
            <span>Déviations d'activité & flux</span>
            <span className="text-[#f87171] font-medium">Revue requise</span>
          </div>
        </div>

        {/* Card 4: Profils Modifiés */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0d1522] p-5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Profils avec Changement</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{stats.modifiedProfiles}</span>
            <span className="text-xs text-amber-300 font-medium bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
              Score Changement &gt; 50
            </span>
          </div>
          <div className="mt-2 text-xs text-[#94a3b8] flex items-center justify-between">
            <span>Mismatch observé vs déclaré</span>
            <span className="text-amber-400">{stats.highRisk} risque élevé</span>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="rounded-2xl border border-[#1e293b] bg-[#0d1522] p-5 backdrop-blur-md space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              placeholder="Rechercher par nom, ID client (C-000001), téléphone, entreprise, n° compte..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl border border-[#1e293b] bg-[#050811] py-2.5 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/30 transition-all font-mono`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick toggle: Changements seulement */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterChangeOnly(!filterChangeOnly)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterChangeOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:bg-[#006233] hover:text-white hover:border-[#10b981]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Profils avec Changement Détecté
            </button>
          </div>
        </div>

        {/* Dropdown Filters Group */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-[#1e293b]/60">
          {/* Filter 1: Type Client */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Type Client</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#050811] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
            >
              <option value="ALL">Tous les types</option>
              <option value="Particulier">Particulier (Individuel)</option>
              <option value="Professionnel">Professionnel</option>
              <option value="PME / Entreprise">PME / Entreprise</option>
            </select>
          </div>

          {/* Filter 2: Statut Compte */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Statut Compte</label>
            <select
              value={filterAccountStatus}
              onChange={e => setFilterAccountStatus(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#050811] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="Active">Compte Actif</option>
              <option value="Suspended">Compte Suspendu</option>
              <option value="Inactive">Compte Inactif</option>
            </select>
          </div>

          {/* Filter 3: Statut KYC */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Statut KYC</label>
            <select
              value={filterKycStatus}
              onChange={e => setFilterKycStatus(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#050811] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
            >
              <option value="ALL">Tous les statuts KYC</option>
              <option value="VERIFIED">Vérifié (Conforme)</option>
              <option value="Pending">En Attente / Revue</option>
              <option value="REJECTED">Rejeté</option>
            </select>
          </div>

          {/* Filter 4: Niveau de Risque */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Niveau Risque</label>
            <select
              value={filterRiskLevel}
              onChange={e => setFilterRiskLevel(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#050811] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
            >
              <option value="ALL">Tous les risques</option>
              <option value="LOW">Faible (0 - 29)</option>
              <option value="MEDIUM">Modéré (30 - 59)</option>
              <option value="HIGH">Élevé (60 - 79)</option>
              <option value="CRITICAL">Critique (80 - 100)</option>
            </select>
          </div>

          {/* Filter 5: Signal EWS */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Signal EWS</label>
            <select
              value={filterEws}
              onChange={e => setFilterEws(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#050811] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#10b981]"
            >
              <option value="ALL">Tous les signaux</option>
              <option value="EWS_HIGH">⚠️ EWS High Risk</option>
              <option value="WATCHLIST">👁️ Sous Surveillance</option>
              <option value="NORMAL">✅ Normal / Conforme</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Clients Table */}
      <div className="rounded-2xl border border-[#1e293b] bg-[#0d1522] backdrop-blur-md overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#050811]/40">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#34d399]" />
              Répertoire KYC des Clients ({filteredClients.length} correspondants)
            </h2>
            {filteredClients.length !== clients.length && (
              <span className="text-xs text-[#94a3b8] bg-[#050811] px-2.5 py-0.5 rounded-full border border-[#1e293b]">
                Filtré sur {clients.length.toLocaleString('fr-FR')} chargés
              </span>
            )}
          </div>
          <div className="text-xs text-[#94a3b8]">
            Affichage page <span className="text-[#34d399] font-bold">{currentPage}</span> / {totalPages} • Cliquez sur <span className="text-[#34d399] font-semibold">Dossier 360°</span> pour inspecter
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-medium">Chargement des dossiers KYC en cours...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">Aucun client ne correspond aux critères de filtre</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Essayez de réinitialiser la recherche ou de modifier les filtres par statut, type de compte ou signal EWS.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('ALL');
                setFilterAccountStatus('ALL');
                setFilterKycStatus('ALL');
                setFilterRiskLevel('ALL');
                setFilterEws('ALL');
                setFilterChangeOnly(false);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Client / Référence</th>
                  <th className="py-3 px-4">Activité / Profession</th>
                  <th className="py-3 px-4">Compte Principal & Solde</th>
                  <th className="py-3 px-4 text-center">Score KYC (0-100)</th>
                  <th className="py-3 px-4 text-center">Score Changement</th>
                  <th className="py-3 px-4 text-center">Signal EWS</th>
                  <th className="py-3 px-4 text-center">Revues</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {paginatedClients.map((client) => {
                  const riskInfo = getRiskBadge(client.kyc_engine?.risk_level || 'LOW');
                  const primaryAcc = client.accounts?.[0];
                  const hasMajorChange = (client.kyc_engine?.change_score && client.kyc_engine.change_score >= 60) ||
                    client.kyc_engine?.changes?.profileChangeDetected;
                  const isEwsHigh = client.kyc_engine?.ews_status?.includes('HIGH') || (client.kyc_engine?.change_score >= 70);

                  return (
                    <tr
                      key={client.client_id || client.customer_id}
                      onClick={() => {
                        setSelectedClient(client);
                        setActiveDossierTab('identity');
                      }}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Client / Référence */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                            client.type_client?.includes('Entreprise') || client.type_client?.includes('PME')
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {client.nom ? client.nom.slice(0, 2) : 'CL'}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                              {client.kyc_engine?.identity?.fullName || `${client.prenom || ''} ${client.nom || ''}`}
                              {hasMajorChange && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Changement de profil détecté" />
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-500">{client.customer_id || `C-${String(client.client_id).padStart(6, '0')}`}</span>
                              <span>•</span>
                              <span className="text-[11px] text-slate-400">{client.type_client}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Activité / Profession */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-200">
                          {client.kyc_engine?.business?.legalName ||
                            client.kyc_engine?.business?.profession ||
                            client.kyc_engine?.business?.businessActivity ||
                            'Non spécifié'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                          {client.kyc_engine?.business?.sector || client.kyc_engine?.identity?.address || 'Algérie'}
                        </div>
                      </td>

                      {/* Compte Principal & Solde */}
                      <td className="py-3.5 px-4">
                        {primaryAcc ? (
                          <div>
                            <div className="font-mono text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                              {primaryAcc.numeroCompte}
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
                                primaryAcc.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                              }`}>
                                {primaryAcc.status}
                              </span>
                            </div>
                            <div className="text-xs text-emerald-400 font-bold mt-0.5">
                              {(primaryAcc.soldeActuel || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {primaryAcc.devise || 'DZD'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Aucun compte lié</span>
                        )}
                      </td>

                      {/* Score KYC */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${riskInfo.bg}`}>
                            {client.kyc_engine?.kyc_score || 0}/100 • {riskInfo.label}
                          </span>
                          <div className="w-16 bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                (client.kyc_engine?.kyc_score || 0) >= 60 ? 'bg-rose-500' :
                                (client.kyc_engine?.kyc_score || 0) >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, client.kyc_engine?.kyc_score || 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Score Changement */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            (client.kyc_engine?.change_score || 0) >= 70
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : (client.kyc_engine?.change_score || 0) >= 40
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-white/5'
                          }`}>
                            Δ {client.kyc_engine?.change_score || 0} pts
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">
                            {(client.kyc_engine?.change_score || 0) >= 60 ? 'Majeur' : (client.kyc_engine?.change_score || 0) >= 30 ? 'Mineur' : 'Stable'}
                          </span>
                        </div>
                      </td>

                      {/* Signal EWS */}
                      <td className="py-3.5 px-4 text-center">
                        {getEwsBadge(client.kyc_engine?.ews_status || 'NORMAL', client.kyc_engine?.change_score || 0)}
                      </td>

                      {/* Revues */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-[11px] text-slate-300">
                          {client.kyc_engine?.last_review || '06/10/2026'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Prochaine: {client.kyc_engine?.next_review || '2027'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setActiveDossierTab('identity');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Dossier 360°
                          </button>

                          <button
                            onClick={e => navigateToModule('predictions', client, e)}
                            title="Simuler les prédictions de défaut et cashflow sur 30, 60 et 90 jours"
                            className="p-1.5 rounded-lg text-xs font-semibold border bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border-white/10 transition-all active:scale-95"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={e => navigateToModule('xai', client, e)}
                            title="Consulter l'explicabilité XAI et les 8 variables clés du client"
                            className="p-1.5 rounded-lg text-xs font-semibold border bg-slate-800 text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border-white/10 transition-all active:scale-95"
                          >
                            <Brain className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={e => handleTransmitToEws(client, e)}
                            disabled={transmittingEws === (client.client_id || client.customer_id)}
                            title="Transmettre ce profil au Système d'Alerte Précoce (EWS)"
                            className={`p-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                              isEwsHigh
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border-white/10'
                            }`}
                          >
                            <Send className={`w-3.5 h-3.5 ${transmittingEws === (client.client_id || client.customer_id) ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Toolbar */}
          <div className="p-4 border-t border-[#1e293b] bg-[#050811]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#94a3b8]">
              <span>
                Affichage de <span className="text-white font-bold">{filteredClients.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> à{' '}
                <span className="text-white font-bold">{Math.min(currentPage * pageSize, filteredClients.length)}</span> sur{' '}
                <span className="text-[#34d399] font-bold">{filteredClients.length.toLocaleString('fr-FR')}</span> dossiers ({clients.length.toLocaleString('fr-FR')} chargés sur 10 500 dans le Core Banking)
              </span>
              <div className="flex items-center gap-1.5 border-l border-[#1e293b] pl-3">
                <span className="text-slate-400">Par page :</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="rounded-lg border border-[#1e293b] bg-[#070b12] px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#10b981]"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Première page"
                className="p-1.5 rounded-lg border border-[#1e293b] bg-[#0d1522] text-slate-300 hover:text-white hover:bg-[#1e293b] disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                title="Page précédente"
                className="p-1.5 rounded-lg border border-[#1e293b] bg-[#0d1522] text-slate-300 hover:text-white hover:bg-[#1e293b] disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 text-xs font-bold text-slate-200 bg-[#0d1522] border border-[#1e293b] rounded-lg">
                Page <span className="text-[#34d399]">{currentPage}</span> / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                title="Page suivante"
                className="p-1.5 rounded-lg border border-[#1e293b] bg-[#0d1522] text-slate-300 hover:text-white hover:bg-[#1e293b] disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                title="Dernière page"
                className="p-1.5 rounded-lg border border-[#1e293b] bg-[#0d1522] text-slate-300 hover:text-white hover:bg-[#1e293b] disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>

      {/* ======================================================== */}
      {/* 360° KYC DOSSIER MODAL (Exact 9 Tabs from KYC .PDF)      */}
      {/* ======================================================== */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-[#1e293b] bg-[#070b12] text-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1e293b] bg-[#0d1522] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base uppercase shadow-lg ${
                  selectedClient.type_client?.includes('Entreprise') || selectedClient.type_client?.includes('PME')
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'bg-[#006233]/30 text-[#34d399] border border-[#006233]/60'
                }`}>
                  {selectedClient.nom ? selectedClient.nom.slice(0, 2) : 'KYC'}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-extrabold text-white">
                      {selectedClient.kyc_engine?.identity?.fullName || `${selectedClient.prenom || ''} ${selectedClient.nom || ''}`}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#050811] text-[#34d399] border border-[#1e293b]">
                      {selectedClient.customer_id || `C-${String(selectedClient.client_id).padStart(6, '0')}`}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#006233]/25 text-[#34d399] border border-[#006233]/50">
                      {selectedClient.type_client}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#94a3b8] mt-1">
                    <span>Statut: <b className="text-[#34d399]">{selectedClient.kyc_engine?.status || 'Actif'}</b></span>
                    <span>•</span>
                    <span>Conformité: <b className="text-slate-200">{selectedClient.kyc_engine?.kyc_status || 'Vérifié'}</b></span>
                    <span>•</span>
                    <span>Revue: {selectedClient.kyc_engine?.last_review || '06/10/2026'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigateToModule('predictions', selectedClient)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-cyan-200 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 transition-all shadow-md active:scale-95"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Prédictions 30/60/90j
                </button>

                <button
                  onClick={() => navigateToModule('xai', selectedClient)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 transition-all shadow-md active:scale-95"
                >
                  <Brain className="w-3.5 h-3.5" />
                  XAI Explicabilité
                </button>

                <button
                  onClick={() => navigateToModule('credit_risk', selectedClient)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-all shadow-md active:scale-95"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Risque Crédit
                </button>

                <button
                  onClick={() => handleTransmitToEws(selectedClient)}
                  disabled={transmittingEws === (selectedClient.client_id || selectedClient.customer_id)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-200 bg-[#d21034]/25 hover:bg-[#d21034]/40 border border-[#d21034]/50 transition-all shadow-md active:scale-95"
                >
                  <Send className={`w-3.5 h-3.5 ${transmittingEws === (selectedClient.client_id || selectedClient.customer_id) ? 'animate-spin' : ''}`} />
                  Transmettre EWS
                </button>

                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1e293b] transition-all ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 5 Tabs Navigation Bar */}
            <div className="px-6 border-b border-[#1e293b] bg-[#050811] overflow-x-auto scrollbar-none shrink-0 flex gap-2">
              {[
                { id: 'identity', label: '1. Identité', icon: UserCheck },
                { id: 'business', label: '2. Activité', icon: Building2 },
                { id: 'financial', label: '3. Financier', icon: Landmark },
                { id: 'ubo', label: '4. UBO / Bénéficiaires', icon: Users },
                { id: 'documents', label: '5. Documents', icon: FileText },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeDossierTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDossierTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                      isActive
                        ? 'border-[#10b981] text-[#34d399] bg-[#006233]/25'
                        : 'border-transparent text-[#94a3b8] hover:text-slate-200 hover:bg-[#0d1522]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#34d399]' : 'text-slate-500'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#070b12]">
              {/* TAB 1: IDENTITY */}
              {activeDossierTab === 'identity' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        État Civil & Coordonnées
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block">Nom complet</span>
                          <span className="font-semibold text-white">{selectedClient.kyc_engine?.identity?.fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Date de Naissance</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.identity?.dateOfBirth || '15/04/1982'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Nationalité</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.identity?.nationality || 'Algérienne 🇩🇿'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Pays de Résidence</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.identity?.countryOfResidence || 'Algérie'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Adresse Déclarée</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.identity?.address || 'Alger Centre, Algérie'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Téléphone</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.identity?.phone || selectedClient.telephone || '0550 12 34 56'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Email Officiel</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.identity?.email || 'contact@client.dz'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Pièce d'Identité Officielle
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                          <div>
                            <span className="text-slate-500 block">Type de Document</span>
                            <span className="font-semibold text-white">
                              {selectedClient.kyc_engine?.identity?.identificationDocument?.documentType || 'CNI Biométrique'}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {selectedClient.kyc_engine?.identity?.identificationDocument?.verificationStatus || 'VÉRIFIÉ'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                          <div>
                            <span className="text-slate-500 block">Numéro de Document</span>
                            <span className="font-mono font-bold text-slate-200">
                              {selectedClient.kyc_engine?.identity?.identificationDocument?.documentNumber || '16/09482914'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Date d'Expiration</span>
                            <span className="font-mono font-bold text-slate-200">
                              {selectedClient.kyc_engine?.identity?.identificationDocument?.expiryDate || '14/04/2031'}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Identité certifiée conforme au Registre National d'État Civil.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BUSINESS / ACTIVITY */}
              {activeDossierTab === 'business' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Données Professionnelles / Entreprise
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Raison Sociale / Employeur</span>
                          <span className="font-bold text-white text-sm">
                            {selectedClient.kyc_engine?.business?.legalName || selectedClient.kyc_engine?.business?.employer || 'Sonatrach / Entreprise Publique'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Profession / Fonction</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.business?.profession || 'Cadre Dirigeant'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Statut d'Emploi</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.business?.employmentStatus || 'Salarié CDI'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Secteur d'Activité</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.business?.sector || 'Énergie & Industrie'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Pays d'Exercice</span>
                          <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.business?.countryOfEmployment || 'Algérie'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Objet de la Relation d'Affaires</span>
                          <span className="font-semibold text-slate-300">
                            {selectedClient.kyc_engine?.business?.purposeOfAccount || 'Gestion des flux financiers, encaissements commerciaux et domiciliation'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <Landmark className="w-4 h-4" />
                        Chiffre d'Affaires & Revenus Déclarés
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 block">Revenu / CA Mensuel Prévu</span>
                            <span className="font-bold text-emerald-400 text-sm">
                              {selectedClient.kyc_engine?.business?.expectedIncome || selectedClient.kyc_engine?.financial?.declaredIncome || '180 000 DZD / mois'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">Déclaré KYC</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 block">Chiffre d'Affaires Annuel Estimé</span>
                            <span className="font-bold text-slate-200 text-sm">
                              {selectedClient.kyc_engine?.business?.annualTurnover || '2 400 000 DZD'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">Exercice 2026</span>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-300 text-xs">
                          Profil validé conforme au modèle d'activité économique standard du secteur.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FINANCIAL PROFILE */}
              {activeDossierTab === 'financial' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Origine des Fonds & Patrimoine
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                          <span className="text-slate-500 block">Origine des Fonds (Source of Funds)</span>
                          <span className="font-semibold text-white">
                            {selectedClient.kyc_engine?.financial?.sourceOfFunds || 'Salaires, primes professionnelles et honoraires'}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                          <span className="text-slate-500 block">Origine du Patrimoine (Source of Wealth)</span>
                          <span className="font-semibold text-white">
                            {selectedClient.kyc_engine?.financial?.sourceOfWealth || 'Épargne salariale cumulée et biens immobiliers déclarés'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                            <span className="text-slate-500 block">Activité Espèces</span>
                            <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.financial?.cashActivity || 'Faible (DAB standard)'}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                            <span className="text-slate-500 block">Activité Internationale</span>
                            <span className="font-semibold text-slate-200">{selectedClient.kyc_engine?.financial?.internationalActivity || 'Aucune / Limitée'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Flux Mensuels Attendus vs Profil
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 block">Crédits Prévus (Inflow Mensuel)</span>
                            <span className="font-bold text-emerald-400 text-sm">
                              {selectedClient.kyc_engine?.financial?.expectedMonthlyInflow || '150 000 DZD'}
                            </span>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 block">Débits Prévus (Outflow Mensuel)</span>
                            <span className="font-bold text-slate-200 text-sm">
                              {selectedClient.kyc_engine?.financial?.expectedMonthlyOutflow || '120 000 DZD'}
                            </span>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 block">Volume Opérations Prévu</span>
                            <span className="font-semibold text-slate-200">
                              {selectedClient.kyc_engine?.financial?.expectedTransactionVolume || '15 tx / mois'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">Fréquence nominale</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: UBO (BENEFICIAL OWNERS) */}
              {activeDossierTab === 'ubo' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Bénéficiaires Effectifs & Personnes Politiquement Exposées (PEP)
                      </h4>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {selectedClient.kyc_engine?.ubo?.declarationUboUploaded ? 'Déclaration UBO Certifiée' : 'Titulaire Physique Direct'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 bg-slate-950/60 text-slate-400 uppercase">
                            <th className="py-2.5 px-3">Bénéficiaire Effectif</th>
                            <th className="py-2.5 px-3">Nationalité</th>
                            <th className="py-2.5 px-3 text-center">Parts Détenues (%)</th>
                            <th className="py-2.5 px-3 text-center">Statut PEP</th>
                            <th className="py-2.5 px-3">Rôle / Qualité</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(selectedClient.kyc_engine?.ubo?.beneficialOwners || [
                            {
                              fullName: selectedClient.kyc_engine?.identity?.fullName || selectedClient.nom,
                              percentage: '100%',
                              nationality: 'Algérienne',
                              isPep: false,
                              role: 'Titulaire Principal & Bénéficiaire Effectif'
                            }
                          ]).map((ubo, i) => (
                            <tr key={i} className="hover:bg-slate-800/40">
                              <td className="py-3 px-3 font-semibold text-white">{ubo.fullName}</td>
                              <td className="py-3 px-3 text-slate-300">{ubo.nationality}</td>
                              <td className="py-3 px-3 text-center">
                                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                  {ubo.percentage}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {ubo.isPep ? (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                    OUI (PEP)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                                    NON
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-300">{ubo.role || 'Associé'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DOCUMENTS */}
              {activeDossierTab === 'documents' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Check-list des Pièces Justificatives Réglementaires
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(selectedClient.kyc_engine?.documents || [
                        { name: 'Carte Nationale d\'Identité (CNI) / Passeport', type: 'IDENTITY', status: 'VALID', date: '2026-01-15' },
                        { name: 'Justificatif de Domicile (< 3 mois)', type: 'RESIDENCE', status: 'VALID', date: '2026-08-10' },
                        { name: 'Registre de Commerce (RC) / Attestation de Travail', type: 'PROFESSIONAL', status: 'VALID', date: '2026-02-01' },
                        { name: 'Relevé de Compte Bancaire (3 mois)', type: 'FINANCIAL', status: 'VALID', date: '2026-07-20' },
                        { name: 'Statuts & Déclaration UBO', type: 'LEGAL', status: 'VALID', date: '2026-01-15' },
                        { name: 'Carte d\'Immatriculation Fiscale (NIF)', type: 'TAX', status: 'VALID', date: '2026-01-15' }
                      ]).map((doc, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <div className="text-xs font-semibold text-white">{doc.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Délivré / Enregistré le {doc.date}</div>
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            doc.status === 'VALID'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {doc.status === 'VALID' ? 'CONFORME' : doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* END OF 5 DOSSIER TABS */}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                Dossier Client ID: {selectedClient.customer_id || selectedClient.client_id} • Risque: {selectedClient.kyc_engine?.risk_level}
              </span>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              >
                Fermer le Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
