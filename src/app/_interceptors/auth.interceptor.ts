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

    // TB authentication response
    /*if (request.headers.has('Set-cookie')) {
      console.log(request.headers.get('Set-cookie'));
    }*/

    return next.handle(request);
  }

  private applies(request: HttpRequest<any>, token: string): boolean {
    // console.log(`APPLIES INTERCEPTOR ?`);
    // console.log(`token?: ${token}`);
    // console.log(`Login connexion?: ${request.url.startsWith(this.ssoLoginUrl)}`);
    // console.log(`Identite?: ${request.url.startsWith(this.ssoIdentiteUrl)}`);
    // console.log(`--`);

    if (request.url.startsWith(this.ssoLoginUrl)) { // request.url.startsWith(this.ssoIdentiteUrl)
      // The current request is a SSO-Login with remote Tela Bota's SSO service
      // To avoid Preflight (OPTIONS) request send by the browser, the request must be a SIMPLE request
      // see https://medium.com/@praveen.beatle/avoiding-pre-flight-options-calls-on-cors-requests-baba9692c21a
      // So, we don't add any header
      // console.log('AUTH interceptor, Login request or Identite request : do nothing...');
    } else if (token && request.url.startsWith(this.ssoIdentiteUrl)) {
      // SSO Identity Request
      return false;
    } else {
      return (token && ( request.url.startsWith(this.apiBaseUrl) || request.url.startsWith(this.ssoBaseUrl) ));
    }
  }

}
