import { PlatformStrategy, type PlatformPostResult, type PlatformAnalytics, type PlatformCredentials, type ScheduledPostData } from './platform-strategy';

export class TwitterStrategy extends PlatformStrategy {
  private readonly BASE_URL = 'https://api.twitter.com/2';

  constructor(credentials: PlatformCredentials) {
    super('Twitter', credentials);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/users/me`;
      const response = await this.makeRequest(url, 'GET', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });
      return !!response.data;
    } catch (error) {
      console.error('Twitter credential validation failed:', error);
      return false;
    }
  }

  async publishPost(postData: ScheduledPostData): Promise<PlatformPostResult> {
    try {
      const text = this.buildTweet(postData.content, postData.hashtags);

      const tweetData: any = { text };

      if (postData.mediaUrls && postData.mediaUrls.length > 0) {
        const mediaIds = await this.uploadMedia(postData.mediaUrls);
        if (mediaIds.length > 0) {
          tweetData.media = { media_ids: mediaIds };
        }
      }

      const url = `${this.BASE_URL}/tweets`;
      const response = await this.makeRequest(url, 'POST', tweetData, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });

      return {
        success: true,
        platformPostId: response.data.id,
        metadata: {
          tweetUrl: `https://twitter.com/i/status/${response.data.id}`,
        },
      };
    } catch (error: any) {
      console.error('Twitter post failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAnalytics(dateFrom: Date, dateTo: Date): Promise<PlatformAnalytics> {
    try {
      const meUrl = `${this.BASE_URL}/users/me?user.fields=public_metrics`;
      const meResponse = await this.makeRequest(meUrl, 'GET', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });

      const metrics = meResponse.data?.public_metrics || {};

      return {
        followers: metrics.followers_count || 0,
        impressions: 0,
        engagement: metrics.tweet_count || 0,
        reach: metrics.followers_count || 0,
      };
    } catch (error) {
      console.error('Twitter analytics fetch failed:', error);
      return {
        followers: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/tweets/${platformPostId}`;
      await this.makeRequest(url, 'DELETE', undefined, {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
      });
      return true;
    } catch (error) {
      console.error('Twitter post deletion failed:', error);
      return false;
    }
  }

  async updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult> {
    return {
      success: false,
      error: 'Twitter does not support editing tweets (use delete and repost)',
    };
  }

  private buildTweet(content: string, hashtags?: string[]): string {
    let tweet = content;
    if (hashtags && hashtags.length > 0) {
      const hashtagText = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
      tweet += ` ${hashtagText}`;
    }
    return tweet.slice(0, 280);
  }

  private async uploadMedia(mediaUrls: string[]): Promise<string[]> {
    const mediaIds: string[] = [];
    
    for (const url of mediaUrls.slice(0, 4)) {
      try {
        const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const formData = new FormData();
        formData.append('media', new Blob([buffer]), 'media');

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`,
          },
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.media_id_string) {
          mediaIds.push(uploadResult.media_id_string);
        }
      } catch (error) {
        console.error('Twitter media upload failed:', error);
      }
    }

    return mediaIds;
  }
}
