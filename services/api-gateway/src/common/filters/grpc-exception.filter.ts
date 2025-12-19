import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

// gRPC status codes to HTTP status mapping
const grpcToHttpStatus: Record<number, number> = {
  0: HttpStatus.OK, // OK
  1: HttpStatus.INTERNAL_SERVER_ERROR, // CANCELLED
  2: HttpStatus.INTERNAL_SERVER_ERROR, // UNKNOWN
  3: HttpStatus.BAD_REQUEST, // INVALID_ARGUMENT
  4: HttpStatus.GATEWAY_TIMEOUT, // DEADLINE_EXCEEDED
  5: HttpStatus.NOT_FOUND, // NOT_FOUND
  6: HttpStatus.CONFLICT, // ALREADY_EXISTS
  7: HttpStatus.FORBIDDEN, // PERMISSION_DENIED
  8: HttpStatus.TOO_MANY_REQUESTS, // RESOURCE_EXHAUSTED
  9: HttpStatus.BAD_REQUEST, // FAILED_PRECONDITION
  10: HttpStatus.CONFLICT, // ABORTED
  11: HttpStatus.BAD_REQUEST, // OUT_OF_RANGE
  12: HttpStatus.NOT_IMPLEMENTED, // UNIMPLEMENTED
  13: HttpStatus.INTERNAL_SERVER_ERROR, // INTERNAL
  14: HttpStatus.SERVICE_UNAVAILABLE, // UNAVAILABLE
  15: HttpStatus.INTERNAL_SERVER_ERROR, // DATA_LOSS
  16: HttpStatus.UNAUTHORIZED, // UNAUTHENTICATED
};

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
  metadata?: any;
}

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Handle gRPC errors
    if (this.isGrpcError(exception)) {
      const grpcError = exception as GrpcError;
      status = grpcToHttpStatus[grpcError.code || 2] || HttpStatus.INTERNAL_SERVER_ERROR;
      message = grpcError.details || grpcError.message || 'gRPC error';
      error = this.getErrorName(status);
    }
    // Handle HTTP exceptions
    else if (exception.getStatus && typeof exception.getStatus === 'function') {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      error = this.getErrorName(status);
    }
    // Handle connection errors
    else if (exception.code === 'UNAVAILABLE' || exception.code === 14) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Service temporarily unavailable';
      error = 'Service Unavailable';
    }

    this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isGrpcError(exception: any): boolean {
    return (
      exception &&
      (typeof exception.code === 'number' ||
        exception.details !== undefined ||
        (exception.message && exception.message.includes('GRPC')))
    );
  }

  private getErrorName(status: number): string {
    const names: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
      [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
    };
    return names[status] || 'Error';
  }
}
