import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure
import { ElasticsearchModule } from '@infrastructure/elasticsearch/elasticsearch.module';
import { ProductCdcConsumer } from '@infrastructure/kafka/product-cdc.consumer';

// Application - Query Handlers
import { SearchProductsHandler } from '@application/queries/handlers/search-products.handler';
import { GetSuggestionsHandler } from '@application/queries/handlers/get-suggestions.handler';
import { GetIndexStatsHandler } from '@application/queries/handlers/get-index-stats.handler';

// Application - Command Handlers
import { IndexProductHandler } from '@application/commands/handlers/index-product.handler';
import { DeleteProductHandler } from '@application/commands/handlers/delete-product.handler';
import { ReindexAllHandler } from '@application/commands/handlers/reindex-all.handler';

// Presentation
import { SearchController } from '@presentation/grpc/search.controller';

const QueryHandlers = [SearchProductsHandler, GetSuggestionsHandler, GetIndexStatsHandler];

const CommandHandlers = [IndexProductHandler, DeleteProductHandler, ReindexAllHandler];

@Module({
  imports: [CqrsModule, ElasticsearchModule],
  controllers: [SearchController],
  providers: [...QueryHandlers, ...CommandHandlers, ProductCdcConsumer],
})
export class SearchModule {}
