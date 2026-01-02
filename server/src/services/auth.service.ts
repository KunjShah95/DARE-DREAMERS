import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { 
  CandidateRegistration, 
  RecruiterRegistration
} from '../types';
import { UserType, Platform, SubscriptionTier } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    userType: UserType;
  };
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   */
  static generateToken(userId: string, email: string, userType: UserType): string {
    return jwt.sign(
      { userId, email, userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Register a new candidate
   */
  static async registerCandidate(data: CandidateRegistration): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user and candidate profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          userType: UserType.CANDIDATE
        }
      });

      // Create candidate profile
      const candidateProfile = await tx.candidateProfile.create({
        data: {
          userId: user.id,
          location: data.location,
          bio: data.bio,
          website: data.website,
          isPublic: false // Default to private
        }
      });

      // Create platform connections if provided
      if (data.platformConnections && data.platformConnections.length > 0) {
        await tx.platformConnection.createMany({
          data: data.platformConnections.map(conn => ({
            candidateId: candidateProfile.id,
            platform: conn.platform,
            username: conn.username,
            isVerified: false
          }))
        });
      }

      return user;
    });

    // Generate token
    const token = this.generateToken(result.id, result.email, result.userType);

    return {
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        userType: result.userType
      },
      token
    };
  }

  /**
   * Register a new recruiter
   */
  static async registerRecruiter(data: RecruiterRegistration): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user and recruiter profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          userType: UserType.RECRUITER
        }
      });

      // Create recruiter profile
      await tx.recruiterProfile.create({
        data: {
          userId: user.id,
          company: data.company,
          subscriptionTier: data.subscriptionTier || SubscriptionTier.BASIC
        }
      });

      return user;
    });

    // Generate token
    const token = this.generateToken(result.id, result.email, result.userType);

    return {
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        userType: result.userType
      },
      token
    };
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email, user.userType);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType
      },
      token
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId }
    });
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}