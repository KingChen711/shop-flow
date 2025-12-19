import { Module, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { ElasticsearchSearchRepository } from './elasticsearch-search.repository';
import { SEARCH_REPOSITORY } from '@domain/repositories/search.repository.interface';

export const ELASTICSEARCH_CLIENT = 'ElasticsearchClient';

@Module({
  providers: [
    {
      provide: ELASTICSEARCH_CLIENT,
      useFactory: (configService: ConfigService) => {
        const node = configService.get('ELASTICSEARCH_NODE', 'http://localhost:9200');
        const username = configService.get('ELASTICSEARCH_USERNAME');
        const password = configService.get('ELASTICSEARCH_PASSWORD');

        const clientConfig: ConstructorParameters<typeof Client>[0] = {
          node,
        };

        if (username && password) {
          clientConfig.auth = { username, password };
        }

        return new Client(clientConfig);
      },
      inject: [ConfigService],
    },
    {
      provide: SEARCH_REPOSITORY,
      useFactory: (client: Client, configService: ConfigService) => {
        return new ElasticsearchSearchRepository(client, configService);
      },
      inject: [ELASTICSEARCH_CLIENT, ConfigService],
    },
  ],
  exports: [ELASTICSEARCH_CLIENT, SEARCH_REPOSITORY],
})
export class ElasticsearchModule implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchModule.name);

  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ElasticsearchSearchRepository
  ) {}

  async onModuleInit() {
    // Initialize index on module startup
    try {
      const exists = await this.searchRepository.indexExists();
      if (!exists) {
        await this.searchRepository.createIndex();
        this.logger.log('Elasticsearch index created');
      } else {
        this.logger.log('Elasticsearch index already exists');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch index:', error);
    }
  }
}
