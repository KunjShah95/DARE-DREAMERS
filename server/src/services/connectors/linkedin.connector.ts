/**
 * LinkedIn Connector Service
 * Task 3.7: Create LinkedIn connector placeholder
 * - Implement basic LinkedIn data structure handling
 * - Add manual data entry fallback for LinkedIn Partner API restrictions
 * Requirements: 1.2, 2.3
 * 
 * Note: LinkedIn's API requires Partner Program access which has strict requirements.
 * This connector provides a structure for manual data entry and future API integration.
 */

import { prisma } from '../../lib/prisma';
import { Platform, Prisma } from '@prisma/client';

// Types for LinkedIn data
export interface LinkedInProfile {
  username: string;
  name: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  url: string;
  location: string | null;
  industry: string | null;
  connections: number;
  isManualEntry: boolean;
}

export interface LinkedInExperience {
  id: string;
  title: string;
  company: string;
  companyUrl: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface LinkedInEducation {
  id: string;
  school: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
}

export interface LinkedInSkill {
  name: string;
  endorsements: number;
}

export interface LinkedInCertification {
  name: string;
  authority: string;
  issueDate: string | null;
  expirationDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
}

export interface LinkedInMetrics {
  experienceScore: number;
  educationScore: number;
  skillsScore: number;
  networkScore: number;
  overallScore: number;
  breakdown: {
    yearsOfExperience: number;
    numberOfPositions: number;
    numberOfEducation: number;
    numberOfSkills: number;
    topSkills: string[];
    connections: number;
    hasCertifications: boolean;
  };
  recommendations: string[];
}

export interface LinkedInData {
  profile: LinkedInProfile;
  experiences: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: LinkedInSkill[];
  certifications: LinkedInCertification[];
  metrics: LinkedInMetrics;
  fetchedAt: Date;
}

export interface ManualLinkedInInput {
  profileUrl: string;
  name: string;
  headline?: string;
  bio?: string;
  location?: string;
  industry?: string;
  connections?: number;
  experiences?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    authority: string;
    issueDate?: string;
  }>;
}

