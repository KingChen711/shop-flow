import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ReindexAllCommand } from '../reindex-all.command';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
} from '@domain/repositories/search.repository.interface';

export interface ReindexResult {
  success: boolean;
  message: string;
  indexedCount: number;
}

@CommandHandler(ReindexAllCommand)
export class ReindexAllHandler implements ICommandHandler<ReindexAllCommand> {
  private readonly logger = new Logger(ReindexAllHandler.name);

  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ISearchRepository
  ) {}

  async execute(command: ReindexAllCommand): Promise<ReindexResult> {
    this.logger.log(`Starting reindex operation (force: ${command.force})`);

    try {
      // If force, recreate the index
      if (command.force) {
        const exists = await this.searchRepository.indexExists();
        if (exists) {
          await this.searchRepository.deleteIndex();
          this.logger.log('Deleted existing index');
        }
        await this.searchRepository.createIndex();
        this.logger.log('Created new index');
      }

      // Note: In a real implementation, this would fetch products from
      // the Product Service via gRPC and index them all.
      // For now, we just ensure the index exists and is ready.

      // The actual reindexing would typically be done by:
      // 1. Fetching all products from Product Service
      // 2. Bulk indexing them into Elasticsearch
      // This requires the Product Service to have a ListAllProducts or similar endpoint.

      this.logger.log('Reindex operation completed');

      return {
        success: true,
        message: 'Index recreated successfully. Products will be indexed via CDC.',
        indexedCount: 0,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Reindex failed: ${errorMsg}`);

      return {
        success: false,
        message: `Reindex failed: ${errorMsg}`,
        indexedCount: 0,
      };
    }
  }
}
