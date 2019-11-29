import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { SsoService } from '../_services/sso.service';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private apiBaseUrl: string = environment.apiBaseUrl;
  private ssoBaseUrl: string = environment.sso.baseUrl;

  constructor(private ssoService: SsoService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.ssoService.getToken();

    // Add authorization request header with auth token if available
    // For API & SSO urls
    if (this.applies(request, token)) {
      request = request.clone({
          setHeaders: {
              Authorization: `Bearer ${token}`
          }
      });
    }

    return next.handle(request);
  }

  private applies(request: HttpRequest<any>, token: string): boolean {
    return (token && ( request.url.startsWith(this.apiBaseUrl) || request.url.startsWith(this.ssoBaseUrl) ));
  }

}
