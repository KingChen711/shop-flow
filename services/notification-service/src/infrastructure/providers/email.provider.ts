import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  html?: boolean;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

type EmailProviderType = 'ses' | 'smtp' | 'simulate';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private sesClient: SESClient | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;
  private readonly providerType: EmailProviderType;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@shopflow.com');

    // Determine provider type: ses > smtp > simulate
    const emailProvider = this.configService.get('EMAIL_PROVIDER', 'simulate').toLowerCase();

    if (emailProvider === 'ses') {
      this.providerType = 'ses';
      this.initializeSES();
    } else if (emailProvider === 'smtp') {
      this.providerType = 'smtp';
      this.initializeSMTP();
    } else {
      this.providerType = 'simulate';
      this.logger.log('📧 Email Provider running in SIMULATION mode');
    }
  }

  private initializeSES(): void {
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

    const clientConfig: ConstructorParameters<typeof SESClient>[0] = {
      region,
    };

    // If credentials are provided, use them; otherwise rely on AWS SDK's default credential chain
    // (environment variables, IAM roles, etc.)
    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    this.sesClient = new SESClient(clientConfig);
    this.logger.log(`📧 Email Provider initialized with AWS SES (region: ${region})`);
  }

  private initializeSMTP(): void {
    const host = this.configService.get('SMTP_HOST');
    const port = parseInt(this.configService.get('SMTP_PORT', '587'), 10);
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    if (host && user && pass) {
      this.smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`📧 Email Provider initialized with SMTP: ${host}`);
    } else {
      this.logger.warn('📧 SMTP not configured, falling back to simulation');
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    const { to, toName, subject, body, html = true } = options;

    this.logger.log(`Sending email to ${to}: ${subject}`);

    switch (this.providerType) {
      case 'ses':
        return this.sendViaSES(to, toName, subject, body, html);
      case 'smtp':
        return this.sendViaSMTP(to, subject, body, html);
      default:
        return this.sendSimulated(to, subject, body);
    }
  }

  private async sendViaSES(
    to: string,
    toName: string | undefined,
    subject: string,
    body: string,
    html: boolean
  ): Promise<EmailResult> {
    if (!this.sesClient) {
      return { success: false, error: 'SES client not initialized' };
    }

    try {
      const destination = toName ? `${toName} <${to}>` : to;

      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [destination],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: html
            ? {
                Html: {
                  Data: body,
                  Charset: 'UTF-8',
                },
              }
            : {
                Text: {
                  Data: body,
                  Charset: 'UTF-8',
                },
              },
        },
      });

      const response = await this.sesClient.send(command);
      const messageId = response.MessageId;

      this.logger.log(`Email sent via AWS SES to ${to}, messageId: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown SES error';
      this.logger.error(`Failed to send email via AWS SES to ${to}: ${errorMsg}`);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  private async sendViaSMTP(
    to: string,
    subject: string,
    body: string,
    html: boolean
  ): Promise<EmailResult> {
    if (!this.smtpTransporter) {
      return this.sendSimulated(to, subject, body);
    }

    try {
      const result = await this.smtpTransporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        [html ? 'html' : 'text']: body,
      });

      this.logger.log(`Email sent via SMTP to ${to}, messageId: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Failed to send email via SMTP to ${to}: ${errorMsg}`);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  private async sendSimulated(to: string, subject: string, body: string): Promise<EmailResult> {
    const simulatedDelay = parseInt(this.configService.get('EMAIL_SIMULATED_DELAY', '500'), 10);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

    // Simulate random failures (configurable)
    const failureRate = parseInt(this.configService.get('EMAIL_FAILURE_RATE', '0'), 10);
    if (Math.random() * 100 < failureRate) {
      this.logger.warn(`[SIMULATED] Email failed to ${to}`);
      return {
        success: false,
        error: 'Simulated email failure',
      };
    }

    const messageId = `simulated_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.logger.log(`[SIMULATED] Email sent to ${to}, messageId: ${messageId}`);
    this.logger.debug(`[SIMULATED] Subject: ${subject}`);
    this.logger.debug(`[SIMULATED] Body: ${body.substring(0, 100)}...`);

    return {
      success: true,
      messageId,
    };
  }
}
