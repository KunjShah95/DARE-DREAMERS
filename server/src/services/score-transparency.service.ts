/**
 * Score Transparency and Reporting Service
 * Task 8: Implement score transparency and reporting
 * - Create detailed score breakdown display
 * - Generate comprehensive score reports
 * - Create historical score tracking
 * - Generate actionable improvement recommendations
 * - Implement score dispute submission and review
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { prisma } from '../lib/prisma';
import { Platform } from '@prisma/client';
import { aggregationService, CompositeScore } from './aggregation.service';

// Detailed score breakdown
export interface DetailedScoreBreakdown {
  candidateId: string;
  userId: string;
  name: string;
  overallScore: number;
  lastUpdated: Date;
  platformBreakdown: {
    github?: PlatformScoreDetail;
    linkedin?: PlatformScoreDetail;
    blog?: PlatformScoreDetail;
    social?: PlatformScoreDetail;
  };
  scoringFactors: ScoringFactor[];
  recommendations: Recommendation[];
  historicalTrend: ScoreHistoryPoint[];
}

// Platform-specific score detail
export interface PlatformScoreDetail {
  platform: string;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'not-connected';
  metrics: Record<string, number>;
  strengths: string[];
  areasForImprovement: string[];
}

// Scoring factor analysis
export interface ScoringFactor {
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  score: number;
  maxScore: number;
  recommendations: string[];
}

// Improvement recommendation
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'platform' | 'content' | 'engagement' | 'profile';
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'challenging';
  estimatedImpact: number; // Points improvement estimate
  platform?: string;
  actionSteps: string[];
  resources?: string[];
}

// Score history point
export interface ScoreHistoryPoint {
  date: Date;
  overallScore: number;
  githubScore?: number;
  linkedinScore?: number;
  blogScore?: number;
  socialScore?: number;
  notes?: string;
}

// Score dispute
export interface ScoreDispute {
  id: string;
  candidateId: string;
  type: 'data-inaccuracy' | 'calculation-error' | 'platform-missing' | 'other';
  description: string;
  status: 'pending' | 'in-review' | 'resolved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  resolution?: string;
  adminNotes?: string;
}

// Score report export
export interface ScoreReport {
  generatedAt: Date;
  reportType: 'detailed' | 'summary' | 'comparison';
  candidateInfo: {
    name: string;
    email: string;
    location?: string;
  };
  scores: DetailedScoreBreakdown;
  recommendations: Recommendation[];
  comparison?: {
    percentile: number;
    peerAverage: number;
    topPerformers: string[];
  };
}

export class ScoreTransparencyService {
  /**
   * Get detailed score breakdown for a candidate
   */
  async getDetailedScoreBreakdown(userId: string): Promise<DetailedScoreBreakdown | null> {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true } },
        candidateScores: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        platformConnections: true,
        platformData: {
          where: { dataType: 'metrics' }
        }
      }
    });

    if (!candidateProfile || candidateProfile.candidateScores.length === 0) {
      return null;
    }

    const score = candidateProfile.candidateScores[0];
    const profile = await aggregationService.aggregateProfile(userId);
    
    // Build platform breakdown
    const platformBreakdown: DetailedScoreBreakdown['platformBreakdown'] = {};
    
    if (profile.platforms.github) {
      platformBreakdown.github = this.buildPlatformDetail(
        'GitHub',
        score.githubScore,
        profile.platforms.github.metrics.overallScore,
        profile.platforms.github
      );
    }
    
    if (profile.platforms.linkedin) {
      platformBreakdown.linkedin = this.buildPlatformDetail(
        'LinkedIn',
        score.linkedinScore,
        profile.platforms.linkedin.metrics.overallScore,
        profile.platforms.linkedin
      );
    }
    
    // Calculate combined blog score
    const blogScores = [];
    if (profile.platforms.devto) blogScores.push(profile.platforms.devto.metrics.overallScore);
    if (profile.platforms.hashnode) blogScores.push(profile.platforms.hashnode.metrics.overallScore);
    if (profile.platforms.medium) blogScores.push(profile.platforms.medium.metrics.overallScore);
    
    if (blogScores.length > 0) {
      const avgBlogScore = Math.round(blogScores.reduce((a, b) => a + b, 0) / blogScores.length);
      platformBreakdown.blog = this.buildBlogDetail('Blog Platforms', avgBlogScore, profile.platforms);
    }
    
    if (profile.platforms.twitter) {
      platformBreakdown.social = this.buildPlatformDetail(
        'Social Media',
        score.socialScore,
        profile.platforms.twitter.metrics.overallScore,
        profile.platforms.twitter
      );
    }

    // Generate scoring factors
    const scoringFactors = this.generateScoringFactors(score, profile);

    // Generate recommendations
    const recommendations = this.generateRecommendations(score, profile, platformBreakdown);

    // Get historical trend
    const historicalTrend = await this.getScoreHistory(userId, 30);

    return {
      candidateId: candidateProfile.id,
      userId: candidateProfile.userId,
      name: candidateProfile.user.name,
      overallScore: score.compositeScore,
      lastUpdated: score.updatedAt,
      platformBreakdown,
      scoringFactors,
      recommendations,
      historicalTrend
    };
  }

  /**
   * Generate score report for export
   */
  async generateScoreReport(userId: string, reportType: 'detailed' | 'summary' | 'comparison'): Promise<ScoreReport | null> {
    const breakdown = await this.getDetailedScoreBreakdown(userId);
    
    if (!breakdown) {
      return null;
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!candidateProfile) {
      return null;
    }

    // Calculate comparison data for comparison reports
    let comparison: ScoreReport['comparison'] = undefined;
    if (reportType === 'comparison') {
      comparison = await this.calculateComparison(breakdown.overallScore);
    }

    return {
      generatedAt: new Date(),
      reportType,
      candidateInfo: {
        name: candidateProfile.user.name,
        email: candidateProfile.user.email,
        location: candidateProfile.location || undefined
      },
      scores: breakdown,
      recommendations: breakdown.recommendations,
      comparison
    };
  }

  /**
   * Submit a score dispute (in-memory for now)
   */
  async submitScoreDispute(
    userId: string,
    type: ScoreDispute['type'],
    description: string
  ): Promise<ScoreDispute> {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    // In a real implementation, this would save to database
    // For now, return a mock dispute object
    const dispute: ScoreDispute = {
      id: `dispute-${Date.now()}`,
      candidateId: candidateProfile.id,
      type,
      description,
      status: 'pending',
      submittedAt: new Date()
    };

    return dispute;
  }

  /**
   * Get score disputes for a candidate (in-memory for now)
   */
  async getScoreDisputes(userId: string): Promise<ScoreDispute[]> {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!candidateProfile) {
      return [];
    }

    // In a real implementation, this would fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Build platform-specific detail
   */
  private buildPlatformDetail(
    platformName: string,
    finalScore: number | null,
    rawScore: number,
    platformData: any
  ): PlatformScoreDetail {
    const status = finalScore 
      ? finalScore >= 80 ? 'excellent' 
      : finalScore >= 65 ? 'good' 
      : finalScore >= 50 ? 'needs-improvement'
      : 'needs-improvement'
      : 'not-connected';

    return {
      platform: platformName,
      score: finalScore || 0,
      weight: this.getPlatformWeight(platformName.toLowerCase()),
      status,
      metrics: platformData.metrics || {},
      strengths: this.extractStrengths(platformData),
      areasForImprovement: this.extractImprovements(platformData)
    };
  }

  /**
   * Build blog platform detail
   */
  private buildBlogDetail(
    platformName: string,
    avgScore: number,
    platforms: any
  ): PlatformScoreDetail {
    const metrics: Record<string, number> = {};
    let totalPosts = 0;
    let totalEngagement = 0;
    const platformsWithData = [];

    if (platforms.devto) {
      platformsWithData.push(platforms.devto);
      totalPosts += platforms.devto.metrics.totalPosts || 0;
      totalEngagement += platforms.devto.metrics.averageEngagement || 0;
    }
    if (platforms.hashnode) {
      platformsWithData.push(platforms.hashnode);
      totalPosts += platforms.hashnode.metrics.totalPosts || 0;
      totalEngagement += platforms.hashnode.metrics.averageEngagement || 0;
    }
    if (platforms.medium) {
      platformsWithData.push(platforms.medium);
      totalPosts += platforms.medium.metrics.totalPosts || 0;
      totalEngagement += platforms.medium.metrics.averageEngagement || 0;
    }

    metrics.averageScore = avgScore;
    metrics.totalPosts = totalPosts;
    metrics.averageEngagement = platformsWithData.length > 0 ? totalEngagement / platformsWithData.length : 0;

    return {
      platform: platformName,
      score: avgScore,
      weight: this.getPlatformWeight('blog'),
      status: avgScore >= 80 ? 'excellent' : avgScore >= 65 ? 'good' : 'needs-improvement',
      metrics,
      strengths: this.extractBlogStrengths(platforms),
      areasForImprovement: this.extractBlogImprovements(platforms)
    };
  }

  /**
   * Generate scoring factors analysis
   */
  private generateScoringFactors(score: any, profile: any): ScoringFactor[] {
    const factors: ScoringFactor[] = [];

    // Code quality factor (GitHub)
    if (score.githubScore) {
      factors.push({
        name: 'Code Quality',
        description: 'Assesses the quality and consistency of code contributions on GitHub',
        impact: 'high',
        score: score.githubScore,
        maxScore: 100,
        recommendations: [
          'Improve commit messages with clear, descriptive content',
          'Add comprehensive README files to your repositories',
          'Include proper documentation and code comments',
          'Ensure consistent coding style and formatting'
        ]
      });
    }

    // Professional presence factor (LinkedIn)
    if (score.linkedinScore) {
      factors.push({
        name: 'Professional Network',
        description: 'Evaluates professional experience, education, and network quality on LinkedIn',
        impact: 'high',
        score: score.linkedinScore,
        maxScore: 100,
        recommendations: [
          'Complete your LinkedIn profile with detailed experience',
          'Request recommendations from colleagues and supervisors',
          'Join relevant professional groups and communities',
          'Share industry insights and professional content regularly'
        ]
      });
    }

    // Content creation factor (Blog platforms)
    if (score.blogScore) {
      factors.push({
        name: 'Technical Content Creation',
        description: 'Analyzes the quality, consistency, and engagement of technical blog posts',
        impact: 'medium',
        score: score.blogScore,
        maxScore: 100,
        recommendations: [
          'Write more consistent technical blog posts',
          'Focus on in-depth tutorials and problem-solving articles',
          'Engage with your readers through comments and discussions',
          'Use relevant tags and categories to improve discoverability'
        ]
      });
    }

    // Social engagement factor (Twitter)
    if (score.socialScore) {
      factors.push({
        name: 'Technical Community Engagement',
        description: 'Measures technical knowledge sharing and community participation on social media',
        impact: 'medium',
        score: score.socialScore,
        maxScore: 100,
        recommendations: [
          'Share more technical insights and learnings',
          'Engage in technical discussions and Q&A sessions',
          'Use relevant hashtags to increase visibility',
          'Participate in technical Twitter chats and events'
        ]
      });
    }

    return factors;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(score: any, profile: any, breakdown: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // GitHub recommendations
    if (!score.githubScore || score.githubScore < 70) {
      recommendations.push({
        id: `rec-github-${Date.now()}`,
        title: 'Improve GitHub Profile and Contributions',
        description: 'Enhance your GitHub presence to showcase technical skills and collaboration',
        category: 'platform',
        priority: score.githubScore ? 'medium' : 'high',
        difficulty: 'moderate',
        estimatedImpact: 15,
        platform: 'github',
        actionSteps: [
          'Update your GitHub profile with a professional bio and avatar',
          'Create well-documented repositories with clear README files',
          'Contribute to open source projects to demonstrate collaboration',
          'Use meaningful commit messages and maintain clean code history'
        ],
        resources: [
          'GitHub Profile Best Practices Guide',
          'Open Source Contribution Guidelines',
          'Professional README Templates'
        ]
      });
    }

    // LinkedIn recommendations
    if (!score.linkedinScore || score.linkedinScore < 70) {
      recommendations.push({
        id: `rec-linkedin-${Date.now()}`,
        title: 'Build Strong Professional Network',
        description: 'Develop a comprehensive LinkedIn profile that highlights your expertise',
        category: 'profile',
        priority: score.linkedinScore ? 'medium' : 'high',
        difficulty: 'easy',
        estimatedImpact: 12,
        platform: 'linkedin',
        actionSteps: [
          'Complete all sections of your LinkedIn profile',
          'Add detailed descriptions to your work experience',
          'Request recommendations from colleagues and supervisors',
          'Share industry-relevant content weekly'
        ],
        resources: [
          'LinkedIn Profile Optimization Checklist',
          'Professional Networking Strategies',
          'Content Creation Ideas for LinkedIn'
        ]
      });
    }

    // Blog content recommendations
    if (!score.blogScore || score.blogScore < 70) {
      recommendations.push({
        id: `rec-blog-${Date.now()}`,
        title: 'Develop Technical Content Strategy',
        description: 'Create consistent, high-quality technical content to demonstrate expertise',
        category: 'content',
        priority: score.blogScore ? 'medium' : 'high',
        difficulty: 'challenging',
        estimatedImpact: 10,
        platform: 'blog',
        actionSteps: [
          'Establish a regular blogging schedule (weekly or bi-weekly)',
          'Write tutorials, tips, and insights about your technical expertise',
          'Engage with your readers through comments and discussions',
          'Cross-promote your content across multiple platforms'
        ],
        resources: [
          'Technical Writing Guidelines',
          'Content Planning Templates',
          'Blog Platform Optimization Tips'
        ]
      });
    }

    // Social media recommendations
    if (!score.socialScore || score.socialScore < 70) {
      recommendations.push({
        id: `rec-social-${Date.now()}`,
        title: 'Increase Technical Community Engagement',
        description: 'Actively participate in technical discussions and share knowledge',
        category: 'engagement',
        priority: score.socialScore ? 'low' : 'medium',
        difficulty: 'moderate',
        estimatedImpact: 8,
        platform: 'twitter',
        actionSteps: [
          'Share technical insights and lessons learned',
          'Participate in relevant Twitter chats and discussions',
          'Use technical hashtags to increase discoverability',
          'Engage with other developers\' content regularly'
        ],
        resources: [
          'Technical Twitter Best Practices',
          'Developer Community Engagement Guide',
          'Hashtag Research Tools'
        ]
      });
    }

    // General recommendations based on missing platforms
    const missingPlatforms = [];
    if (!score.githubScore) missingPlatforms.push('GitHub');
    if (!score.linkedinScore) missingPlatforms.push('LinkedIn');
    if (!score.blogScore) missingPlatforms.push('Blog platforms');
    if (!score.socialScore) missingPlatforms.push('Social media');

    if (missingPlatforms.length > 0) {
      recommendations.push({
        id: `rec-platforms-${Date.now()}`,
        title: 'Connect Additional Platforms',
        description: `Expand your digital presence by connecting ${missingPlatforms.join(', ')}`,
        category: 'platform',
        priority: 'high',
        difficulty: 'easy',
        estimatedImpact: 20,
        actionSteps: missingPlatforms.map(platform => 
          `Create or update your ${platform} profile with professional information`
        ),
        resources: [
          'Platform-Specific Setup Guides',
          'Cross-Platform Content Strategy',
          'Professional Branding Tips'
        ]
      });
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Get score history for trend analysis
   */
  private async getScoreHistory(userId: string, days: number): Promise<ScoreHistoryPoint
