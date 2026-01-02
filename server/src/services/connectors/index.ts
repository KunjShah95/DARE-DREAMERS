/**
 * Platform Connectors Index
 * Exports all platform connector services
 */

export { GitHubConnector, githubConnector } from './github.connector';
export type { GitHubData, GitHubMetrics, GitHubUserProfile, GitHubRepository } from './github.connector';

export { BlogConnector, blogConnector } from './blog.connector';
export type { BlogData, BlogMetrics, BlogProfile, BlogPost } from './blog.connector';

export { TwitterConnector, twitterConnector } from './twitter.connector';
export type { TwitterData, TwitterMetrics, TwitterProfile, TwitterTweet } from './twitter.connector';

export { LinkedInConnector, linkedInConnector } from './linkedin.connector';
export type { LinkedInData, LinkedInMetrics, LinkedInProfile, ManualLinkedInInput } from './linkedin.connector';
