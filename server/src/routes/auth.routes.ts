import express, { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { Platform, SubscriptionTier } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Validation schemas
const candidateRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  platformConnections: z.array(z.object({
    platform: z.nativeEnum(Platform),
    username: z.string().min(1, 'Username is required')
  })).optional()
});

const recruiterRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  subscriptionTier: z.nativeEnum(SubscriptionTier).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

/**
 * POST /api/auth/register/candidate
 * Register a new candidate
 */
router.post('/register/candidate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = candidateRegistrationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Additional password validation
    const passwordValidation = AuthService.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Register candidate
    const result = await AuthService.registerCandidate(data);

    res.status(201).json({
      message: 'Candidate registered successfully',
      ...result
    });

  } catch (error: any) {
    console.error('Candidate Registration Error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to register candidate' });
  }
});

/**
 * POST /api/auth/register/recruiter
 * Register a new recruiter
 */
router.post('/register/recruiter', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = recruiterRegistrationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Additional password validation
    const passwordValidation = AuthService.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Register recruiter
    const result = await AuthService.registerRecruiter(data);

    res.status(201).json({
      message: 'Recruiter registered successfully',
      ...result
    });

  } catch (error: any) {
    console.error('Recruiter Registration Error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to register recruiter' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const credentials = validationResult.data;

    // Login user
    const result = await AuthService.login(credentials);

    res.json({
      message: 'Login successful',
      ...result
    });

  } catch (error: any) {
    console.error('Login Error:', error);
    
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get full user details from database
    const user = await AuthService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Get Current User Error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * POST /api/auth/verify-token
 * Verify if a token is valid
 */
router.post('/verify-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType
      }
    });

  } catch (error) {
    console.error('Token Verification Error:', error);
    res.status(401).json({ 
      valid: false,
      error: 'Invalid or expired token' 
    });
  }
});

export default router;