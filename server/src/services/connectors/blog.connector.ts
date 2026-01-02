/**
 * Blog Connector Service
 * Task 3.3: Implement blog connector service
 * - Create connectors for Medium, Hashnode, and Dev.to APIs
 * - Implement content extraction and analysis
 * - Calculate content quality metrics
 * Requirements: 1.4, 2.5
 */

import { prisma } from '../../lib/prisma';
import { Platform, Prisma } from '@prisma/client';

// Types for Blog data
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  url: string;
  excerpt: string | null;
  content: string | null;
  tags: string[];
  publishedAt: string;
  readingTime: number;
  reactions: number;
  comments: number;
  views?: number;
  coverImage: string | null;
}

export interface BlogProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  url: string;
  followers: number;
  following: number;
  totalPosts: number;
  joinedAt: string | null;
}

export interface BlogMetrics {
  contentQualityScore: number;
  consistencyScore: number;
  engagementScore: number;
  topicDiversityScore: number;
  overallScore: number;
  breakdown: {
    totalPosts: number;
    totalReactions: number;
    totalComments: number;
    avgReadingTime: number;
    postsPerMonth: number;
    topTags: string[];
    followers: number;
  };
  recommendations: string[];
}

export interface BlogData {
  platform: Platform;
  profile: BlogProfile;
  posts: BlogPost[];
  metrics: BlogMetrics;
  fetchedAt: Date;
}

// Dev.to API response types
interface DevToArticle {
  id: number;
  title: string;
  description: string;
  slug: string;
  url: string;
  tags: string;
  published_at: string;
  reading_time_minutes: number;
  public_reactions_count: number;
  comments_count: number;
  page_views_count?: number;
  cover_image: string | null;
  body_markdown?: string;
}

interface DevToUser {
  id: number;
  username: string;
  name: string;
  summary: string | null;
  profile_image: string;
  joined_at: string;
  twitter_username: string | null;
  github_username: string | null;
}

// Hashnode API types
interface HashnodePost {
  _id: string;
  title: string;
  slug: string;
  brief: string;
  content: string;
  dateAdded: string;
  totalReactions: number;
  responseCount: number;
  coverImage: string | null;
  tags: Array<{ name: string }>;
}

interface HashnodeUser {
  _id: string;
  username: string;
  name: string;
  tagline: string | null;
  photo: string | null;
  numFollowers: number;
  numFollowing: number;
  publication: {
    posts: HashnodePost[];
  };
}

export class BlogConnector {
  /**
   * Fetch Dev.to user profile
   */
  async fetchDevToProfile(username: string): Promise<BlogProfile> {
    const response = await fetch(`https://dev.to/api/users/by_username?username=${username}`, {
      headers: { 'User-Agent': 'CandidateScoringPlatform' }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Dev.to user not found');
      }
      throw new Error(`Dev.to API error: ${response.status}`);
    }

    const data = await response.json() as DevToUser;

    return {
      username: data.username,
      name: data.name,
      bio: data.summary,
      avatarUrl: data.profile_image,
      url: `https://dev.to/${data.username}`,
      followers: 0, // Dev.to doesn't expose follower count in public API
      following: 0,
      totalPosts: 0, // Will be calculated from posts
      joinedAt: data.joined_at
    };
  }

  /**
   * Fetch Dev.to articles
   */
  async fetchDevToArticles(username: string, limit = 30): Promise<BlogPost[]> {
    const response = await fetch(
      `https://dev.to/api/articles?username=${username}&per_page=${limit}`,
      { headers: { 'User-Agent': 'CandidateScoringPlatform' } }
    );

    if (!response.ok) {
      throw new Error(`Dev.to API error: ${response.status}`);
    }

    const articles = await response.json() as DevToArticle[];

    return articles.map(article => ({
      id: String(article.id),
      title: article.title,
      slug: article.slug,
      url: article.url,
      excerpt: article.description,
      content: null, // Would need another request for full content
      tags: article.tags ? article.tags.split(', ') : [],
      publishedAt: article.published_at,
      readingTime: article.reading_time_minutes,
      reactions: article.public_reactions_count,
      comments: article.comments_count,
      views: article.page_views_count,
      coverImage: article.cover_image
    }));
  }

  /**
   * Fetch all Dev.to data
   */
  async fetchDevToData(username: string): Promise<BlogData> {
    const [profile, posts] = await Promise.all([
      this.fetchDevToProfile(username),
      this.fetchDevToArticles(username)
    ]);

    profile.totalPosts = posts.length;
    const metrics = this.calculateMetrics(profile, posts);

    return {
      platform: Platform.DEVTO,
      profile,
      posts,
      metrics,
      fetchedAt: new Date()
    };
  }

