import type { InsertSocialMediaPost, SelectSocialMediaAnalytics, SelectPlatformCredential } from '@shared/schema';

export interface PlatformPostResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PlatformAnalytics {
  followers: number;
  impressions: number;
  engagement: number;
  clicks?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  reach?: number;
}

export interface PlatformCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  accountId?: string;
  channelId?: string;
  additionalData?: Record<string, any>;
}

export interface ScheduledPostData {
  content: string;
  mediaUrls?: string[];
  scheduledFor: Date;
  hashtags?: string[];
  language?: string;
}

export abstract class PlatformStrategy {
  protected platform: string;
  protected credentials: PlatformCredentials;

  constructor(platform: string, credentials: PlatformCredentials) {
    this.platform = platform;
    this.credentials = credentials;
  }

  abstract validateCredentials(): Promise<boolean>;

  abstract publishPost(postData: ScheduledPostData): Promise<PlatformPostResult>;

  abstract getAnalytics(dateFrom: Date, dateTo: Date): Promise<PlatformAnalytics>;

  abstract deletePost(platformPostId: string): Promise<boolean>;

  abstract updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult>;

  getPlatformName(): string {
    return this.platform;
  }

  protected async makeRequest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Platform API request failed for ${this.platform}:`, error);
      throw error;
    }
  }
}
