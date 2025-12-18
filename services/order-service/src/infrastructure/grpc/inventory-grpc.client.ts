import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

interface ReserveStockItem {
  productId: string;
  quantity: number;
}

interface Reservation {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: string;
}

interface ReserveMultipleResponse {
  success: boolean;
  reservations: Reservation[];
  failedProductIds: string[];
  errorMessage?: string;
}

interface ReleaseMultipleResponse {
  success: boolean;
  releasedReservationIds: string[];
}

@Injectable()
export class InventoryGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(InventoryGrpcClient.name);
  private client: any;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const inventoryServiceUrl = this.configService.get('INVENTORY_SERVICE_URL', 'localhost:50054');

    const protoPath = join(__dirname, '../../../../../packages/proto/inventory/inventory.proto');
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDefinition) as any;
    this.client = new proto.inventory.InventoryService(
      inventoryServiceUrl,
      grpc.credentials.createInsecure()
    );

    this.logger.log(`Inventory gRPC client initialized: ${inventoryServiceUrl}`);
  }

  async reserveMultipleStock(
    orderId: string,
    items: ReserveStockItem[],
    ttlMinutes: number
  ): Promise<ReserveMultipleResponse> {
    return new Promise((resolve, reject) => {
      this.client.ReserveMultipleStock(
        {
          order_id: orderId,
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
          ttl_minutes: ttlMinutes,
        },
        (error: any, response: any) => {
          if (error) {
            this.logger.error('ReserveMultipleStock error:', error);
            reject(error);
            return;
          }
          resolve({
            success: response.success,
            reservations: (response.reservations || []).map((r: any) => ({
              id: r.id,
              orderId: r.order_id,
              productId: r.product_id,
              quantity: r.quantity,
              status: r.status,
            })),
            failedProductIds: response.failed_product_ids || [],
            errorMessage: response.error_message,
          });
        }
      );
    });
  }

  async confirmReservation(reservationId: string): Promise<Reservation> {
    return new Promise((resolve, reject) => {
      this.client.ConfirmReservation(
        { reservation_id: reservationId },
        (error: any, response: any) => {
          if (error) {
            this.logger.error('ConfirmReservation error:', error);
            reject(error);
            return;
          }
          resolve({
            id: response.id,
            orderId: response.order_id,
            productId: response.product_id,
            quantity: response.quantity,
            status: response.status,
          });
        }
      );
    });
  }

  async releaseMultipleStock(
    orderId: string,
    reservationIds: string[],
    reason: string
  ): Promise<ReleaseMultipleResponse> {
    return new Promise((resolve, reject) => {
      this.client.ReleaseMultipleStock(
        {
          order_id: orderId,
          reservation_ids: reservationIds,
          reason,
        },
        (error: any, response: any) => {
          if (error) {
            this.logger.error('ReleaseMultipleStock error:', error);
            reject(error);
            return;
          }
          resolve({
            success: response.success,
            releasedReservationIds: response.released_reservation_ids || [],
          });
        }
      );
    });
  }

  /**
   * Restock items (add stock back) - used when cancelling CONFIRMED orders
   */
  async restockItems(
    items: Array<{ productId: string; quantity: number }>,
    reason: string
  ): Promise<void> {
    for (const item of items) {
      await this.updateStock(item.productId, item.quantity, reason);
    }
  }

  /**
   * Update stock (add quantity)
   */
  async updateStock(
    productId: string,
    quantity: number,
    reason: string
  ): Promise<{ productId: string; totalStock: number; availableStock: number }> {
    return new Promise((resolve, reject) => {
      this.client.UpdateStock(
        {
          product_id: productId,
          quantity: quantity,
          reason: reason,
        },
        (error: any, response: any) => {
          if (error) {
            this.logger.error(`UpdateStock error for ${productId}:`, error);
            reject(error);
            return;
          }
          resolve({
            productId: response.product_id,
            totalStock: response.total_stock,
            availableStock: response.available_stock,
          });
        }
      );
    });
  }
}
