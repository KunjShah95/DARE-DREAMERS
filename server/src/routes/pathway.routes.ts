
import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// List All Pathways
router.get('/', async (req, res) => {
    try {
        const pathways = await prisma.pathway.findMany();
        res.json(pathways);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Pathway Detail
router.get('/:id', async (req, res) => {
    try {
        const pathway = await prisma.pathway.findUnique({ where: { id: req.params.id } });
        if (!pathway) return res.status(404).json({ error: 'Pathway not found' });
        res.json(pathway);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Join Pathway
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const { id } = req.params;

        const progress = await prisma.userPathwayProgress.create({
            data: {
                userId,
                pathwayId: id,
                status: 'STARTED',
                progress: 0
            }
        });
        res.json(progress);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update Progress
router.post('/:id/progress', async (req, res) => {
    try {
        const { userId, progress: progressValue } = req.body; // 0-100
        const { id } = req.params;

        const updated = await prisma.userPathwayProgress.update({
            where: {
                userId_pathwayId: { userId, pathwayId: id }
            },
            data: {
                progress: progressValue,
                status: progressValue >= 100 ? 'COMPLETED' : 'STARTED'
            }
        });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
