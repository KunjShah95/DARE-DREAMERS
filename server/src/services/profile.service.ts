import { prisma } from '../lib/prisma';
import { ProfileUpdate } from '../types';
import { Platform, UserType } from '@prisma/client';

export interface PlatformConnectionUpdate {
  platform: Platform;
  username: string;
}

export class ProfileService {
  /**
   * Get candidate profile with platform connections
   */
  static async getCandidateProfile(userId: string) {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        platformConnections: true
      }
    });

    return profile;
  }

  /**
   * Get recruiter profile
   */
  static async getRecruiterProfile(userId: string) {
    return prisma.recruiterProfile.findUnique({
      where: { userId }
    });
  }

  /**
   * Update candidate profile
   */
  static async updateCandidateProfile(
    userId: string, 
    updates: ProfileUpdate
  ) {
    // First verify the user is a candidate
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.userType !== UserType.CANDIDATE) {
      throw new Error('User is not a candidate');
    }

    // Update the candidate profile
    const updatedProfile = await prisma.candidateProfile.update({
      where: { userId },
      data: {
        location: updates.location,
        bio: updates.bio,
        website: updates.website,
        isPublic: updates.isPublic,
        updatedAt: new Date()
      },
      include: {
        platformConnections: true
      }
    });

    // Also update user name if provided
    if (updates.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: updates.name }
      });
    }

    return updatedProfile;
  }

  /**
   * Update recruiter profile
   */
  static async updateRecruiterProfile(
    userId: string, 
    updates: { name?: string; company?: string }
  ) {
    // First verify the user is a recruiter
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.userType !== UserType.RECRUITER) {
      throw new Error('User is not a recruiter');
    }

    // Update the recruiter profile
    const updatedProfile = await prisma.recruiterProfile.update({
      where: { userId },
      data: {
        company: updates.company,
        updatedAt: new Date()
      }
    });

    // Also update user name if provided
    if (updates.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: updates.name }
      });
    }

    return updatedProfile;
  }

  /**
   * Add or update platform connection for a candidate
   */
  static async upsertPlatformConnection(
    userId: string,
    platform: Platform,
    username: string
  ) {
    // Get candidate profile
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    // Upsert platform connection
    const connection = await prisma.platformConnection.upsert({
      where: {
        candidateId_platform: {
          candidateId: candidateProfile.id,
          platform
        }
      },
      update: {
        username,
        isVerified: false, // Reset verification when username changes
        lastSynced: null
      },
      create: {
        candidateId: candidateProfile.id,
        platform,
        username,
        isVerified: false
      }
    });

    return connection;
  }

  /**
   * Remove platform connection for a candidate
   */
  static async removePlatformConnection(
    userId: string,
    platform: Platform
  ): Promise<void> {
    // Get candidate profile
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    // Delete platform connection
    await prisma.platformConnection.deleteMany({
      where: {
        candidateId: candidateProfile.id,
        platform
      }
    });
  }

  /**
   * Update multiple platform connections at once
   */
  static async updatePlatformConnections(
    userId: string,
    connections: PlatformConnectionUpdate[]
  ) {
    // Get candidate profile
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    // Use transaction to update all connections
    const result = await prisma.$transaction(async (tx) => {
      const updatedConnections = [];

      for (const conn of connections) {
        const connection = await tx.platformConnection.upsert({
          where: {
            candidateId_platform: {
              candidateId: candidateProfile.id,
              platform: conn.platform
            }
          },
          update: {
            username: conn.username,
            isVerified: false,
            lastSynced: null
          },
          create: {
            candidateId: candidateProfile.id,
            platform: conn.platform,
            username: conn.username,
            isVerified: false
          }
        });

        updatedConnections.push(connection);
      }

      return updatedConnections;
    });

    return result;
  }

  /**
   * Toggle candidate profile visibility
   */
  static async toggleProfileVisibility(userId: string): Promise<{ isPublic: boolean }> {
    // Get current profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Candidate profile not found');
    }

    // Toggle visibility
    const updatedProfile = await prisma.candidateProfile.update({
      where: { userId },
      data: {
        isPublic: !profile.isPublic,
        updatedAt: new Date()
      }
    });

    return { isPublic: updatedProfile.isPublic };
  }

  /**
   * Get all platform connections for a candidate
   */
  static async getPlatformConnections(userId: string) {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        platformConnections: true
      }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    return candidateProfile.platformConnections;
  }

  /**
   * Validate platform username format
   */
  static validatePlatformUsername(platform: Platform, username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: 'Username cannot be empty' };
    }

    const trimmedUsername = username.trim();

    switch (platform) {
      case Platform.GITHUB:
        // GitHub usernames can contain alphanumeric characters and hyphens
        // Cannot start or end with hyphen, cannot have consecutive hyphens
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername)) {
          return { isValid: false, error: 'Invalid GitHub username format' };
        }
        if (trimmedUsername.length > 39) {
          return { isValid: false, error: 'GitHub username too long (max 39 characters)' };
        }
        break;

      case Platform.TWITTER:
        // Twitter usernames can contain alphanumeric characters and underscores
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
          return { isValid: false, error: 'Invalid Twitter username format' };
        }
        if (trimmedUsername.length > 15) {
          return { isValid: false, error: 'Twitter username too long (max 15 characters)' };
        }
        break;

      case Platform.LINKEDIN:
        // LinkedIn usernames are more flexible
        if (trimmedUsername.length < 3 || trimmedUsername.length > 100) {
          return { isValid: false, error: 'LinkedIn username must be 3-100 characters' };
        }
        break;

      case Platform.MEDIUM:
      case Platform.HASHNODE:
      case Platform.DEVTO:
        // Blog platform usernames
        if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
          return { isValid: false, error: 'Invalid blog platform username format' };
        }
        break;

      default:
        return { isValid: false, error: 'Unsupported platform' };
    }

    return { isValid: true };
  }
}