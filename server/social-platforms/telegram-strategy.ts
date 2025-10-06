import { PlatformStrategy, type PlatformPostResult, type PlatformAnalytics, type PlatformCredentials, type ScheduledPostData } from './platform-strategy';

export class TelegramStrategy extends PlatformStrategy {
  private readonly BASE_URL = 'https://api.telegram.org/bot';

  constructor(credentials: PlatformCredentials) {
    super('Telegram', credentials);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}${this.credentials.apiKey}/getMe`;
      const response = await this.makeRequest(url, 'GET');
      return response.ok && !!response.result;
    } catch (error) {
      console.error('Telegram credential validation failed:', error);
      return false;
    }
  }

  async publishPost(postData: ScheduledPostData): Promise<PlatformPostResult> {
    try {
      const channelId = this.credentials.channelId;
      if (!channelId) {
        throw new Error('Telegram channel ID not configured');
      }

      const text = this.buildMessage(postData.content, postData.hashtags);
      const hasMedia = postData.mediaUrls && postData.mediaUrls.length > 0;

      let response;
      if (hasMedia) {
        const mediaUrl = postData.mediaUrls[0];
        const isPhoto = /\.(jpg|jpeg|png|gif)$/i.test(mediaUrl);
        const isVideo = /\.(mp4|avi|mov)$/i.test(mediaUrl);

        if (isPhoto) {
          response = await this.sendPhoto(channelId, mediaUrl, text);
        } else if (isVideo) {
          response = await this.sendVideo(channelId, mediaUrl, text);
        } else {
          response = await this.sendDocument(channelId, mediaUrl, text);
        }
      } else {
        response = await this.sendMessage(channelId, text);
      }

      return {
        success: response.ok,
        platformPostId: response.result?.message_id?.toString(),
        metadata: {
          chatId: response.result?.chat?.id,
          date: response.result?.date,
        },
      };
    } catch (error: any) {
      console.error('Telegram post failed:', error);
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
        throw new Error('Telegram channel ID not configured');
      }

      const chatUrl = `${this.BASE_URL}${this.credentials.apiKey}/getChat`;
      const chatResponse = await this.makeRequest(chatUrl, 'POST', {
        chat_id: channelId,
      });

      const memberCountUrl = `${this.BASE_URL}${this.credentials.apiKey}/getChatMemberCount`;
      const memberResponse = await this.makeRequest(memberCountUrl, 'POST', {
        chat_id: channelId,
      });

      return {
        followers: memberResponse.result || 0,
        impressions: 0,
        engagement: 0,
        reach: memberResponse.result || 0,
      };
    } catch (error) {
      console.error('Telegram analytics fetch failed:', error);
      return {
        followers: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    try {
      const channelId = this.credentials.channelId;
      if (!channelId) {
        throw new Error('Telegram channel ID not configured');
      }

      const url = `${this.BASE_URL}${this.credentials.apiKey}/deleteMessage`;
      const response = await this.makeRequest(url, 'POST', {
        chat_id: channelId,
        message_id: parseInt(platformPostId, 10),
      });

      return response.ok;
    } catch (error) {
      console.error('Telegram post deletion failed:', error);
      return false;
    }
  }

  async updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult> {
    try {
      const channelId = this.credentials.channelId;
      if (!channelId) {
        throw new Error('Telegram channel ID not configured');
      }

      const text = this.buildMessage(postData.content || '', postData.hashtags);
      const url = `${this.BASE_URL}${this.credentials.apiKey}/editMessageText`;
      const response = await this.makeRequest(url, 'POST', {
        chat_id: channelId,
        message_id: parseInt(platformPostId, 10),
        text: text,
        parse_mode: 'HTML',
      });

      return {
        success: response.ok,
        platformPostId: response.result?.message_id?.toString(),
      };
    } catch (error: any) {
      console.error('Telegram post update failed:', error);
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
    return message.slice(0, 4096);
  }

  private async sendMessage(chatId: string, text: string): Promise<any> {
    const url = `${this.BASE_URL}${this.credentials.apiKey}/sendMessage`;
    return await this.makeRequest(url, 'POST', {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    });
  }

  private async sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<any> {
    const url = `${this.BASE_URL}${this.credentials.apiKey}/sendPhoto`;
    return await this.makeRequest(url, 'POST', {
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: 'HTML',
    });
  }

  private async sendVideo(chatId: string, videoUrl: string, caption?: string): Promise<any> {
    const url = `${this.BASE_URL}${this.credentials.apiKey}/sendVideo`;
    return await this.makeRequest(url, 'POST', {
      chat_id: chatId,
      video: videoUrl,
      caption: caption,
      parse_mode: 'HTML',
    });
  }

  private async sendDocument(chatId: string, documentUrl: string, caption?: string): Promise<any> {
    const url = `${this.BASE_URL}${this.credentials.apiKey}/sendDocument`;
    return await this.makeRequest(url, 'POST', {
      chat_id: chatId,
      document: documentUrl,
      caption: caption,
      parse_mode: 'HTML',
    });
  }
}
