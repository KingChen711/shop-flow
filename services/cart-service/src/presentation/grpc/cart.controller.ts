import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { status } from '@grpc/grpc-js';

// Commands
import { AddItemCommand } from '@application/commands/add-item.command';
import { UpdateItemQuantityCommand } from '@application/commands/update-item-quantity.command';
import { RemoveItemCommand } from '@application/commands/remove-item.command';
import { ClearCartCommand } from '@application/commands/clear-cart.command';

// Queries
import { GetCartQuery } from '@application/queries/get-cart.query';
import { GetCartSummaryQuery } from '@application/queries/get-cart-summary.query';
import { CartSummary } from '@application/queries/handlers/get-cart-summary.handler';

// Domain
import { Cart } from '@domain/entities/cart.entity';

// Error handling
import { NotFoundError, ValidationError } from '@shopflow/shared-utils';

@Controller()
export class CartGrpcController {
  private readonly logger = new Logger(CartGrpcController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @GrpcMethod('CartService', 'GetCart')
  async getCart(data: { user_id: string }) {
    try {
      const query = new GetCartQuery(data.user_id);
      const cart: Cart = await this.queryBus.execute(query);
      return this.toCartResponse(cart);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('CartService', 'AddItem')
  async addItem(data: {
    user_id: string;
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
    image_url?: string;
  }) {
    try {
      this.logger.log(`Adding item ${data.product_id} to cart for user ${data.user_id}`);

      const command = new AddItemCommand(
        data.user_id,
        data.product_id,
        data.product_name,
        data.price,
        data.quantity,
        data.image_url
      );

      const cart: Cart = await this.commandBus.execute(command);
      return this.toCartResponse(cart);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('CartService', 'UpdateItemQuantity')
  async updateItemQuantity(data: { user_id: string; product_id: string; quantity: number }) {
    try {
      const command = new UpdateItemQuantityCommand(data.user_id, data.product_id, data.quantity);

      const cart: Cart = await this.commandBus.execute(command);
      return this.toCartResponse(cart);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('CartService', 'RemoveItem')
  async removeItem(data: { user_id: string; product_id: string }) {
    try {
      const command = new RemoveItemCommand(data.user_id, data.product_id);

      const cart: Cart = await this.commandBus.execute(command);
      return this.toCartResponse(cart);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('CartService', 'ClearCart')
  async clearCart(data: { user_id: string }) {
    try {
      const command = new ClearCartCommand(data.user_id);
      const success: boolean = await this.commandBus.execute(command);

      return {
        success,
        message: success ? 'Cart cleared successfully' : 'No cart found to clear',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('CartService', 'GetCartSummary')
  async getCartSummary(data: { user_id: string }) {
    try {
      const query = new GetCartSummaryQuery(data.user_id);
      const summary: CartSummary = await this.queryBus.execute(query);

      return {
        user_id: summary.userId,
        item_count: summary.itemCount,
        total: summary.total,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper methods
  private toCartResponse(cart: Cart) {
    return {
      user_id: cart.userId,
      items: cart.items.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        price: item.price,
        quantity: item.quantity,
        image_url: item.imageUrl,
        subtotal: item.subtotal,
      })),
      total: cart.total,
      item_count: cart.itemCount,
      updated_at: cart.updatedAt.toISOString(),
    };
  }

  private handleError(error: unknown): RpcException {
    this.logger.error('Error in CartGrpcController', error);

    if (error instanceof NotFoundError) {
      return new RpcException({
        code: status.NOT_FOUND,
        message: error.message,
      });
    }

    if (error instanceof ValidationError) {
      return new RpcException({
        code: status.INVALID_ARGUMENT,
        message: error.message,
      });
    }

    if (error instanceof Error) {
      return new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }

    return new RpcException({
      code: status.UNKNOWN,
      message: 'An unexpected error occurred',
    });
  }
}
