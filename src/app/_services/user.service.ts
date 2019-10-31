import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { UserModel } from '../_models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public userEvents = new BehaviorSubject<UserModel>(undefined);

  fakeUser = { id: 1, name: 'Stephane', email: 'stephane@ptt.fr', roles: ['user']};
  fakeAdmin = {id: 2, name: 'Admin', email: 'admin@ptt.fr', roles: ['user', 'admin']};

  constructor(private http: HttpClient) { }

  register() { }

  authenticate(credentials): Observable<UserModel> {
    let user: UserModel;
    switch (credentials) {
      case 'user':
        user = this.fakeUser;
        break;
      case 'admin':
        user = this.fakeAdmin;
        break;
      default:
        user = null;
        break;
    }

    this.storedLoggedInUser(user);
    this.userEvents.next(user);
    return of(user);
  }

  storedLoggedInUser(user: UserModel) {
    window.localStorage.setItem('rememberMe', JSON.stringify(user));
    // this.requestOptions.headers.set('Authorization', `Bearer ${user.token}`);
    this.userEvents.next(user);
  }

  retrieveUser() {
    const value = window.localStorage.getItem('rememberMe');
    if (value) {
      const user = JSON.parse(value);
      // this.requestOptions.headers.set('Authorization', `Bearer ${user.token}`);
      this.userEvents.next(user);
    }
  }

  logout() {
    this.userEvents.next(null);
    window.localStorage.removeItem('rememberMe');
    // this.requestOptions.headers.delete('Authorization');
  }

  isAdmin(): boolean {
    console.log(this.userEvents.getValue());
    return false;
    /*if (this.userEvents.getValue() && this.userEvents.getValue().roles.indexOf('admin') !== -1) {
      return true;
    } else {
      return false;
    }*/
  }
}
