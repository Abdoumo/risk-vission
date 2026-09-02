// ======================================================================
// DONNÉES SIMULÉES — Connecteurs API Systèmes Bancaires Algériens
// SIB (Système Interbancaire), GED, Core Banking (Temenos / Flexcube)
// ======================================================================

export type ConnectorStatus = 'connected' | 'degraded' | 'disconnected' | 'syncing';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface BankConnector {
  id: string;
  name: string;
  system: string;
  type: 'SIB' | 'GED' | 'CoreBanking' | 'CTP' | 'SWIFT' | 'RTGS' | 'REST';
  bank: string;
  status: ConnectorStatus;
  latency: number; // ms
  uptime: number;  // %
  requestsPerMin: number;
  lastSync: string;
  endpoint: string;
  authMethod: 'OAuth2' | 'API Key' | 'mTLS' | 'Basic' | 'JWT';
  dataVolume: string;
  errorRate: number; // %
  version: string;
  environment: 'Production' | 'Staging' | 'Dev';
  flows: FlowStat[];
}

export interface FlowStat {
  label: string;
  count: number;
  status: 'ok' | 'warn' | 'error';
  lastRun: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: HttpMethod;
  endpoint: string;
  connector: string;
  statusCode: number;
  latency: number;
  payload: string;
  level: LogLevel;
  message: string;
  requestId: string;
}

export interface ApiMetricPoint {
  time: string;
  sib: number;
  ged: number;
  corebanking: number;
  swift: number;
}

export interface DataFlow {
  id: string;
  source: string;
  destination: string;
  type: string;
  volume: number;
  frequency: string;
  lastExec: string;
  status: 'active' | 'paused' | 'error';
  transformation: string;
}

