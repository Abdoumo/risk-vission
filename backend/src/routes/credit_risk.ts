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

    // Call the Python AI Pipeline
    const aiResponse = await fetch('http://127.0.0.1:7676/predict/credit_risk_profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(client)
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API returned status: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Include the original clientId in the response
    res.json({
      clientId: client.client_id,
      ...aiData
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
