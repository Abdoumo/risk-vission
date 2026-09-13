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

    let score = 10; // Base score
    const aggFactors: string[] = [];
    const mitFactors: string[] = [];

    // 1. DTI
    let dti = 0;
    if (client.revenu_mensuel_dzd > 0) {
      dti = (client.echeance_mensuelle_dzd / client.revenu_mensuel_dzd) * 100;
    }
    if (dti > 50) {
      score += 40;
      aggFactors.push('un DTI très élevé');
    } else if (dti > 30) {
      score += 20;
      aggFactors.push('un DTI relativement élevé');
    } else if (dti < 20) {
      score -= 5;
      mitFactors.push('un DTI faible');
    }

    // 2. Solde
    if (client.solde_compte_dzd < 10000) {
      score += 15;
      aggFactors.push('un solde très faible');
    } else if (client.solde_compte_dzd > 300000) {
      score -= 10;
      mitFactors.push('un solde positif et stable');
    }

    // 3. Impayés
    if (client.impayes_dzd > 50000) {
      score += 35;
      aggFactors.push('des impayés importants');
    } else if (client.impayes_dzd > 0) {
      score += 15;
      aggFactors.push('des impayés existants');
    } else {
      mitFactors.push('l\'absence d\'impayés');
    }

    // 4. Retards
    if (client.jours_retard > 30) {
      score += 20;
      aggFactors.push('des retards de paiement importants');
    } else if (client.jours_retard > 0) {
      score += 10;
      aggFactors.push('quelques retards de paiement historiques');
    }

    // 5. Historique Bancaire
    if (client.classe_creance !== 'Saine' && client.classe_creance !== 'Non concernee') {
      score += 25;
      aggFactors.push('un historique bancaire défavorable');
    } else {
      mitFactors.push('un historique bancaire régulier');
    }

    // 6. Cashflow
    if (client.cashflow_dzd && client.cashflow_dzd < 0) {
      score += 20;
      aggFactors.push('un cashflow négatif');
    } else if (client.cashflow_dzd && client.cashflow_dzd > 50000) {
      score -= 10;
      mitFactors.push('un cashflow positif');
    }

    // 7. Overdraft
    if (client.overdraft === 'Frequent' || client.overdraft === 'Eleve') {
      score += 20;
      aggFactors.push('un recours fréquent au découvert bancaire');
    }

    // Ensure score is within 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    let riskLevel = '';
    let recommendation = '';
    if (score <= 24) {
      riskLevel = 'faible';
      recommendation = 'décision standard, aucun risque majeur n\'a été identifié.';
    } else if (score <= 49) {
      riskLevel = 'modéré';
      recommendation = 'analyse standard, situation acceptable mais nécessite une attention.';
    } else if (score <= 74) {
      riskLevel = 'élevé';
      recommendation = 'revue renforcée du dossier avant toute décision.';
    } else {
      riskLevel = 'critique';
      recommendation = 'revue manuelle obligatoire, risque critique détecté.';
    }

    let explanation = `L'analyse du profil client a produit un score de risque de ${score}/100, correspondant à un niveau de risque ${riskLevel}.`;
    if (aggFactors.length > 0) {
      explanation += ` Les principaux facteurs de risque identifiés sont ${aggFactors.join(', ')}.`;
    }
    if (mitFactors.length > 0) {
      explanation += ` Parmi les éléments favorables, on note ${mitFactors.join(', ')}.`;
    }
    explanation += ` Recommandation : ${recommendation}`;

    res.json({
      clientId: client.client_id,
      score,
      riskLevel,
      factors: {
        aggravating: aggFactors,
        mitigating: mitFactors
      },
      explanation,
      clientData: client
    });
  } catch (error) {
    console.error(error);
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
