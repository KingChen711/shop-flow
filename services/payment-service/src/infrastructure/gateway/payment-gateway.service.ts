import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod } from '@domain/entities/payment.entity';

export interface ProcessPaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentDetails?: Record<string, string>;
}

export interface ProcessPaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}

export interface RefundPaymentRequest {
  transactionId: string;
  amount: number;
}

export interface RefundPaymentResult {
  success: boolean;
  refundTransactionId?: string;
  errorMessage?: string;
}

/**
 * Simulated Payment Gateway Service
 *
 * In production, this would integrate with:
 * - Stripe
 * - PayPal
 * - Adyen
 * - etc.
 *
 * For testing the Saga pattern, this simulates payment processing
 * with configurable success/failure rates.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly failureRate: number;
  private readonly simulatedDelay: number;

  constructor(private readonly configService: ConfigService) {
    // Configure failure rate (0-100) for testing saga compensation
    this.failureRate = this.configService.get('PAYMENT_FAILURE_RATE', 0);
    this.simulatedDelay = this.configService.get('PAYMENT_SIMULATED_DELAY', 100);
    this.logger.log(
      `Payment gateway initialized (failure rate: ${this.failureRate}%, delay: ${this.simulatedDelay}ms)`
    );
  }

  async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResult> {
    this.logger.log(`Processing payment: ${request.amount} ${request.currency}`);

    // Simulate network delay
    await this.delay(this.simulatedDelay);

    // Simulate random failures for testing compensation
    if (this.shouldFail()) {
      this.logger.warn('Simulated payment failure');
      return {
        success: false,
        errorMessage: 'Payment declined by issuing bank (simulated)',
      };
    }

    // Simulate invalid amount
    if (request.amount <= 0) {
      return {
        success: false,
        errorMessage: 'Invalid payment amount',
      };
    }

    // Simulate very high amounts failing (for testing)
    if (request.amount > 10000) {
      return {
        success: false,
        errorMessage: 'Amount exceeds transaction limit',
      };
    }

    // Generate transaction ID
    const transactionId = `txn_${uuidv4().substring(0, 8)}_${Date.now()}`;

    this.logger.log(`Payment successful: ${transactionId}`);

    return {
      success: true,
      transactionId,
    };
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResult> {
    this.logger.log(`Processing refund: ${request.amount} for txn ${request.transactionId}`);

    // Simulate network delay
    await this.delay(this.simulatedDelay);

    // Validate transaction ID
    if (!request.transactionId || !request.transactionId.startsWith('txn_')) {
      return {
        success: false,
        errorMessage: 'Invalid transaction ID',
      };
    }

    // Generate refund transaction ID
    const refundTransactionId = `ref_${uuidv4().substring(0, 8)}_${Date.now()}`;

    this.logger.log(`Refund successful: ${refundTransactionId}`);

    return {
      success: true,
      refundTransactionId,
    };
  }

  private shouldFail(): boolean {
    return Math.random() * 100 < this.failureRate;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
