/**
 * Data Aggregation and Scoring Service
 * Task 5.1: Create data aggregation service
 * Task 5.3: Implement core scoring algorithm
 * - Implement Digital_Profile aggregation from multiple platforms
 * - Create composite scoring engine with configurable weights
 * - Generate score breakdowns and improvement suggestions
 * Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { prisma } from '../lib/prisma';
import { Platform } from '@prisma/client';
import { 
  githubConnector, GitHubData,
  blogConnector, BlogData,
  twitterConnector, TwitterData,
  linkedInConnector, LinkedInData
} from './connectors';

// Aggregated digital profile
export interface DigitalProfile {
  candidateId: string;
  userId: string;
  name: string;
  platforms: {
    github?: GitHubData;
    linkedin?: LinkedInData;
    twitter?: TwitterData;
    devto?: BlogData;
    hashnode?: BlogData;
    medium?: BlogData;
  };
  aggregatedAt: Date;
}

// Scoring weights configuration
export interface ScoringWeights {
  github: number;
  linkedin: number;
  twitter: number;
  blog: number;
}

// Default scoring weights
export const DEFAULT_WEIGHTS: ScoringWeights = {
  github: 0.35,
  linkedin: 0.30,
  twitter: 0.15,
  blog: 0.20
};

// Composite score result
export interface CompositeScore {
  overallScore: number;
  githubScore: number | null;
  linkedinScore: number | null;
  blogScore: number | null;
  socialScore: number | null;
  breakdown: {
    platformScores: Record<string, number>;
    weights: ScoringWeights;
    platformsConnected: string[];
    platformsMissing: string[];
  };
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  calculatedAt: Date;
}

// Score update result
export interface ScoreUpdateResult {
  previous: CompositeScore | null;
  current: CompositeScore;
  changed: boolean;
  changeAmount: number;
}

export class AggregationService {
  private weights: ScoringWeights;

  constructor(weights: ScoringWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Aggregate all platform data for a candidate
   */
  async aggregateProfile(userId: string): Promise<DigitalProfile> {
    // Get candidate profile
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        platformConnections: true
      }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    const platforms: DigitalProfile['platforms'] = {};

    // Aggregate data from each connected platform
    for (const connection of candidateProfile.platformConnections) {
      try {
        switch (connection.platform) {
          case Platform.GITHUB:
            platforms.github = await githubConnector.getCachedData(candidateProfile.id) || undefined;
            break;
          case Platform.LINKEDIN:
            platforms.linkedin = await linkedInConnector.getCachedData(candidateProfile.id) || undefined;
            break;
          case Platform.TWITTER:
            platforms.twitter = await twitterConnector.getCachedData(candidateProfile.id) || undefined;
            break;
          case Platform.DEVTO:
            platforms.devto = await blogConnector.getCachedData(candidateProfile.id, Platform.DEVTO) || undefined;
            break;
          case Platform.HASHNODE:
            platforms.hashnode = await blogConnector.getCachedData(candidateProfile.id, Platform.HASHNODE) || undefined;
            break;
          case Platform.MEDIUM:
            platforms.medium = await blogConnector.getCachedData(candidateProfile.id, Platform.MEDIUM) || undefined;
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${connection.platform} data:`, error);
      }
    }

    return {
      candidateId: candidateProfile.id,
      userId: candidateProfile.userId,
      name: candidateProfile.user.name,
      platforms,
      aggregatedAt: new Date()
    };
  }

  /**
   * Fetch fresh data from all connected platforms
   */
  async refreshAllPlatformData(userId: string): Promise<DigitalProfile> {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        platformConnections: true
      }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    const platforms: DigitalProfile['platforms'] = {};

    // Fetch fresh data from each connected platform
    for (const connection of candidateProfile.platformConnections) {
      try {
        switch (connection.platform) {
          case Platform.GITHUB:
            platforms.github = await githubConnector.fetchAndStoreData(
              candidateProfile.id, 
              connection.username
            );
            break;
          case Platform.TWITTER:
            platforms.twitter = await twitterConnector.fetchAndStoreData(
              candidateProfile.id,
              connection.username
            );
            break;
          case Platform.DEVTO:
            platforms.devto = await blogConnector.fetchAndStoreData(
              candidateProfile.id,
              Platform.DEVTO,
              connection.username
            );
            break;
          case Platform.HASHNODE:
            platforms.hashnode = await blogConnector.fetchAndStoreData(
              candidateProfile.id,
              Platform.HASHNODE,
              connection.username
            );
            break;
          case Platform.MEDIUM:
            platforms.medium = await blogConnector.fetchAndStoreData(
              candidateProfile.id,
              Platform.MEDIUM,
              connection.username
            );
            break;
          case Platform.LINKEDIN:
            // LinkedIn uses manual data, so just get cached
            platforms.linkedin = await linkedInConnector.getCachedData(candidateProfile.id) || undefined;
            break;
        }
      } catch (error) {
        console.error(`Error refreshing ${connection.platform} data:`, error);
      }
    }

    return {
      candidateId: candidateProfile.id,
      userId: candidateProfile.userId,
      name: candidateProfile.user.name,
      platforms,
      aggregatedAt: new Date()
    };
  }

  /**
   * Calculate composite score from aggregated profile
   */
  calculateCompositeScore(profile: DigitalProfile): CompositeScore {
    const platformScores: Record<string, number> = {};
    const platformsConnected: string[] = [];
    const platformsMissing: string[] = [];
    const allRecommendations: string[] = [];
    const allStrengths: string[] = [];
    const allImprovements: string[] = [];

    // Extract GitHub score
    let githubScore: number | null = null;
    if (profile.platforms.github) {
      githubScore = profile.platforms.github.metrics.overallScore;
      platformScores['github'] = githubScore;
      platformsConnected.push('github');
      
      // Add recommendations and analyze strengths
      allRecommendations.push(...profile.platforms.github.metrics.recommendations);
      if (githubScore >= 70) allStrengths.push('Strong GitHub presence with quality code');
      if (githubScore < 50) allImprovements.push('Improve GitHub activity and project quality');
    } else {
      platformsMissing.push('github');
    }

    // Extract LinkedIn score
    let linkedinScore: number | null = null;
    if (profile.platforms.linkedin) {
      linkedinScore = profile.platforms.linkedin.metrics.overallScore;
      platformScores['linkedin'] = linkedinScore;
      platformsConnected.push('linkedin');
      
      allRecommendations.push(...profile.platforms.linkedin.metrics.recommendations);
      if (linkedinScore >= 70) allStrengths.push('Well-developed professional network');
      if (linkedinScore < 50) allImprovements.push('Enhance LinkedIn profile and connections');
    } else {
      platformsMissing.push('linkedin');
    }

    // Extract Twitter score
    let socialScore: number | null = null;
    if (profile.platforms.twitter) {
      socialScore = profile.platforms.twitter.metrics.overallScore;
      platformScores['twitter'] = socialScore;
      platformsConnected.push('twitter');
      
      allRecommendations.push(...profile.platforms.twitter.metrics.recommendations);
      if (socialScore >= 70) allStrengths.push('Strong social media engagement');
      if (socialScore < 50) allImprovements.push('Increase technical content on social media');
    } else {
      platformsMissing.push('twitter');
    }

    // Calculate combined blog score
    let blogScore: number | null = null;
    const blogScores: number[] = [];
    
    if (profile.platforms.devto) {
      blogScores.push(profile.platforms.devto.metrics.overallScore);
      platformScores['devto'] = profile.platforms.devto.metrics.overallScore;
      platformsConnected.push('devto');
      allRecommendations.push(...profile.platforms.devto.metrics.recommendations);
    }
    if (profile.platforms.hashnode) {
      blogScores.push(profile.platforms.hashnode.metrics.overallScore);
      platformScores['hashnode'] = profile.platforms.hashnode.metrics.overallScore;
      platformsConnected.push('hashnode');
      allRecommendations.push(...profile.platforms.hashnode.metrics.recommendations);
    }
    if (profile.platforms.medium) {
      blogScores.push(profile.platforms.medium.metrics.overallScore);
      platformScores['medium'] = profile.platforms.medium.metrics.overallScore;
      platformsConnected.push('medium');
      allRecommendations.push(...profile.platforms.medium.metrics.recommendations);
    }

    if (blogScores.length > 0) {
      blogScore = Math.round(blogScores.reduce((a, b) => a + b, 0) / blogScores.length);
      if (blogScore >= 70) allStrengths.push('Active content creator with quality blogs');
      if (blogScore < 50) allImprovements.push('Write more technical blog content');
    } else {
      platformsMissing.push('blog');
    }

    // Calculate weighted overall score
    let totalWeight = 0;
    let weightedSum = 0;

    if (githubScore !== null) {
      weightedSum += githubScore * this.weights.github;
      totalWeight += this.weights.github;
    }
    if (linkedinScore !== null) {
      weightedSum += linkedinScore * this.weights.linkedin;
      totalWeight += this.weights.linkedin;
    }
    if (socialScore !== null) {
      weightedSum += socialScore * this.weights.twitter;
      totalWeight += this.weights.twitter;
    }
    if (blogScore !== null) {
      weightedSum += blogScore * this.weights.blog;
      totalWeight += this.weights.blog;
    }

    // Calculate final score (normalize if not all platforms are connected)
    const overallScore = totalWeight > 0 
      ? Math.round(weightedSum / totalWeight)
      : 0;

    // Add general recommendations based on overall profile
    if (platformsMissing.length > 0) {
      allRecommendations.push(`Connect more platforms: ${platformsMissing.join(', ')}`);
    }

    // Deduplicate recommendations
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return {
      overallScore,
      githubScore,
      linkedinScore,
      blogScore,
      socialScore,
      breakdown: {
        platformScores,
        weights: this.weights,
        platformsConnected,
        platformsMissing
      },
      strengths: allStrengths,
      improvements: allImprovements,
      recommendations: uniqueRecommendations.slice(0, 10), // Limit to top 10
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate and store composite score for a candidate
   */
  async calculateAndStoreScore(userId: string): Promise<ScoreUpdateResult> {
    // Get candidate profile
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    // Get previous score
    const previousScoreRecord = await prisma.candidateScore.findFirst({
      where: { candidateId: candidateProfile.id },
      orderBy: { createdAt: 'desc' }
    });

    let previous: CompositeScore | null = null;
    if (previousScoreRecord) {
      previous = {
        overallScore: previousScoreRecord.compositeScore,
        githubScore: previousScoreRecord.githubScore,
        linkedinScore: previousScoreRecord.linkedinScore,
        blogScore: previousScoreRecord.blogScore,
        socialScore: previousScoreRecord.socialScore,
        breakdown: {
          platformScores: {},
          weights: this.weights,
          platformsConnected: [],
          platformsMissing: []
        },
        strengths: previousScoreRecord.strengths,
        improvements: previousScoreRecord.improvements,
        recommendations: [],
        calculatedAt: previousScoreRecord.createdAt
      };
    }

    // Aggregate profile and calculate new score
    const profile = await this.aggregateProfile(userId);
    const current = this.calculateCompositeScore(profile);

    // Store the new score
    await prisma.candidateScore.upsert({
      where: {
        id: previousScoreRecord?.id || ''
      },
      create: {
        candidateId: candidateProfile.id,
        compositeScore: current.overallScore,
        githubScore: current.githubScore,
        linkedinScore: current.linkedinScore,
        blogScore: current.blogScore,
        socialScore: current.socialScore,
        strengths: current.strengths,
        improvements: current.improvements
      },
      update: {
        compositeScore: current.overallScore,
        githubScore: current.githubScore,
        linkedinScore: current.linkedinScore,
        blogScore: current.blogScore,
        socialScore: current.socialScore,
        strengths: current.strengths,
        improvements: current.improvements,
        updatedAt: new Date()
      }
    });

    const changed = previous !== null && previous.overallScore !== current.overallScore;
    const changeAmount = previous !== null ? current.overallScore - previous.overallScore : current.overallScore;

    return {
      previous,
      current,
      changed,
      changeAmount
    };
  }

  /**
   * Get current score for a candidate
   */
  async getCurrentScore(userId: string): Promise<CompositeScore | null> {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      return null;
    }

    const scoreRecord = await prisma.candidateScore.findFirst({
      where: { candidateId: candidateProfile.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!scoreRecord) {
      return null;
    }

    // Rebuild full score from stored data
    const profile = await this.aggregateProfile(userId);
    return this.calculateCompositeScore(profile);
  }

  /**
   * Get score history for a candidate
   */
  async getScoreHistory(userId: string, limit = 10): Promise<CompositeScore[]> {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      return [];
    }

    const scores = await prisma.candidateScore.findMany({
      where: { candidateId: candidateProfile.id },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return scores.map(score => ({
      overallScore: score.compositeScore,
      githubScore: score.githubScore,
      linkedinScore: score.linkedinScore,
      blogScore: score.blogScore,
      socialScore: score.socialScore,
      breakdown: {
        platformScores: {},
        weights: this.weights,
        platformsConnected: [],
        platformsMissing: []
      },
      strengths: score.strengths,
      improvements: score.improvements,
      recommendations: [],
      calculatedAt: score.createdAt
    }));
  }

  /**
   * Refresh data and recalculate score
   */
  async refreshAndRecalculate(userId: string): Promise<ScoreUpdateResult> {
    await this.refreshAllPlatformData(userId);
    return this.calculateAndStoreScore(userId);
  }

  /**
   * Set custom scoring weights
   */
  setWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Get current weights
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }
}

export const aggregationService = new AggregationService();
