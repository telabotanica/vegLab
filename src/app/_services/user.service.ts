import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { UserModel } from '../_models/user.model';  // SSO User Model
import { VlUser } from '../_models/vl-user.model';  // API User Model

import { SsoService } from './sso.service';

import * as jwt_decode from 'jwt-decode';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public currentUser = new BehaviorSubject<UserModel>(null);

  lastToken: string = null;

  private readonly loginEndpoint = environment.sso.loginEndpoint;

  constructor(private http: HttpClient, private ssoService: SsoService) {
    this.ssoService.currentToken.subscribe(
      newToken => {
        // We've got a new token !
        if (newToken == null) {        // newToken can be null at startup or if user has logged out
          if (this.lastToken !== null) {
            // User was logged in
            this.lastToken = null;
            this.currentUser.next(null);
          } else {
            // User was not logged in
            // Still not logged
          }
        } else {
          // Compare with lastToken
          if (this.lastToken !== null) {
            // User was logged in
            // User may change ?
            if (this.lastToken === newToken) {
              // No change
            } else {
              this.lastToken = newToken;
              const userData = this.decode(newToken);
              this.currentUser.next(userData);
            }
          } else {
            // User wasn't logged in
            this.lastToken = newToken;
            const userData = this.decode(newToken);
            this.currentUser.next(userData);
          }
        }
      }, error => {
        // @Todo manage error
      }
    );
  }

  createUser(user: VlUser): Observable<VlUser> {
    const headers = {'Content-Type': 'application/ld+json'};
    return this.http.post<VlUser>(`${environment.apiBaseUrl}/users`, JSON.stringify(user), {headers});
  }

  private decode(token: string): UserModel {
    let response: UserModel;
    try {
      response = jwt_decode(token);
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  getUserName(): string {
    const cUser = this.currentUser.getValue();
    if (cUser) {
      if (cUser.preferred_username) {
        return cUser.preferred_username;
      } else if (cUser.name) {
        return cUser.name;
      } else if (cUser.given_name && cUser.family_name) {
        return cUser.given_name + ' ' + cUser.family_name;
      }
    } else {
      return null;
    }
  }

  getUserFullName(): string {
    const cUser = this.currentUser.getValue();
    if (cUser) {
      if (cUser.given_name && cUser.family_name) {
        return cUser.given_name + ' ' + cUser.family_name;
      } else if (cUser.preferred_username) {
        return cUser.preferred_username;
      } else if (cUser.name) {
        return cUser.name;
      }
    } else {
      return null;
    }
  }

  /**
   * Is current user an admin ?
   */
  hasCurrentUserRole(role: string): boolean {
    const cuRoles = this.getCurrentUserRoles();
    return cuRoles && cuRoles.length > 0 && cuRoles.includes(role) ? true : false;
  }

  isAdmin(): boolean {
    return this.hasCurrentUserRole(environment.sso.roles.admin);
  }

  getCurrentUserRoles(): Array<string> {
    const cu = this.currentUser.getValue();
    if (cu && cu['resource_access'] && cu['resource_access'][environment.sso.clientId]) {
      return cu['resource_access'][environment.sso.clientId].roles as Array<string>;
    }
    return [];
  }
}
