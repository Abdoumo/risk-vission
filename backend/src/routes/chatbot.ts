import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// RiskVision AI Chatbot Integration Endpoint
router.post('/ask', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const msgLower = message.toLowerCase();
    const chatHistory = history ? history.map((m: any) => m.content).join(" ") : "";
    const combinedContext = (msgLower + " " + chatHistory.toLowerCase());
    
    const allClients = await prisma.creditClient.findMany({ take: 500 });
    const allFrauds = await prisma.fraudHistoryItem.findMany({ take: 500 });
    
    const relevantClients = allClients.filter(c => 
      combinedContext.includes(c.nom.toLowerCase()) || 
      combinedContext.includes(c.client_id.toLowerCase())
    );

    const relevantFrauds = allFrauds.filter(f => 
      combinedContext.includes(f.entite.toLowerCase())
    );

    let dbContext = "Database Context:\n";
    if (relevantClients.length > 0) {
      dbContext += "Clients:\n" + JSON.stringify(relevantClients) + "\n";
    }
    if (relevantFrauds.length > 0) {
      dbContext += "Fraud Items:\n" + JSON.stringify(relevantFrauds) + "\n";
    }

    const fullPrompt = `${dbContext}\nConversation History:\n${chatHistory}\nUser: ${message}\nFinGPT Assistant:`;

    // Forward the request to the AI Pipeline (FinGPT)
    const aiResponse = await fetch('http://127.0.0.1:7676/chatbot/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: fullPrompt })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API returned status: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    res.json({
      reply: aiData.reply
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.json({
      reply: "Erreur de connexion à l'IA FinGPT. Veuillez vérifier les logs Python."
    });
  }
});

export default router;
