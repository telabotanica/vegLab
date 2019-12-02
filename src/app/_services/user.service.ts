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

  public userEvents = new BehaviorSubject<UserModel>(undefined);
  public currentUser = new BehaviorSubject<UserModel>(null);

  lastToken: string = null;

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

  isAdmin(): boolean {
    return false;
  }
}
