import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserType } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    userType: UserType;
  };
}

/**
 * Middleware to require authentication for protected routes
 */
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Malformed authorization header' });
    }

    // Verify JWT token
    const decoded = AuthService.verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to require candidate role
 */
export const requireCandidate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.userType !== UserType.CANDIDATE) {
    return res.status(403).json({ error: 'Candidate access required' });
  }

  next();
};

/**
 * Middleware to require recruiter role
 */
export const requireRecruiter = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.userType !== UserType.RECRUITER) {
    return res.status(403).json({ error: 'Recruiter access required' });
  }

  next();
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Try to verify token, but don't fail if invalid
    try {
      const decoded = AuthService.verifyToken(token);
      
      if (decoded && decoded.userId) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          userType: decoded.userType
        };
      }
    } catch (error) {
      // Token invalid, but continue without user
    }

    next();
  } catch (error) {
    console.error('Optional Auth Middleware Error:', error);
    next();
  }
};
