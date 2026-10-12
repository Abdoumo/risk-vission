import express from 'express';
import { PrismaClient } from '@prisma/client';
import { evaluateCreditRiskAndXai, CreditClientData } from '../utils/creditRiskEngine';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/analyze/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    let client = await prisma.creditClient.findUnique({
      where: { client_id: clientId }
    });

    if (!client) {
      // Try searching in Core Banking API or fallback
      const baseUrl = 'http://69.57.163.97:4545/api/open';
      const apiKey = 'riskvision_external_share_key_999';
      try {
        const resp = await fetch(`${baseUrl}/clients/${clientId}`, {
          headers: { 'x-api-key': apiKey },
          signal: AbortSignal.timeout(3000)
        });
        if (resp.ok) {
          const raw = await resp.json();
          const c = raw.data || raw;
          if (c) {
            client = {
              id: String(c.client_id || clientId),
              client_id: String(c.customer_id || c.client_id || clientId),
              type_client: c.type_client || 'Particulier',
              nom: c.nom || 'Client',
              prenom: c.prenom || '',
              wilaya: c.kyc_engine?.identity?.address?.split(',')?.pop()?.trim() || 'Alger',
              ville: c.kyc_engine?.identity?.address || 'Alger',
              agence: 'Agence Centrale SIB',
              secteur_activite: c.kyc_engine?.business?.sector || 'Commerce & Services',
              type_compte: c.accounts?.[0]?.typeCompte || 'Courant Commercial',
              solde_compte_dzd: c.accounts?.[0]?.soldeActuel || 150000,
              revenu_mensuel_dzd: parseFloat(String(c.kyc_engine?.financial?.declaredIncome || '85000').replace(/[^0-9.-]+/g, '')) || 85000,
              type_credit: 'Credit_Consommation',
              montant_credit_dzd: 1200000,
              duree_credit_mois: 36,
              echeance_mensuelle_dzd: 28000,
              impayes_dzd: c.kyc_engine?.ews_status?.includes('HIGH') ? 65000 : 0,
              jours_retard: c.kyc_engine?.ews_status?.includes('HIGH') ? 45 : 0,
              classe_creance: c.kyc_engine?.ews_status?.includes('HIGH') ? 'Défavorable' : 'Courante',
              provision_dzd: 0,
              date_credit: '2026-01-15',
              statut_client: c.kyc_engine?.ews_status || 'Actif',
              cashflow_dzd: c.kyc_engine?.ews_status?.includes('HIGH') ? -15000 : 35000,
              overdraft: c.kyc_engine?.ews_status?.includes('HIGH') ? 'Frequent' : 'Aucun'
            } as any;
          }
        }
      } catch (err) {}
    }

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const evaluation = evaluateCreditRiskAndXai(client as any);

    res.json({
      ...evaluation,
      clientData: {
        ...client,
        dti: evaluation.variables.dti.value
      }
    });
  } catch (error) {
    console.error('Credit risk analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const search = (req.query.search as string || '').trim().toLowerCase();
    const limit = Math.min(10500, parseInt(req.query.limit as string) || 1000);

    let whereClause: any = {};
    if (search) {
      whereClause = {
        OR: [
          { client_id: { contains: search } },
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const clients = await prisma.creditClient.findMany({
      where: whereClause,
      take: limit,
      orderBy: { nom: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
