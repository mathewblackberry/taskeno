import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {authInterceptor} from './auth.interceptor';

import {LoadingInterceptor} from './services/loading-interceptor';
import {messageInterceptor} from './services/message-interceptor';
import {SpinnerService} from './services/spinner-service';

// @ts-ignore
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([LoadingInterceptor, authInterceptor, messageInterceptor])),
    provideAnimations(),
    SpinnerService
  ]

};
