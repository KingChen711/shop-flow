import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetSuggestionsQuery } from '../get-suggestions.query';
import { Suggestion } from '@domain/entities/search-result.entity';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
} from '@domain/repositories/search.repository.interface';

@QueryHandler(GetSuggestionsQuery)
export class GetSuggestionsHandler implements IQueryHandler<GetSuggestionsQuery> {
  private readonly logger = new Logger(GetSuggestionsHandler.name);

  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ISearchRepository
  ) {}

  async execute(query: GetSuggestionsQuery): Promise<Suggestion[]> {
    this.logger.debug(`Getting suggestions for: "${query.prefix}"`);

    const suggestions = await this.searchRepository.getSuggestions(query.prefix, query.limit || 5);

    return suggestions;
  }
}
