/**
 * Property-based tests for database schema integrity
 * Feature: candidate-scoring-platform, Property 1: Database schema consistency
 * Validates: Requirements 3.1, 6.3, 6.4
 */

import fc from 'fast-check';
import { prisma } from '../lib/prisma';
import { UserType, Platform, SubscriptionTier } from '@prisma/client';

describe('Database Schema Integrity Properties', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data and disconnect
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.savedSearch.deleteMany();
    await prisma.platformData.deleteMany();
    await prisma.candidateScore.deleteMany();
    await prisma.platformConnection.deleteMany();
    await prisma.candidateProfile.deleteMany();
    await prisma.recruiterProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  /**
   * Property 1: Database schema consistency
   * For any valid user data, creating and retrieving should preserve all fields
   */
  test('Property 1: User creation and retrieval preserves data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          userType: fc.constantFrom(UserType.CANDIDATE, UserType.RECRUITER),
          passwordHash: fc.string({ minLength: 8, maxLength: 255 })
        }),
        async (userData) => {
          // Create user
          const createdUser = await prisma.user.create({
            data: userData
          });

          // Retrieve user
          const retrievedUser = await prisma.user.findUnique({
            where: { id: createdUser.id }
          });

          // Verify data integrity
          expect(retrievedUser).not.toBeNull();
          expect(retrievedUser!.email).toBe(userData.email);
          expect(retrievedUser!.name).toBe(userData.name);
          expect(retrievedUser!.userType).toBe(userData.userType);
          expect(retrievedUser!.passwordHash).toBe(userData.passwordHash);
          expect(retrievedUser!.id).toBe(createdUser.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Candidate profile with platform connections maintains referential integrity
   */
  test('Property 1: Candidate profile and platform connections referential integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user: fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            passwordHash: fc.string({ minLength: 8, maxLength: 255 })
          }),
          profile: fc.record({
            isPublic: fc.boolean(),
            location: fc.option(fc.string({ maxLength: 255 })),
            bio: fc.option(fc.string({ maxLength: 1000 })),
            website: fc.option(fc.webUrl())
          }),
          connections: fc.array(
            fc.record({
              platform: fc.constantFrom(...Object.values(Platform)),
              username: fc.string({ minLength: 1, maxLength: 100 }),
              isVerified: fc.boolean()
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async (testData) => {
          // Create user
          const user = await prisma.user.create({
            data: {
              ...testData.user,
              userType: UserType.CANDIDATE
            }
          });

          // Create candidate profile
          const profile = await prisma.candidateProfile.create({
            data: {
              ...testData.profile,
              userId: user.id
            }
          });

          // Create platform connections
          const connections = await Promise.all(
            testData.connections.map(conn =>
              prisma.platformConnection.create({
                data: {
                  ...conn,
                  candidateId: profile.id
                }
              })
            )
          );

          // Verify referential integrity
          const retrievedProfile = await prisma.candidateProfile.findUnique({
            where: { id: profile.id },
            include: {
              user: true,
              platformConnections: true
            }
          });

          expect(retrievedProfile).not.toBeNull();
          expect(retrievedProfile!.user.id).toBe(user.id);
          expect(retrievedProfile!.platformConnections).toHaveLength(testData.connections.length);
          
          // Verify each connection maintains integrity
          retrievedProfile!.platformConnections.forEach((conn, index) => {
            expect(conn.candidateId).toBe(profile.id);
            expect(conn.platform).toBe(testData.connections[index].platform);
            expect(conn.username).toBe(testData.connections[index].username);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Recruiter profile with saved searches maintains data consistency
   */
  test('Property 1: Recruiter profile and saved searches data consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user: fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            passwordHash: fc.string({ minLength: 8, maxLength: 255 })
          }),
          profile: fc.record({
            company: fc.string({ minLength: 1, maxLength: 255 }),
            subscriptionTier: fc.constantFrom(...Object.values(SubscriptionTier)),
            apiCallsUsed: fc.integer({ min: 0, max: 10000 }),
            apiCallsLimit: fc.integer({ min: 1000, max: 100000 })
          }),
          searches: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              queryParams: fc.record({
                keywords: fc.array(fc.string(), { maxLength: 3 }),
                minScore: fc.option(fc.integer({ min: 0, max: 100 }))
              })
            }),
            { maxLength: 3 }
          )
        }),
        async (testData) => {
          // Create user
          const user = await prisma.user.create({
            data: {
              ...testData.user,
              userType: UserType.RECRUITER
            }
          });

          // Create recruiter profile
          const profile = await prisma.recruiterProfile.create({
            data: {
              ...testData.profile,
              userId: user.id
            }
          });

          // Create saved searches
          const searches = await Promise.all(
            testData.searches.map(search =>
              prisma.savedSearch.create({
                data: {
                  ...search,
                  recruiterId: profile.id
                }
              })
            )
          );

          // Verify data consistency
          const retrievedProfile = await prisma.recruiterProfile.findUnique({
            where: { id: profile.id },
            include: {
              user: true,
              savedSearches: true
            }
          });

          expect(retrievedProfile).not.toBeNull();
          expect(retrievedProfile!.user.id).toBe(user.id);
          expect(retrievedProfile!.company).toBe(testData.profile.company);
          expect(retrievedProfile!.subscriptionTier).toBe(testData.profile.subscriptionTier);
          expect(retrievedProfile!.savedSearches).toHaveLength(testData.searches.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Cascade deletion maintains database integrity
   */
  test('Property 1: Cascade deletion maintains database integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          passwordHash: fc.string({ minLength: 8, maxLength: 255 })
        }),
        async (userData) => {
          // Create user with candidate profile
          const user = await prisma.user.create({
            data: {
              ...userData,
              userType: UserType.CANDIDATE,
              candidateProfile: {
                create: {
                  isPublic: true,
                  platformConnections: {
                    create: {
                      platform: Platform.GITHUB,
                      username: 'testuser',
                      isVerified: true
                    }
                  },
                  candidateScores: {
                    create: {
                      compositeScore: 85,
                      githubScore: 90,
                      strengths: ['coding'],
                      improvements: ['networking']
                    }
                  }
                }
              }
            },
            include: {
              candidateProfile: {
                include: {
                  platformConnections: true,
                  candidateScores: true
                }
              }
            }
          });

          const profileId = user.candidateProfile!.id;
          const connectionIds = user.candidateProfile!.platformConnections.map(c => c.id);
          const scoreIds = user.candidateProfile!.candidateScores.map(s => s.id);

          // Delete user (should cascade)
          await prisma.user.delete({
            where: { id: user.id }
          });

          // Verify cascade deletion worked
          const deletedProfile = await prisma.candidateProfile.findUnique({
            where: { id: profileId }
          });
          expect(deletedProfile).toBeNull();

          // Verify related records were also deleted
          for (const connId of connectionIds) {
            const deletedConnection = await prisma.platformConnection.findUnique({
              where: { id: connId }
            });
            expect(deletedConnection).toBeNull();
          }

          for (const scoreId of scoreIds) {
            const deletedScore = await prisma.candidateScore.findUnique({
              where: { id: scoreId }
            });
            expect(deletedScore).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});