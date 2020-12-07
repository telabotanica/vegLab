import { Injectable, Injector } from '@angular/core';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { of } from 'rxjs';
import * as StackTraceParser from 'error-stack-parser';

import { UserModel } from '../_models/user.model';

import { UserService } from 'src/app/_services/user.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private injector: Injector, private userService: UserService) { }

  log(error) {
    console.error(error);
    const errorToSend = this.addContextInfo(error);
    // return httpService.post(errorToSend);
    return of(errorToSend);
  }

  addContextInfo(error) {
    const currentUser = this.userService.currentUser.getValue();

    const name = error.name || null;
    const appId = 'VL';
    const userId = currentUser ? currentUser.id : 'null';
    const userName = currentUser ? this.userService.getUserName() : null;
    const time = new Date().getTime();
    const id = currentUser ? `${appId}-${currentUser.id}-${time}` : `${appId}-notLogged-${time}`;
    const location = this.injector.get(LocationStrategy);
    const url = location instanceof PathLocationStrategy ? location.path() : '';
    const status = error.status || null;
    const message = error.message || error.toString();
    const stack = error instanceof HttpErrorResponse ? null : StackTraceParser.parse(error);

    const errorToSend = {name, appId, userId, userName, time, id, url, status, message, stack};
    return errorToSend;

  }
}
