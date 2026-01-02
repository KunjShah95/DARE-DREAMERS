import express, { Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
// Note: Since we are using Supabase Auth, "clearing sessions" is mostly a client-side action (killing the token).
// However, if we track active sessions in our DB or want to revoke tokens universally, we'd use Supabase Admin API.
// For now, consistent with the requirements, we'll implement a simple endpoint that could be expanded.

const router = express.Router();

router.post('/clear', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // In a stateless JWT/Supabase world, backend can't easily "invalidate" a token without RLS or Admin API.
        // But we can return success to let frontend know to clear local storage.

        // Optional: If we had a Session in our DB, we would delete it here.

        res.json({ status: 'cleared', message: 'Session cleared successfully' });
    } catch (error) {
        console.error('Session Clear Error:', error);
        res.status(500).json({ error: 'Failed to clear session' });
    }
});

export default router;
