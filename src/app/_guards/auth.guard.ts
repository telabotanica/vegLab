import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';

import { Observable, interval, of } from 'rxjs';

import { environment } from '../../environments/environment';

import { SsoService } from '../_services/sso.service';
import { UserService } from '../_services/user.service';

import { map, catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  private readonly refreshInterval: number  = Number(environment.sso.refreshInterval);
  private readonly unsetTokenValue: string  = environment.app.unsetTokenValue;
  private readonly absoluteBaseUrl: string  = environment.app.absoluteBaseUrl;

  constructor(private ssoService: SsoService,
              private userService: UserService,
              private routerService: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Get the current user
    const cu = this.userService.currentUser.getValue();

    if (cu !== null) {
      return true;
    } else {
      // Navigate to the login page
      this.routerService.navigate(['/login'], {
        queryParams: {
          redirectUrl: next.routeConfig.path
        }
      });
      return false;
    }
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Get the current user
    const cu = this.userService.currentUser.getValue();

    if (cu !== null) {
      return true;
    } else {
      // Navigate to the login page
      this.routerService.navigate(['/login'], {
        queryParams: {
          redirectUrl: next.routeConfig.path
        }
      });
      return false;
    }
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return true;
  }
}
