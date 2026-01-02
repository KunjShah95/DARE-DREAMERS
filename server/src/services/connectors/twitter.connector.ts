/**
 * Twitter Connector Service
 * Task 3.5: Implement Twitter connector service
 * - Create Twitter API v2 client
 * - Implement content analysis for technical tweets
 * - Calculate engagement metrics
 * Requirements: 1.3, 2.4
 */

import { prisma } from '../../lib/prisma';
import { Platform, Prisma } from '@prisma/client';

// Types for Twitter data
export interface TwitterProfile {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  url: string;
  followers: number;
  following: number;
  tweetCount: number;
  listedCount: number;
  verified: boolean;
  createdAt: string;
  location: string | null;
  website: string | null;
}

export interface TwitterTweet {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions?: number;
  isRetweet: boolean;
  isReply: boolean;
  hashtags: string[];
  mentions: string[];
  urls: string[];
}

export interface TwitterMetrics {
  engagementScore: number;
  technicalContentScore: number;
  influenceScore: number;
  consistencyScore: number;
  overallScore: number;
  breakdown: {
    followers: number;
    following: number;
    totalTweets: number;
    avgLikes: number;
    avgRetweets: number;
    engagementRate: number;
    technicalTweetRatio: number;
    topHashtags: string[];
  };
  recommendations: string[];
}

export interface TwitterData {
  profile: TwitterProfile;
  tweets: TwitterTweet[];
  metrics: TwitterMetrics;
  fetchedAt: Date;
}

// Twitter API v2 response types
interface TwitterUserV2 {
  id: string;
  username: string;
  name: string;
  description?: string;
  profile_image_url?: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified?: boolean;
  created_at?: string;
  location?: string;
  url?: string;
}

interface TwitterTweetV2 {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
    impression_count?: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    urls?: Array<{ expanded_url: string }>;
  };
  referenced_tweets?: Array<{ type: string; id: string }>;
}

// Technical keywords for content analysis
const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'rust', 'golang', 'react',
  'vue', 'angular', 'nodejs', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
  'api', 'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'redis',
  'git', 'github', 'gitlab', 'cicd', 'devops', 'agile', 'scrum',
  'machine learning', 'ai', 'ml', 'deep learning', 'neural network',
  'frontend', 'backend', 'fullstack', 'microservices', 'serverless',
  'programming', 'coding', 'developer', 'software', 'engineering',
  'algorithm', 'data structure', 'open source', 'code review'
];

export class TwitterConnector {
  private bearerToken: string | null;

  constructor(bearerToken?: string) {
    this.bearerToken = bearerToken || process.env.TWITTER_BEARER_TOKEN || null;
  }

  /**
   * Make a Twitter API v2 request
   */
  private async apiRequest<T>(endpoint: string): Promise<T> {
    if (!this.bearerToken) {
      throw new Error('Twitter Bearer Token required');
    }

    const response = await fetch(`https://api.twitter.com/2${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'User-Agent': 'CandidateScoringPlatform'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Twitter user not found');
      }
      if (response.status === 429) {
        throw new Error('Twitter API rate limit exceeded');
      }
      if (response.status === 401) {
        throw new Error('Twitter API authentication failed');
      }
      throw new Error(`Twitter API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetch Twitter user profile
   */
  async fetchProfile(username: string): Promise<TwitterProfile> {
    const data = await this.apiRequest<{ data: TwitterUserV2 }>(
      `/users/by/username/${username}?user.fields=description,profile_image_url,public_metrics,verified,created_at,location,url`
    );

    const user = data.data;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.description || null,
      avatarUrl: user.profile_image_url || null,
      url: `https://twitter.com/${user.username}`,
      followers: user.public_metrics.followers_count,
      following: user.public_metrics.following_count,
      tweetCount: user.public_metrics.tweet_count,
      listedCount: user.public_metrics.listed_count,
      verified: user.verified || false,
      createdAt: user.created_at || new Date().toISOString(),
      location: user.location || null,
      website: user.url || null
    };
  }

  /**
   * Fetch recent tweets
   */
  async fetchTweets(userId: string, limit = 100): Promise<TwitterTweet[]> {
    const data = await this.apiRequest<{ data?: TwitterTweetV2[] }>(
      `/users/${userId}/tweets?max_results=${Math.min(limit, 100)}&tweet.fields=created_at,public_metrics,entities,referenced_tweets`
    );

    if (!data.data) {
      return [];
    }

    return data.data.map(tweet => {
      const isRetweet = tweet.referenced_tweets?.some(ref => ref.type === 'retweeted') || false;
      const isReply = tweet.referenced_tweets?.some(ref => ref.type === 'replied_to') || false;

      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        likes: tweet.public_metrics.like_count,
        retweets: tweet.public_metrics.retweet_count,
        replies: tweet.public_metrics.reply_count,
        quotes: tweet.public_metrics.quote_count,
        impressions: tweet.public_metrics.impression_count,
        isRetweet,
        isReply,
        hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
        mentions: tweet.entities?.mentions?.map(m => m.username) || [],
        urls: tweet.entities?.urls?.map(u => u.expanded_url) || []
      };
    });
  }

