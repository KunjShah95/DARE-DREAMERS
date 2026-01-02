// Main types export file for the Candidate Scoring Platform

// Database types
export * from './database';

// Service types
export * from './services';

// Re-export Prisma generated types for convenience
export type { 
  User as PrismaUser,
  CandidateProfile as PrismaCandidateProfile,
  RecruiterProfile as PrismaRecruiterProfile,
  PlatformConnection as PrismaPlatformConnection,
  CandidateScore as PrismaCandidateScore,
  PlatformData as PrismaPlatformData,
  SavedSearch as PrismaSavedSearch
} from '@prisma/client';