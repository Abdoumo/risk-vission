import express from 'express';
import { getLiveCoreBankingClients, findLiveClientById } from '../utils/liveClientsService';
import { evaluateCreditRiskAndXai } from '../utils/creditRiskEngine';

const router = express.Router();

router.get('/analyze/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await findLiveClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé dans le Core Banking API' });
    }

    const evaluation = client.evaluation || evaluateCreditRiskAndXai(client as any);

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

    const allClients = await getLiveCoreBankingClients();

    let filtered = allClients;
    if (search) {
      filtered = allClients.filter(c =>
        c.client_id.toLowerCase().includes(search) ||
        c.customer_id.toLowerCase().includes(search) ||
        c.nom.toLowerCase().includes(search) ||
        (c.prenom && c.prenom.toLowerCase().includes(search)) ||
        (c.type_client && c.type_client.toLowerCase().includes(search)) ||
        (c.secteur_activite && c.secteur_activite.toLowerCase().includes(search))
      );
    }

    res.json(filtered.slice(0, limit));
  } catch (error) {
    console.error('Failed to get credit risk clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

