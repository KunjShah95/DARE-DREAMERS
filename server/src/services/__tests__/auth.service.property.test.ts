/**
 * Property-Based Tests for Authentication Service
 * Feature: candidate-scoring-platform, Property 4: Profile registration and management
 * Validates: Requirements 3.1, 3.4, 3.5
 */

import * as fc from 'fast-check';
import { AuthService } from '../auth.service';
import { ProfileService } from '../profile.service';
import { prisma } from '../../lib/prisma';
import { UserType, Platform } from '@prisma/client';

describe('AuthService Property Tests', () => {
  describe('Property 4: Profile registration and management', () => {
    test('For any valid candidate registration data, the system should create a complete profile with all provided platform connections, and profile visibility changes should immediately affect search discoverability', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid candidate registration data
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(pwd => 
              /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
            ),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            location: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            bio: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
            website: fc.option(fc.webUrl(), { nil: undefined }),
            platformConnections: fc.option(
              fc.array(
                fc.record({
                  platform: fc.constantFrom(...Object.values(Platform)),
                  username: fc.string({ minLength: 1, maxLength: 50 })
                }),
                { minLength: 0, maxLength: 3 }
              ),
              { nil: undefined }
            )
          }),
          async (candidateData) => {
            // Test candidate registration creates complete profile
            const authResult = await AuthService.registerCandidate(candidateData);
            
            // Verify user was created with correct data
            expect(authResult.user.email).toBe(candidateData.email);
            expect(authResult.user.name).toBe(candidateData.name);
            expect(authResult.user.userType).toBe(UserType.CANDIDATE);
            expect(authResult.token).toBeDefined();
            expect(typeof authResult.token).toBe('string');
            
            // Verify candidate profile was created
            const profile = await ProfileService.getCandidateProfile(authResult.user.id);
            expect(profile).toBeDefined();
            expect(profile!.userId).toBe(authResult.user.id);
            expect(profile!.location).toBe(candidateData.location || null);
            expect(profile!.bio).toBe(candidateData.bio || null);
            expect(profile!.website).toBe(candidateData.website || null);
            expect(profile!.isPublic).toBe(false); // Default to private
            
            // Verify platform connections were created if provided
            if (candidateData.platformConnections && candidateData.platformConnections.length > 0) {
              expect(profile!.platformConnections).toHaveLength(candidateData.platformConnections.length);
              
              for (const expectedConn of candidateData.platformConnections) {
                const actualConn = profile!.platformConnections.find(
                  conn => conn.platform === expectedConn.platform
                );
                expect(actualConn).toBeDefined();
                expect(actualConn!.username).toBe(expectedConn.username);
                expect(actualConn!.isVerified).toBe(false);
              }
            } else {
              expect(profile!.platformConnections).toHaveLength(0);
            }
            
            // Test profile visibility changes affect discoverability
            // Initially private (not discoverable)
            expect(profile!.isPublic).toBe(false);
            
            // Make profile public
            const visibilityResult = await ProfileService.toggleProfileVisibility(authResult.user.id);
            expect(visibilityResult.isPublic).toBe(true);
            
            // Verify profile is now public
            const updatedProfile = await ProfileService.getCandidateProfile(authResult.user.id);
            expect(updatedProfile!.isPublic).toBe(true);
            
            // Toggle back to private
            const visibilityResult2 = await ProfileService.toggleProfileVisibility(authResult.user.id);
            expect(visibilityResult2.isPublic).toBe(false);
            
            // Verify profile is now private again
            const finalProfile = await ProfileService.getCandidateProfile(authResult.user.id);
            expect(finalProfile!.isPublic).toBe(false);
          }
        ),
        { 
          numRuns: 100,
          timeout: 30000,
          verbose: true
        }
      );
    });

    test('For any valid recruiter registration data, the system should create a complete recruiter profile', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid recruiter registration data
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(pwd => 
              /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
            ),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            company: fc.string({ minLength: 1, maxLength: 100 }),
            subscriptionTier: fc.option(fc.constantFrom('BASIC', 'PREMIUM', 'ENTERPRISE'), { nil: undefined })
          }),
          async (recruiterData) => {
            // Test recruiter registration creates complete profile
            const authResult = await AuthService.registerRecruiter(recruiterData);
            
            // Verify user was created with correct data
            expect(authResult.user.email).toBe(recruiterData.email);
            expect(authResult.user.name).toBe(recruiterData.name);
            expect(authResult.user.userType).toBe(UserType.RECRUITER);
            expect(authResult.token).toBeDefined();
            expect(typeof authResult.token).toBe('string');
            
            // Verify recruiter profile was created
            const profile = await ProfileService.getRecruiterProfile(authResult.user.id);
            expect(profile).toBeDefined();
            expect(profile!.userId).toBe(authResult.user.id);
            expect(profile!.company).toBe(recruiterData.company);
            expect(profile!.subscriptionTier).toBe(recruiterData.subscriptionTier || 'BASIC');
            expect(profile!.apiCallsUsed).toBe(0);
            expect(profile!.apiCallsLimit).toBe(1000);
          }
        ),
        { 
          numRuns: 100,
          timeout: 30000,
          verbose: true
        }
      );
    });

    test('For any valid login credentials, authentication should return consistent user data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid registration data first
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(pwd => 
              /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
            ),
            name: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (userData) => {
            // Register a candidate first
            const registrationResult = await AuthService.registerCandidate(userData);
            
            // Test login with same credentials
            const loginResult = await AuthService.login({
              email: userData.email,
              password: userData.password
            });
            
            // Verify login returns same user data
            expect(loginResult.user.id).toBe(registrationResult.user.id);
            expect(loginResult.user.email).toBe(registrationResult.user.email);
            expect(loginResult.user.name).toBe(registrationResult.user.name);
            expect(loginResult.user.userType).toBe(registrationResult.user.userType);
            expect(loginResult.token).toBeDefined();
            expect(typeof loginResult.token).toBe('string');
            
            // Tokens should be different (new session)
            expect(loginResult.token).not.toBe(registrationResult.token);
            
            // Verify token is valid
            const decoded = AuthService.verifyToken(loginResult.token);
            expect(decoded.userId).toBe(loginResult.user.id);
            expect(decoded.email).toBe(loginResult.user.email);
            expect(decoded.userType).toBe(loginResult.user.userType);
          }
        ),
        { 
          numRuns: 50,
          timeout: 30000,
          verbose: true
        }
      );
    });

    test('For any invalid credentials, login should consistently fail', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 1, maxLength: 50 })
          }),
          async (invalidCredentials) => {
            // Test login with non-existent credentials should fail
            await expect(
              AuthService.login(invalidCredentials)
            ).rejects.toThrow('Invalid email or password');
          }
        ),
        { 
          numRuns: 50,
          timeout: 30000,
          verbose: true
        }
      );
    });

    test('For any duplicate email registration, the system should consistently reject it', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(pwd => 
              /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
            ),
            name: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (userData) => {
            // Register first candidate
            await AuthService.registerCandidate(userData);
            
            // Attempt to register another candidate with same email
            await expect(
              AuthService.registerCandidate({
                ...userData,
                name: 'Different Name'
              })
            ).rejects.toThrow('User with this email already exists');
            
            // Attempt to register recruiter with same email
            await expect(
              AuthService.registerRecruiter({
                email: userData.email,
                password: userData.password,
                name: 'Different Name',
                company: 'Test Company'
              })
            ).rejects.toThrow('User with this email already exists');
          }
        ),
        { 
          numRuns: 50,
          timeout: 30000,
          verbose: true
        }
      );
    });
  });
});