import { PlatformStrategy, type PlatformPostResult, type PlatformAnalytics, type PlatformCredentials, type ScheduledPostData } from './platform-strategy';

export class YouTubeStrategy extends PlatformStrategy {
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  constructor(credentials: PlatformCredentials) {
    super('YouTube', credentials);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/channels?part=snippet&mine=true`;
      const response = await this.makeRequest(url, 'GET', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });
      return !!response.items && response.items.length > 0;
    } catch (error) {
      console.error('YouTube credential validation failed:', error);
      return false;
    }
  }

  async publishPost(postData: ScheduledPostData): Promise<PlatformPostResult> {
    try {
      const channelId = this.credentials.channelId;
      if (!channelId) {
        throw new Error('YouTube channel ID not configured');
      }

      const videoUrl = postData.mediaUrls?.[0];
      if (!videoUrl) {
        throw new Error('YouTube requires a video URL for publishing');
      }

      const snippet = {
        title: postData.content.slice(0, 100),
        description: postData.content,
        tags: postData.hashtags || [],
        categoryId: '22',
        defaultLanguage: postData.language || 'fa',
      };

      const status = {
        privacyStatus: 'public',
        publishAt: postData.scheduledFor?.toISOString(),
      };

      const url = `${this.BASE_URL}/videos?part=snippet,status`;
      const response = await this.makeRequest(url, 'POST', {
        snippet,
        status,
      }, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });

      return {
        success: true,
        platformPostId: response.id,
        metadata: {
          videoUrl: `https://www.youtube.com/watch?v=${response.id}`,
        },
      };
    } catch (error: any) {
      console.error('YouTube video upload failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAnalytics(dateFrom: Date, dateTo: Date): Promise<PlatformAnalytics> {
    try {
      const channelId = this.credentials.channelId;
      if (!channelId) {
        throw new Error('YouTube channel ID not configured');
      }

      const channelUrl = `${this.BASE_URL}/channels?part=statistics&id=${channelId}`;
      const channelResponse = await this.makeRequest(channelUrl, 'GET', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });

      const stats = channelResponse.items?.[0]?.statistics;

      const analyticsUrl = `${this.BASE_URL}/reports?ids=channel==${channelId}&startDate=${dateFrom.toISOString().split('T')[0]}&endDate=${dateTo.toISOString().split('T')[0]}&metrics=views,likes,comments,shares,subscribersGained`;
      const analyticsResponse = await this.makeRequest(analyticsUrl, 'GET', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });

      return {
        followers: parseInt(stats?.subscriberCount || '0', 10),
        impressions: parseInt(stats?.viewCount || '0', 10),
        engagement: parseInt(stats?.commentCount || '0', 10) + parseInt(stats?.likeCount || '0', 10),
        likes: parseInt(stats?.likeCount || '0', 10),
        comments: parseInt(stats?.commentCount || '0', 10),
        reach: parseInt(stats?.viewCount || '0', 10),
      };
    } catch (error) {
      console.error('YouTube analytics fetch failed:', error);
      return {
        followers: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/videos?id=${platformPostId}`;
      await this.makeRequest(url, 'DELETE', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });
      return true;
    } catch (error) {
      console.error('YouTube video deletion failed:', error);
      return false;
    }
  }

  async updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult> {
    try {
      const snippet: any = {};
      if (postData.content) {
        snippet.title = postData.content.slice(0, 100);
        snippet.description = postData.content;
      }
      if (postData.hashtags) {
        snippet.tags = postData.hashtags;
      }

      const url = `${this.BASE_URL}/videos?part=snippet`;
      const response = await this.makeRequest(url, 'PUT', {
        id: platformPostId,
        snippet,
      }, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });

      return {
        success: true,
        platformPostId: response.id,
      };
    } catch (error: any) {
      console.error('YouTube video update failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
