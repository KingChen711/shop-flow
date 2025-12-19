import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetIndexStatsQuery } from '../get-index-stats.query';
import { IndexStats } from '@domain/entities/search-result.entity';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
} from '@domain/repositories/search.repository.interface';

@QueryHandler(GetIndexStatsQuery)
export class GetIndexStatsHandler implements IQueryHandler<GetIndexStatsQuery> {
  private readonly logger = new Logger(GetIndexStatsHandler.name);

  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ISearchRepository
  ) {}

  async execute(_query: GetIndexStatsQuery): Promise<IndexStats> {
    this.logger.debug('Getting index statistics');
    return this.searchRepository.getStats();
  }
}
