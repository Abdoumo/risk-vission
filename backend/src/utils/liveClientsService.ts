import { PrismaClient } from '@prisma/client';
import { evaluateCreditRiskAndXai, CreditClientData, CreditAnalysisResult } from './creditRiskEngine';

const prisma = new PrismaClient();

const CORE_BANKING_BASE_URL = 'http://69.57.163.97:4545/api/open';
const CORE_BANKING_API_KEY = 'riskvision_external_share_key_999';

export interface EnrichedLiveClient extends CreditClientData {
  id: string;
  customer_id: string;
  wilaya: string;
  ville: string;
  agence: string;
  secteur_activite: string;
  telephone?: string;
  credit_id?: string | number;
  taux_interet?: number;
  nombre_impayes?: number;
  provision_dzd?: number;
  date_credit?: string;
  credit_status?: string;
  evaluation?: CreditAnalysisResult;
  score?: number;
  riskLevel?: string;
  dti?: number;
  projections?: CreditAnalysisResult['projections'];
  source: string;
}

let cachedLiveClients: EnrichedLiveClient[] = [];
let lastFetchTimestamp = 0;
let isExpandingBackground = false;
const CACHE_TTL_MS = 300000; // 5 minutes

export function mapSingleClient(c: any, idx = 0, cr?: any): EnrichedLiveClient {
  const customerId = c.customer_id || `C-${String(c.client_id || idx + 1).padStart(6, '0')}`;
  const isCompany = c.type_client?.includes('Entreprise') || c.type_client?.includes('PME') || (idx % 3 === 0);
  const isEwsHigh = c.kyc_engine?.ews_status?.includes('HIGH') || (c.kyc_engine?.change_score && c.kyc_engine.change_score > 60);

  // Parse income
  let baseIncome = 85000;
  if (c.kyc_engine?.financial?.declaredIncome) {
    const num = parseFloat(String(c.kyc_engine.financial.declaredIncome).replace(/[^0-9.-]+/g, ''));
    if (!isNaN(num) && num > 0) baseIncome = num;
  } else if (isCompany) {
    baseIncome = 2800000;
  }

  // Parse balance
  let solde = 150000;
  if (c.accounts && c.accounts.length > 0 && c.accounts[0]?.soldeActuel !== undefined) {
    const num = parseFloat(String(c.accounts[0].soldeActuel));
    if (!isNaN(num)) solde = num;
  }

  // Credit values
  const montantCredit = cr
    ? parseFloat(String(cr.montant_initial || 1200000))
    : (isCompany ? 12000000 : 1500000);

  const mensualite = cr
    ? parseFloat(String(cr.mensualite || 28000))
    : Math.round(montantCredit * 0.032);

  const joursRetard = cr
    ? parseInt(String(cr.jours_retard || 0), 10)
    : (isEwsHigh ? 45 : 0);

  const nbImpayes = cr?.nombre_impayes !== undefined
    ? parseInt(String(cr.nombre_impayes), 10)
    : (isEwsHigh ? 2 : 0);

  const impayesDzd = nbImpayes > 0 ? Math.round(nbImpayes * mensualite) : (isEwsHigh ? 65000 : 0);

  const classeCreance = cr?.status === 'Defaulted' || joursRetard > 90
    ? 'Très_Défavorable'
    : (joursRetard > 30 || isEwsHigh ? 'Défavorable' : 'Courante');

  const addressParts = c.kyc_engine?.identity?.address ? String(c.kyc_engine.identity.address).split(',') : [];
  const wilaya = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : 'Alger';

  const clientData: CreditClientData = {
    client_id: customerId,
    nom: c.nom || 'Client',
    prenom: c.prenom || '',
    type_client: c.type_client || (isCompany ? 'PME/Entreprise' : 'Particulier'),
    statut_client: c.kyc_engine?.ews_status || 'Actif',
    type_compte: c.accounts?.[0]?.typeCompte || 'Courant Commercial',
    type_credit: cr?.type_credit || (isCompany ? 'Credit Entreprise' : 'Credit Consommation'),
    revenu_mensuel_dzd: Math.round(baseIncome),
    solde_compte_dzd: Math.round(solde),
    echeance_mensuelle_dzd: Math.round(mensualite),
    impayes_dzd: Math.round(impayesDzd),
    nombre_impayes: nbImpayes,
    jours_retard: joursRetard,
    cashflow_dzd: isEwsHigh ? -25000 : Math.round(baseIncome * 0.35),
    classe_creance: classeCreance,
    overdraft: isEwsHigh ? 'Frequent' : 'Aucun',
    montant_credit_dzd: Math.round(montantCredit),
    duree_credit_mois: cr?.duree_mois || 36
  };

  const evalRes = evaluateCreditRiskAndXai(clientData);

  return {
    ...clientData,
    id: customerId,
    customer_id: customerId,
    wilaya,
    ville: c.kyc_engine?.identity?.address || wilaya,
    agence: 'Agence Centrale SIB (Temenos)',
    secteur_activite: c.kyc_engine?.business?.sector || c.kyc_engine?.business?.businessActivity || 'Commerce & Services',
    telephone: c.telephone || '',
    credit_id: cr?.credit_id || `CR-${String(idx + 1).padStart(5, '0')}`,
    taux_interet: cr ? parseFloat(String(cr.taux_interet || 6.5)) : 6.5,
    provision_dzd: Math.round(impayesDzd * 0.5),
    date_credit: cr?.date_debut || '2025-06-15',
    credit_status: cr?.status || (isEwsHigh ? 'Under Review' : 'Active'),
    evaluation: evalRes,
    score: evalRes.score,
    riskLevel: evalRes.riskLevel,
    dti: evalRes.variables.dti.value,
    projections: evalRes.projections,
    source: 'Core Banking SIB (69.57.163.97)'
  };
}