  /**
   * Analyze if a tweet is technical content
   */
  private isTechnicalTweet(tweet: TwitterTweet): boolean {
    const text = tweet.text.toLowerCase();
    const hashtags = tweet.hashtags.map(h => h.toLowerCase());
    
    return TECH_KEYWORDS.some(keyword => 
      text.includes(keyword) || hashtags.includes(keyword.replace(/\s+/g, ''))
    );
  }

  /**
   * Calculate Twitter metrics
   */
  calculateMetrics(profile: TwitterProfile, tweets: TwitterTweet[]): TwitterMetrics {
    // Filter original tweets (not retweets)
    const originalTweets = tweets.filter(t => !t.isRetweet);

    if (originalTweets.length === 0) {
      return {
        engagementScore: 0,
        technicalContentScore: 0,
        influenceScore: Math.min((profile.followers / 1000) * 20, 100),
        consistencyScore: 0,
        overallScore: Math.min((profile.followers / 1000) * 5, 25),
        breakdown: {
          followers: profile.followers,
          following: profile.following,
          totalTweets: profile.tweetCount,
          avgLikes: 0,
          avgRetweets: 0,
          engagementRate: 0,
          technicalTweetRatio: 0,
          topHashtags: []
        },
        recommendations: ['Tweet more to build your social presence']
      };
    }

    // Calculate engagement metrics
    const totalLikes = originalTweets.reduce((sum, t) => sum + t.likes, 0);
    const totalRetweets = originalTweets.reduce((sum, t) => sum + t.retweets, 0);
    const avgLikes = totalLikes / originalTweets.length;
    const avgRetweets = totalRetweets / originalTweets.length;

    // Calculate engagement rate (per follower)
    const totalEngagement = totalLikes + totalRetweets * 2;
    const engagementRate = profile.followers > 0 
      ? (totalEngagement / originalTweets.length / profile.followers) * 100 
      : 0;

    // Count technical tweets
    const technicalTweets = originalTweets.filter(t => this.isTechnicalTweet(t));
    const technicalTweetRatio = technicalTweets.length / originalTweets.length;

    // Calculate hashtag distribution
    const hashtagCounts: Record<string, number> = {};
    for (const tweet of originalTweets) {
      for (const tag of tweet.hashtags) {
        const lowerTag = tag.toLowerCase();
        hashtagCounts[lowerTag] = (hashtagCounts[lowerTag] || 0) + 1;
      }
    }
    const topHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Calculate scores
    const engagementScore = Math.min(
      (avgLikes >= 10 ? 40 : avgLikes * 4) +
      (avgRetweets >= 5 ? 30 : avgRetweets * 6) +
      (engagementRate >= 1 ? 30 : engagementRate * 30),
      100
    );

    const technicalContentScore = Math.min(
      technicalTweetRatio * 100,
      100
    );

    const influenceScore = Math.min(
      (profile.followers >= 10000 ? 40 : (profile.followers / 10000) * 40) +
      (profile.listedCount >= 100 ? 30 : (profile.listedCount / 100) * 30) +
      (profile.verified ? 30 : 0),
      100
    );

    // Calculate consistency (tweets per week)
    const sortedTweets = [...originalTweets].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let tweetsPerWeek = 0;
    if (sortedTweets.length >= 2) {
      const firstTweet = new Date(sortedTweets[0].createdAt);
      const lastTweet = new Date(sortedTweets[sortedTweets.length - 1].createdAt);
      const weeks = Math.max(1, (lastTweet.getTime() - firstTweet.getTime()) / (1000 * 60 * 60 * 24 * 7));
      tweetsPerWeek = originalTweets.length / weeks;
    }

    const consistencyScore = Math.min(
      (tweetsPerWeek >= 7 ? 100 : tweetsPerWeek * 14),
      100
    );

    const overallScore = Math.round(
      engagementScore * 0.3 +
      technicalContentScore * 0.25 +
      influenceScore * 0.25 +
      consistencyScore * 0.2
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (technicalTweetRatio < 0.3) {
      recommendations.push('Share more technical content to establish expertise');
    }
    if (avgLikes < 5) {
      recommendations.push('Engage more with the community to increase visibility');
    }
    if (tweetsPerWeek < 3) {
      recommendations.push('Tweet more consistently to grow your audience');
    }
    if (topHashtags.length < 3) {
      recommendations.push('Use relevant hashtags to reach a wider audience');
    }
    if (profile.bio === null) {
      recommendations.push('Add a bio to your Twitter profile');
    }

    return {
      engagementScore: Math.round(engagementScore),
      technicalContentScore: Math.round(technicalContentScore),
      influenceScore: Math.round(influenceScore),
      consistencyScore: Math.round(consistencyScore),
      overallScore,
      breakdown: {
        followers: profile.followers,
        following: profile.following,
        totalTweets: profile.tweetCount,
        avgLikes: Math.round(avgLikes * 10) / 10,
        avgRetweets: Math.round(avgRetweets * 10) / 10,
        engagementRate: Math.round(engagementRate * 100) / 100,
        technicalTweetRatio: Math.round(technicalTweetRatio * 100) / 100,
        topHashtags
      },
      recommendations
    };
  }

  /**
   * Fetch all Twitter data for a user
   */
  async fetchAllData(username: string): Promise<TwitterData> {
    const profile = await this.fetchProfile(username);
    const tweets = await this.fetchTweets(profile.id);
    const metrics = this.calculateMetrics(profile, tweets);

    return {
      profile,
      tweets,
      metrics,
      fetchedAt: new Date()
    };
  }

  /**
   * Store platform data helper
   */
  private async storePlatformData(
    candidateId: string,
    dataType: string,
    rawData: Prisma.InputJsonValue,
    processedData?: Prisma.InputJsonValue
  ): Promise<void> {
    const existing = await prisma.platformData.findFirst({
      where: { candidateId, platform: Platform.TWITTER, dataType }
    });

    if (existing) {
      await prisma.platformData.update({
        where: { id: existing.id },
        data: {
          rawData,
          processedData: processedData ?? Prisma.JsonNull,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    } else {
      await prisma.platformData.create({
        data: {
          candidateId,
          platform: Platform.TWITTER,
          dataType,
          rawData,
          processedData: processedData ?? Prisma.JsonNull,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  /**
   * Fetch and store Twitter data for a candidate
   */
  async fetchAndStoreData(candidateId: string, username: string): Promise<TwitterData> {
    const data = await this.fetchAllData(username);

    await this.storePlatformData(candidateId, 'profile', data.profile as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(candidateId, 'tweets', data.tweets as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(
      candidateId,
      'metrics',
      data.metrics as unknown as Prisma.InputJsonValue,
      { score: data.metrics.overallScore }
    );

    // Update platform connection
    await prisma.platformConnection.updateMany({
      where: { candidateId, platform: Platform.TWITTER },
      data: { lastSynced: new Date(), isVerified: true }
    });

    return data;
  }

  /**
   * Get cached Twitter data
   */
  async getCachedData(candidateId: string): Promise<TwitterData | null> {
    const platformData = await prisma.platformData.findMany({
      where: { candidateId, platform: Platform.TWITTER }
    });

    if (platformData.length === 0) return null;

    const profile = platformData.find(d => d.dataType === 'profile');
    const tweets = platformData.find(d => d.dataType === 'tweets');
    const metrics = platformData.find(d => d.dataType === 'metrics');

    if (!profile || !tweets || !metrics) return null;

    return {
      profile: profile.rawData as unknown as TwitterProfile,
      tweets: tweets.rawData as unknown as TwitterTweet[],
      metrics: metrics.rawData as unknown as TwitterMetrics,
      fetchedAt: profile.fetchedAt
    };
  }
}

export const twitterConnector = new TwitterConnector();