// -----------------------------------------------------------------------
// CONNECTEURS
// -----------------------------------------------------------------------
export const bankConnectors: BankConnector[] = [
  {
    id: 'sib-cpa',
    name: 'SIB — CPA Compensation',
    system: 'Système Interbancaire',
    type: 'SIB',
    bank: 'Crédit Populaire d\'Algérie',
    status: 'connected',
    latency: 38,
    uptime: 99.87,
    requestsPerMin: 342,
    lastSync: 'Il y a 12s',
    endpoint: 'https://sib.ba.dz/api/v3/compensation',
    authMethod: 'mTLS',
    dataVolume: '2.4 GB/j',
    errorRate: 0.04,
    version: 'v3.2.1',
    environment: 'Production',
    flows: [
      { label: 'Virements interbancaires', count: 14_820, status: 'ok',   lastRun: '14:32:05' },
      { label: 'Compensation chèques',     count: 3_412,  status: 'ok',   lastRun: '14:31:58' },
      { label: 'Rejets & retours',         count: 47,     status: 'warn', lastRun: '14:30:12' },
    ],
  },
  {
    id: 'sib-bna',
    name: 'SIB — BNA Règlements',
    system: 'Système Interbancaire',
    type: 'SIB',
    bank: 'Banque Nationale d\'Algérie',
    status: 'connected',
    latency: 52,
    uptime: 99.71,
    requestsPerMin: 218,
    lastSync: 'Il y a 28s',
    endpoint: 'https://sib.ba.dz/api/v3/bna/reglements',
    authMethod: 'mTLS',
    dataVolume: '1.8 GB/j',
    errorRate: 0.07,
    version: 'v3.2.1',
    environment: 'Production',
    flows: [
      { label: 'Règlements RTGS',          count: 8_940,  status: 'ok',   lastRun: '14:32:01' },
      { label: 'Transferts interbancaires', count: 5_230,  status: 'ok',   lastRun: '14:31:45' },
      { label: 'Incidents de paiement',    count: 12,     status: 'warn', lastRun: '14:29:00' },
    ],
  },
  {
    id: 'ged-badr',
    name: 'GED — BADR Documents',
    system: 'Gestion Électronique de Documents',
    type: 'GED',
    bank: 'Banque de l\'Agriculture et du Développement Rural',
    status: 'connected',
    latency: 124,
    uptime: 98.34,
    requestsPerMin: 89,
    lastSync: 'Il y a 2m',
    endpoint: 'https://ged.badr.dz/api/v2/documents',
    authMethod: 'OAuth2',
    dataVolume: '450 MB/j',
    errorRate: 0.21,
    version: 'v2.4.0',
    environment: 'Production',
    flows: [
      { label: 'Dossiers crédits',         count: 1_240,  status: 'ok',   lastRun: '14:30:00' },
      { label: 'Contrats & avenants',      count: 389,    status: 'ok',   lastRun: '14:28:30' },
      { label: 'Documents KYC',            count: 892,    status: 'warn', lastRun: '14:25:10' },
    ],
  },
  {
    id: 'ged-bea',
    name: 'GED — BEA Archivage',
    system: 'Gestion Électronique de Documents',
    type: 'GED',
    bank: 'Banque Extérieure d\'Algérie',
    status: 'syncing',
    latency: 187,
    uptime: 97.12,
    requestsPerMin: 54,
    lastSync: 'En cours...',
    endpoint: 'https://ged.bea.dz/api/v2/archives',
    authMethod: 'OAuth2',
    dataVolume: '280 MB/j',
    errorRate: 0.38,
    version: 'v2.3.5',
    environment: 'Production',
    flows: [
      { label: 'Archives commerce ext.',  count: 2_180,  status: 'ok',   lastRun: '14:20:00' },
      { label: 'Dossiers domiciliation',  count: 674,    status: 'warn', lastRun: '14:18:45' },
      { label: 'Rapports réglementaires', count: 45,     status: 'ok',   lastRun: '14:15:00' },
    ],
  },
  {
    id: 'core-temenos',
    name: 'Core Banking — Temenos T24',
    system: 'Core Banking System',
    type: 'CoreBanking',
    bank: 'Multi-banques (CPA, BNA, BADR)',
    status: 'connected',
    latency: 67,
    uptime: 99.93,
    requestsPerMin: 1_240,
    lastSync: 'Il y a 5s',
    endpoint: 'https://api.temenos.ba.dz/t24/v5',
    authMethod: 'JWT',
    dataVolume: '8.7 GB/j',
    errorRate: 0.02,
    version: 'v5.0.3',
    environment: 'Production',
    flows: [
      { label: 'Comptes & soldes',         count: 48_230, status: 'ok',   lastRun: '14:32:10' },
      { label: 'Transactions en temps réel',count: 12_450, status: 'ok',   lastRun: '14:32:08' },
      { label: 'Référentiels clients',     count: 94_120, status: 'ok',   lastRun: '14:32:00' },
      { label: 'Paramètres produits',      count: 840,    status: 'ok',   lastRun: '14:30:00' },
    ],
  },
  {
    id: 'core-flexcube',
    name: 'Core Banking — Flexcube',
    system: 'Core Banking System',
    type: 'CoreBanking',
    bank: 'Banque Al Baraka Algérie',
    status: 'degraded',
    latency: 312,
    uptime: 94.28,
    requestsPerMin: 178,
    lastSync: 'Il y a 8m',
    endpoint: 'https://flexcube.albaraka.dz/api/v3',
    authMethod: 'API Key',
    dataVolume: '1.2 GB/j',
    errorRate: 1.84,
    version: 'v3.1.0',
    environment: 'Production',
    flows: [
      { label: 'Comptes courants',         count: 18_420, status: 'warn',  lastRun: '14:24:00' },
      { label: 'Financement islamique',    count: 4_230,  status: 'error', lastRun: '14:20:00' },
      { label: 'Dépôts à terme',          count: 2_180,  status: 'warn',  lastRun: '14:22:30' },
    ],
  },
  {
    id: 'swift-ba',
    name: 'SWIFT — Banque d\'Algérie',
    system: 'SWIFT / RTGS',
    type: 'SWIFT',
    bank: 'Banque d\'Algérie',
    status: 'connected',
    latency: 22,
    uptime: 99.99,
    requestsPerMin: 94,
    lastSync: 'Il y a 3s',
    endpoint: 'https://swift.ba.dz/messaging/v1',
    authMethod: 'mTLS',
    dataVolume: '340 MB/j',
    errorRate: 0.00,
    version: 'v1.0.0',
    environment: 'Production',
    flows: [
      { label: 'Messages SWIFT MT103',    count: 1_840,  status: 'ok',   lastRun: '14:32:07' },
      { label: 'Confirmations MT202',     count: 620,    status: 'ok',   lastRun: '14:31:50' },
      { label: 'Rapports MT950',          count: 48,     status: 'ok',   lastRun: '14:30:00' },
    ],
  },
  {
    id: 'ctp-algerie',
    name: 'CTP — Trésor Public',
    system: 'Comptabilité Trésor',
    type: 'CTP',
    bank: 'Direction Générale du Trésor',
    status: 'disconnected',
    latency: 0,
    uptime: 89.14,
    requestsPerMin: 0,
    lastSync: 'Il y a 2h 14m',
    endpoint: 'https://ctp.mf.gov.dz/api/v1',
    authMethod: 'Basic',
    dataVolume: '120 MB/j',
    errorRate: 12.4,
    version: 'v1.2.0',
    environment: 'Production',
    flows: [
      { label: 'Recettes fiscales',       count: 0,      status: 'error', lastRun: '12:18:00' },
      { label: 'Dépenses publiques',      count: 0,      status: 'error', lastRun: '12:18:00' },
    ],
  },
];

