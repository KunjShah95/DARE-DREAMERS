// Database types and interfaces for the Candidate Scoring Platform
import { UserType, Platform, SubscriptionTier } from '@prisma/client';

// Core User Interface
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  userType: UserType;
  createdAt: Date;
  updatedAt: Date;
}

// Registration DTOs
export interface CandidateRegistration {
  email: string;
  password: string;
  name: string;
  location?: string;
  bio?: string;
  website?: string;
  platformConnections?: {
    platform: Platform;
    username: string;
  }[];
}

export interface RecruiterRegistration {
  email: string;
  password: string;
  name: string;
  company: string;
  subscriptionTier?: SubscriptionTier;
}

// Profile Update DTOs
export interface ProfileUpdate {
  name?: string;
  location?: string;
  bio?: string;
  website?: string;
  isPublic?: boolean;
}

// User Data Export Interface
export interface UserDataExport {
  user: User;
  profile: any; // Will be either CandidateProfile or RecruiterProfile from Prisma
  platformConnections?: any[];
  scores?: any[];
  platformData?: any[];
  savedSearches?: any[];
  exportedAt: Date;
}

// Search Query Interface
export interface SearchQuery {
  keywords?: string[];
  skills?: string[];
  minScore?: number;
  maxScore?: number;
  location?: string;
  experience?: string;
  languages?: string[];
  sortBy: 'score' | 'relevance' | 'recent';
  limit: number;
  offset: number;
}

// Search Results Interface
export interface SearchResults {
  candidates: CandidateSearchResult[];
  total: number;
  facets: SearchFacets;
}

export interface CandidateSearchResult {
  id: string;
  name: string;
  score: number;
  topSkills: string[];
  location?: string;
  githubUsername?: string;
  summary: string;
}

export interface SearchFacets {
  skills: { [key: string]: number };
  locations: { [key: string]: number };
  scoreRanges: { [key: string]: number };
  languages: { [key: string]: number };
}

// Scoring Weights Configuration
export interface ScoringWeights {
  github: number; // 0.4 (40%)
  linkedin: number; // 0.3 (30%)
  blog: number; // 0.2 (20%)
  social: number; // 0.1 (10%)
}

// Platform-specific data interfaces
export interface GitHubProfile {
  username: string;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: Date;
  location?: string;
  company?: string;
}

export interface Repository {
  name: string;
  description?: string;
  language: string;
  stars: number;
  forks: number;
  size: number;
  lastUpdated: Date;
  isForked: boolean;
  topics: string[];
}

export interface CodeQualityMetrics {
  languageDiversity: number;
  averageRepoSize: number;
  commitFrequency: number;
  collaborationScore: number;
  documentationScore: number;
}

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  location?: string;
  industry?: string;
  connections: number;
}

export interface Experience {
  title: string;
  company: string;
  duration: number; // in months
  description?: string;
  skills: string[];
}

export interface BlogPost {
  title: string;
  url: string;
  publishedAt: Date;
  readTime: number;
  claps: number;
  views: number;
  tags: string[];
  content: string;
}

export interface ContentMetrics {
  postFrequency: number;
  averageReadTime: number;
  engagementRate: number;
  topicConsistency: number;
  technicalDepth: number;
}