export class LinkedInConnector {
  /**
   * Extract username from LinkedIn URL
   */
  private extractUsername(profileUrl: string): string {
    // Handle various LinkedIn URL formats
    const patterns = [
      /linkedin\.com\/in\/([^/?]+)/,
      /linkedin\.com\/pub\/([^/?]+)/
    ];

    for (const pattern of patterns) {
      const match = profileUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no pattern matches, use the URL as-is or extract last segment
    const segments = profileUrl.split('/').filter(s => s);
    return segments[segments.length - 1] || profileUrl;
  }

  /**
   * Create LinkedIn data from manual input
   */
  createFromManualInput(input: ManualLinkedInInput): LinkedInData {
    const username = this.extractUsername(input.profileUrl);

    const profile: LinkedInProfile = {
      username,
      name: input.name,
      headline: input.headline || null,
      bio: input.bio || null,
      avatarUrl: null,
      url: input.profileUrl,
      location: input.location || null,
      industry: input.industry || null,
      connections: input.connections || 0,
      isManualEntry: true
    };

    const experiences: LinkedInExperience[] = (input.experiences || []).map((exp, index) => ({
      id: `exp-${index}`,
      title: exp.title,
      company: exp.company,
      companyUrl: null,
      location: null,
      startDate: exp.startDate,
      endDate: exp.endDate || null,
      isCurrent: exp.isCurrent || false,
      description: exp.description || null
    }));

    const education: LinkedInEducation[] = (input.education || []).map((edu, index) => ({
      id: `edu-${index}`,
      school: edu.school,
      degree: edu.degree || null,
      fieldOfStudy: edu.fieldOfStudy || null,
      startYear: edu.startYear || null,
      endYear: edu.endYear || null,
      description: null
    }));

    const skills: LinkedInSkill[] = (input.skills || []).map(skill => ({
      name: skill,
      endorsements: 0
    }));

    const certifications: LinkedInCertification[] = (input.certifications || []).map(cert => ({
      name: cert.name,
      authority: cert.authority,
      issueDate: cert.issueDate || null,
      expirationDate: null,
      credentialId: null,
      credentialUrl: null
    }));

    const metrics = this.calculateMetrics(profile, experiences, education, skills, certifications);

    return {
      profile,
      experiences,
      education,
      skills,
      certifications,
      metrics,
      fetchedAt: new Date()
    };
  }

  /**
   * Calculate LinkedIn metrics
   */
  calculateMetrics(
    profile: LinkedInProfile,
    experiences: LinkedInExperience[],
    education: LinkedInEducation[],
    skills: LinkedInSkill[],
    certifications: LinkedInCertification[]
  ): LinkedInMetrics {
    // Calculate years of experience
    let totalMonths = 0;
    for (const exp of experiences) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
    const yearsOfExperience = Math.round(totalMonths / 12 * 10) / 10;

    // Calculate experience score
    const experienceScore = Math.min(
      (yearsOfExperience >= 5 ? 40 : yearsOfExperience * 8) +
      (experiences.length >= 3 ? 30 : experiences.length * 10) +
      (experiences.filter(e => e.description).length / Math.max(experiences.length, 1)) * 30,
      100
    );

    // Calculate education score
    const hasAdvancedDegree = education.some(e => 
      e.degree?.toLowerCase().includes('master') || 
      e.degree?.toLowerCase().includes('phd') ||
      e.degree?.toLowerCase().includes('mba')
    );
    const educationScore = Math.min(
      (education.length >= 1 ? 40 : 0) +
      (hasAdvancedDegree ? 30 : 0) +
      (education.some(e => e.fieldOfStudy) ? 30 : 0),
      100
    );

    // Calculate skills score
    const topSkills = skills
      .sort((a, b) => b.endorsements - a.endorsements)
      .slice(0, 10)
      .map(s => s.name);

    const skillsScore = Math.min(
      (skills.length >= 10 ? 50 : skills.length * 5) +
      (skills.reduce((sum, s) => sum + s.endorsements, 0) >= 50 ? 50 : 
       skills.reduce((sum, s) => sum + s.endorsements, 0)),
      100
    );

    // Calculate network score
    const networkScore = Math.min(
      (profile.connections >= 500 ? 100 : profile.connections / 5),
      100
    );

    // Calculate overall score
    const overallScore = Math.round(
      experienceScore * 0.35 +
      educationScore * 0.2 +
      skillsScore * 0.25 +
      networkScore * 0.2
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (yearsOfExperience < 2) {
      recommendations.push('Gain more professional experience');
    }
    if (experiences.filter(e => e.description).length < experiences.length) {
      recommendations.push('Add detailed descriptions to your work experiences');
    }
    if (skills.length < 10) {
      recommendations.push('Add more skills to your profile');
    }
    if (profile.connections < 100) {
      recommendations.push('Expand your professional network');
    }
    if (!profile.headline) {
      recommendations.push('Add a professional headline');
    }
    if (!profile.bio) {
      recommendations.push('Write a compelling summary/bio');
    }
    if (certifications.length === 0) {
      recommendations.push('Add relevant certifications to stand out');
    }

    return {
      experienceScore: Math.round(experienceScore),
      educationScore: Math.round(educationScore),
      skillsScore: Math.round(skillsScore),
      networkScore: Math.round(networkScore),
      overallScore,
      breakdown: {
        yearsOfExperience,
        numberOfPositions: experiences.length,
        numberOfEducation: education.length,
        numberOfSkills: skills.length,
        topSkills,
        connections: profile.connections,
        hasCertifications: certifications.length > 0
      },
      recommendations
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
      where: { candidateId, platform: Platform.LINKEDIN, dataType }
    });

    if (existing) {
      await prisma.platformData.update({
        where: { id: existing.id },
        data: {
          rawData,
          processedData: processedData ?? Prisma.JsonNull,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for manual data
        }
      });
    } else {
      await prisma.platformData.create({
        data: {
          candidateId,
          platform: Platform.LINKEDIN,
          dataType,
          rawData,
          processedData: processedData ?? Prisma.JsonNull,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  /**
   * Store LinkedIn data from manual input
   */
  async storeManualData(candidateId: string, input: ManualLinkedInInput): Promise<LinkedInData> {
    const data = this.createFromManualInput(input);

    await this.storePlatformData(candidateId, 'profile', data.profile as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(candidateId, 'experiences', data.experiences as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(candidateId, 'education', data.education as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(candidateId, 'skills', data.skills as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(candidateId, 'certifications', data.certifications as unknown as Prisma.InputJsonValue);
    await this.storePlatformData(
      candidateId,
      'metrics',
      data.metrics as unknown as Prisma.InputJsonValue,
      { score: data.metrics.overallScore }
    );

    // Update platform connection
    await prisma.platformConnection.updateMany({
      where: { candidateId, platform: Platform.LINKEDIN },
      data: { lastSynced: new Date(), isVerified: false } // Manual data is not verified
    });

    return data;
  }

  /**
   * Get cached LinkedIn data
   */
  async getCachedData(candidateId: string): Promise<LinkedInData | null> {
    const platformData = await prisma.platformData.findMany({
      where: { candidateId, platform: Platform.LINKEDIN }
    });

    if (platformData.length === 0) return null;

    const profile = platformData.find(d => d.dataType === 'profile');
    const experiences = platformData.find(d => d.dataType === 'experiences');
    const education = platformData.find(d => d.dataType === 'education');
    const skills = platformData.find(d => d.dataType === 'skills');
    const certifications = platformData.find(d => d.dataType === 'certifications');
    const metrics = platformData.find(d => d.dataType === 'metrics');

    if (!profile || !metrics) return null;

    return {
      profile: profile.rawData as unknown as LinkedInProfile,
      experiences: (experiences?.rawData as unknown as LinkedInExperience[]) || [],
      education: (education?.rawData as unknown as LinkedInEducation[]) || [],
      skills: (skills?.rawData as unknown as LinkedInSkill[]) || [],
      certifications: (certifications?.rawData as unknown as LinkedInCertification[]) || [],
      metrics: metrics.rawData as unknown as LinkedInMetrics,
      fetchedAt: profile.fetchedAt
    };
  }
}

export const linkedInConnector = new LinkedInConnector();
