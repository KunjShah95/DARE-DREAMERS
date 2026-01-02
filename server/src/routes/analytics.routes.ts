import express from 'express';
import { calculateUserScore } from '../services/scoring.service';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Trigger Analysis
router.post('/analyze/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await calculateUserScore(userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Latest Score
router.get('/score/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const score = await prisma.score.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(score);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
