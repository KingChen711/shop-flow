import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendSmsOptions {
  to: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private readonly simulateMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.simulateMode = this.configService.get('SMS_SIMULATE', 'true') === 'true';

    if (this.simulateMode) {
      this.logger.log('📱 SMS Provider running in SIMULATION mode');
    } else {
      // In production, initialize Twilio or other SMS provider here
      this.logger.log('📱 SMS Provider initialized');
    }
  }

  async sendSms(options: SendSmsOptions): Promise<SmsResult> {
    const { to, message } = options;

    this.logger.log(`Sending SMS to ${to}`);

    if (this.simulateMode) {
      // Simulate sending SMS
      const simulatedDelay = parseInt(this.configService.get('SMS_SIMULATED_DELAY', '300'), 10);
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

      // Simulate random failures (configurable)
      const failureRate = parseInt(this.configService.get('SMS_FAILURE_RATE', '0'), 10);
      if (Math.random() * 100 < failureRate) {
        this.logger.warn(`[SIMULATED] SMS failed to ${to}`);
        return {
          success: false,
          error: 'Simulated SMS failure',
        };
      }

      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      this.logger.log(`[SIMULATED] SMS sent to ${to}, messageId: ${messageId}`);
      this.logger.debug(`[SIMULATED] Message: ${message.substring(0, 50)}...`);

      return {
        success: true,
        messageId,
      };
    }

    // Production implementation would use Twilio SDK
    // Example:
    // const twilio = require('twilio')(accountSid, authToken);
    // const result = await twilio.messages.create({
    //   body: message,
    //   from: this.configService.get('TWILIO_PHONE_NUMBER'),
    //   to,
    // });

    return {
      success: false,
      error: 'SMS provider not configured for production',
    };
  }
}
