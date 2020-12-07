import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponseBase } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject, interval, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { UserModel } from '../_models/user.model';

import * as jwt_decode from 'jwt-decode';

// See github issue HTTP_INTERCEPTORS can't use providedIn injectable/service
// https://github.com/angular/angular/issues/24306
@Injectable(/*{
  providedIn: 'root'
}*/)
export class SsoService {
  private readonly ssoClientId: string = environment.sso.clientId;
  private readonly loginEndpoint: string = environment.sso.loginEndpoint;
  private readonly logoutEndpoint: string = environment.sso.logoutEndpoint;
  private readonly refreshEndpoint: string = environment.sso.refreshEndpoint;
  private readonly refreshInterval: number = Number(environment.sso.refreshInterval);
  private readonly localStorageTokenKey: string = 'token';
  private readonly localStorageRefreshTokenKey: string = 'refreshtoken';

  refreshTokenSet = false;
  refreshTokenSubscription: Subscription;

  currentToken = new BehaviorSubject<string>(null);
  currentRefreshToken = new BehaviorSubject<string>(null);

  constructor(private http: HttpClient, private router: Router) { }

  /**
   * Refresh a token
   */
  public refreshToken(refreshToken: string) {
    const headers = new HttpHeaders();

    const body = new HttpParams()
      .set('client_id', encodeURIComponent(this.ssoClientId))
      .set('grant_type', encodeURIComponent('refresh_token'))
      .set('refresh_token', encodeURIComponent(refreshToken));

    return this.http.post(this.refreshEndpoint, body, { headers }).pipe(
      tap(response => console.log(response))
    );
  }

  /**
   * Periodically refresh a token
   */
  public alwaysRefreshToken(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken !== null && !this.refreshTokenSet) {
      this.refreshTokenSubscription = interval(this.refreshInterval).subscribe(
        intervalResponse => {
          this.refreshTokenSet = true;
          this.refreshToken(refreshToken).subscribe(
            tokenResponse => {
              this.currentToken.next(tokenResponse['access_token']);
              this.currentRefreshToken.next(tokenResponse['refresh_token']);
            }, error => {
              console.log('error ', error);
            }
          );
        }, error => {
          console.log('error ', error);
        });
    }
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

  public getRefreshToken(): string {
    return localStorage.getItem(this.localStorageRefreshTokenKey);
  }

  public setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.localStorageRefreshTokenKey, refreshToken);
    this.currentRefreshToken.next(refreshToken);
  }

  public removeToken(): void {
    localStorage.removeItem(this.localStorageTokenKey);
    localStorage.removeItem(this.localStorageRefreshTokenKey);
    this.currentToken.next(null);
    this.currentRefreshToken.next(null);
  }

  public removeRefreshToken(): void {
    localStorage.removeItem(this.localStorageRefreshTokenKey);
    this.currentRefreshToken.next(null);
  }

  public isTokenSet(): boolean {
    return !(this.getToken() === null);
  }

  public isRefreshTokenSet(): boolean {
    return !(this.getRefreshToken() === null);
  }

  public loginWithEmailAndPassword(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders();
    // headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const _email = email ? encodeURIComponent(email) : null;
    const _password = password ? encodeURIComponent(password) : null;

    const body = new HttpParams()
      .set('username', email)
      .set('password', password)
      .set('client_id', this.ssoClientId)
      .set('grant_type', 'password');

    return this.http.post(this.loginEndpoint, body, {headers}); // withCredentials: true, responseType: 'text' // observe: 'events' | response | events
  }

  /**
   * Log out from SSO and client App
   */
  public logout(): void {
    const refreshToken = this.getRefreshToken();

    const headers = new HttpHeaders();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    const body = new HttpParams()
      .set('client_id', this.ssoClientId)
      .set('refresh_token', encodeURIComponent(refreshToken));

    this.http.post(this.logoutEndpoint, body, {headers}).subscribe(
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
