import express, { Request, Response } from 'express';
import { z } from 'zod';
import { ProfileService, PlatformConnectionUpdate } from '../services/profile.service';
import { Platform, UserType } from '@prisma/client';
import { 
  requireAuth, 
  requireCandidate, 
  requireRecruiter, 
  AuthenticatedRequest 
} from '../middleware/auth.middleware';

const router = express.Router();

// Validation schemas
const candidateProfileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().optional()
});

const recruiterProfileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().min(1).optional()
});

const platformConnectionSchema = z.object({
  platform: z.nativeEnum(Platform),
  username: z.string().min(1, 'Username is required')
});

const platformConnectionsUpdateSchema = z.object({
  connections: z.array(platformConnectionSchema)
});

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { userId, userType } = req.user;

    if (userType === UserType.CANDIDATE) {
      const profile = await ProfileService.getCandidateProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Candidate profile not found' });
      }

      res.json({
        userType: 'candidate',
        profile
      });
    } else if (userType === UserType.RECRUITER) {
      const profile = await ProfileService.getRecruiterProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Recruiter profile not found' });
      }

      res.json({
        userType: 'recruiter',
        profile
      });
    } else {
      res.status(400).json({ error: 'Invalid user type' });
    }

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/profile/candidate
 * Update candidate profile
 */
router.put('/candidate', requireAuth, requireCandidate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate request body
    const validationResult = candidateProfileUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const updates = validationResult.data;

    // Update profile
    const updatedProfile = await ProfileService.updateCandidateProfile(req.user.userId, updates);

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error: any) {
    console.error('Update Candidate Profile Error:', error);
    
    if (error.message === 'User is not a candidate') {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * PUT /api/profile/recruiter
 * Update recruiter profile
 */
router.put('/recruiter', requireAuth, requireRecruiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate request body
    const validationResult = recruiterProfileUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const updates = validationResult.data;

    // Update profile
    const updatedProfile = await ProfileService.updateRecruiterProfile(req.user.userId, updates);

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error: any) {
    console.error('Update Recruiter Profile Error:', error);
    
    if (error.message === 'User is not a recruiter') {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/profile/visibility/toggle
 * Toggle candidate profile visibility
 */
router.post('/visibility/toggle', requireAuth, requireCandidate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await ProfileService.toggleProfileVisibility(req.user.userId);

    res.json({
      message: 'Profile visibility updated',
      isPublic: result.isPublic
    });

  } catch (error: any) {
    console.error('Toggle Visibility Error:', error);
    
    if (error.message === 'Candidate profile not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

/**
 * GET /api/profile/platforms
 * Get platform connections for candidate
 */
router.get('/platforms', requireAuth, requireCandidate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const connections = await ProfileService.getPlatformConnections(req.user.userId);

    res.json({
      connections
    });

  } catch (error: any) {
    console.error('Get Platform Connections Error:', error);
    
    if (error.message === 'Candidate profile not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to get platform connections' });
  }
});

/**
 * PUT /api/profile/platforms
 * Update multiple platform connections
 */
router.put('/platforms', requireAuth, requireCandidate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate request body
    const validationResult = platformConnectionsUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { connections } = validationResult.data;

    // Validate each platform username
    for (const conn of connections) {
      const validation = ProfileService.validatePlatformUsername(conn.platform, conn.username);
      if (!validation.isValid) {
        return res.status(400).json({
          error: `Invalid ${conn.platform} username: ${validation.error}`
        });
      }
    }

    // Update connections
    const updatedConnections = await ProfileService.updatePlatformConnections(req.user.userId, connections);

    res.json({
      message: 'Platform connections updated successfully',
      connections: updatedConnections
    });

  } catch (error: any) {
    console.error('Update Platform Connections Error:', error);
    
    if (error.message === 'Candidate profile not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update platform connections' });
  }
});

/**
 * POST /api/profile/platforms/:platform
 * Add or update a single platform connection
 */
router.post('/platforms/:platform', requireAuth, requireCandidate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { platform } = req.params;
    const { username } = req.body;

    // Validate platform
    if (!Object.values(Platform).includes(platform as Platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const platformEnum = platform as Platform;

    // Validate username format
    const validation = ProfileService.validatePlatformUsername(platformEnum, username);
    if (!validation.isValid) {
      return res.status(400).json({
        error: `Invalid ${platform} username: ${validation.error}`
      });
    }

    // Add/update connection
    const connection = await ProfileService.upsertPlatformConnection(
      req.user.userId,
      platformEnum,
      username.trim()
    );

    res.json({
      message: 'Platform connection updated successfully',
      connection
    });

  } catch (error: any) {
    console.error('Upsert Platform Connection Error:', error);
    
    if (error.message === 'Candidate profile not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update platform connection' });
  }
});

/**
 * DELETE /api/profile/platforms/:platform
 * Remove a platform connection
 */
router.delete('/platforms/:platform', requireAuth, requireCandidate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { platform } = req.params;

    // Validate platform
    if (!Object.values(Platform).includes(platform as Platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const platformEnum = platform as Platform;

    // Remove connection
    await ProfileService.removePlatformConnection(req.user.userId, platformEnum);

    res.json({
      message: 'Platform connection removed successfully'
    });

  } catch (error: any) {
    console.error('Remove Platform Connection Error:', error);
    
    if (error.message === 'Candidate profile not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to remove platform connection' });
  }
});

export default router;