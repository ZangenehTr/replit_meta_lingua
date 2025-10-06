import { PlatformStrategy, type PlatformPostResult, type PlatformAnalytics, type PlatformCredentials, type ScheduledPostData } from './platform-strategy';

export class FacebookStrategy extends PlatformStrategy {
  private readonly BASE_URL = 'https://graph.facebook.com/v18.0';

  constructor(credentials: PlatformCredentials) {
    super('Facebook', credentials);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/me?access_token=${this.credentials.accessToken}`;
      const response = await this.makeRequest(url, 'GET');
      return !!response.id;
    } catch (error) {
      console.error('Facebook credential validation failed:', error);
      return false;
    }
  }

  async publishPost(postData: ScheduledPostData): Promise<PlatformPostResult> {
    try {
      const pageId = this.credentials.accountId;
      if (!pageId) {
        throw new Error('Facebook page ID not configured');
      }

      const message = this.buildMessage(postData.content, postData.hashtags);
      const hasMedia = postData.mediaUrls && postData.mediaUrls.length > 0;

      let response;
      if (hasMedia) {
        const photoUrl = postData.mediaUrls[0];
        response = await this.publishPhoto(pageId, photoUrl, message);
      } else {
        response = await this.publishTextPost(pageId, message);
      }

      return {
        success: true,
        platformPostId: response.id,
        metadata: {
          postUrl: `https://www.facebook.com/${response.id}`,
        },
      };
    } catch (error: any) {
      console.error('Facebook post failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAnalytics(dateFrom: Date, dateTo: Date): Promise<PlatformAnalytics> {
    try {
      const pageId = this.credentials.accountId;
      if (!pageId) {
        throw new Error('Facebook page ID not configured');
      }

      const since = Math.floor(dateFrom.getTime() / 1000);
      const until = Math.floor(dateTo.getTime() / 1000);

      const insightsUrl = `${this.BASE_URL}/${pageId}/insights`;
      const metrics = 'page_fans,page_impressions,page_engaged_users';
      
      const response = await this.makeRequest(
        `${insightsUrl}?metric=${metrics}&since=${since}&until=${until}&access_token=${this.credentials.accessToken}`,
        'GET'
      );

      const analytics: PlatformAnalytics = {
        followers: 0,
        impressions: 0,
        engagement: 0,
      };

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((metric: any) => {
          if (metric.name === 'page_fans') {
            analytics.followers = metric.values[metric.values.length - 1]?.value || 0;
          } else if (metric.name === 'page_impressions') {
            analytics.impressions = metric.values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
          } else if (metric.name === 'page_engaged_users') {
            analytics.engagement = metric.values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
          }
        });
      }

      return analytics;
    } catch (error) {
      console.error('Facebook analytics fetch failed:', error);
      return {
        followers: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/${platformPostId}?access_token=${this.credentials.accessToken}`;
      await this.makeRequest(url, 'DELETE');
      return true;
    } catch (error) {
      console.error('Facebook post deletion failed:', error);
      return false;
    }
  }

  async updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult> {
    try {
      const message = this.buildMessage(postData.content || '', postData.hashtags);
      const url = `${this.BASE_URL}/${platformPostId}`;
      
      const response = await this.makeRequest(url, 'POST', {
        message: message,
        access_token: this.credentials.accessToken,
      });

      return {
        success: response.success,
        platformPostId: platformPostId,
      };
    } catch (error: any) {
      console.error('Facebook post update failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private buildMessage(content: string, hashtags?: string[]): string {
    let message = content;
    if (hashtags && hashtags.length > 0) {
      message += '\n\n' + hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    }
    return message;
  }

  private async publishTextPost(pageId: string, message: string): Promise<any> {
    const url = `${this.BASE_URL}/${pageId}/feed`;
    return await this.makeRequest(url, 'POST', {
      message: message,
      access_token: this.credentials.accessToken,
    });
  }

  private async publishPhoto(pageId: string, photoUrl: string, caption: string): Promise<any> {
    const url = `${this.BASE_URL}/${pageId}/photos`;
    return await this.makeRequest(url, 'POST', {
      url: photoUrl,
      caption: caption,
      access_token: this.credentials.accessToken,
    });
  }
}
