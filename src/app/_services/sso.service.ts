import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { IdentiteResponse } from '../_models/identite-response';

// See github issue HTTP_INTERCEPTORS can't use providedIn injectable/service
// https://github.com/angular/angular/issues/24306
@Injectable(/*{
  providedIn: 'root'
}*/)
export class SsoService {
  private readonly identiteEndpoint: string = environment.sso.identiteEndpoint;
  private readonly refreshEndpoint: string = environment.sso.refreshEndpoint;
  private readonly localStorageTokenKey: string = 'token';

  constructor(private http: HttpClient) { }

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
    const headers = new HttpHeaders({ withCredentials: 'true' });
    this.http.get<IdentiteResponse>(this.identiteEndpoint, { headers }).subscribe(
      result => {
        this.setToken(result.token);
      }, error => {
        // @Todo manage error notify user
        this.setToken(null);
      }
    );
  }

  /**
   * Same as identity() whithout subscription (returns an Observable)
   */
  public getIdentity(): Observable<IdentiteResponse> {
    const headers = new HttpHeaders({ withCredentials: 'true' });
    return this.http.get<IdentiteResponse>(this.identiteEndpoint, { headers});
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
  }

  public removeToken(): void {
    localStorage.removeItem(this.localStorageTokenKey);
  }

  public isTokenSet(): boolean {
    return !(this.getToken() == null);
  }
}
