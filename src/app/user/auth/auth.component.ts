import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService } from '../../_services/user.service';
import { SsoService } from 'src/app/_services/sso.service';

import { UserModel } from '../../_models/user.model';

/**
 * @Todo make a smart/dumb component (with @Input user)
 */
@Component({
  selector: 'vl-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, OnDestroy {

  userSubscriber: Subscription;
  currentUser: UserModel = null;
  isAdmin: boolean;

  constructor(private userService: UserService,
              private ssoService: SsoService,
              private router: Router) { }

  ngOnInit() {
    this.userSubscriber = this.userService.currentUser.subscribe(
      user => {
        this.currentUser = user;
        this.isAdmin = this.userService.isAdmin();
      }, error => {
        // @Todo manage error
        // Should logout ?
        console.log(error);
      }
      );
  }

  ngOnDestroy() {
    if (this.userSubscriber) { this.userSubscriber.unsubscribe(); }
  }

  getUserName(): string {
    return this.userService.getUserName();
  }

  login() {
    const redirectUrl = this.router.routerState.snapshot.url;
    this.router.navigate(['/login'], {queryParams: {redirectUrl}});
  }

  logout() {
    this.ssoService.logout();
  }

}
