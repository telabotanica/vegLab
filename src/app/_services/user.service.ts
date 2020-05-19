import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { UserModel } from '../_models/user.model';

import { SsoService } from './sso.service';

import * as jwt_decode from 'jwt-decode';

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
              // console.log('Token has been updated');
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
      if (cUser.intitule) {
        return cUser.intitule;
      } else if (cUser.pseudoUtilise && cUser.pseudo) {
        return cUser.pseudo;
      } else if (cUser.nom && cUser.prenom) {
        return cUser.prenom + ' ' + cUser.nom;
      }
    } else {
      return null;
    }
  }

  /**
   * Is current user an admin ?
   * @TODO important : set up a role based authentification
   * E-mail check is for testing only
   */
  isAdmin(): boolean {
    const currentUser = this.currentUser.getValue();
    if (currentUser !== null && currentUser.sub === 'stephane@phytoscopa.fr') {
      return true;
    } else {
      return false;
    }
  }
}
