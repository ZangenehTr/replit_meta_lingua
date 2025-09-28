import axios, { AxiosResponse } from 'axios';
import { db } from '../db';
import { thirdPartyApis } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { persianCalendar } from '@shared/persian-calendar';

// Interface for keybit.ir API responses
interface KeybitDateResponse {
  j_y: number;    // Jalali year
  j_m: number;    // Jalali month
  j_d: number;    // Jalali day
  g_y: number;    // Gregorian year
  g_m: number;    // Gregorian month
  g_d: number;    // Gregorian day
  weekday: number; // Day of week
  lunar_h_y?: number; // Hijri year
  lunar_h_m?: number; // Hijri month
  lunar_h_d?: number; // Hijri day
}

interface KeybitHolidayResponse {
  holidays: Array<{
    name: string;
    description: string;
    type: string;
    date: string;
    is_official: boolean;
  }>;
}

interface KeybitMonthResponse {
  month_names: {
    persian: string[];
    english: string[];
  };
  weekdays: {
    persian: string[];
    english: string[];
  };
}

export class KeybitCalendarService {
  private apiConfig: any = null;
  private isHealthy = true;
  private lastHealthCheck: Date | null = null;
  private readonly BASE_URL = 'https://api.keybit.ir';

  constructor() {
    this.loadApiConfig();
  }

  /**
   * Load API configuration from database
   */
  private async loadApiConfig() {
    try {
      const [config] = await db
        .select()
        .from(thirdPartyApis)
        .where(eq(thirdPartyApis.apiName, 'keybit'))
        .limit(1);

      if (config && config.apiKey) {
        // Decrypt API key for use
        const decryptedApiKey = this.decryptApiKey(config.apiKey);
        this.apiConfig = {
          ...config,
          apiKey: decryptedApiKey
        };
      } else {
        this.apiConfig = config || null;
      }
    } catch (error) {
      console.error('Failed to load keybit API config:', error);
      this.apiConfig = null;
    }
  }

  /**
   * Decrypt API key using secure AES-256-GCM
   */
  private decryptApiKey(encryptedKey: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const encryptionKey = process.env.ENCRYPTION_KEY;
      
      if (!encryptionKey || encryptionKey.length !== 64) {
        console.error('ENCRYPTION_KEY environment variable must be 64 characters (32 bytes hex)');
        return '';
      }
      
      const key = Buffer.from(encryptionKey, 'hex');
      const parts = encryptedKey.split(':');
      
      if (parts.length !== 3) {
        console.error('Invalid encrypted key format');
        return '';
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return '';
    }
  }

  /**
   * Check if keybit.ir API is available and healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Test the actual keybit.ir time endpoint (no auth required)
      const response = await axios.get(`${this.BASE_URL}/time/`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.isHealthy = response.status === 200 && response.data?.date?.year?.number;
      this.lastHealthCheck = new Date();
      
      // Update health status in database
      await this.updateHealthStatus(this.isHealthy);
      
      return this.isHealthy;
    } catch (error) {
      console.error('Keybit health check failed:', error);
      this.isHealthy = false;
      await this.updateHealthStatus(false, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Update API health status in database
   */
  private async updateHealthStatus(isHealthy: boolean, errorMessage?: string) {
    if (!this.apiConfig) return;

    try {
      await db
        .update(thirdPartyApis)
        .set({
          isHealthy,
          lastHealthCheck: new Date(),
          lastErrorMessage: errorMessage || null,
          lastErrorAt: errorMessage ? new Date() : this.apiConfig.lastErrorAt,
          errorCount: errorMessage ? (this.apiConfig.errorCount || 0) + 1 : this.apiConfig.errorCount
        })
        .where(eq(thirdPartyApis.id, this.apiConfig.id));
    } catch (error) {
      console.error('Failed to update keybit health status:', error);
    }
  }

