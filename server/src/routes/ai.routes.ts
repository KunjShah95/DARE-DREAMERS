
import express from 'express';
import { chatWithGemini, crawlPapers } from '../services/ai.service';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Crawl Papers
router.post('/crawl', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const results = await crawlPapers(query);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Chat with AI
router.post('/chat', async (req, res) => {
    try {
        const { userId, message, contextPapersIds } = req.body;
        if (!userId || !message) return res.status(400).json({ error: 'UserId and Message required' });

        const result = await chatWithGemini(userId, message, contextPapersIds);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Chat History
router.get('/history/:userId', async (req, res) => {
    try {
        const sessions = await prisma.chatSession.findMany({
            where: { userId: req.params.userId },
            include: { messages: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(sessions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
