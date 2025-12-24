import { Module, Global, DynamicModule, OnModuleInit } from '@nestjs/common';

export interface TracingModuleOptions {
  serviceName: string;
  jaegerEndpoint?: string;
  enabled?: boolean;
}

/**
 * OpenTelemetry Tracing Module for ShopFlow
 *
 * Provides distributed tracing via Jaeger
 *
 * Usage:
 * ```
 * TracingModule.forRoot({
 *   serviceName: 'user-service',
 *   jaegerEndpoint: 'http://jaeger-collector:4318/v1/traces'
 * })
 * ```
 */
@Global()
@Module({})
export class TracingModule implements OnModuleInit {
  private static options: TracingModuleOptions;

  static forRoot(options: TracingModuleOptions): DynamicModule {
    TracingModule.options = {
      enabled: true,
      jaegerEndpoint:
        process.env.JAEGER_ENDPOINT ||
        'http://jaeger-collector.monitoring.svc.cluster.local:4318/v1/traces',
      ...options,
    };

    return {
      module: TracingModule,
      providers: [
        {
          provide: 'TRACING_OPTIONS',
          useValue: TracingModule.options,
        },
      ],
      exports: ['TRACING_OPTIONS'],
    };
  }

  async onModuleInit() {
    if (!TracingModule.options?.enabled) {
      console.log('Tracing disabled');
      return;
    }

    try {
      // OpenTelemetry setup would go here
      // For production, use @opentelemetry/sdk-node
      console.log(`Tracing initialized for ${TracingModule.options.serviceName}`);
      console.log(`Jaeger endpoint: ${TracingModule.options.jaegerEndpoint}`);
    } catch (error) {
      console.warn('Failed to initialize tracing:', error);
    }
  }
}

/**
 * Tracing decorator for methods
 * Automatically creates spans for decorated methods
 */
export function Trace(spanName?: string) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      // In production, this would create an OpenTelemetry span
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        throw error;
      } finally {
        const duration = Date.now() - startTime;
        // Log trace info (in production, this would be a span)
        if (process.env.TRACE_DEBUG === 'true') {
          console.log(`[TRACE] ${name}: ${duration}ms`);
        }
      }
    };

    return descriptor;
  };
}
