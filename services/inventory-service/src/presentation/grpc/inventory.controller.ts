import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { status } from '@grpc/grpc-js';

// Commands
import { UpdateStockCommand } from '@application/commands/update-stock.command';
import { ReserveStockCommand } from '@application/commands/reserve-stock.command';
import { ConfirmReservationCommand } from '@application/commands/confirm-reservation.command';
import { ReleaseReservationCommand } from '@application/commands/release-reservation.command';
import { ReserveMultipleStockCommand } from '@application/commands/reserve-multiple-stock.command';
import { ReleaseMultipleStockCommand } from '@application/commands/release-multiple-stock.command';

// Command Results
import { ReserveMultipleResult } from '@application/commands/handlers/reserve-multiple-stock.handler';
import { ReleaseMultipleResult } from '@application/commands/handlers/release-multiple-stock.handler';

// Queries
import { GetStockQuery } from '@application/queries/get-stock.query';
import { GetMultipleStockQuery } from '@application/queries/get-multiple-stock.query';

// Domain
import { Inventory } from '@domain/entities/inventory.entity';
import { Reservation, ReservationStatus } from '@domain/entities/reservation.entity';

// Error handling
import { NotFoundError, ConflictError, ValidationError } from '@shopflow/shared-utils';

// Proto enums mapping
const RESERVATION_STATUS_MAP = {
  [ReservationStatus.RESERVED]: 1,
  [ReservationStatus.CONFIRMED]: 2,
  [ReservationStatus.RELEASED]: 3,
  [ReservationStatus.EXPIRED]: 4,
};

@Controller()
export class InventoryGrpcController {
  private readonly logger = new Logger(InventoryGrpcController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  // ============================================
  // Stock Management
  // ============================================

  @GrpcMethod('InventoryService', 'GetStock')
  async getStock(data: { product_id: string }) {
    try {
      const query = new GetStockQuery(data.product_id);
      const inventory: Inventory = await this.queryBus.execute(query);
      return this.toStockResponse(inventory);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('InventoryService', 'UpdateStock')
  async updateStock(data: { product_id: string; quantity: number; reason: string }) {
    try {
      const command = new UpdateStockCommand(
        data.product_id,
        data.quantity,
        data.reason || 'Manual update'
      );
      const inventory: Inventory = await this.commandBus.execute(command);
      return this.toStockResponse(inventory);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('InventoryService', 'GetMultipleStock')
  async getMultipleStock(data: { product_ids: string[] }) {
    try {
      const query = new GetMultipleStockQuery(data.product_ids);
      const inventories: Inventory[] = await this.queryBus.execute(query);
      return {
        stocks: inventories.map((inv) => this.toStockResponse(inv)),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================
  // Stock Reservation (for Saga)
  // ============================================

  @GrpcMethod('InventoryService', 'ReserveStock')
  async reserveStock(data: {
    order_id: string;
    product_id: string;
    quantity: number;
    ttl_minutes: number;
  }) {
    try {
      const command = new ReserveStockCommand(
        data.order_id,
        data.product_id,
        data.quantity,
        data.ttl_minutes || 15
      );
      const reservation: Reservation = await this.commandBus.execute(command);
      return this.toReservationResponse(reservation);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('InventoryService', 'ConfirmReservation')
  async confirmReservation(data: { reservation_id: string }) {
    try {
      const command = new ConfirmReservationCommand(data.reservation_id);
      const reservation: Reservation = await this.commandBus.execute(command);
      return this.toReservationResponse(reservation);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('InventoryService', 'ReleaseReservation')
  async releaseReservation(data: { reservation_id: string; reason: string }) {
    try {
      const command = new ReleaseReservationCommand(
        data.reservation_id,
        data.reason || 'Released by request'
      );
      const reservation: Reservation = await this.commandBus.execute(command);
      return this.toReservationResponse(reservation);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================
  // Batch Operations
  // ============================================

  @GrpcMethod('InventoryService', 'ReserveMultipleStock')
  async reserveMultipleStock(data: {
    order_id: string;
    items: Array<{ product_id: string; quantity: number }>;
    ttl_minutes: number;
  }) {
    try {
      const command = new ReserveMultipleStockCommand(
        data.order_id,
        data.items.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
        data.ttl_minutes || 15
      );

      const result: ReserveMultipleResult = await this.commandBus.execute(command);

      return {
        success: result.success,
        reservations: result.reservations.map((r) => this.toReservationResponse(r)),
        failed_product_ids: result.failedProductIds,
        error_message: result.errorMessage || '',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('InventoryService', 'ReleaseMultipleStock')
  async releaseMultipleStock(data: {
    order_id: string;
    reservation_ids: string[];
    reason: string;
  }) {
    try {
      const command = new ReleaseMultipleStockCommand(
        data.order_id,
        data.reservation_ids,
        data.reason || 'Released by request'
      );

      const result: ReleaseMultipleResult = await this.commandBus.execute(command);

      return {
        success: result.success,
        released_reservation_ids: result.releasedReservationIds,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toStockResponse(inventory: Inventory) {
    return {
      product_id: inventory.productId,
      total_stock: inventory.totalStock,
      reserved_stock: inventory.reservedStock,
      available_stock: inventory.availableStock,
      updated_at: inventory.updatedAt.toISOString(),
    };
  }

  private toReservationResponse(reservation: Reservation) {
    return {
      id: reservation.id,
      order_id: reservation.orderId,
      product_id: reservation.productId,
      quantity: reservation.quantity,
      status: RESERVATION_STATUS_MAP[reservation.status] || 0,
      created_at: reservation.createdAt.toISOString(),
      expires_at: reservation.expiresAt.toISOString(),
    };
  }

  private handleError(error: unknown): RpcException {
    this.logger.error('Error in InventoryGrpcController', error);

    if (error instanceof NotFoundError) {
      return new RpcException({
        code: status.NOT_FOUND,
        message: error.message,
      });
    }

    if (error instanceof ConflictError) {
      return new RpcException({
        code: status.FAILED_PRECONDITION,
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
      // Check for lock-related errors
      if (error.message.includes('locked')) {
        return new RpcException({
          code: status.ABORTED,
          message: error.message,
        });
      }

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
