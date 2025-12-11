import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { status } from '@grpc/grpc-js';

// Commands
import { CreateCategoryCommand } from '../../application/commands/create-category.command';

// Queries
import { GetCategoryQuery } from '../../application/queries/get-category.query';
import { ListCategoriesQuery } from '../../application/queries/list-categories.query';

// Domain
import { Category } from '../../domain/entities/category.entity';

// Error handling
import { NotFoundError, ValidationError } from '@shopflow/shared-utils';

@Controller()
export class CategoryGrpcController {
  private readonly logger = new Logger(CategoryGrpcController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @GrpcMethod('ProductService', 'CreateCategory')
  async createCategory(data: { name: string; description: string; parent_id?: string }) {
    try {
      this.logger.log(`Creating category: ${data.name}`);

      const command = new CreateCategoryCommand(data.name, data.description, data.parent_id);

      const category: Category = await this.commandBus.execute(command);
      return this.toCategoryResponse(category);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('ProductService', 'GetCategory')
  async getCategory(data: { category_id: string }) {
    try {
      const query = new GetCategoryQuery(data.category_id);
      const category: Category = await this.queryBus.execute(query);
      return this.toCategoryResponse(category);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('ProductService', 'ListCategories')
  async listCategories(data: { parent_id?: string }) {
    try {
      // If parent_id is empty string, treat as undefined (get all)
      // If parent_id is "null" or not provided, get root categories
      let parentId: string | null | undefined = undefined;

      if (data.parent_id === 'null' || data.parent_id === '') {
        parentId = null; // Root categories
      } else if (data.parent_id) {
        parentId = data.parent_id;
      }

      const query = new ListCategoriesQuery(parentId);
      const categories: Category[] = await this.queryBus.execute(query);

      return {
        categories: categories.map((category) => this.toCategoryResponse(category)),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper methods
  private toCategoryResponse(category: Category) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parent_id: category.parentId || '',
      created_at: category.createdAt.toISOString(),
    };
  }

  private handleError(error: unknown): RpcException {
    this.logger.error('Error in CategoryGrpcController', error);

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
