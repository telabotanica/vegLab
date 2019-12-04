import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { SsoService } from '../_services/sso.service';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private apiBaseUrl: string = environment.apiBaseUrl;
  private ssoBaseUrl: string = environment.sso.baseUrl;
  private ssoLoginUrl: string = environment.sso.loginEndpoint;
  private ssoIdentiteUrl: string = environment.sso.identiteEndpoint;

  constructor(private ssoService: SsoService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add authorization request header if needed
    if (this.applies(request)) {
      const token = this.ssoService.getToken();
      if (token !== null) {
        request = request.clone({
          setHeaders: {
              Authorization: `Bearer ${token}`
          }
        });
      }
    }
    return next.handle(request);
  }

  private applies(request: HttpRequest<any>): boolean {
    if (request.url.startsWith(this.ssoLoginUrl)) {
      // The current request is a SSO-Login with remote Tela Bota's SSO service
      // To avoid Preflight (OPTIONS) request send by the browser, the request must be a SIMPLE request
      // see https://medium.com/@praveen.beatle/avoiding-pre-flight-options-calls-on-cors-requests-baba9692c21a
      // So, we don't add any header
      return false;
    } else if (request.url.startsWith(this.ssoIdentiteUrl)) {
      // SSO identite request
      const token = this.ssoService.getToken();
      return token ? true : false;
    } else if (request.url.startsWith(this.ssoBaseUrl)) {
      // SSO request
      const token = this.ssoService.getToken();
      return token ? true : false;
    } else if (request.url.startsWith(this.apiBaseUrl)) {
      // API request
      const token = this.ssoService.getToken();
      return token ? true : false;
    } else {
      return false;
    }
  }

}
