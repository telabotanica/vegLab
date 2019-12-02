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

  userSubscriber: Subscription;
  currentUser: UserModel = null;

  constructor(private userService: UserService,
              private router: Router) { }

  ngOnInit() {
    this.userSubscriber = this.userService.currentUser.subscribe(
      user => {
        this.currentUser = user;
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

  isAdmin(): boolean {
    return this.userService.isAdmin();
  }

  getUserName(): string {
    if (this.currentUser) {
      return this.currentUser.pseudoUtilise ? this.currentUser.pseudo : this.currentUser.prenom + ' ' + this.currentUser.nom;
    } else {
      return null;
    }
  }

}
