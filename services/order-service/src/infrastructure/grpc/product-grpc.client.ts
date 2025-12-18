import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrls: string[];
  isActive: boolean;
}

@Injectable()
export class ProductGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ProductGrpcClient.name);
  private client: any;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const productServiceUrl = this.configService.get('PRODUCT_SERVICE_URL', 'localhost:50052');

    try {
      const protoPath = join(__dirname, '../../../../../packages/proto/product/product.proto');
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const proto = grpc.loadPackageDefinition(packageDefinition) as any;
      this.client = new proto.product.ProductService(
        productServiceUrl,
        grpc.credentials.createInsecure()
      );

      this.isConnected = true;
      this.logger.log(`Product gRPC client initialized: ${productServiceUrl}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Product service not available: ${errorMsg}`);
      this.isConnected = false;
    }
  }

  async getProduct(productId: string): Promise<ProductResponse | null> {
    // If product service is not connected, return a mock product for testing
    if (!this.isConnected) {
      this.logger.warn(`Product service not available, returning mock for ${productId}`);
      return {
        id: productId,
        name: `Product ${productId}`,
        description: 'Mock product for testing',
        price: 99.99,
        categoryId: 'mock-category',
        imageUrls: [],
        isActive: true,
      };
    }

    return new Promise((resolve, reject) => {
      this.client.GetProduct({ product_id: productId }, (error: any, response: any) => {
        if (error) {
          if (error.code === grpc.status.NOT_FOUND) {
            resolve(null);
            return;
          }
          this.logger.error('GetProduct error:', error);
          reject(error);
          return;
        }
        resolve({
          id: response.id,
          name: response.name,
          description: response.description,
          price: Number(response.price),
          categoryId: response.category_id,
          imageUrls: response.image_urls || [],
          isActive: response.is_active,
        });
      });
    });
  }
}
