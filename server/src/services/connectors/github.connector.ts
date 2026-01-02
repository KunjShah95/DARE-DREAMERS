/**
 * GitHub Connector Service
 * Task 3.1: Implement GitHub connector service
 * - Create GitHub API v4 GraphQL client
 * - Implement repository data fetching and analysis
 * - Calculate code quality metrics (language diversity, commit frequency, etc.)
 * Requirements: 1.1, 2.2
 */

import { prisma } from '../../lib/prisma';
import { Platform, Prisma } from '@prisma/client';

// Types for GitHub data
export interface GitHubUserProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  url: string;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  createdAt: string;
  publicRepos: number;
  publicGists: number;
}

export interface GitHubRepository {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  languages: Record<string, number>;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isForked: boolean;
  topics: string[];
  license: string | null;
  defaultBranch: string;
}

export interface GitHubContributionStats {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  contributionsByDay: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
}

export interface GitHubMetrics {
  codeQualityScore: number;
  languageDiversity: number;
  commitFrequency: number;
  collaborationScore: number;
  projectImpactScore: number;
  overallScore: number;
  breakdown: {
    repositories: number;
    stars: number;
    forks: number;
    followers: number;
    languages: string[];
    topLanguage: string | null;
    avgCommitsPerRepo: number;
    activeRepos: number;
  };
  recommendations: string[];
}

export interface GitHubData {
  profile: GitHubUserProfile;
  repositories: GitHubRepository[];
  contributionStats: GitHubContributionStats;
  metrics: GitHubMetrics;
  fetchedAt: Date;
}

// GitHub API response types
interface GitHubUserResponse {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  created_at: string;
  public_repos: number;
  public_gists: number;
}

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  topics?: string[];
  license?: { spdx_id: string } | null;
  default_branch: string;
}

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
}

interface GraphQLUserResponse {
  user: {
    contributionsCollection: ContributionsCollection;
  };
}

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

