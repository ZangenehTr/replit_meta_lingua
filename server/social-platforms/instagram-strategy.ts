import { PlatformStrategy, type PlatformPostResult, type PlatformAnalytics, type PlatformCredentials, type ScheduledPostData } from './platform-strategy';

export class InstagramStrategy extends PlatformStrategy {
  private readonly BASE_URL = 'https://graph.facebook.com/v18.0';

  constructor(credentials: PlatformCredentials) {
    super('Instagram', credentials);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/me?access_token=${this.credentials.accessToken}&fields=id,username`;
      const response = await this.makeRequest(url, 'GET');
      return !!response.id;
    } catch (error) {
      console.error('Instagram credential validation failed:', error);
      return false;
    }
  }

  async publishPost(postData: ScheduledPostData): Promise<PlatformPostResult> {
    try {
      const igAccountId = this.credentials.accountId;
      if (!igAccountId) {
        throw new Error('Instagram account ID not configured');
      }

      const mediaUrl = postData.mediaUrls?.[0];
      if (!mediaUrl) {
        throw new Error('Instagram requires at least one media URL');
      }

      const caption = this.buildCaption(postData.content, postData.hashtags);

      const containerUrl = `${this.BASE_URL}/${igAccountId}/media`;
      const containerResponse = await this.makeRequest(containerUrl, 'POST', {
        image_url: mediaUrl,
        caption: caption,
        access_token: this.credentials.accessToken,
      });

      const publishUrl = `${this.BASE_URL}/${igAccountId}/media_publish`;
      const publishResponse = await this.makeRequest(publishUrl, 'POST', {
        creation_id: containerResponse.id,
        access_token: this.credentials.accessToken,
      });

      return {
        success: true,
        platformPostId: publishResponse.id,
        metadata: {
          containerid: containerResponse.id,
        },
      };
    } catch (error: any) {
      console.error('Instagram post failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAnalytics(dateFrom: Date, dateTo: Date): Promise<PlatformAnalytics> {
    try {
      const igAccountId = this.credentials.accountId;
      if (!igAccountId) {
        throw new Error('Instagram account ID not configured');
      }

      const insightsUrl = `${this.BASE_URL}/${igAccountId}/insights`;
      const metrics = 'follower_count,impressions,reach,profile_views';
      const period = 'day';
      
      const since = Math.floor(dateFrom.getTime() / 1000);
      const until = Math.floor(dateTo.getTime() / 1000);

      const response = await this.makeRequest(
        `${insightsUrl}?metric=${metrics}&period=${period}&since=${since}&until=${until}&access_token=${this.credentials.accessToken}`,
        'GET'
      );

      const analytics: PlatformAnalytics = {
        followers: 0,
        impressions: 0,
        engagement: 0,
        reach: 0,
      };

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((metric: any) => {
          if (metric.name === 'follower_count') {
            analytics.followers = metric.values[metric.values.length - 1]?.value || 0;
          } else if (metric.name === 'impressions') {
            analytics.impressions = metric.values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
          } else if (metric.name === 'reach') {
            analytics.reach = metric.values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
          }
        });
      }

      const mediaUrl = `${this.BASE_URL}/${igAccountId}/media`;
      const mediaResponse = await this.makeRequest(
        `${mediaUrl}?fields=like_count,comments_count&since=${since}&until=${until}&access_token=${this.credentials.accessToken}`,
        'GET'
      );

      if (mediaResponse.data && Array.isArray(mediaResponse.data)) {
        const totalLikes = mediaResponse.data.reduce((sum: number, m: any) => sum + (m.like_count || 0), 0);
        const totalComments = mediaResponse.data.reduce((sum: number, m: any) => sum + (m.comments_count || 0), 0);
        analytics.engagement = totalLikes + totalComments;
        analytics.likes = totalLikes;
        analytics.comments = totalComments;
      }

      return analytics;
    } catch (error) {
      console.error('Instagram analytics fetch failed:', error);
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
      console.error('Instagram post deletion failed:', error);
      return false;
    }
  }

  async updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult> {
    return {
      success: false,
      error: 'Instagram does not support editing published posts',
    };
  }

  private buildCaption(content: string, hashtags?: string[]): string {
    let caption = content;
    if (hashtags && hashtags.length > 0) {
      caption += '\n\n' + hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    }
    return caption.slice(0, 2200);
  }
}
