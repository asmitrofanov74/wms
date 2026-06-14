import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, FieldErrors } from '../dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | FieldErrors | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const body = res as Record<string, unknown>;
        message = (body.message as string) || message;
        if (Array.isArray(body.message)) {
          errors = body.message as string[];
          message = 'Validation failed';
        }
        if (body.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
          errors = body.errors as FieldErrors;
          message = 'Validation failed';
        }
      }
    } else {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error('Unhandled exception', error.stack);
      message = error.message;
      errors = [error.stack || error.message];
    }

    response.status(status).json(ApiResponse.error(message, errors));
  }
}
