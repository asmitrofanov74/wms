import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../shared/models/api-response';

export const unwrapInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object' && 'success' in event.body) {
        const apiResponse = event.body as ApiResponse<unknown>;
        if (apiResponse.success && apiResponse.data !== undefined) {
          return event.clone({ body: apiResponse.data });
        }
      }
      return event;
    }),
  );
};