/**
 * Fetch and harmonize clients & credits from Core Banking Open API
 */
export async function getLiveCoreBankingClients(forceRefresh = false): Promise<EnrichedLiveClient[]> {
  const now = Date.now();
  if (!forceRefresh && cachedLiveClients.length > 0 && cachedLiveClients[0]?.source?.includes('Core Banking') && (now - lastFetchTimestamp < CACHE_TTL_MS)) {
    return cachedLiveClients;
  }

  try {
    // Step 1: Rapidly fetch initial batch (up to 1,000 clients & 1,000 credits in ~3-4 seconds)
    const [clientsRes, creditsRes] = await Promise.all([
      fetch(`${CORE_BANKING_BASE_URL}/clients?limit=1000`, {
        headers: { 'x-api-key': CORE_BANKING_API_KEY },
        signal: AbortSignal.timeout(9000)
      }),
      fetch(`${CORE_BANKING_BASE_URL}/credits?limit=1000`, {
        headers: { 'x-api-key': CORE_BANKING_API_KEY },
        signal: AbortSignal.timeout(9000)
      })
    ]);

    let rawClients: any[] = [];
    if (clientsRes.ok) {
      const cJson = await clientsRes.json();
      rawClients = Array.isArray(cJson) ? cJson : (cJson.data || []);
    }

    let rawCredits: any[] = [];
    if (creditsRes.ok) {
      const crJson = await creditsRes.json();
      rawCredits = Array.isArray(crJson) ? crJson : (crJson.data || []);
    }

    const creditMap = new Map<string, any>();
    rawCredits.forEach((cr: any) => {
      if (cr.customer_id) creditMap.set(String(cr.customer_id), cr);
      if (cr.client_id) creditMap.set(String(cr.client_id), cr);
    });

    if (rawClients.length > 0) {
      const enriched = rawClients.map((c: any, idx: number) => {
        const customerId = c.customer_id || `C-${String(c.client_id || idx + 1).padStart(6, '0')}`;
        const cr = creditMap.get(customerId) || creditMap.get(String(c.client_id));
        return mapSingleClient(c, idx, cr);
      });

      cachedLiveClients = enriched;
      lastFetchTimestamp = now;

      // Trigger background expansion to 10,500 if not already expanding
      if (!isExpandingBackground && enriched.length < 10500) {
        expandClientsPoolInBackground();
      }

      return cachedLiveClients;
    }
  } catch (err) {
    console.warn('Failed to fetch clients from live Core Banking API, falling back to cache/DB:', err);
  }

  // Fallback 1: Return memory cache if present
  if (cachedLiveClients.length > 0) {
    return cachedLiveClients;
  }

  // Fallback 2: Local SQLite Prisma creditClient
  try {
    const dbClients = await prisma.creditClient.findMany({ take: 200 });
    if (dbClients && dbClients.length > 0) {
      const mapped: EnrichedLiveClient[] = dbClients.map((c: any) => {
        const evalRes = evaluateCreditRiskAndXai(c);
        return {
          ...c,
          id: c.client_id,
          customer_id: c.client_id,
          evaluation: evalRes,
          score: evalRes.score,
          riskLevel: evalRes.riskLevel,
          dti: evalRes.variables.dti.value,
          projections: evalRes.projections,
          source: 'Local SQLite Database'
        };
      });
      return mapped;
    }
  } catch (dbErr) {
    console.error('Error fetching fallback DB clients:', dbErr);
  }

  return [];
}

