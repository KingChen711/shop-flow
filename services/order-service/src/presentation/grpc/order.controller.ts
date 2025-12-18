import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@application/commands/create-order.command';
import { CancelOrderCommand } from '@application/commands/cancel-order.command';
import { ConfirmOrderCommand } from '@application/commands/confirm-order.command';
import { FailOrderCommand } from '@application/commands/fail-order.command';
import { GetOrderQuery } from '@application/queries/get-order.query';
import { ListOrdersQuery } from '@application/queries/list-orders.query';
import { GetOrderStatusQuery } from '@application/queries/get-order-status.query';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { NotFoundError, ValidationError, ConflictError } from '@shopflow/shared-utils';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

// Proto status enum mapping
const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'ORDER_STATUS_PENDING',
  [OrderStatus.CONFIRMED]: 'ORDER_STATUS_CONFIRMED',
  [OrderStatus.PROCESSING]: 'ORDER_STATUS_PROCESSING',
  [OrderStatus.SHIPPED]: 'ORDER_STATUS_SHIPPED',
  [OrderStatus.DELIVERED]: 'ORDER_STATUS_DELIVERED',
  [OrderStatus.CANCELLED]: 'ORDER_STATUS_CANCELLED',
  [OrderStatus.FAILED]: 'ORDER_STATUS_FAILED',
};

const PROTO_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  ORDER_STATUS_PENDING: OrderStatus.PENDING,
  ORDER_STATUS_CONFIRMED: OrderStatus.CONFIRMED,
  ORDER_STATUS_PROCESSING: OrderStatus.PROCESSING,
  ORDER_STATUS_SHIPPED: OrderStatus.SHIPPED,
  ORDER_STATUS_DELIVERED: OrderStatus.DELIVERED,
  ORDER_STATUS_CANCELLED: OrderStatus.CANCELLED,
  ORDER_STATUS_FAILED: OrderStatus.FAILED,
};

@Controller()
export class OrderGrpcController {
  private readonly logger = new Logger(OrderGrpcController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  async createOrder(data: any): Promise<any> {
    try {
      this.logger.log(`CreateOrder request: user_id=${data.user_id}`);

      const command = new CreateOrderCommand(
        data.user_id,
        (data.items || []).map((item: any) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
        data.shipping_address,
        data.notes
      );

      const order = await this.commandBus.execute<CreateOrderCommand, Order>(command);
      return this.toOrderResponse(order);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('OrderService', 'GetOrder')
  async getOrder(data: any): Promise<any> {
    try {
      this.logger.log(`GetOrder request: order_id=${data.order_id}`);

      const query = new GetOrderQuery(data.order_id);
      const order = await this.queryBus.execute<GetOrderQuery, Order>(query);

      return this.toOrderResponse(order);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('OrderService', 'ListOrders')
  async listOrders(data: any): Promise<any> {
    try {
      this.logger.log(`ListOrders request: user_id=${data.user_id}`);

      const status = data.status ? PROTO_TO_ORDER_STATUS[data.status] : undefined;
      const query = new ListOrdersQuery(data.user_id, data.page || 1, data.limit || 10, status);

      const result = await this.queryBus.execute(query);

      return {
        orders: result.orders.map((order: Order) => this.toOrderResponse(order)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('OrderService', 'CancelOrder')
  async cancelOrder(data: any): Promise<any> {
    try {
      this.logger.log(`CancelOrder request: order_id=${data.order_id}`);

      const command = new CancelOrderCommand(data.order_id, data.reason);
      const order = await this.commandBus.execute<CancelOrderCommand, Order>(command);

      return this.toOrderResponse(order);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('OrderService', 'GetOrderStatus')
  async getOrderStatus(data: any): Promise<any> {
    try {
      this.logger.log(`GetOrderStatus request: order_id=${data.order_id}`);

      const query = new GetOrderStatusQuery(data.order_id);
      const result = (await this.queryBus.execute(query)) as {
        orderId: string;
        status: OrderStatus;
        statusMessage: string;
        updatedAt: Date;
      };

      return {
        order_id: result.orderId,
        status: ORDER_STATUS_MAP[result.status],
        status_message: result.statusMessage,
        updated_at: result.updatedAt.toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('OrderService', 'ConfirmOrder')
  async confirmOrder(data: any): Promise<any> {
    try {
      this.logger.log(`ConfirmOrder request: order_id=${data.order_id}`);

      const command = new ConfirmOrderCommand(data.order_id);
      const order = await this.commandBus.execute<ConfirmOrderCommand, Order>(command);

      return this.toOrderResponse(order);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('OrderService', 'FailOrder')
  async failOrder(data: any): Promise<any> {
    try {
      this.logger.log(`FailOrder request: order_id=${data.order_id}`);

      const command = new FailOrderCommand(data.order_id, data.reason);
      const order = await this.commandBus.execute<FailOrderCommand, Order>(command);

      return this.toOrderResponse(order);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private toOrderResponse(order: Order): any {
    return {
      id: order.id,
      user_id: order.userId,
      items: order.items.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      total_amount: order.totalAmount,
      status: ORDER_STATUS_MAP[order.status],
      shipping_address: order.shippingAddress,
      notes: order.notes || '',
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    };
  }

  private handleError(error: unknown): RpcException {
    const err = error instanceof Error ? error : new Error('Unknown error');
    this.logger.error(`Error: ${err.message}`, err.stack);

    if (error instanceof NotFoundError) {
      return new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: error.message,
      });
    }

    if (error instanceof ValidationError) {
      return new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: error.message,
      });
    }

    if (error instanceof ConflictError) {
      return new RpcException({
        code: GrpcStatus.FAILED_PRECONDITION,
        message: error.message,
      });
    }

    return new RpcException({
      code: GrpcStatus.INTERNAL,
      message: err.message || 'Internal server error',
    });
  }
}
