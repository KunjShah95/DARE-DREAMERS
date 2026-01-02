// Service interfaces for the Candidate Scoring Platform

import {
  User,
  CandidateProfile,
  RecruiterProfile,
  CandidateRegistration,
  RecruiterRegistration,
  ProfileUpdate,
  UserDataExport,
  CandidateScore,
  SearchQuery,
  SearchResults,
  SavedSearch,
  GitHubProfile,
  Repository,
  CodeQualityMetrics,
  LinkedInProfile,
  Experience,
  BlogPost,
  ContentMetrics,
  ScoringWeights
} from './database';

// Platform Connector Interfaces
export interface GitHubConnector {
  fetchUserProfile(username: string): Promise<GitHubProfile>;
  fetchRepositories(username: string): Promise<Repository[]>;
  fetchContributions(username: string, timeframe: string): Promise<ContributionData>;
  calculateCodeQualityMetrics(repositories: Repository[]): Promise<CodeQualityMetrics>;
}

export interface ContributionData {
  totalCommits: number;
  commitsByMonth: { [month: string]: number };
  streakDays: number;
  contributionScore: number;
}

export interface LinkedInConnector {
  fetchProfile(profileId: string): Promise<LinkedInProfile>;
  fetchExperience(profileId: string): Promise<Experience[]>;
  fetchSkills(profileId: string): Promise<Skill[]>;
}

export interface Skill {
  name: string;
  endorsements: number;
  proficiencyLevel?: string;
}

export interface BlogConnector {
  fetchMediumPosts(username: string): Promise<BlogPost[]>;
  fetchHashnodePosts(username: string): Promise<BlogPost[]>;
  fetchDevToPosts(username: string): Promise<BlogPost[]>;
  analyzeContentQuality(posts: BlogPost[]): Promise<ContentMetrics>;
}

export interface TwitterConnector {
  fetchProfile(username: string): Promise<TwitterProfile>;
  fetchTweets(username: string, limit: number): Promise<Tweet[]>;
  analyzeTechnicalContent(tweets: Tweet[]): Promise<SocialMetrics>;
}

export interface TwitterProfile {
  username: string;
  followers: number;
  following: number;
  tweetsCount: number;
  verified: boolean;
  bio?: string;
}

export interface Tweet {
  id: string;
  text: string;
  createdAt: Date;
  likes: number;
  retweets: number;
  replies: number;
  hashtags: string[];
  mentions: string[];
}

export interface SocialMetrics {
  engagementRate: number;
  technicalContentRatio: number;
  influenceScore: number;
  consistencyScore: number;
}

// Scoring Engine Interface
export interface ScoringEngine {
  calculateCompositeScore(profile: CandidateProfile): Promise<CandidateScore>;
  calculateGitHubScore(data: GitHubData): number;
  calculateLinkedInScore(data: LinkedInData): number;
  calculateBlogScore(data: BlogData): number;
  calculateSocialScore(data: SocialData): number;
  getDefaultWeights(): ScoringWeights;
  updateWeights(weights: Partial<ScoringWeights>): void;
}

export interface GitHubData {
  profile: GitHubProfile;
  repositories: Repository[];
  contributions: ContributionData;
  metrics: CodeQualityMetrics;
}

export interface LinkedInData {
  profile: LinkedInProfile;
  experience: Experience[];
  skills: Skill[];
}

export interface BlogData {
  posts: BlogPost[];
  metrics: ContentMetrics;
}

export interface SocialData {
  profile: TwitterProfile;
  tweets: Tweet[];
  metrics: SocialMetrics;
}

// User Management Service Interface
export interface UserService {
  createCandidate(data: CandidateRegistration): Promise<User>;
  createRecruiter(data: RecruiterRegistration): Promise<User>;
  updateProfile(userId: string, updates: ProfileUpdate): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
  exportData(userId: string): Promise<UserDataExport>;
  authenticateUser(email: string, password: string): Promise<AuthResult>;
  generateApiKey(recruiterId: string): Promise<string>;
  validateApiKey(apiKey: string): Promise<RecruiterProfile | null>;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Search and Discovery Service Interface
export interface SearchService {
  searchCandidates(query: SearchQuery): Promise<SearchResults>;
  filterBySkills(skills: string[]): Promise<CandidateProfile[]>;
  filterByScore(minScore: number, maxScore: number): Promise<CandidateProfile[]>;
  saveSearch(recruiterId: string, query: SearchQuery): Promise<SavedSearch>;
  getRecommendations(recruiterId: string): Promise<CandidateProfile[]>;
  indexCandidate(candidate: CandidateProfile): Promise<void>;
  removeFromIndex(candidateId: string): Promise<void>;
}

// Data Aggregation Service Interface
export interface DataAggregationService {
  aggregateDigitalProfile(candidateId: string): Promise<DigitalProfile>;
  refreshPlatformData(candidateId: string, platform?: string): Promise<void>;
  scheduleDataRefresh(candidateId: string, intervalHours: number): Promise<void>;
  validatePlatformConnection(platform: string, username: string): Promise<boolean>;
}

export interface DigitalProfile {
  candidateId: string;
  github?: GitHubData;
  linkedin?: LinkedInData;
  blog?: BlogData;
  social?: SocialData;
  lastUpdated: Date;
  completeness: number; // 0-100 percentage
}

// Notification Service Interface
export interface NotificationService {
  sendScoreUpdate(candidateId: string, oldScore: number, newScore: number): Promise<void>;
  sendNewMatchNotification(recruiterId: string, candidateId: string): Promise<void>;
  sendWebhook(url: string, payload: any): Promise<boolean>;
  registerWebhook(recruiterId: string, url: string, events: string[]): Promise<string>;
  unregisterWebhook(webhookId: string): Promise<void>;
}

// Audit Service Interface
export interface AuditService {
  logDataAccess(userId: string, action: string, resource: string, metadata?: any): Promise<void>;
  logScoreCalculation(candidateId: string, scoreData: CandidateScore): Promise<void>;
  logApiCall(recruiterId: string, endpoint: string, parameters?: any): Promise<void>;
  getAuditTrail(userId: string, startDate?: Date, endDate?: Date): Promise<AuditEntry[]>;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Background Job Service Interface
export interface JobService {
  scheduleDataRefresh(candidateId: string, delay?: number): Promise<string>;
  scheduleScoreRecalculation(candidateId: string, delay?: number): Promise<string>;
  processWebhookDelivery(webhookId: string, payload: any): Promise<void>;
  retryFailedJob(jobId: string): Promise<void>;
  getJobStatus(jobId: string): Promise<JobStatus>;
}

export interface JobStatus {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  type: 'score_updated' | 'new_candidate_match' | 'profile_updated';
  timestamp: Date;
  data: any;
  recruiterId: string;
}

// Rate Limiting Types
export interface RateLimit {
  limit: number;
  remaining: number;
  resetTime: Date;
  windowMs: number;
}