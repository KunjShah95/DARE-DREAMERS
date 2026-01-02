import express, { Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Sync user from Supabase to local DB
router.post('/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Upsert user in local database
        const localUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email!,
                updatedAt: new Date(),
                // Add other fields to sync if needed
            },
            create: {
                id: user.id,
                email: user.email!,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        res.json({ status: 'synced', user: localUser });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});

// Get current user profile
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const localUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                scores: true,
                progress: true
            }
        });

        if (!localUser) {
            return res.status(404).json({ error: 'User not found in local database' });
        }

        res.json(localUser);
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

import { calculateUserScore } from '../services/scoring.service';

// Get user score
router.get('/:id/score', async (req, res) => {
    try {
        const { id } = req.params;
        const score = await calculateUserScore(id);
        res.json(score);
    } catch (error: any) {
        console.error('Score Fetch Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