// -----------------------------------------------------------------------
// LOGS API
// -----------------------------------------------------------------------
export const apiLogs: ApiLog[] = [
  { id: 'l1',  timestamp: '14:32:18.234', method: 'POST', endpoint: '/api/v3/compensation/batch',        connector: 'SIB — CPA',       statusCode: 200, latency: 38,  payload: '14,820 txn',  level: 'INFO',  message: 'Batch compensation OK — 14,820 virements traités',    requestId: 'req_8f2k9x' },
  { id: 'l2',  timestamp: '14:32:15.891', method: 'GET',  endpoint: '/t24/v5/accounts/balances',         connector: 'Core — Temenos',  statusCode: 200, latency: 67,  payload: '48,230 cpt',  level: 'INFO',  message: 'Soldes comptes récupérés en temps réel',               requestId: 'req_2m7n4p' },
  { id: 'l3',  timestamp: '14:32:12.445', method: 'GET',  endpoint: '/api/v2/documents/kyc?page=3',     connector: 'GED — BADR',      statusCode: 200, latency: 124, payload: '892 docs',    level: 'INFO',  message: 'Documents KYC récupérés — 892 fichiers',               requestId: 'req_4q8r2s' },
  { id: 'l4',  timestamp: '14:32:09.112', method: 'POST', endpoint: '/messaging/v1/swift/mt103',        connector: 'SWIFT — BA',      statusCode: 200, latency: 22,  payload: 'MT103 x12',  level: 'INFO',  message: 'Messages SWIFT MT103 envoyés avec succès',             requestId: 'req_7t5u3v' },
  { id: 'l5',  timestamp: '14:31:58.003', method: 'GET',  endpoint: '/api/v3/flexcube/accounts',        connector: 'Core — Flexcube', statusCode: 503, latency: 312, payload: 'timeout',    level: 'ERROR', message: 'Service indisponible — Timeout 312ms > seuil 250ms',   requestId: 'req_9w6x8y' },
  { id: 'l6',  timestamp: '14:31:45.667', method: 'PUT',  endpoint: '/api/v3/bna/reglements/confirm',  connector: 'SIB — BNA',       statusCode: 200, latency: 52,  payload: '8,940 rgl',  level: 'INFO',  message: 'Règlements RTGS confirmés — 8,940 opérations',         requestId: 'req_3a1b2c' },
  { id: 'l7',  timestamp: '14:31:32.889', method: 'POST', endpoint: '/api/v3/flexcube/islamic/finance', connector: 'Core — Flexcube', statusCode: 502, latency: 289, payload: 'error',      level: 'ERROR', message: 'Erreur financement islamique — Gateway timeout',        requestId: 'req_5d4e6f' },
  { id: 'l8',  timestamp: '14:31:15.234', method: 'GET',  endpoint: '/api/v2/archives/commerce-ext',   connector: 'GED — BEA',       statusCode: 206, latency: 187, payload: 'partial',    level: 'WARN',  message: 'Réponse partielle — synchronisation en cours (68%)',   requestId: 'req_7g8h9i' },
  { id: 'l9',  timestamp: '14:30:58.445', method: 'GET',  endpoint: '/api/v1/trésor/recettes',         connector: 'CTP — Trésor',    statusCode: 503, latency: 0,   payload: 'unreachable', level: 'ERROR', message: 'Connexion impossible — Hôte CTP inaccessible',          requestId: 'req_0j1k2l' },
  { id: 'l10', timestamp: '14:30:42.112', method: 'GET',  endpoint: '/t24/v5/customers/reference',      connector: 'Core — Temenos',  statusCode: 200, latency: 71,  payload: '94,120 clt', level: 'INFO',  message: 'Référentiels clients synchronisés — 94,120 entrées',   requestId: 'req_3m4n5o' },
  { id: 'l11', timestamp: '14:30:28.678', method: 'POST', endpoint: '/api/v3/compensation/reject',      connector: 'SIB — CPA',       statusCode: 200, latency: 41,  payload: '47 rejets',  level: 'WARN',  message: '47 rejets de chèques détectés — notification envoyée', requestId: 'req_6p7q8r' },
  { id: 'l12', timestamp: '14:30:12.003', method: 'GET',  endpoint: '/messaging/v1/swift/mt950',        connector: 'SWIFT — BA',      statusCode: 200, latency: 19,  payload: '48 rapports', level: 'INFO',  message: 'Rapports MT950 récupérés — 48 relevés',                requestId: 'req_9s0t1u' },
];