export class GitHubConnector {
  private token: string | null;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN || null;
  }

  /**
   * Make a REST API request to GitHub
   */
  private async restRequest<T>(endpoint: string): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CandidateScoringPlatform'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${GITHUB_API_URL}${endpoint}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('GitHub user not found');
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make a GraphQL API request to GitHub
   */
  private async graphqlRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    if (!this.token) {
      throw new Error('GitHub token required for GraphQL API');
    }

    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'CandidateScoringPlatform'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`GitHub GraphQL API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as { data?: T; errors?: Array<{ message: string }> };
    
    if (result.errors) {
      throw new Error(`GitHub GraphQL error: ${result.errors[0].message}`);
    }

    return result.data as T;
  }

  /**
   * Fetch user profile from GitHub
   */
  async fetchUserProfile(username: string): Promise<GitHubUserProfile> {
    const data = await this.restRequest<GitHubUserResponse>(`/users/${username}`);

    return {
      login: data.login,
      name: data.name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      url: data.html_url,
      company: data.company,
      location: data.location,
      followers: data.followers,
      following: data.following,
      createdAt: data.created_at,
      publicRepos: data.public_repos,
      publicGists: data.public_gists
    };
  }

  /**
   * Fetch user repositories from GitHub
   */
  async fetchRepositories(username: string, limit = 100): Promise<GitHubRepository[]> {
    const repos: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100;

    while (repos.length < limit) {
      const data = await this.restRequest<GitHubRepoResponse[]>(
        `/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`
      );

      if (data.length === 0) break;

      for (const repo of data) {
        if (repos.length >= limit) break;

        // Fetch languages for each repo
        let languages: Record<string, number> = {};
        try {
          languages = await this.restRequest<Record<string, number>>(
            `/repos/${username}/${repo.name}/languages`
          );
        } catch {
          // Ignore errors for individual language fetches
        }

        repos.push({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          languages,
          stargazersCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          watchersCount: repo.watchers_count,
          openIssuesCount: repo.open_issues_count,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
          isForked: repo.fork,
          topics: repo.topics || [],
          license: repo.license?.spdx_id || null,
          defaultBranch: repo.default_branch
        });
      }

      if (data.length < perPage) break;
      page++;
    }

    return repos;
  }

  /**
   * Fetch contribution stats using GraphQL
   */
  async fetchContributionStats(username: string): Promise<GitHubContributionStats> {
    // If no token, return estimated stats
    if (!this.token) {
      return {
        totalCommits: 0,
        totalPRs: 0,
        totalIssues: 0,
        totalReviews: 0,
        contributionsByDay: {},
        currentStreak: 0,
        longestStreak: 0
      };
    }

    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.graphqlRequest<GraphQLUserResponse>(query, { username });
      const contributions = data.user.contributionsCollection;
      const calendar = contributions.contributionCalendar;

      // Build contributions by day
      const contributionsByDay: Record<string, number> = {};
      let longestStreak = 0;
      let tempStreak = 0;

      for (const week of calendar.weeks) {
        for (const day of week.contributionDays) {
          contributionsByDay[day.date] = day.contributionCount;
          
          if (day.contributionCount > 0) {
            tempStreak++;
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
          } else {
            tempStreak = 0;
          }
        }
      }

      // Calculate current streak (from today backwards)
      const sortedDates = Object.keys(contributionsByDay).sort().reverse();
      let currentStreak = 0;
      
      for (const date of sortedDates) {
        if (contributionsByDay[date] > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalCommits: contributions.totalCommitContributions,
        totalPRs: contributions.totalPullRequestContributions,
        totalIssues: contributions.totalIssueContributions,
        totalReviews: contributions.totalPullRequestReviewContributions,
        contributionsByDay,
        currentStreak,
        longestStreak
      };
    } catch {
      // Return empty stats on error
      return {
        totalCommits: 0,
        totalPRs: 0,
        totalIssues: 0,
        totalReviews: 0,
        contributionsByDay: {},
        currentStreak: 0,
        longestStreak: 0
      };
    }
  }

  /**
   * Calculate GitHub metrics from fetched data
   */
  calculateMetrics(
    profile: GitHubUserProfile,
    repositories: GitHubRepository[],
    contributionStats: GitHubContributionStats
  ): GitHubMetrics {
    // Filter out forked repos for most metrics
    const ownRepos = repositories.filter(r => !r.isForked);
    
    // Calculate language diversity
    const allLanguages = new Set<string>();
    const languageBytes: Record<string, number> = {};
    
    for (const repo of ownRepos) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        allLanguages.add(lang);
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
    }
    
    const uniqueLanguages = Array.from(allLanguages);
    const languageDiversity = Math.min(uniqueLanguages.length / 10, 1) * 100;
    
    // Find top language
    const topLanguage = Object.entries(languageBytes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Calculate total stars and forks
    const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazersCount, 0);
    const totalForks = ownRepos.reduce((sum, r) => sum + r.forksCount, 0);

    // Calculate code quality score
    const hasReadme = ownRepos.filter(r => r.description).length;
    const hasLicense = ownRepos.filter(r => r.license).length;
    const hasTopics = ownRepos.filter(r => r.topics.length > 0).length;
    
    const codeQualityScore = Math.min(
      ((hasReadme / Math.max(ownRepos.length, 1)) * 30 +
       (hasLicense / Math.max(ownRepos.length, 1)) * 20 +
       (hasTopics / Math.max(ownRepos.length, 1)) * 20 +
       Math.min(totalStars / 100, 1) * 30),
      100
    );

    // Calculate commit frequency
    const avgCommitsPerRepo = ownRepos.length > 0 
      ? contributionStats.totalCommits / ownRepos.length 
      : 0;
    const commitFrequency = Math.min((contributionStats.totalCommits / 365) * 10, 100);

    // Calculate collaboration score
    const collaborationScore = Math.min(
      (contributionStats.totalPRs / 50 * 40 +
       contributionStats.totalReviews / 50 * 30 +
       contributionStats.totalIssues / 100 * 30),
      100
    );

    // Calculate project impact score
    const projectImpactScore = Math.min(
      (totalStars / 100 * 40 +
       totalForks / 50 * 30 +
       profile.followers / 100 * 30),
      100
    );

    // Count active repos (updated in last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const activeRepos = ownRepos.filter(
      r => new Date(r.pushedAt) > sixMonthsAgo
    ).length;

    // Calculate overall score
    const overallScore = Math.round(
      codeQualityScore * 0.25 +
      languageDiversity * 0.15 +
      commitFrequency * 0.25 +
      collaborationScore * 0.2 +
      projectImpactScore * 0.15
    );

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (languageDiversity < 50) {
      recommendations.push('Explore more programming languages to increase diversity');
    }
    if (hasReadme < ownRepos.length * 0.8) {
      recommendations.push('Add descriptions to more of your repositories');
    }
    if (hasLicense < ownRepos.length * 0.5) {
      recommendations.push('Add licenses to your repositories');
    }
    if (commitFrequency < 50) {
      recommendations.push('Maintain consistent commit activity');
    }
    if (collaborationScore < 50) {
      recommendations.push('Contribute to other projects through PRs and code reviews');
    }
    if (activeRepos < 3) {
      recommendations.push('Keep more projects actively maintained');
    }
    if (profile.bio === null) {
      recommendations.push('Add a bio to your GitHub profile');
    }

    return {
      codeQualityScore: Math.round(codeQualityScore),
      languageDiversity: Math.round(languageDiversity),
      commitFrequency: Math.round(commitFrequency),
      collaborationScore: Math.round(collaborationScore),
      projectImpactScore: Math.round(projectImpactScore),
      overallScore,
      breakdown: {
        repositories: ownRepos.length,
        stars: totalStars,
        forks: totalForks,
        followers: profile.followers,
        languages: uniqueLanguages,
        topLanguage,
        avgCommitsPerRepo: Math.round(avgCommitsPerRepo * 10) / 10,
        activeRepos
      },
      recommendations
    };
  }

  /**
   * Fetch all GitHub data for a user
   */
  async fetchAllData(username: string): Promise<GitHubData> {
    const [profile, repositories, contributionStats] = await Promise.all([
      this.fetchUserProfile(username),
      this.fetchRepositories(username, 50),
      this.fetchContributionStats(username)
    ]);

    const metrics = this.calculateMetrics(profile, repositories, contributionStats);

    return {
      profile,
      repositories,
      contributionStats,
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
      where: { candidateId, platform: Platform.GITHUB, dataType }
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
          platform: Platform.GITHUB,
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
   * Fetch and store GitHub data for a candidate
   */
  async fetchAndStoreData(candidateId: string, username: string): Promise<GitHubData> {
    const data = await this.fetchAllData(username);

    // Store all data types
    await this.storePlatformData(candidateId, 'profile', data.profile as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(candidateId, 'repositories', data.repositories as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(candidateId, 'contributions', data.contributionStats as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(
      candidateId,
      'metrics',
      data.metrics as unknown as Prisma.InputJsonValue,
      { score: data.metrics.overallScore }
    );

    // Update platform connection sync time
    await prisma.platformConnection.updateMany({
      where: { candidateId, platform: Platform.GITHUB },
      data: { lastSynced: new Date(), isVerified: true }
    });

    return data;
  }

  /**
   * Get cached GitHub data for a candidate
   */
  async getCachedData(candidateId: string): Promise<GitHubData | null> {
    const platformData = await prisma.platformData.findMany({
      where: { candidateId, platform: Platform.GITHUB }
    });

    if (platformData.length === 0) return null;

    const profile = platformData.find(d => d.dataType === 'profile');
    const repositories = platformData.find(d => d.dataType === 'repositories');
    const contributions = platformData.find(d => d.dataType === 'contributions');
    const metrics = platformData.find(d => d.dataType === 'metrics');

    if (!profile || !repositories || !contributions || !metrics) return null;

    return {
      profile: profile.rawData as unknown as GitHubUserProfile,
      repositories: repositories.rawData as unknown as GitHubRepository[],
      contributionStats: contributions.rawData as unknown as GitHubContributionStats,
      metrics: metrics.rawData as unknown as GitHubMetrics,
      fetchedAt: profile.fetchedAt
    };
  }

  /**
   * Check if cached data is still valid
   */
  async isCacheValid(candidateId: string): Promise<boolean> {
    const data = await prisma.platformData.findFirst({
      where: {
        candidateId,
        platform: Platform.GITHUB,
        expiresAt: { gt: new Date() }
      }
    });

    return data !== null;
  }
}

export const githubConnector = new GitHubConnector();
