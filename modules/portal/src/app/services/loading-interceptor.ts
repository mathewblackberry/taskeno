import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { SpinnerService } from './spinner-service';

export function LoadingInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const spinnerService = inject(SpinnerService);
  spinnerService.show();
  return next(req).pipe(
    finalize(() => spinnerService.hide())
  );
}
