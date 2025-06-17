import { storage } from "./storage";

interface SMSConfig {
  provider: 'twilio' | 'aws-sns' | 'vonage' | 'messagebird' | 'plivo';
  enabled: boolean;
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  vonage?: {
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
  };
  notifications?: {
    security_alerts: boolean;
    banned_guest_detected: boolean;
    system_errors: boolean;
    license_expiry: boolean;
    emergency_alerts: boolean;
  };
}

interface SMSMessage {
  to: string;
  message: string;
  type: 'security_alerts' | 'banned_guest_detected' | 'system_errors' | 'license_expiry' | 'emergency_alerts';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class SMSService {
  private config: SMSConfig | null = null;

  async loadConfig(): Promise<void> {
    // In production, this would load from platform settings
    // For now, we'll use environment variables as fallback
    this.config = {
      provider: (process.env.SMS_PROVIDER as any) || 'twilio',
      enabled: process.env.SMS_ENABLED === 'true',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || ''
      },
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1'
      },
      notifications: {
        security_alerts: true,
        banned_guest_detected: true,
        system_errors: true,
        license_expiry: true,
        emergency_alerts: true
      }
    };
  }

  async sendSMS(message: SMSMessage): Promise<boolean> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config?.enabled) {
      console.log('SMS service disabled');
      return false;
    }

    if (!this.config.notifications?.[message.type]) {
      console.log(`SMS notifications disabled for type: ${message.type}`);
      return false;
    }

    try {
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendTwilioSMS(message);
        case 'aws-sns':
          return await this.sendAWSSMS(message);
        case 'vonage':
          return await this.sendVonageSMS(message);
        default:
          console.error(`Unsupported SMS provider: ${this.config.provider}`);
          return false;
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  private async sendTwilioSMS(message: SMSMessage): Promise<boolean> {
    if (!this.config?.twilio?.accountSid || !this.config?.twilio?.authToken) {
      console.error('Twilio credentials not configured');
      return false;
    }

    try {
      // In production, use the actual Twilio SDK
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.twilio.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.twilio.accountSid}:${this.config.twilio.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: this.config.twilio.fromNumber,
          To: message.to,
          Body: message.message
        })
      });

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Twilio SMS sent successfully:', result.sid);
      return true;
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return false;
    }
  }

  private async sendAWSSMS(message: SMSMessage): Promise<boolean> {
    if (!this.config?.aws?.accessKeyId || !this.config?.aws?.secretAccessKey) {
      console.error('AWS credentials not configured');
      return false;
    }

    try {
      // In production, use the AWS SDK
      // For now, this is a placeholder implementation
      console.log('AWS SNS SMS would be sent:', message);
      return true;
    } catch (error) {
      console.error('AWS SNS SMS error:', error);
      return false;
    }
  }

  private async sendVonageSMS(message: SMSMessage): Promise<boolean> {
    if (!this.config?.vonage?.apiKey || !this.config?.vonage?.apiSecret) {
      console.error('Vonage credentials not configured');
      return false;
    }

    try {
      // In production, use the Vonage SDK
      console.log('Vonage SMS would be sent:', message);
      return true;
    } catch (error) {
      console.error('Vonage SMS error:', error);
      return false;
    }
  }

  async sendSecurityAlert(phoneNumber: string, alertMessage: string): Promise<boolean> {
    return await this.sendSMS({
      to: phoneNumber,
      message: `🚨 SECURITY ALERT: ${alertMessage}`,
      type: 'security_alerts',
      priority: 'critical'
    });
  }

  async sendBannedGuestAlert(phoneNumber: string, guestName: string, location: string): Promise<boolean> {
    return await this.sendSMS({
      to: phoneNumber,
      message: `⚠️ BANNED GUEST DETECTED: ${guestName} attempted entry at ${location}. Entry denied.`,
      type: 'banned_guest_detected',
      priority: 'high'
    });
  }

  async sendSystemError(phoneNumber: string, errorMessage: string): Promise<boolean> {
    return await this.sendSMS({
      to: phoneNumber,
      message: `🔧 SYSTEM ERROR: ${errorMessage}`,
      type: 'system_errors',
      priority: 'medium'
    });
  }

  async sendLicenseExpiry(phoneNumber: string, licenseName: string, daysRemaining: number): Promise<boolean> {
    return await this.sendSMS({
      to: phoneNumber,
      message: `📋 LICENSE EXPIRY: ${licenseName} expires in ${daysRemaining} days. Please renew.`,
      type: 'license_expiry',
      priority: 'medium'
    });
  }

  async sendEmergencyAlert(phoneNumber: string, emergencyMessage: string): Promise<boolean> {
    return await this.sendSMS({
      to: phoneNumber,
      message: `🚨 EMERGENCY: ${emergencyMessage}`,
      type: 'emergency_alerts',
      priority: 'critical'
    });
  }

  async sendBulkAlert(phoneNumbers: string[], message: string, type: SMSMessage['type']): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const phoneNumber of phoneNumbers) {
      const sent = await this.sendSMS({
        to: phoneNumber,
        message,
        type,
        priority: 'high'
      });

      if (sent) {
        success++;
      } else {
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { success, failed };
  }
}

export const smsService = new SMSService();