// -----------------------------------------------------------------------
// MÉTRIQUES TEMPORELLES
// -----------------------------------------------------------------------
export function genererApiMetrics(): ApiMetricPoint[] {
  const data: ApiMetricPoint[] = [];
  for (let i = 0; i < 60; i++) {
    const h = Math.floor(i / 6);
    const m = (i % 6) * 10;
    data.push({
      time: `${String(8 + h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
      sib:         Math.round(20  + Math.sin(i/8) * 15  + (i % 10)),
      ged:         Math.round(8   + Math.sin(i/5) * 4   + (i % 5)),
      corebanking: Math.round(60  + Math.sin(i/6) * 25  + (i % 15)),
      swift:       Math.round(6   + Math.sin(i/10) * 3  + (i % 3)),
    });
  }
  return data;
}

// -----------------------------------------------------------------------
// FLUX DE DONNÉES
// -----------------------------------------------------------------------
export const dataFlows: DataFlow[] = [
  { id: 'df1', source: 'Temenos T24',         destination: 'RiskVisionAI Engine',  type: 'Transactions RT',     volume: 12_450, frequency: 'Temps réel',  lastExec: '14:32:08', status: 'active', transformation: 'Normalisation + Feature Eng.' },
  { id: 'df2', source: 'SIB CPA/BNA',         destination: 'Risk Engine',        type: 'Données compensation', volume: 28_200, frequency: 'Toutes 5min', lastExec: '14:30:00', status: 'active', transformation: 'Agrégation + Calcul VaR' },
  { id: 'df3', source: 'GED BADR',             destination: 'Modèle Crédit',      type: 'Dossiers KYC',        volume: 892,    frequency: 'Horaire',     lastExec: '14:00:00', status: 'active', transformation: 'NLP + Extraction entités' },
  { id: 'df4', source: 'GED BEA',              destination: 'Archive IA',         type: 'Docs commerce ext.',  volume: 2_180,  frequency: 'Quotidien',   lastExec: '10:00:00', status: 'paused', transformation: 'OCR + Classification' },
  { id: 'df5', source: 'SWIFT BA',             destination: 'Monitoring Fraude',  type: 'Messages MT103/202',  volume: 2_460,  frequency: 'Temps réel',  lastExec: '14:32:07', status: 'active', transformation: 'Graph ML + Scoring' },
  { id: 'df6', source: 'Flexcube Al Baraka',   destination: 'Moteur Risque',      type: 'Financement islamique',volume: 4_230,  frequency: 'Toutes 15min',lastExec: '14:20:00', status: 'error',  transformation: 'Calcul Profit/Loss islamique' },
  { id: 'df7', source: 'CTP Trésor',           destination: 'Modèle Macro',       type: 'Données fiscales',    volume: 0,      frequency: 'Quotidien',   lastExec: '12:18:00', status: 'error',  transformation: 'Indicateurs macro DZ' },
  { id: 'df8', source: 'RiskVisionAI Prédictions',destination: 'Dashboards Risk Mgr',type: 'Scores & Alertes',   volume: 84_230, frequency: 'Temps réel',  lastExec: '14:32:10', status: 'active', transformation: 'XAI + Seuillage' },
];
