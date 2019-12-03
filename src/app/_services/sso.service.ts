import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environment';

import { IdentiteResponse } from '../_models/identite-response';


// See github issue HTTP_INTERCEPTORS can't use providedIn injectable/service
// https://github.com/angular/angular/issues/24306
@Injectable(/*{
  providedIn: 'root'
}*/)
export class SsoService {
  private readonly loginEndpoint: string = environment.sso.loginEndpoint;
  private readonly identiteEndpoint: string = environment.sso.identiteEndpoint;
  private readonly refreshEndpoint: string = environment.sso.refreshEndpoint;
  private readonly localStorageTokenKey: string = 'token';

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
    // DEV
    this.setToken(MOCKEDTOKEN.token);

    // PROD
    /*const headers = new HttpHeaders();
    headers.set('withCredentials', 'true').set('Content-Type', 'text/plain').set('Accept', 'text/plain');
    this.http.get<IdentiteResponse>(this.identiteEndpoint, { headers }).subscribe(
      result => {
        this.setToken(result.token);
      }, error => {
        // @Todo manage error notify user
        console.log(error);
        this.setToken(null);
      }
    );*/
  }

  /**
   * Same as identity() whithout subscription (returns an Observable)
   */
  public getIdentity(): Observable<IdentiteResponse> {
    // DEV
    return of(MOCKEDTOKEN);

    // PROD
    // const headers = new HttpHeaders({ withCredentials: 'true' });
    // return this.http.get<IdentiteResponse>(this.identiteEndpoint, { headers});
  }

  /**
   * Shortcut to refresh token
   */
  public refreshToken(): void {
    this.identity();
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
    return !(this.getToken() == null);
  }

  public loginWithEmailAndPassword(email: string, password: string): Observable<IdentiteResponse> {
    // Set Content-Type ans Accept headers to 'text/plain' to avoid sending a pre-flight OPTIONS request (currently not supported by the SSO server)
    // see https://medium.com/@praveen.beatle/avoiding-pre-flight-options-calls-on-cors-requests-baba9692c21a
    // The Auth interceptor also prevent adding headers for this request
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'text/plain').set('Accept', 'text/plain');

    const _email = email ? encodeURIComponent(email) : null;
    const _password = password ? encodeURIComponent(password) : null;

    return this.http.get<IdentiteResponse>(`${this.loginEndpoint}?login=${_email}&password=${_password}`, {headers});
  }

  public logout(): void {
    // DEV
    this.removeToken();
    this.router.navigate(['/']);

    // PROD
    // + CALL SSO ENDPOINT LOGOUT
    // this.removeToken();
    // this.router.navigate(['/']);
  }
}

export const MOCKEDTOKEN: IdentiteResponse = {
  session: 'true',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvd3d3LnRlbGEtYm90YW5pY2Eub3JnIiwidG9rZW5faWQiOiJ0Yl9hdXRoX2JldGFfdGVzdCIsInN1YiI6InN0ZXBoLmRlbEByaXNldXAubmV0IiwiaWF0IjoxNTc1MDE1MDY4LCJleHAiOjE1NzUyODc3MzMsInNjb3BlcyI6WyJ0ZWxhLWJvdGFuaWNhLm9yZyJdLCJpZCI6IjEwMDA0IiwicHJlbm9tIjoiU3RcdTAwZTlwaGFuZSIsIm5vbSI6IkRlbHBsYW5xdWUiLCJwc2V1ZG8iOiJTdFx1MDBlOXBoYW5lIERlbHBsYW5xdWUiLCJwc2V1ZG9VdGlsaXNlIjp0cnVlLCJpbnRpdHVsZSI6IlN0XHUwMGU5cGhhbmUgRGVscGxhbnF1ZSIsImF2YXRhciI6IlwvXC93d3cuZ3JhdmF0YXIuY29tXC9hdmF0YXJcL2YzODY4YThkOWI0NDEyNWEzN2JmNDgwZTA3ZTU0MjAxP3M9NTAmcj1nJmQ9bW0iLCJncm91cGVzIjp7IjE5MjMwIjoiIiwiMTUwNjYiOiIiLCIyMDM0MCI6IiIsIjE2NTU2IjoiIiwiMTc3NzQiOiIiLCIyMTg5NSI6IiIsIjE1MjY2IjoiIn0sInBlcm1pc3Npb25zIjpbImNvbnRyaWJ1dG9yIl0sIm5vbVdpa2kiOiJTdGVwaGFuZURlbHBsYW5xdWUiLCJkYXRlRGVybmllcmVNb2RpZiI6MTQ5NTIwNjM3Nn0.pkGoS3jcyO0v-fkefWBFbe1TRE-bj_b1KDynY_q1DfQ',
  duration: 900,
  token_id: 'tb_auth_beta_test'
};