/**
 * Background expansion to fetch up to 10,500 clients asynchronously without blocking user UI
 */
async function expandClientsPoolInBackground() {
  if (isExpandingBackground) return;
  isExpandingBackground = true;

  try {
    const [clientsRes, creditsRes] = await Promise.all([
      fetch(`${CORE_BANKING_BASE_URL}/clients?limit=10500`, {
        headers: { 'x-api-key': CORE_BANKING_API_KEY },
        signal: AbortSignal.timeout(60000)
      }),
      fetch(`${CORE_BANKING_BASE_URL}/credits?limit=5000`, {
        headers: { 'x-api-key': CORE_BANKING_API_KEY },
        signal: AbortSignal.timeout(60000)
      })
    ]);

    if (clientsRes.ok) {
      const cJson = await clientsRes.json();
      const rawClients = Array.isArray(cJson) ? cJson : (cJson.data || []);
      
      let rawCredits: any[] = [];
      if (creditsRes.ok) {
        const crJson = await creditsRes.json();
        rawCredits = Array.isArray(crJson) ? crJson : (crJson.data || []);
      }

      const creditMap = new Map<string, any>();
      rawCredits.forEach((cr: any) => {
        if (cr.customer_id) creditMap.set(String(cr.customer_id), cr);
        if (cr.client_id) creditMap.set(String(cr.client_id), cr);
      });

      if (rawClients.length > cachedLiveClients.length) {
        cachedLiveClients = rawClients.map((c: any, idx: number) => {
          const customerId = c.customer_id || `C-${String(c.client_id || idx + 1).padStart(6, '0')}`;
          const cr = creditMap.get(customerId) || creditMap.get(String(c.client_id));
          return mapSingleClient(c, idx, cr);
        });
        lastFetchTimestamp = Date.now();
        console.log(`[CoreBanking] Successfully expanded in-memory cache to ${cachedLiveClients.length} clients`);
      }
    }
  } catch (err) {
    console.warn('[CoreBanking] Background expansion note:', err);
  } finally {
    isExpandingBackground = false;
  }
}

/**
 * Find single client by ID (supports 'C-000001', '1', etc.)
 */
export async function findLiveClientById(clientId: string): Promise<EnrichedLiveClient | null> {
  const all = await getLiveCoreBankingClients();
  const searchKey = clientId.trim().toLowerCase();
  
  const found = all.find(c => 
    c.client_id.toLowerCase() === searchKey ||
    c.customer_id.toLowerCase() === searchKey ||
    String(c.id).toLowerCase() === searchKey ||
    c.client_id.replace(/^C-0*/i, '') === searchKey.replace(/^C-0*/i, '')
  );

  if (found) return found;

  // Direct remote fetch for specific client if not found in current memory batch
  try {
    const resp = await fetch(`${CORE_BANKING_BASE_URL}/clients/${encodeURIComponent(clientId)}`, {
      headers: { 'x-api-key': CORE_BANKING_API_KEY },
      signal: AbortSignal.timeout(5000)
    });
    if (resp.ok) {
      const raw = await resp.json();
      const c = raw.data || raw;
      if (c) {
        const enriched = mapSingleClient(c, 0);
        // Cache this client so subsequent requests are instant
        cachedLiveClients.push(enriched);
        return enriched;
      }
    }
  } catch (e) {}

  return null;
}
