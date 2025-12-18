import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { PaymentEntity } from '@infrastructure/persistence/entities/payment.entity';
import { PaymentRepositoryImpl } from '@infrastructure/persistence/repositories/payment.repository';

// Application - Command Handlers
import { ProcessPaymentHandler } from '@application/commands/handlers/process-payment.handler';
import { RefundPaymentHandler } from '@application/commands/handlers/refund-payment.handler';

// Application - Query Handlers
import { GetPaymentHandler } from '@application/queries/handlers/get-payment.handler';
import { GetPaymentByOrderHandler } from '@application/queries/handlers/get-payment-by-order.handler';
import { ListPaymentsHandler } from '@application/queries/handlers/list-payments.handler';

// Infrastructure - Payment Gateway
import { PaymentGatewayService } from '@infrastructure/gateway/payment-gateway.service';

// Presentation
import { PaymentGrpcController } from '@presentation/grpc/payment.controller';

const CommandHandlers = [ProcessPaymentHandler, RefundPaymentHandler];

const QueryHandlers = [GetPaymentHandler, GetPaymentByOrderHandler, ListPaymentsHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PaymentEntity])],
  controllers: [PaymentGrpcController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    PaymentGatewayService,
    {
      provide: 'PaymentRepository',
      useClass: PaymentRepositoryImpl,
    },
  ],
  exports: ['PaymentRepository'],
})
export class PaymentModule {}
