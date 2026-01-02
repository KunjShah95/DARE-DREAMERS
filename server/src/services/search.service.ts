/**
 * Search and Discovery Service
 * Task 6: Build search and discovery service
 * - Implement candidate search functionality
 * - Create skill-based search with ranking
 * - Implement programming language filtering
 * - Add score-based filtering and sorting
 * - Saved search functionality
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { prisma } from '../lib/prisma';
import { Platform } from '@prisma/client';

// Search filters
export interface CandidateSearchFilters {
  skills?: string[];
  languages?: string[];
  minScore?: number;
  maxScore?: number;
  minGithubScore?: number;
  minLinkedinScore?: number;
  minBlogScore?: number;
  minSocialScore?: number;
  location?: string;
  hasGithub?: boolean;
  hasLinkedin?: boolean;
  hasTwitter?: boolean;
  hasBlog?: boolean;
  isPublic?: boolean;
}

// Sort options
export enum SortBy {
  SCORE_DESC = 'score_desc',
  SCORE_ASC = 'score_asc',
  GITHUB_DESC = 'github_desc',
  LINKEDIN_DESC = 'linkedin_desc',
  BLOG_DESC = 'blog_desc',
  SOCIAL_DESC = 'social_desc',
  RECENT = 'recent',
  NAME_ASC = 'name_asc'
}

// Search result candidate
export interface SearchResultCandidate {
  id: string;
  userId: string;
  name: string;
  location: string | null;
  bio: string | null;
  isPublic: boolean;
  score: {
    composite: number;
    github: number | null;
    linkedin: number | null;
    blog: number | null;
    social: number | null;
  };
  platforms: {
    platform: Platform;
    username: string;
    isVerified: boolean;
  }[];
  skills: string[];
  languages: string[];
  strengths: string[];
  matchScore?: number;
}

// Search result
export interface SearchResult {
  candidates: SearchResultCandidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: CandidateSearchFilters;
  sortBy: SortBy;
}

// Saved search
export interface SavedSearchConfig {
  id: string;
  name: string;
  filters: CandidateSearchFilters;
  sortBy: SortBy;
  createdAt: Date;
  lastRunAt: Date | null;
  notifyOnNewMatches: boolean;
}

export class SearchService {
  /**
   * Search candidates with filters
   */
  async searchCandidates(
    filters: CandidateSearchFilters,
    sortBy: SortBy = SortBy.SCORE_DESC,
    page = 1,
    pageSize = 20
  ): Promise<SearchResult> {
    // Build query conditions
    const whereConditions: Record<string, unknown>[] = [];
    
    // Public profile filter
    if (filters.isPublic !== false) {
      whereConditions.push({ isPublic: true });
    }

    // Location filter
    if (filters.location) {
      whereConditions.push({
        location: { contains: filters.location, mode: 'insensitive' }
      });
    }

    // Platform presence filters
    const platformFilters: Platform[] = [];
    if (filters.hasGithub) platformFilters.push(Platform.GITHUB);
    if (filters.hasLinkedin) platformFilters.push(Platform.LINKEDIN);
    if (filters.hasTwitter) platformFilters.push(Platform.TWITTER);
    if (filters.hasBlog) {
      platformFilters.push(Platform.DEVTO, Platform.HASHNODE, Platform.MEDIUM);
    }

    // Get candidates with their scores and connections
    const candidates = await prisma.candidateProfile.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : {},
      include: {
        user: {
          select: { name: true }
        },
        platformConnections: true,
        candidateScores: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        platformData: {
          where: {
            dataType: 'metrics'
          }
        }
      }
    });

    // Process and filter candidates
    let results: SearchResultCandidate[] = candidates
      .filter(candidate => {
        // Filter by platform presence
        if (platformFilters.length > 0) {
          const connectedPlatforms = candidate.platformConnections.map(c => c.platform);
          const hasAllRequired = platformFilters.every(p => 
            connectedPlatforms.includes(p) ||
            (p === Platform.DEVTO && (connectedPlatforms.includes(Platform.HASHNODE) || connectedPlatforms.includes(Platform.MEDIUM))) ||
            (p === Platform.HASHNODE && (connectedPlatforms.includes(Platform.DEVTO) || connectedPlatforms.includes(Platform.MEDIUM))) ||
            (p === Platform.MEDIUM && (connectedPlatforms.includes(Platform.DEVTO) || connectedPlatforms.includes(Platform.HASHNODE)))
          );
          if (!hasAllRequired) return false;
        }

        const score = candidate.candidateScores[0];
        if (!score) return true;

        // Score filters
        if (filters.minScore && score.compositeScore < filters.minScore) return false;
        if (filters.maxScore && score.compositeScore > filters.maxScore) return false;
        if (filters.minGithubScore && (score.githubScore === null || score.githubScore < filters.minGithubScore)) return false;
        if (filters.minLinkedinScore && (score.linkedinScore === null || score.linkedinScore < filters.minLinkedinScore)) return false;
        if (filters.minBlogScore && (score.blogScore === null || score.blogScore < filters.minBlogScore)) return false;
        if (filters.minSocialScore && (score.socialScore === null || score.socialScore < filters.minSocialScore)) return false;

        return true;
      })
      .map(candidate => {
        const score = candidate.candidateScores[0];
        
        // Extract skills and languages from platform data
        const skills = new Set<string>();
        const languages = new Set<string>();
        
        for (const data of candidate.platformData) {
          const rawData = data.rawData as Record<string, unknown>;
          if (rawData?.breakdown) {
            const breakdown = rawData.breakdown as Record<string, unknown>;
            if (Array.isArray(breakdown.languages)) {
              breakdown.languages.forEach((lang: string) => languages.add(lang));
            }
            if (Array.isArray(breakdown.topSkills)) {
              breakdown.topSkills.forEach((skill: string) => skills.add(skill));
            }
            if (Array.isArray(breakdown.topTags)) {
              breakdown.topTags.forEach((tag: string) => skills.add(tag));
            }
          }
        }

        return {
          id: candidate.id,
          userId: candidate.userId,
          name: candidate.user.name,
          location: candidate.location,
          bio: candidate.bio,
          isPublic: candidate.isPublic,
          score: {
            composite: score?.compositeScore || 0,
            github: score?.githubScore || null,
            linkedin: score?.linkedinScore || null,
            blog: score?.blogScore || null,
            social: score?.socialScore || null
          },
          platforms: candidate.platformConnections.map(c => ({
            platform: c.platform,
            username: c.username,
            isVerified: c.isVerified
          })),
          skills: Array.from(skills),
          languages: Array.from(languages),
          strengths: score?.strengths || []
        };
      });

    // Filter by skills
    if (filters.skills && filters.skills.length > 0) {
      const skillsLower = filters.skills.map(s => s.toLowerCase());
      results = results.filter(c => {
        const candidateSkills = c.skills.map(s => s.toLowerCase());
        return skillsLower.some(skill => 
          candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
        );
      });
    }

    // Filter by languages
    if (filters.languages && filters.languages.length > 0) {
      const langsLower = filters.languages.map(l => l.toLowerCase());
      results = results.filter(c => {
        const candidateLangs = c.languages.map(l => l.toLowerCase());
        return langsLower.some(lang => candidateLangs.includes(lang));
      });
    }

    // Calculate match score if skills/languages filter is provided
    if ((filters.skills && filters.skills.length > 0) || (filters.languages && filters.languages.length > 0)) {
      results = results.map(c => {
        let matchScore = 0;
        const totalCriteria = (filters.skills?.length || 0) + (filters.languages?.length || 0);
        
        if (filters.skills) {
          const skillsLower = filters.skills.map(s => s.toLowerCase());
          const candidateSkills = c.skills.map(s => s.toLowerCase());
          matchScore += skillsLower.filter(skill => 
            candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
          ).length;
        }
        
        if (filters.languages) {
          const langsLower = filters.languages.map(l => l.toLowerCase());
          const candidateLangs = c.languages.map(l => l.toLowerCase());
          matchScore += langsLower.filter(lang => candidateLangs.includes(lang)).length;
        }
        
        return {
          ...c,
          matchScore: Math.round((matchScore / totalCriteria) * 100)
        };
      });
    }

    // Sort results
    results = this.sortResults(results, sortBy);

    // Paginate
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedResults = results.slice(offset, offset + pageSize);

    return {
      candidates: paginatedResults,
      total,
      page,
      pageSize,
      totalPages,
      filters,
      sortBy
    };
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResultCandidate[], sortBy: SortBy): SearchResultCandidate[] {
    switch (sortBy) {
      case SortBy.SCORE_DESC:
        return results.sort((a, b) => b.score.composite - a.score.composite);
      case SortBy.SCORE_ASC:
        return results.sort((a, b) => a.score.composite - b.score.composite);
      case SortBy.GITHUB_DESC:
        return results.sort((a, b) => (b.score.github || 0) - (a.score.github || 0));
      case SortBy.LINKEDIN_DESC:
        return results.sort((a, b) => (b.score.linkedin || 0) - (a.score.linkedin || 0));
      case SortBy.BLOG_DESC:
        return results.sort((a, b) => (b.score.blog || 0) - (a.score.blog || 0));
      case SortBy.SOCIAL_DESC:
        return results.sort((a, b) => (b.score.social || 0) - (a.score.social || 0));
      case SortBy.NAME_ASC:
        return results.sort((a, b) => a.name.localeCompare(b.name));
      case SortBy.RECENT:
      default:
        return results;
    }
  }

  /**
   * Get candidate by ID (for recruiter viewing)
   */
  async getCandidateById(candidateId: string, recruiterId?: string): Promise<SearchResultCandidate | null> {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      include: {
        user: { select: { name: true } },
        platformConnections: true,
        candidateScores: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        platformData: {
          where: { dataType: 'metrics' }
        }
      }
    });

    if (!candidate) return null;

    // Check visibility
    if (!candidate.isPublic && !recruiterId) {
      return null;
    }

    const score = candidate.candidateScores[0];
    const skills = new Set<string>();
    const languages = new Set<string>();

    for (const data of candidate.platformData) {
      const rawData = data.rawData as Record<string, unknown>;
      if (rawData?.breakdown) {
        const breakdown = rawData.breakdown as Record<string, unknown>;
        if (Array.isArray(breakdown.languages)) {
          breakdown.languages.forEach((lang: string) => languages.add(lang));
        }
        if (Array.isArray(breakdown.topSkills)) {
          breakdown.topSkills.forEach((skill: string) => skills.add(skill));
        }
      }
    }

    return {
      id: candidate.id,
      userId: candidate.userId,
      name: candidate.user.name,
      location: candidate.location,
      bio: candidate.bio,
      isPublic: candidate.isPublic,
      score: {
        composite: score?.compositeScore || 0,
        github: score?.githubScore || null,
        linkedin: score?.linkedinScore || null,
        blog: score?.blogScore || null,
        social: score?.socialScore || null
      },
      platforms: candidate.platformConnections.map(c => ({
        platform: c.platform,
        username: c.username,
        isVerified: c.isVerified
      })),
      skills: Array.from(skills),
      languages: Array.from(languages),
      strengths: score?.strengths || []
    };
  }

  /**
   * Save a search for a recruiter
   */
  async saveSearch(
    recruiterId: string,
    name: string,
    filters: CandidateSearchFilters,
    sortBy: SortBy = SortBy.SCORE_DESC,
    notifyOnNewMatches = false
  ): Promise<SavedSearchConfig> {
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: recruiterId }
    });

    if (!recruiterProfile) {
      throw new Error('Recruiter profile not found');
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        recruiterId: recruiterProfile.id,
        name,
        queryParams: JSON.parse(JSON.stringify({
          filters,
          sortBy,
          notifyOnNewMatches
        }))
      }
    });

    return {
      id: savedSearch.id,
      name: savedSearch.name,
      filters,
      sortBy,
      createdAt: savedSearch.createdAt,
      lastRunAt: null,
      notifyOnNewMatches
    };
  }

  /**
   * Get saved searches for a recruiter
   */
  async getSavedSearches(recruiterId: string): Promise<SavedSearchConfig[]> {
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: recruiterId }
    });

    if (!recruiterProfile) {
      return [];
    }

    const searches = await prisma.savedSearch.findMany({
      where: { recruiterId: recruiterProfile.id },
      orderBy: { createdAt: 'desc' }
    });

    return searches.map(s => {
      const params = s.queryParams as Record<string, unknown>;
      return {
        id: s.id,
        name: s.name,
        filters: (params.filters || {}) as CandidateSearchFilters,
        sortBy: (params.sortBy || SortBy.SCORE_DESC) as SortBy,
        createdAt: s.createdAt,
        lastRunAt: null,
        notifyOnNewMatches: (params.notifyOnNewMatches || false) as boolean
      };
    });
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(recruiterId: string, searchId: string): Promise<boolean> {
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: recruiterId }
    });

    if (!recruiterProfile) {
      return false;
    }

    const search = await prisma.savedSearch.findFirst({
      where: {
        id: searchId,
        recruiterId: recruiterProfile.id
      }
    });

    if (!search) {
      return false;
    }

    await prisma.savedSearch.delete({
      where: { id: searchId }
    });

    return true;
  }

  /**
   * Run a saved search
   */
  async runSavedSearch(
    recruiterId: string,
    searchId: string,
    page = 1,
    pageSize = 20
  ): Promise<SearchResult | null> {
    const searches = await this.getSavedSearches(recruiterId);
    const search = searches.find(s => s.id === searchId);

    if (!search) {
      return null;
    }

    return this.searchCandidates(search.filters, search.sortBy, page, pageSize);
  }

  /**
   * Get top candidates (leaderboard)
   */
  async getTopCandidates(limit = 10): Promise<SearchResultCandidate[]> {
    const result = await this.searchCandidates(
      { isPublic: true },
      SortBy.SCORE_DESC,
      1,
      limit
    );
    return result.candidates;
  }

  /**
   * Get candidates by skill
   */
  async getCandidatesBySkill(skill: string, limit = 20): Promise<SearchResultCandidate[]> {
    const result = await this.searchCandidates(
      { skills: [skill], isPublic: true },
      SortBy.SCORE_DESC,
      1,
      limit
    );
    return result.candidates;
  }

  /**
   * Get candidates by programming language
   */
  async getCandidatesByLanguage(language: string, limit = 20): Promise<SearchResultCandidate[]> {
    const result = await this.searchCandidates(
      { languages: [language], isPublic: true },
      SortBy.GITHUB_DESC,
      1,
      limit
    );
    return result.candidates;
  }
}

export const searchService = new SearchService();
