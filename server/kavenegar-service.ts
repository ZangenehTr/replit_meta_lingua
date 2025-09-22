interface KavenegarResponse {
  return: {
    status: number;
    message: string;
  };
  entries?: Array<{
    messageid: number;
    message: string;
    status: number;
    statustext: string;
    sender: string;
    receptor: string;
    date: number;
    cost: number;
  }>;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  cost?: number;
  error?: string;
}

export class KavenegarService {
  private apiKey: string;
  private baseUrl = 'https://api.kavenegar.com/v1';

  constructor() {
    this.apiKey = process.env.KAVENEGAR_API_KEY || '';
    if (!this.apiKey) {
      console.warn('KAVENEGAR_API_KEY not provided - SMS service will not function');
    } else {
      console.log('✅ Kavenegar API Key configured successfully');
    }
  }

  // Test connectivity to Kavenegar API
  async testConnectivity(): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/${this.apiKey}/account/info.json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const latency = Date.now() - startTime;
      console.log(`Kavenegar connectivity test: ${response.status} in ${latency}ms`);
      
      return {
        success: response.ok,
        latency,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('Kavenegar connectivity test failed:', error.message);
      return {
        success: false,
        latency,
        error: error.name === 'TimeoutError' ? 'Connection timeout (5s)' : error.message
      };
    }
  }

  /**
   * Send a simple SMS message
   */
  async sendSimpleSMS(receptor: string, message: string, sender?: string): Promise<SMSResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Kavenegar API key not configured'
      };
    }

    try {
      const url = `${this.baseUrl}/${this.apiKey}/sms/send.json`;
      
      const params = new URLSearchParams({
        receptor: this.normalizePhoneNumber(receptor),
        message: message,
        ...(sender && { sender })
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      const data: KavenegarResponse = await response.json();
      
      if (data.return.status === 200 && data.entries && data.entries.length > 0) {
        const entry = data.entries[0];
        return {
          success: true,
          messageId: entry.messageid.toString(),
          status: entry.statustext,
          cost: entry.cost
        };
      } else {
        return {
          success: false,
          error: data.return.message || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('Kavenegar SMS Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Send OTP verification code
   */
  async sendVerificationCode(receptor: string, code: string, template?: string): Promise<SMSResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Kavenegar API key not configured'
      };
    }

    try {
      // If template is provided, use template-based sending
      if (template) {
        return await this.sendWithTemplate(receptor, template, { code });
      }
      
      // Otherwise send simple SMS
      const message = `Your Meta Lingua verification code is: ${code}`;
      return await this.sendSimpleSMS(receptor, message);
    } catch (error) {
      console.error('Kavenegar Verification Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code'
      };
    }
  }

  /**
   * Send SMS using template
   */
  async sendWithTemplate(receptor: string, template: string, tokens: Record<string, string>): Promise<SMSResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Kavenegar API key not configured'
      };
    }

    try {
      const url = `${this.baseUrl}/${this.apiKey}/verify/lookup.json`;
      
      const params = new URLSearchParams({
        receptor: this.normalizePhoneNumber(receptor),
        template: template,
        ...tokens // token, token2, token3, etc.
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      const data: KavenegarResponse = await response.json();
      
      if (data.return.status === 200 && data.entries && data.entries.length > 0) {
        const entry = data.entries[0];
        return {
          success: true,
          messageId: entry.messageid.toString(),
          status: entry.statustext,
          cost: entry.cost
        };
      } else {
        return {
          success: false,
          error: data.return.message || 'Template sending failed'
        };
      }
    } catch (error) {
      console.error('Kavenegar Template Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template sending error'
      };
    }
  }

  /**
   * Check account balance
   */
  async getAccountInfo(): Promise<{ success: boolean; balance?: number; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Kavenegar API key not configured'
      };
    }

    try {
      const url = `${this.baseUrl}/${this.apiKey}/account/info.json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.return.status === 200 && data.entries && data.entries.length > 0) {
        return {
          success: true,
          balance: data.entries[0].remaincredit
        };
      } else {
        return {
          success: false,
          error: data.return.message || 'Failed to get account info'
        };
      }
    } catch (error) {
      console.error('Kavenegar Account Info Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Account info error'
      };
    }
  }

  /**
   * Test SMS service connectivity
   */
  async testService(): Promise<{ success: boolean; message: string; balance?: number }> {
    try {
      const accountInfo = await this.getAccountInfo();
      
      if (accountInfo.success) {
        return {
          success: true,
          message: 'Kavenegar service is working correctly',
          balance: accountInfo.balance
        };
      } else {
        return {
          success: false,
          message: accountInfo.error || 'Service test failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Service test error'
      };
    }
  }

  /**
   * Normalize Iranian phone numbers
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    
    // Handle Iranian phone numbers
    if (normalized.startsWith('0')) {
      normalized = '98' + normalized.substring(1);
    } else if (normalized.startsWith('98')) {
      // Already has country code
    } else if (normalized.startsWith('9')) {
      normalized = '98' + normalized;
    }
    
    return normalized;
  }

  /**
   * Send teacher observation notification SMS
   */
  async sendTeacherObservationNotification(
    teacherPhone: string, 
    teacherName: string, 
    observationType: string,
    overallScore?: string
  ): Promise<SMSResult> {
    const message = overallScore 
      ? `Dear ${teacherName}, your ${observationType} evaluation has been completed with a score of ${overallScore}/5. Please check your dashboard to review feedback and respond. Meta Lingua Academy`
      : `Dear ${teacherName}, a new ${observationType} has been scheduled. Please check your dashboard for details. Meta Lingua Academy`;
    
    return await this.sendSimpleSMS(teacherPhone, message);
  }

  /**
   * Send teacher observation follow-up reminder SMS
   */
  async sendTeacherObservationReminder(
    teacherPhone: string, 
    teacherName: string,
    daysOverdue: number
  ): Promise<SMSResult> {
    const message = `Dear ${teacherName}, you have a pending observation response that is ${daysOverdue} days overdue. Please respond via your dashboard. Meta Lingua Academy`;
    
    return await this.sendSimpleSMS(teacherPhone, message);
  }

  /**
   * Send observation acknowledgment confirmation SMS
   */
  async sendObservationAcknowledgmentConfirmation(
    teacherPhone: string, 
    teacherName: string
  ): Promise<SMSResult> {
    const message = `Dear ${teacherName}, thank you for acknowledging your observation feedback. Your response has been recorded. Meta Lingua Academy`;
    
    return await this.sendSimpleSMS(teacherPhone, message);
  }

  /**
   * Send enrollment notification
   */
  async sendEnrollmentNotification(receptor: string, studentName: string, courseName: string): Promise<SMSResult> {
    const message = `Dear ${studentName}, you have been successfully enrolled in ${courseName}. Welcome to Meta Lingua!`;
    return await this.sendSimpleSMS(receptor, message);
  }

  /**
   * Send class reminder
   */
  async sendClassReminder(receptor: string, studentName: string, classTime: string, teacherName: string): Promise<SMSResult> {
    const message = `Hi ${studentName}, reminder: Your class with ${teacherName} is scheduled for ${classTime}. Don't forget!`;
    return await this.sendSimpleSMS(receptor, message);
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(receptor: string, amount: number, courseName: string): Promise<SMSResult> {
    const message = `Payment confirmed! ${amount.toLocaleString()} IRR received for ${courseName}. Thank you for choosing Meta Lingua.`;
    return await this.sendSimpleSMS(receptor, message);
  }

  /**
   * Send teacher attention alert SMS
   */
  async sendTeacherAttentionAlert(
    teacherPhone: string, 
    teacherName: string, 
    issue: string
  ): Promise<SMSResult> {
    const message = `Dear ${teacherName}, this is a gentle reminder regarding ${issue}. Please check your dashboard for details or contact your supervisor. Meta Lingua Academy`;
    return await this.sendSimpleSMS(teacherPhone, message);
  }

  /**
   * Send student attention alert SMS  
   */
  async sendStudentAttentionAlert(
    studentPhone: string, 
    studentName: string,
    issue: string,
    teacherName: string
  ): Promise<SMSResult> {
    const message = `Dear ${studentName}, we noticed ${issue}. Please contact ${teacherName} or check your dashboard for support. We're here to help! Meta Lingua Academy`;
    return await this.sendSimpleSMS(studentPhone, message);
  }

  /**
   * Send homework reminder SMS
   */
  async sendHomeworkReminder(
    studentPhone: string,
    studentName: string,
    assignmentTitle: string,
    dueDate: string
  ): Promise<SMSResult> {
    const message = `Hi ${studentName}, reminder: "${assignmentTitle}" is due ${dueDate}. Please submit your work via the student portal. Meta Lingua Academy`;
    return await this.sendSimpleSMS(studentPhone, message);
  }

  /**
   * Send attendance follow-up SMS
   */
  async sendAttendanceFollowUp(
    studentPhone: string,
    studentName: string,
    missedSessions: number,
    teacherName: string
  ): Promise<SMSResult> {
    const message = `Dear ${studentName}, you've missed ${missedSessions} recent sessions. ${teacherName} is ready to help you catch up. Contact us today! Meta Lingua Academy`;
    return await this.sendSimpleSMS(studentPhone, message);
  }
}

export const kavenegarService = new KavenegarService();