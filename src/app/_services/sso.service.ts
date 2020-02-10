import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponseBase } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject, interval, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { IdentiteResponse } from '../_models/identite-response';
import { UserModel } from '../_models/user.model';

import * as jwt_decode from 'jwt-decode';

// See github issue HTTP_INTERCEPTORS can't use providedIn injectable/service
// https://github.com/angular/angular/issues/24306
@Injectable(/*{
  providedIn: 'root'
}*/)
export class SsoService {
  private readonly loginEndpoint: string = environment.sso.loginEndpoint;
  private readonly logoutEndpoint: string = environment.sso.logoutEndpoint;
  private readonly identiteEndpoint: string = environment.sso.identiteEndpoint;
  private readonly refreshEndpoint: string = environment.sso.refreshEndpoint;
  private readonly refreshInterval: number = environment.sso.refreshInterval;
  private readonly localStorageTokenKey: string = 'token';

  refreshTokenSet = false;
  refreshTokenSubscription: Subscription;

  currentToken = new BehaviorSubject<string>(null);

  constructor(private http: HttpClient, private router: Router) { }

  /**
   * Refresh token both server and client sides
   *
   * Default endpoint : https://beta.tela-botanica.org/service:annuaire:auth/identite
   * Parameters :
   *  - token: "jeton JWT (facultatif)"
   * Description :
   *  confirme l'authentification et la session;
   *  rafraîchit le jeton fourni (dans le cookie tb_auth_beta_test, le header Authorization ou en paramètre)
   */
  public identity(): void {
    const headers = new HttpHeaders();
    // headers.set('Content-Type', 'text/plain').set('Accept', 'text/plain');
    this.http.get<IdentiteResponse>(this.identiteEndpoint, { headers, withCredentials: false }).subscribe(
      result => {
        this.setToken(result.token);
        // The token expires after 15 minutes. We need to refresh it periodically to always keep it fresh
        if (!this.refreshTokenSet) {
          this.refreshTokenSubscription = interval(this.refreshInterval).subscribe((resp) => { this.refreshTokenSet = true; this.refreshToken(); });
        }
      }, (error: HttpResponseBase) => {
        // @Todo manage error | notify user ?
        if (error.status && error.status === 400) {
          // Token may be invalid
        }
        this.setToken(null);
      }
    );
  }

  /**
   * Same as identity() whithout subscription (returns an Observable)
   */
  public getIdentity(): Observable<IdentiteResponse> {
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'text/plain').set('Accept', 'text/plain');
    return this.http.get<IdentiteResponse>(this.identiteEndpoint, { headers, withCredentials: false}).pipe(
      tap(identite => {
        // The token expires after 15 minutes. We need to refresh it periodically to always keep it fresh
        if (!this.refreshTokenSet) {
          this.refreshTokenSubscription = interval(this.refreshInterval).subscribe((resp) => { this.refreshTokenSet = true; this.refreshToken(); });
        }
      })
    );
  }

  /**
   * Shortcut to refresh token
   */
  public refreshToken(): void {
    this.identity();
  }

  /**
   * Compare the token expiration date to now
   */
  public tokenShouldBeRefreshed(token: string): boolean {
    if (token !== null) {
      const decoded: UserModel = jwt_decode(token);
      const expiration = decoded ? decoded.exp : null;
      if (expiration) {
        const now = Date.now();
        return expiration > now ? true : false;
      } else { return true; }
    }
    return true;
  }

  public getToken(): string {
    return localStorage.getItem(this.localStorageTokenKey);
  }

  public setToken(token: string): void {
    localStorage.setItem(this.localStorageTokenKey, token);
    this.currentToken.next(token);
  }

  public removeToken(): void {
    localStorage.removeItem(this.localStorageTokenKey);
    this.currentToken.next(null);
  }

  public isTokenSet(): boolean {
    return !(this.getToken() === null);
  }

  public loginWithEmailAndPassword(email: string, password: string): Observable<any> {
    // Set Content-Type ans Accept headers to 'text/plain' to avoid sending a pre-flight OPTIONS request (may not be supported by the server)
    // see https://medium.com/@praveen.beatle/avoiding-pre-flight-options-calls-on-cors-requests-baba9692c21a
    // The Auth interceptor should prevent adding headers for this request
    // Note : If the server is well configured with OPTIONS request handling and response headers contains :
    //          - Access-Control-Allow-Credentials "true"
    //          - Access-Control-Allow-Headers: "[...], authorization[...]"
    // Then, preflight request should pass
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'text/plain').set('Accept', 'text/plain');

    const _email = email ? encodeURIComponent(email) : null;
    const _password = password ? encodeURIComponent(password) : null;

    // The token expires after 15 minutes. We need to refresh it periodically to always keep it fresh
    if (!this.refreshTokenSet) {
      this.refreshTokenSubscription = interval(this.refreshInterval).subscribe((resp) => { this.refreshTokenSet = true; this.refreshToken(); });
    }

    return this.http.get(`${this.loginEndpoint}?login=${_email}&password=${_password}`, {headers}); // withCredentials: true, responseType: 'text' // observe: 'events' | response | events
  }

  public logout(): void {
    this.http.get<any>(this.logoutEndpoint).subscribe(
      logout => {
        this.removeToken();
        if (this.refreshTokenSubscription) { this.refreshTokenSubscription.unsubscribe(); this.refreshTokenSet = false; }
        this.router.navigate(['/']);
      }, error => {
        // @Todo manage error
        console.log(error);
      }
    );
  }
}
