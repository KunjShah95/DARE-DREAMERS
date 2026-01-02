/**
 * Unit Tests for Authentication Service
 * Task 2.4: Write unit tests for authentication flows
 * Tests: Registration validation, JWT token generation/validation, error cases
 */

import { AuthService } from '../auth.service';
import { prisma } from '../../lib/prisma';
import { UserType, Platform } from '@prisma/client';

describe('AuthService Unit Tests', () => {
  // Clean up test data before each test
  beforeEach(async () => {
    await prisma.platformConnection.deleteMany();
    await prisma.candidateScore.deleteMany();
    await prisma.platformData.deleteMany();
    await prisma.candidateProfile.deleteMany();
    await prisma.savedSearch.deleteMany();
    await prisma.recruiterProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Password Hashing and Validation', () => {
    test('should hash password securely', async () => {
      const password = 'Test@123Password';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
    });

    test('should verify correct password against hash', async () => {
      const password = 'Test@123Password';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'Test@123Password';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword('WrongPassword@123', hash);
      expect(isValid).toBe(false);
    });

    test('should produce different hashes for same password', async () => {
      const password = 'Test@123Password';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // bcrypt uses random salt
    });
  });

  describe('Email Validation', () => {
    test('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.co.uk',
        'test123@sub.domain.com'
      ];

      validEmails.forEach(email => {
        expect(AuthService.validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@domain.com',
        'invalid@domain',
        'invalid @domain.com',
        'invalid@domain .com'
      ];

      invalidEmails.forEach(email => {
        expect(AuthService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    test('should accept strong passwords', () => {
      const strongPasswords = [
        'Test@123!',
        'SecureP@ss1',
        'Complex#Password9',
        'Str0ng!Pass'
      ];

      strongPasswords.forEach(password => {
        const result = AuthService.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject password shorter than 8 characters', () => {
      const result = AuthService.validatePassword('Aa1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject password without uppercase', () => {
      const result = AuthService.validatePassword('testpass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should reject password without lowercase', () => {
      const result = AuthService.validatePassword('TESTPASS1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should reject password without number', () => {
      const result = AuthService.validatePassword('TestPass!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should reject password without special character', () => {
      const result = AuthService.validatePassword('TestPass1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    test('should return multiple errors for weak password', () => {
      const result = AuthService.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('JWT Token Generation and Validation', () => {
    test('should generate valid JWT token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const userType = UserType.CANDIDATE;

      const token = AuthService.generateToken(userId, email, userType);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should verify and decode valid token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const userType = UserType.CANDIDATE;

      const token = AuthService.generateToken(userId, email, userType);
      const decoded = AuthService.verifyToken(token);
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.userType).toBe(userType);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('should reject invalid token', () => {
      expect(() => AuthService.verifyToken('invalid.token.here')).toThrow('Invalid or expired token');
    });

    test('should reject tampered token', () => {
      const token = AuthService.generateToken('user-id', 'test@example.com', UserType.CANDIDATE);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      
      expect(() => AuthService.verifyToken(tamperedToken)).toThrow('Invalid or expired token');
    });
  });

  describe('Candidate Registration', () => {
    test('should successfully register a candidate with minimal data', async () => {
      const result = await AuthService.registerCandidate({
        email: 'candidate@example.com',
        password: 'SecureP@ss1',
        name: 'Test Candidate'
      });

      expect(result.user.email).toBe('candidate@example.com');
      expect(result.user.name).toBe('Test Candidate');
      expect(result.user.userType).toBe(UserType.CANDIDATE);
      expect(result.token).toBeDefined();
    });

    test('should successfully register a candidate with all optional fields', async () => {
      const result = await AuthService.registerCandidate({
        email: 'fullcandidate@example.com',
        password: 'SecureP@ss1',
        name: 'Full Candidate',
        location: 'New York, USA',
        bio: 'Senior Developer',
        website: 'https://example.com',
        platformConnections: [
          { platform: Platform.GITHUB, username: 'testuser' },
          { platform: Platform.LINKEDIN, username: 'testlinkedin' }
        ]
      });

      expect(result.user.email).toBe('fullcandidate@example.com');
      expect(result.user.name).toBe('Full Candidate');
      expect(result.user.userType).toBe(UserType.CANDIDATE);
    });

    test('should reject duplicate email registration', async () => {
      await AuthService.registerCandidate({
        email: 'duplicate@example.com',
        password: 'SecureP@ss1',
        name: 'First User'
      });

      await expect(
        AuthService.registerCandidate({
          email: 'duplicate@example.com',
          password: 'AnotherP@ss1',
          name: 'Second User'
        })
      ).rejects.toThrow('User with this email already exists');
    });

    test('should create candidate profile with default private visibility', async () => {
      const result = await AuthService.registerCandidate({
        email: 'private@example.com',
        password: 'SecureP@ss1',
        name: 'Private User'
      });

      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: result.user.id }
      });

      expect(profile).toBeDefined();
      expect(profile!.isPublic).toBe(false);
    });
  });

  describe('Recruiter Registration', () => {
    test('should successfully register a recruiter', async () => {
      const result = await AuthService.registerRecruiter({
        email: 'recruiter@example.com',
        password: 'SecureP@ss1',
        name: 'Test Recruiter',
        company: 'Tech Corp'
      });

      expect(result.user.email).toBe('recruiter@example.com');
      expect(result.user.name).toBe('Test Recruiter');
      expect(result.user.userType).toBe(UserType.RECRUITER);
      expect(result.token).toBeDefined();
    });

    test('should create recruiter profile with default subscription tier', async () => {
      const result = await AuthService.registerRecruiter({
        email: 'newrecruiter@example.com',
        password: 'SecureP@ss1',
        name: 'New Recruiter',
        company: 'Startup Inc'
      });

      const profile = await prisma.recruiterProfile.findUnique({
        where: { userId: result.user.id }
      });

      expect(profile).toBeDefined();
      expect(profile!.subscriptionTier).toBe('BASIC');
      expect(profile!.apiCallsUsed).toBe(0);
      expect(profile!.apiCallsLimit).toBe(1000);
    });

    test('should reject duplicate email for recruiter', async () => {
      await AuthService.registerRecruiter({
        email: 'samemail@example.com',
        password: 'SecureP@ss1',
        name: 'First Recruiter',
        company: 'Company A'
      });

      await expect(
        AuthService.registerRecruiter({
          email: 'samemail@example.com',
          password: 'AnotherP@ss1',
          name: 'Second Recruiter',
          company: 'Company B'
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await AuthService.registerCandidate({
        email: 'logintest@example.com',
        password: 'LoginP@ss1',
        name: 'Login Test User'
      });
    });

    test('should successfully login with valid credentials', async () => {
      const result = await AuthService.login({
        email: 'logintest@example.com',
        password: 'LoginP@ss1'
      });

      expect(result.user.email).toBe('logintest@example.com');
      expect(result.user.name).toBe('Login Test User');
      expect(result.token).toBeDefined();
    });

    test('should reject login with wrong password', async () => {
      await expect(
        AuthService.login({
          email: 'logintest@example.com',
          password: 'WrongP@ss1'
        })
      ).rejects.toThrow('Invalid email or password');
    });

    test('should reject login with non-existent email', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'AnyP@ss1'
        })
      ).rejects.toThrow('Invalid email or password');
    });

    test('should generate new token on each login', async () => {
      const result1 = await AuthService.login({
        email: 'logintest@example.com',
        password: 'LoginP@ss1'
      });

      // Small delay to ensure different token timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      const result2 = await AuthService.login({
        email: 'logintest@example.com',
        password: 'LoginP@ss1'
      });

      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe('Get User By ID', () => {
    test('should return user by valid ID', async () => {
      const registration = await AuthService.registerCandidate({
        email: 'getuser@example.com',
        password: 'SecureP@ss1',
        name: 'Get User Test'
      });

      const user = await AuthService.getUserById(registration.user.id);

      expect(user).toBeDefined();
      expect(user!.email).toBe('getuser@example.com');
      expect(user!.name).toBe('Get User Test');
    });

    test('should return null for non-existent user ID', async () => {
      const user = await AuthService.getUserById('non-existent-uuid');
      expect(user).toBeNull();
    });
  });
});
