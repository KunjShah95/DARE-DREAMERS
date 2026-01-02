/**
 * Notification Service
 * Task 5.5: Implement score update and notification system
 * - Create automatic score recalculation on data changes
 * - Implement notification service for score updates
 * - Generate improvement recommendations
 * Requirements: 3.2, 3.3
 */

import { prisma } from '../lib/prisma';
import { Platform } from '@prisma/client';
import { aggregationService, ScoreUpdateResult } from './aggregation.service';

// Notification types
export enum NotificationType {
  SCORE_UPDATE = 'SCORE_UPDATE',
  SCORE_IMPROVEMENT = 'SCORE_IMPROVEMENT',
  SCORE_DECLINE = 'SCORE_DECLINE',
  PLATFORM_CONNECTED = 'PLATFORM_CONNECTED',
  PLATFORM_DATA_REFRESHED = 'PLATFORM_DATA_REFRESHED',
  NEW_RECOMMENDATION = 'NEW_RECOMMENDATION',
  PROFILE_VIEW = 'PROFILE_VIEW'
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

// Score change notification data
export interface ScoreChangeData {
  previousScore: number;
  currentScore: number;
  changeAmount: number;
  affectedPlatforms: string[];
  recommendations: string[];
}

// Platform connection notification data
export interface PlatformConnectionData {
  platform: Platform;
  username: string;
  isVerified: boolean;
}

// Notification store (in-memory for now, can be replaced with Redis/DB)
const notificationStore: Map<string, Notification[]> = new Map();

export class NotificationService {
  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date()
    };

