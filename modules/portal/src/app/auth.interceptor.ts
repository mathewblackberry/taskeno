import {HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {fetchAuthSession} from "aws-amplify/auth";
import {from, Observable, throwError} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';

const urlsToExclude: string[] = ['s3.ap-southeast-2.amazonaws.com'];
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const isExcluded = urlsToExclude.some(url => req.url.includes(url));
  if (isExcluded)
    return next(req);

  return from(fetchAuthSession()).pipe(
    switchMap(token => {
      const clonedReq = req.clone({
        headers: req.headers.set('Authorization', `${token.tokens?.idToken}`)
      });

      if (req.method === 'POST' || req.method === 'PUT') {
        const clonedReq = req.clone({
          headers: req.headers.set('Content-Type', 'application/json')
        });
      }
      return next(clonedReq);
    }),
    catchError(error => {
      // console.error('Error in interceptor:', error);
      return throwError(error);
    })
  );
}

