// src/app/interceptors/message.interceptor.ts

import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse} from '@angular/common/http';
import {catchError, Observable, tap} from 'rxjs';
import { inject } from '@angular/core';
import { ToastService } from './toast-service';

export const messageInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    tap(event => {
      // @ts-ignore
      if (event instanceof HttpResponse && event.body && event.body.message) {
        console.log(JSON.stringify(event.body,null,1));
        // @ts-ignore
        toastService.showSuccessAlert(event.body.message);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.log('error');
      console.log(JSON.stringify(error,null,1));
      if (error.error && error.error.message) {
        toastService.showErrorAlert(error.error.message);
      }
      throw error;
    })
  );
};
