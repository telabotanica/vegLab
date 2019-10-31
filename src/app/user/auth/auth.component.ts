import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService } from '../../_services/user.service';
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

  user: UserModel;
  userEventsSubscription: Subscription;

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
    this.userEventsSubscription = this.userService.userEvents.subscribe(user => this.user = user);
  }

  ngOnDestroy() {
    if (this.userEventsSubscription) { this.userEventsSubscription.unsubscribe(); }
  }

  authAsUser() {
    this.userService.authenticate('user').subscribe();
  }

  authAsAdmin() {
    this.userService.authenticate('admin').subscribe();
  }

  logout() {
    this.userService.logout();
  }

  isAdmin(): boolean {
    return this.userService.isAdmin();
  }

}
