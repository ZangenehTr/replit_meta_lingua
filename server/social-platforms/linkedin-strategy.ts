import { PlatformStrategy, type PlatformPostResult, type PlatformAnalytics, type PlatformCredentials, type ScheduledPostData } from './platform-strategy';

export class LinkedInStrategy extends PlatformStrategy {
  private readonly BASE_URL = 'https://api.linkedin.com/v2';

  constructor(credentials: PlatformCredentials) {
    super('LinkedIn', credentials);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/me`;
      const response = await this.makeRequest(url, 'GET', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });
      return !!response.id;
    } catch (error) {
      console.error('LinkedIn credential validation failed:', error);
      return false;
    }
  }

  async publishPost(postData: ScheduledPostData): Promise<PlatformPostResult> {
    try {
      const personUrn = this.credentials.additionalData?.personUrn;
      if (!personUrn) {
        throw new Error('LinkedIn person URN not configured');
      }

      const shareData = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postData.content,
            },
            shareMediaCategory: postData.mediaUrls && postData.mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
            media: postData.mediaUrls?.map(url => ({
              status: 'READY',
              media: url,
            })) || [],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const url = `${this.BASE_URL}/ugcPosts`;
      const response = await this.makeRequest(url, 'POST', shareData, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      });

      return {
        success: true,
        platformPostId: response.id,
      };
    } catch (error: any) {
      console.error('LinkedIn post failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAnalytics(dateFrom: Date, dateTo: Date): Promise<PlatformAnalytics> {
    try {
      const personUrn = this.credentials.additionalData?.personUrn;
      if (!personUrn) {
        throw new Error('LinkedIn person URN not configured');
      }

      const analyticsUrl = `${this.BASE_URL}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${personUrn}`;
      const response = await this.makeRequest(analyticsUrl, 'GET', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });

      let totalImpressions = 0;
      let totalEngagement = 0;
      let totalClicks = 0;

      if (response.elements && Array.isArray(response.elements)) {
        response.elements.forEach((stat: any) => {
          totalImpressions += stat.totalShareStatistics?.impressionCount || 0;
          totalEngagement += stat.totalShareStatistics?.engagement || 0;
          totalClicks += stat.totalShareStatistics?.clickCount || 0;
        });
      }

      return {
        followers: 0,
        impressions: totalImpressions,
        engagement: totalEngagement,
        clicks: totalClicks,
        reach: totalImpressions,
      };
    } catch (error) {
      console.error('LinkedIn analytics fetch failed:', error);
      return {
        followers: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/ugcPosts/${encodeURIComponent(platformPostId)}`;
      await this.makeRequest(url, 'DELETE', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });
      return true;
    } catch (error) {
      console.error('LinkedIn post deletion failed:', error);
      return false;
    }
  }

  async updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult> {
    return {
      success: false,
      error: 'LinkedIn does not support editing published posts',
    };
  }
}
