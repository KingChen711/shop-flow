import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { status } from '@grpc/grpc-js';

// Commands
import { CreateProductCommand } from '../../application/commands/create-product.command';
import { UpdateProductCommand } from '../../application/commands/update-product.command';
import { DeleteProductCommand } from '../../application/commands/delete-product.command';

// Queries
import { GetProductQuery } from '../../application/queries/get-product.query';
import { ListProductsQuery } from '../../application/queries/list-products.query';
import { ListProductsResult } from '../../application/queries/handlers/list-products.handler';

// Domain
import { Product } from '../../domain/entities/product.entity';

// Error handling
import { NotFoundError, ValidationError } from '@shopflow/shared-utils';

// gRPC KeyValue type (from proto)
interface KeyValue {
  key: string;
  value: string;
}

@Controller()
export class ProductGrpcController {
  private readonly logger = new Logger(ProductGrpcController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @GrpcMethod('ProductService', 'CreateProduct')
  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    category_id: string;
    image_urls?: string[];
    attributes?: KeyValue[];
  }) {
    try {
      this.logger.log(`Creating product: ${data.name}`);

      const command = new CreateProductCommand(
        data.name,
        data.description,
        data.price,
        data.category_id,
        data.image_urls,
        this.keyValueToRecord(data.attributes)
      );

      const product: Product = await this.commandBus.execute(command);
      return this.toProductResponse(product);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('ProductService', 'GetProduct')
  async getProduct(data: { product_id: string }) {
    try {
      const query = new GetProductQuery(data.product_id);
      const product: Product = await this.queryBus.execute(query);
      return this.toProductResponse(product);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('ProductService', 'UpdateProduct')
  async updateProduct(data: {
    product_id: string;
    name?: string;
    description?: string;
    price?: number;
    category_id?: string;
    image_urls?: string[];
    attributes?: KeyValue[];
  }) {
    try {
      const command = new UpdateProductCommand(
        data.product_id,
        data.name,
        data.description,
        data.price,
        data.category_id,
        data.image_urls,
        this.keyValueToRecord(data.attributes)
      );

      const product: Product = await this.commandBus.execute(command);
      return this.toProductResponse(product);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('ProductService', 'DeleteProduct')
  async deleteProduct(data: { product_id: string }) {
    try {
      const command = new DeleteProductCommand(data.product_id);
      const success: boolean = await this.commandBus.execute(command);

      return {
        success,
        message: success ? 'Product deleted successfully' : 'Failed to delete product',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('ProductService', 'ListProducts')
  async listProducts(data: {
    page: number;
    limit: number;
    category_id?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    sort_order?: string;
  }) {
    try {
      const query = new ListProductsQuery(
        data.page || 1,
        data.limit || 20,
        data.category_id,
        data.search,
        data.min_price,
        data.max_price,
        data.sort_by,
        (data.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC'
      );

      const result: ListProductsResult = await this.queryBus.execute(query);

      return {
        products: result.products.map((product) => this.toProductResponse(product)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper methods
  private toProductResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.categoryId,
      category_name: '', // Will be populated if category is loaded
      image_urls: product.imageUrls,
      attributes: this.recordToKeyValue(product.attributes),
      is_active: product.isActive,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }

  // Convert KeyValue[] from gRPC to Record<string, string>
  private keyValueToRecord(keyValues?: KeyValue[]): Record<string, string> | undefined {
    if (!keyValues || keyValues.length === 0) {
      return undefined;
    }
    return keyValues.reduce(
      (acc, { key, value }) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  // Convert Record<string, string> to KeyValue[] for gRPC response
  private recordToKeyValue(record: Record<string, string>): KeyValue[] {
    if (!record) {
      return [];
    }
    return Object.entries(record).map(([key, value]) => ({ key, value }));
  }

  private handleError(error: unknown): RpcException {
    this.logger.error('Error in ProductGrpcController', error);

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
