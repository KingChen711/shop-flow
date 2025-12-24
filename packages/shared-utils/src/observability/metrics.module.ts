import { Module, Global, DynamicModule } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

export interface MetricsModuleOptions {
  serviceName: string;
  defaultLabels?: Record<string, string>;
}

/**
 * Standard metrics for ShopFlow services
 * - HTTP request count
 * - HTTP request duration
 * - gRPC request count
 * - gRPC request duration
 * - Active connections gauge
 */
@Global()
@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    const { serviceName, defaultLabels = {} } = options;

    return {
      module: MetricsModule,
      imports: [
        PrometheusModule.register({
          path: '/metrics',
          defaultLabels: {
            service: serviceName,
            ...defaultLabels,
          },
        }),
      ],
      providers: [
        // HTTP Request Counter
        makeCounterProvider({
          name: 'http_requests_total',
          help: 'Total number of HTTP requests',
          labelNames: ['method', 'path', 'status', 'service'],
        }),

        // HTTP Request Duration Histogram
        makeHistogramProvider({
          name: 'http_request_duration_seconds',
          help: 'HTTP request duration in seconds',
          labelNames: ['method', 'path', 'status', 'service'],
          buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        }),

        // gRPC Request Counter
        makeCounterProvider({
          name: 'grpc_requests_total',
          help: 'Total number of gRPC requests',
          labelNames: ['method', 'service', 'status'],
        }),

        // gRPC Request Duration Histogram
        makeHistogramProvider({
          name: 'grpc_request_duration_seconds',
          help: 'gRPC request duration in seconds',
          labelNames: ['method', 'service', 'status'],
          buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
        }),

        // Active Connections Gauge
        makeGaugeProvider({
          name: 'active_connections',
          help: 'Number of active connections',
          labelNames: ['type', 'service'],
        }),

        // Database Query Counter
        makeCounterProvider({
          name: 'db_queries_total',
          help: 'Total number of database queries',
          labelNames: ['operation', 'table', 'service'],
        }),

        // Database Query Duration
        makeHistogramProvider({
          name: 'db_query_duration_seconds',
          help: 'Database query duration in seconds',
          labelNames: ['operation', 'table', 'service'],
          buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
        }),

        // Cache Hit/Miss Counter
        makeCounterProvider({
          name: 'cache_operations_total',
          help: 'Total cache operations',
          labelNames: ['operation', 'result', 'service'],
        }),

        // Kafka Message Counter
        makeCounterProvider({
          name: 'kafka_messages_total',
          help: 'Total Kafka messages',
          labelNames: ['topic', 'operation', 'service'],
        }),

        // Business Metrics
        makeCounterProvider({
          name: 'orders_total',
          help: 'Total orders processed',
          labelNames: ['status', 'service'],
        }),

        makeHistogramProvider({
          name: 'order_value_dollars',
          help: 'Order value in dollars',
          labelNames: ['service'],
          buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
        }),
      ],
      exports: [PrometheusModule],
    };
  }
}
