import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/analyze/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await prisma.creditClient.findUnique({
      where: { client_id: clientId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Call the Python AI Pipeline with timeout and fallback
    let aiData: any = null;
    try {
      const aiResponse = await fetch('http://127.0.0.1:7676/predict/credit_risk_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(client),
        signal: AbortSignal.timeout(2000)
      });
      if (aiResponse.ok) {
        aiData = await aiResponse.json();
      }
    } catch (e) {
      // Python unavailable, fall back to algorithmic calculation
    }

    if (!aiData) {
      const revenu = client.revenu_mensuel_dzd || 85000;
      const echeance = client.echeance_mensuelle_dzd || 25000;
      const dti = Math.min(100, Math.round((echeance / Math.max(1, revenu)) * 100));
      const hasLate = (client.jours_retard || 0) > 0 || (client.impayes_dzd || 0) > 0;
      const pd = Math.min(95, Math.max(5, (hasLate ? 48 : 8) + (dti > 45 ? 25 : dti > 33 ? 12 : 4)));
      const score = Math.max(10, Math.min(95, 100 - pd));

      aiData = {
        score: score,
        score_pd: pd,
        pd_percentage: `${pd}%`,
        expected_loss: Math.round((client.montant_credit_dzd || 1000000) * (pd / 100) * 0.45),
        grade: score > 75 ? 'A' : score > 55 ? 'B' : score > 35 ? 'C' : 'D',
        decision: score > 60 ? 'ACCORD_FAVORABLE' : score > 40 ? 'ACCORD_SOUS_CONDITIONS' : 'REFUS_OU_GARANTIE_FORTE',
        facteurs: [
          `Ratio d'endettement: ${dti}%`,
          hasLate ? `Retard de paiement: ${client.jours_retard} jours` : 'Historique de remboursement impeccable',
          `Solde moyen: ${(client.solde_compte_dzd || 0).toLocaleString('fr-FR')} DZD`
        ]
      };
    }

    res.json({
      clientId: client.client_id,
      ...aiData
    });
  } catch (error) {
    console.error('Credit risk analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.creditClient.findMany({ take: 1000 });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
