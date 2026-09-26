import express from 'express';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { montant, heure, localisation, beneficiaire, transactions24h, device, type_operation, sous_type, solde_avant, tentatives_precedentes } = req.body;

    let score = 10; // Base score
    const riskFactors: string[] = [];

    // 1. Montant
    if (montant > 500000) {
      score += 40;
      riskFactors.push(`Montant très élevé (${montant} DA)`);
    } else if (montant > 100000) {
      score += 20;
      riskFactors.push(`Montant élevé (${montant} DA)`);
    }

    // 2. Heure (assuming format "HH:MM")
    const hour = parseInt(heure?.split(':')[0] || '12');
    if (hour >= 0 && hour <= 5) {
      score += 20;
      riskFactors.push(`Transaction effectuée à une heure inhabituelle (${heure})`);
    }

    // 3. Localisation
    if (localisation && localisation.toLowerCase() !== 'algérie') {
      score += 15;
      riskFactors.push(`Localisation hors de la zone habituelle (${localisation})`);
    }

    // 4. Beneficiaire
    if (beneficiaire && beneficiaire.toLowerCase() === 'nouveau') {
      score += 15;
      riskFactors.push('Nouveau bénéficiaire');
    }

    // 5. Fréquence
    if (transactions24h > 10) {
      score += 30;
      riskFactors.push(`${transactions24h} transactions durant les dernières 24h`);
    } else if (transactions24h > 5) {
      score += 15;
      riskFactors.push('Fréquence de transactions élevée');
    }

    // 6. Device
    if (device && device.toLowerCase() === 'nouveau') {
      score += 15;
      riskFactors.push('Device jamais utilisé auparavant');
    }

    // 7. Types d'opérations (Virement, Retrait, etc.)
    if (type_operation) {
      if (type_operation.toLowerCase() === 'virement' && sous_type?.toLowerCase() === 'international') {
        score += 25;
        riskFactors.push('Virement international (risque de blanchiment / fuite de capitaux)');
      }
    }

    // 8. Ratio Montant / Solde
    if (montant && solde_avant && montant > (solde_avant * 0.9)) {
      score += 30;
      riskFactors.push('Montant de la transaction épuise presque le solde disponible (Risque de vidage)');
    }

    // 9. Tentatives précédentes
    if (tentatives_precedentes && tentatives_precedentes > 2) {
      score += 20;
      riskFactors.push(`Nombre de tentatives suspect (${tentatives_precedentes})`);
    }

    score = Math.max(0, Math.min(100, score));

    let riskLevel = '';
    let decision = '';
    if (score <= 35) {
      riskLevel = 'Low Risk';
      decision = 'ALLOW';
    } else if (score <= 65) {
      riskLevel = 'Medium Risk';
      decision = 'VERIFY';
    } else if (score <= 90) {
      riskLevel = 'High Risk';
      decision = 'HOLD';
    } else {
      riskLevel = 'Critical';
      decision = 'BLOCK';
    }

    const explanation = `Fraud Score: ${score}/100 — ${riskLevel}.\nMain Risk Factors: ${riskFactors.length > 0 ? riskFactors.join(', ') : 'Aucun'}`;

    res.json({
      score,
      riskLevel,
      decision,
      riskFactors,
      explanation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