    // Store notification
    const userNotifications = notificationStore.get(userId) || [];
    userNotifications.unshift(notification);
    
    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.splice(100);
    }
    
    notificationStore.set(userId, userNotifications);

    // In production, this would also:
    // - Store in database
    // - Send push notification
    // - Send email if user preferences allow
    // - Trigger webhooks

    return notification;
  }

  /**
   * Get notifications for a user
   */
  getNotifications(userId: string, limit = 20, unreadOnly = false): Notification[] {
    const notifications = notificationStore.get(userId) || [];
    
    let filtered = notifications;
    if (unreadOnly) {
      filtered = notifications.filter(n => !n.read);
    }
    
    return filtered.slice(0, limit);
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, notificationId: string): boolean {
    const notifications = notificationStore.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      return true;
    }
    
    return false;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): number {
    const notifications = notificationStore.get(userId) || [];
    let count = 0;
    
    for (const notification of notifications) {
      if (!notification.read) {
        notification.read = true;
        count++;
      }
    }
    
    return count;
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userId: string): number {
    const notifications = notificationStore.get(userId) || [];
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Notify user of score update
   */
  async notifyScoreUpdate(userId: string, scoreResult: ScoreUpdateResult): Promise<Notification | null> {
    if (!scoreResult.changed) {
      return null;
    }

    const { previous, current, changeAmount } = scoreResult;
    const isImprovement = changeAmount > 0;

    const type = isImprovement ? NotificationType.SCORE_IMPROVEMENT : NotificationType.SCORE_DECLINE;
    const title = isImprovement 
      ? `🎉 Score Improved by ${changeAmount} points!` 
      : `📉 Score Changed by ${changeAmount} points`;
    
    const message = isImprovement
      ? `Great work! Your overall score increased from ${previous?.overallScore || 0} to ${current.overallScore}. Keep up the momentum!`
      : `Your score changed from ${previous?.overallScore || 0} to ${current.overallScore}. Check your profile for improvement suggestions.`;

    const data: ScoreChangeData = {
      previousScore: previous?.overallScore || 0,
      currentScore: current.overallScore,
      changeAmount,
      affectedPlatforms: current.breakdown.platformsConnected,
      recommendations: current.recommendations.slice(0, 3)
    };

    return this.createNotification(userId, type, title, message, data as unknown as Record<string, unknown>);
  }

  /**
   * Notify user of platform connection
   */
  async notifyPlatformConnected(
    userId: string,
    platform: Platform,
    username: string,
    isVerified: boolean
  ): Promise<Notification> {
    const platformNames: Record<Platform, string> = {
      [Platform.GITHUB]: 'GitHub',
      [Platform.LINKEDIN]: 'LinkedIn',
      [Platform.TWITTER]: 'Twitter',
      [Platform.MEDIUM]: 'Medium',
      [Platform.HASHNODE]: 'Hashnode',
      [Platform.DEVTO]: 'Dev.to'
    };

    const title = `✅ ${platformNames[platform]} Connected`;
    const message = isVerified 
      ? `Your ${platformNames[platform]} account (@${username}) has been connected and verified!`
      : `Your ${platformNames[platform]} account (@${username}) has been connected. We'll start fetching your data soon.`;

    const data: PlatformConnectionData = {
      platform,
      username,
      isVerified
    };

    return this.createNotification(
      userId,
      NotificationType.PLATFORM_CONNECTED,
      title,
      message,
      data as unknown as Record<string, unknown>
    );
  }

  /**
   * Notify user of data refresh
   */
  async notifyDataRefreshed(
    userId: string,
    platforms: Platform[]
  ): Promise<Notification> {
    const platformNames = platforms.map(p => {
      const names: Record<Platform, string> = {
        [Platform.GITHUB]: 'GitHub',
        [Platform.LINKEDIN]: 'LinkedIn',
        [Platform.TWITTER]: 'Twitter',
        [Platform.MEDIUM]: 'Medium',
        [Platform.HASHNODE]: 'Hashnode',
        [Platform.DEVTO]: 'Dev.to'
      };
      return names[p];
    });

    const title = '🔄 Profile Data Updated';
    const message = `Your data from ${platformNames.join(', ')} has been refreshed. Your score may have changed.`;

    return this.createNotification(
      userId,
      NotificationType.PLATFORM_DATA_REFRESHED,
      title,
      message,
      { platforms }
    );
  }

  /**
   * Notify user of new recommendations
   */
  async notifyNewRecommendations(
    userId: string,
    recommendations: string[]
  ): Promise<Notification | null> {
    if (recommendations.length === 0) {
      return null;
    }

    const title = '💡 New Improvement Suggestions';
    const message = `We have ${recommendations.length} new recommendation${recommendations.length > 1 ? 's' : ''} to help improve your score.`;

    return this.createNotification(
      userId,
      NotificationType.NEW_RECOMMENDATION,
      title,
      message,
      { recommendations }
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(userId: string, notificationId: string): boolean {
    const notifications = notificationStore.get(userId) || [];
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      notifications.splice(index, 1);
      notificationStore.set(userId, notifications);
      return true;
    }
    
    return false;
  }

  /**
   * Clear all notifications for a user
   */
  clearAllNotifications(userId: string): void {
    notificationStore.set(userId, []);
  }
}

/**
 * Score Update Service
 * Handles automatic score recalculation and notifications
 */
export class ScoreUpdateService {
  private notificationService: NotificationService;

  constructor(notificationService?: NotificationService) {
    this.notificationService = notificationService || new NotificationService();
  }

  /**
   * Trigger score recalculation after platform data change
   */
  async onPlatformDataChanged(userId: string, platform: Platform): Promise<ScoreUpdateResult> {
    // Recalculate score
    const result = await aggregationService.calculateAndStoreScore(userId);

    // Notify user of score change
    await this.notificationService.notifyScoreUpdate(userId, result);

    // Check for new recommendations
    if (result.current.recommendations.length > 0) {
      const newRecs = result.previous 
        ? result.current.recommendations.filter(r => !result.previous?.recommendations.includes(r))
        : result.current.recommendations;
      
      if (newRecs.length > 0) {
        await this.notificationService.notifyNewRecommendations(userId, newRecs);
      }
    }

    return result;
  }

  /**
   * Trigger score recalculation after platform connection
   */
  async onPlatformConnected(
    userId: string,
    platform: Platform,
    username: string
  ): Promise<ScoreUpdateResult> {
    // Notify about connection
    await this.notificationService.notifyPlatformConnected(userId, platform, username, false);

    // Recalculate score
    const result = await aggregationService.calculateAndStoreScore(userId);

    // Notify user of score change
    await this.notificationService.notifyScoreUpdate(userId, result);

    return result;
  }

  /**
   * Refresh all platform data and recalculate score
   */
  async refreshAndNotify(userId: string): Promise<ScoreUpdateResult> {
    // Get connected platforms
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: { platformConnections: true }
    });

    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    const platforms = candidateProfile.platformConnections.map(c => c.platform);

    // Refresh and recalculate
    const result = await aggregationService.refreshAndRecalculate(userId);

    // Notify about data refresh
    if (platforms.length > 0) {
      await this.notificationService.notifyDataRefreshed(userId, platforms);
    }

    // Notify about score change
    await this.notificationService.notifyScoreUpdate(userId, result);

    return result;
  }

  /**
   * Schedule periodic score updates for all candidates
   * This would typically be called by a background job
   */
  async schedulePeriodicUpdate(userId: string): Promise<void> {
    // Check if data is stale (older than 24 hours)
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: { platformConnections: true }
    });

    if (!candidateProfile) return;

    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hasStaleData = candidateProfile.platformConnections.some(
      c => !c.lastSynced || c.lastSynced < staleThreshold
    );

    if (hasStaleData) {
      await this.refreshAndNotify(userId);
    }
  }
}

export const notificationService = new NotificationService();
export const scoreUpdateService = new ScoreUpdateService(notificationService);