  /**
   * Fetch Hashnode user data using GraphQL
   */
  async fetchHashnodeData(username: string): Promise<BlogData> {
    const query = `
      query GetUser($username: String!) {
        user(username: $username) {
          _id
          username
          name
          tagline
          photo
          numFollowers
          numFollowing
          publication {
            posts(page: 0) {
              _id
              title
              slug
              brief
              content
              dateAdded
              totalReactions
              responseCount
              coverImage
              tags {
                name
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.hashnode.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CandidateScoringPlatform'
      },
      body: JSON.stringify({ query, variables: { username } })
    });

    if (!response.ok) {
      throw new Error(`Hashnode API error: ${response.status}`);
    }

    const result = await response.json() as { data?: { user: HashnodeUser }; errors?: Array<{ message: string }> };

    if (result.errors || !result.data?.user) {
      throw new Error('Hashnode user not found');
    }

    const user = result.data.user;
    const posts: BlogPost[] = (user.publication?.posts || []).map(post => ({
      id: post._id,
      title: post.title,
      slug: post.slug,
      url: `https://hashnode.com/@${user.username}/${post.slug}`,
      excerpt: post.brief,
      content: post.content,
      tags: post.tags.map(t => t.name),
      publishedAt: post.dateAdded,
      readingTime: Math.ceil((post.content?.length || 0) / 1500), // Estimate
      reactions: post.totalReactions,
      comments: post.responseCount,
      coverImage: post.coverImage
    }));

    const profile: BlogProfile = {
      username: user.username,
      name: user.name,
      bio: user.tagline,
      avatarUrl: user.photo,
      url: `https://hashnode.com/@${user.username}`,
      followers: user.numFollowers,
      following: user.numFollowing,
      totalPosts: posts.length,
      joinedAt: null
    };

    const metrics = this.calculateMetrics(profile, posts);

    return {
      platform: Platform.HASHNODE,
      profile,
      posts,
      metrics,
      fetchedAt: new Date()
    };
  }

  /**
   * Fetch Medium data (limited due to API restrictions)
   * Medium doesn't have a public API, so this is a placeholder
   */
  async fetchMediumData(username: string): Promise<BlogData> {
    // Medium doesn't have a public API
    // This would need to use RSS feed parsing or web scraping
    // RSS URL: https://medium.com/feed/@${username}
    
    // For now, return placeholder data
    const profile: BlogProfile = {
      username,
      name: null,
      bio: null,
      avatarUrl: null,
      url: `https://medium.com/@${username}`,
      followers: 0,
      following: 0,
      totalPosts: 0,
      joinedAt: null
    };

    const posts: BlogPost[] = [];
    const metrics = this.calculateMetrics(profile, posts);

    return {
      platform: Platform.MEDIUM,
      profile,
      posts,
      metrics,
      fetchedAt: new Date()
    };
  }

  /**
   * Calculate blog metrics
   */
  calculateMetrics(profile: BlogProfile, posts: BlogPost[]): BlogMetrics {
    if (posts.length === 0) {
      return {
        contentQualityScore: 0,
        consistencyScore: 0,
        engagementScore: 0,
        topicDiversityScore: 0,
        overallScore: 0,
        breakdown: {
          totalPosts: 0,
          totalReactions: 0,
          totalComments: 0,
          avgReadingTime: 0,
          postsPerMonth: 0,
          topTags: [],
          followers: profile.followers
        },
        recommendations: ['Start writing blog posts to build your content portfolio']
      };
    }

    // Calculate total engagement
    const totalReactions = posts.reduce((sum, p) => sum + p.reactions, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
    const avgReadingTime = posts.reduce((sum, p) => sum + p.readingTime, 0) / posts.length;

    // Calculate posting frequency
    const sortedPosts = [...posts].sort(
      (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );
    const firstPost = new Date(sortedPosts[0].publishedAt);
    const lastPost = new Date(sortedPosts[sortedPosts.length - 1].publishedAt);
    const monthsActive = Math.max(
      1,
      (lastPost.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const postsPerMonth = posts.length / monthsActive;

    // Calculate tag distribution
    const tagCounts: Record<string, number> = {};
    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    const uniqueTags = Object.keys(tagCounts).length;

    // Calculate scores
    const contentQualityScore = Math.min(
      (avgReadingTime >= 3 ? 30 : avgReadingTime * 10) +
      (posts.filter(p => p.coverImage).length / posts.length) * 20 +
      (posts.filter(p => p.excerpt && p.excerpt.length > 50).length / posts.length) * 20 +
      Math.min(posts.length / 20, 1) * 30,
      100
    );

    const consistencyScore = Math.min(
      (postsPerMonth >= 4 ? 100 : postsPerMonth * 25),
      100
    );

    const engagementScore = Math.min(
      (totalReactions / posts.length >= 10 ? 40 : (totalReactions / posts.length) * 4) +
      (totalComments / posts.length >= 5 ? 30 : (totalComments / posts.length) * 6) +
      (profile.followers >= 100 ? 30 : profile.followers * 0.3),
      100
    );

    const topicDiversityScore = Math.min(
      (uniqueTags / 10) * 100,
      100
    );

    const overallScore = Math.round(
      contentQualityScore * 0.3 +
      consistencyScore * 0.25 +
      engagementScore * 0.3 +
      topicDiversityScore * 0.15
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (postsPerMonth < 2) {
      recommendations.push('Write more frequently to maintain reader engagement');
    }
    if (avgReadingTime < 3) {
      recommendations.push('Write longer, more in-depth articles');
    }
    if (uniqueTags < 5) {
      recommendations.push('Cover more diverse topics to reach a wider audience');
    }
    if (posts.filter(p => p.coverImage).length < posts.length * 0.8) {
      recommendations.push('Add cover images to more of your posts');
    }
    if (totalReactions / posts.length < 5) {
      recommendations.push('Engage with the community to increase your reactions');
    }

    return {
      contentQualityScore: Math.round(contentQualityScore),
      consistencyScore: Math.round(consistencyScore),
      engagementScore: Math.round(engagementScore),
      topicDiversityScore: Math.round(topicDiversityScore),
      overallScore,
      breakdown: {
        totalPosts: posts.length,
        totalReactions,
        totalComments,
        avgReadingTime: Math.round(avgReadingTime * 10) / 10,
        postsPerMonth: Math.round(postsPerMonth * 10) / 10,
        topTags,
        followers: profile.followers
      },
      recommendations
    };
  }

  /**
   * Fetch data for any blog platform
   */
  async fetchData(platform: Platform, username: string): Promise<BlogData> {
    switch (platform) {
      case Platform.DEVTO:
        return this.fetchDevToData(username);
      case Platform.HASHNODE:
        return this.fetchHashnodeData(username);
      case Platform.MEDIUM:
        return this.fetchMediumData(username);
      default:
        throw new Error(`Unsupported blog platform: ${platform}`);
    }
  }

  /**
   * Store blog data helper
   */
  private async storePlatformData(
    candidateId: string,
    platform: Platform,
    dataType: string,
    rawData: Prisma.InputJsonValue,
    processedData?: Prisma.InputJsonValue
  ): Promise<void> {
    const existing = await prisma.platformData.findFirst({
      where: { candidateId, platform, dataType }
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
          platform,
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
   * Fetch and store blog data for a candidate
   */
  async fetchAndStoreData(candidateId: string, platform: Platform, username: string): Promise<BlogData> {
    const data = await this.fetchData(platform, username);

    await this.storePlatformData(
      candidateId,
      platform,
      'profile',
      data.profile as unknown as Prisma.InputJsonValue
    );
    await this.storePlatformData(
      candidateId,
      platform,
      'posts',
      data.posts as unknown as Prisma.InputJsonValue
    );
    await this.storePlatformData(
      candidateId,
      platform,
      'metrics',
      data.metrics as unknown as Prisma.InputJsonValue,
      { score: data.metrics.overallScore }
    );

    // Update platform connection
    await prisma.platformConnection.updateMany({
      where: { candidateId, platform },
      data: { lastSynced: new Date(), isVerified: true }
    });

    return data;
  }

  /**
   * Get cached blog data
   */
  async getCachedData(candidateId: string, platform: Platform): Promise<BlogData | null> {
    const platformData = await prisma.platformData.findMany({
      where: { candidateId, platform }
    });

    if (platformData.length === 0) return null;

    const profile = platformData.find(d => d.dataType === 'profile');
    const posts = platformData.find(d => d.dataType === 'posts');
    const metrics = platformData.find(d => d.dataType === 'metrics');

    if (!profile || !posts || !metrics) return null;

    return {
      platform,
      profile: profile.rawData as unknown as BlogProfile,
      posts: posts.rawData as unknown as BlogPost[],
      metrics: metrics.rawData as unknown as BlogMetrics,
      fetchedAt: profile.fetchedAt
    };
  }
}

export const blogConnector = new BlogConnector();