  /**
   * Convert Gregorian date to Jalali using keybit.ir API with fallback
   */
  async gregorianToJalali(gregorianDate: Date): Promise<{
    year: number;
    month: number;
    day: number;
    weekday: number;
    source: 'keybit' | 'local';
  }> {
    // Try keybit API first
    if (this.apiConfig?.isEnabled && this.isHealthy) {
      try {
        const dateStr = gregorianDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const response: AxiosResponse<KeybitDateResponse> = await axios.get(
          `${this.BASE_URL}/calendar/convert/g2j`,
          {
            params: { date: dateStr },
            headers: {
              'Authorization': `Bearer ${this.apiConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 3000
          }
        );

        const data = response.data;
        
        // Update usage statistics
        await this.updateUsageStats();

        return {
          year: data.j_y,
          month: data.j_m,
          day: data.j_d,
          weekday: data.weekday,
          source: 'keybit'
        };
      } catch (error) {
        console.warn('Keybit API failed, falling back to local conversion:', error);
        await this.updateHealthStatus(false, error instanceof Error ? error.message : 'API call failed');
      }
    }

    // Fallback to local conversion
    const jalaliDate = persianCalendar.gregorianToJalali(gregorianDate);
    return {
      ...jalaliDate,
      source: 'local'
    };
  }

  /**
   * Convert Jalali date to Gregorian using keybit.ir API with fallback
   */
  async jalaliToGregorian(year: number, month: number, day: number): Promise<{
    date: Date;
    source: 'keybit' | 'local';
  }> {
    // Try keybit API first
    if (this.apiConfig?.isEnabled && this.isHealthy) {
      try {
        const response: AxiosResponse<KeybitDateResponse> = await axios.get(
          `${this.BASE_URL}/calendar/convert/j2g`,
          {
            params: { 
              year,
              month,
              day
            },
            headers: {
              'Authorization': `Bearer ${this.apiConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 3000
          }
        );

        const data = response.data;
        
        // Update usage statistics
        await this.updateUsageStats();

        const gregorianDate = new Date(data.g_y, data.g_m - 1, data.g_d);
        
        return {
          date: gregorianDate,
          source: 'keybit'
        };
      } catch (error) {
        console.warn('Keybit API failed, falling back to local conversion:', error);
        await this.updateHealthStatus(false, error instanceof Error ? error.message : 'API call failed');
      }
    }

    // Fallback to local conversion
    const gregorianDate = persianCalendar.jalaliToGregorian(year, month, day);
    return {
      date: gregorianDate,
      source: 'local'
    };
  }

  /**
   * Get Persian month and weekday names
   */
  async getMonthNames(): Promise<{
    months: string[];
    weekdays: string[];
    source: 'keybit' | 'local';
  }> {
    // Try keybit API first
    if (this.apiConfig?.isEnabled && this.isHealthy) {
      try {
        const response: AxiosResponse<KeybitMonthResponse> = await axios.get(
          `${this.BASE_URL}/calendar/names`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 3000
          }
        );

        const data = response.data;
        
        // Update usage statistics
        await this.updateUsageStats();

        return {
          months: data.month_names.persian,
          weekdays: data.weekdays.persian,
          source: 'keybit'
        };
      } catch (error) {
        console.warn('Keybit API failed, falling back to local names:', error);
        await this.updateHealthStatus(false, error instanceof Error ? error.message : 'API call failed');
      }
    }

    // Fallback to local names
    return {
      months: persianCalendar.getPersianMonthNames(),
      weekdays: persianCalendar.getPersianWeekdayNames(),
      source: 'local'
    };
  }

  /**
   * Get Iranian holidays for a specific year
   */
  async getHolidays(jalaliYear: number): Promise<{
    holidays: Array<{
      name: string;
      description: string;
      type: string;
      persianDate: string;
      gregorianDate: Date;
      isOfficial: boolean;
    }>;
    source: 'keybit' | 'local';
  }> {
    // Try keybit API first
    if (this.apiConfig?.isEnabled && this.isHealthy) {
      try {
        const response: AxiosResponse<KeybitHolidayResponse> = await axios.get(
          `${this.BASE_URL}/calendar/holidays`,
          {
            params: { year: jalaliYear },
            headers: {
              'Authorization': `Bearer ${this.apiConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        const data = response.data;
        
        // Update usage statistics
        await this.updateUsageStats();

        const holidays = data.holidays.map(holiday => ({
          name: holiday.name,
          description: holiday.description,
          type: holiday.type,
          persianDate: holiday.date,
          gregorianDate: new Date(holiday.date + 'T00:00:00'),
          isOfficial: holiday.is_official
        }));

        return {
          holidays,
          source: 'keybit'
        };
      } catch (error) {
        console.warn('Keybit API failed, falling back to local holidays:', error);
        await this.updateHealthStatus(false, error instanceof Error ? error.message : 'API call failed');
      }
    }

    // Fallback to local holidays
    const holidays = persianCalendar.getIranianHolidays(jalaliYear);
    return {
      holidays,
      source: 'local'
    };
  }

  /**
   * Update API usage statistics
   */
  private async updateUsageStats() {
    if (!this.apiConfig) return;

    try {
      await db
        .update(thirdPartyApis)
        .set({
          usageCount: (this.apiConfig.usageCount || 0) + 1,
          usageCountMonth: (this.apiConfig.usageCountMonth || 0) + 1,
          lastUsedAt: new Date()
        })
        .where(eq(thirdPartyApis.id, this.apiConfig.id));
        
      // Update local config for next calls
      this.apiConfig.usageCount = (this.apiConfig.usageCount || 0) + 1;
      this.apiConfig.usageCountMonth = (this.apiConfig.usageCountMonth || 0) + 1;
    } catch (error) {
      console.error('Failed to update keybit usage stats:', error);
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    if (!this.apiConfig?.isEnabled) {
      return {
        success: false,
        error: 'API not configured or disabled'
      };
    }

    const startTime = Date.now();
    
    try {
      // Test with a simple date conversion
      const testDate = new Date();
      await this.gregorianToJalali(testDate);
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        latency
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get API status and statistics
   */
  async getApiStatus() {
    await this.loadApiConfig(); // Refresh config
    
    return {
      isConfigured: !!this.apiConfig,
      isEnabled: this.apiConfig?.isEnabled || false,
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      usageCount: this.apiConfig?.usageCount || 0,
      usageCountMonth: this.apiConfig?.usageCountMonth || 0,
      errorCount: this.apiConfig?.errorCount || 0,
      lastUsedAt: this.apiConfig?.lastUsedAt || null,
      lastErrorAt: this.apiConfig?.lastErrorAt || null,
      lastErrorMessage: this.apiConfig?.lastErrorMessage || null
    };
  }
}

// Export singleton instance
export const keybitCalendarService = new KeybitCalendarService();