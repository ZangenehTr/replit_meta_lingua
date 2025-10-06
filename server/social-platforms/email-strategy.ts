import { PlatformStrategy, type PlatformPostResult, type PlatformAnalytics, type PlatformCredentials, type ScheduledPostData } from './platform-strategy';

export class EmailStrategy extends PlatformStrategy {
  private readonly SENDGRID_URL = 'https://api.sendgrid.com/v3';

  constructor(credentials: PlatformCredentials) {
    super('Email', credentials);
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const url = `${this.SENDGRID_URL}/api_keys`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('SendGrid credential validation failed:', error);
      return false;
    }
  }

  async publishPost(postData: ScheduledPostData): Promise<PlatformPostResult> {
    try {
      const fromEmail = this.credentials.additionalData?.fromEmail || 'noreply@metalingua.com';
      const fromName = this.credentials.additionalData?.fromName || 'Meta Lingua';
      const recipientList = this.credentials.additionalData?.recipientList || [];

      if (!Array.isArray(recipientList) || recipientList.length === 0) {
        throw new Error('Email recipient list is empty');
      }

      const emailData = {
        personalizations: recipientList.map((email: string) => ({
          to: [{ email }],
          subject: this.credentials.additionalData?.subject || 'Newsletter from Meta Lingua',
        })),
        from: {
          email: fromEmail,
          name: fromName,
        },
        content: [
          {
            type: 'text/html',
            value: this.buildEmailHtml(postData.content, postData.mediaUrls),
          },
        ],
        send_at: postData.scheduledFor ? Math.floor(postData.scheduledFor.getTime() / 1000) : undefined,
      };

      const url = `${this.SENDGRID_URL}/mail/send`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${errorText}`);
      }

      const messageId = response.headers.get('X-Message-Id') || `email_${Date.now()}`;

      return {
        success: true,
        platformPostId: messageId,
        metadata: {
          recipientCount: recipientList.length,
          scheduledFor: postData.scheduledFor?.toISOString(),
        },
      };
    } catch (error: any) {
      console.error('Email broadcast failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAnalytics(dateFrom: Date, dateTo: Date): Promise<PlatformAnalytics> {
    try {
      const startDate = dateFrom.toISOString().split('T')[0];
      const endDate = dateTo.toISOString().split('T')[0];
      
      const url = `${this.SENDGRID_URL}/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('SendGrid stats API failed');
      }

      const stats = await response.json();
      
      let totalDelivered = 0;
      let totalOpens = 0;
      let totalClicks = 0;

      if (Array.isArray(stats)) {
        stats.forEach((dayStat: any) => {
          if (dayStat.stats && Array.isArray(dayStat.stats)) {
            dayStat.stats.forEach((metric: any) => {
              totalDelivered += metric.metrics?.delivered || 0;
              totalOpens += metric.metrics?.opens || 0;
              totalClicks += metric.metrics?.clicks || 0;
            });
          }
        });
      }

      return {
        followers: 0,
        impressions: totalDelivered,
        engagement: totalOpens + totalClicks,
        clicks: totalClicks,
        reach: totalDelivered,
      };
    } catch (error) {
      console.error('Email analytics fetch failed:', error);
      return {
        followers: 0,
        impressions: 0,
        engagement: 0,
      };
    }
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    return false;
  }

  async updatePost(platformPostId: string, postData: Partial<ScheduledPostData>): Promise<PlatformPostResult> {
    return {
      success: false,
      error: 'Email campaigns cannot be edited after sending',
    };
  }

  private buildEmailHtml(content: string, mediaUrls?: string[]): string {
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Tahoma', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .media { margin: 20px 0; }
          .media img { max-width: 100%; height: auto; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="content">
          ${content.replace(/\n/g, '<br>')}
        </div>
    `;

    if (mediaUrls && mediaUrls.length > 0) {
      html += '<div class="media">';
      mediaUrls.forEach(url => {
        html += `<img src="${url}" alt="Media attachment">`;
      });
      html += '</div>';
    }

    html += `
      </body>
      </html>
    `;

    return html;
  }
}
