import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';

import { UserService } from '../_services/user.service';
import { SsoService } from '../_services/sso.service';

import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanActivateChild {
  private readonly unsetTokenValue: string  = environment.app.unsetTokenValue;

  constructor(private userService: UserService,
              private ssoService: SsoService,
              private routerService: Router) { }

  canActivate(next: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const isAdmin =  this.userService.isAdmin();

    if (isAdmin) {
      return true;
    } else {
      this.routerService.navigate(['/login'], {
        queryParams: {
          redirectUrl: next.routeConfig.path
        }
      });
      return false;
    }
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
    const isAdmin =  this.userService.isAdmin();

    if (isAdmin) {
      return true;
    } else {
      this.routerService.navigate(['/login'], {
        queryParams: {
          redirectUrl: childRoute.routeConfig.path
        }
      });
      return false;
    }
  }
}
