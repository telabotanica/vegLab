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
      // Do we have a refresh token in local storage
      if (this.ssoService.isRefreshTokenSet()) {
        const refreshToken = this.ssoService.getRefreshToken();
        if (refreshToken !== null) {
          return this.ssoService.refreshToken(refreshToken).pipe(
            map(response => {
              if (response['access_token'] && response['refresh_token']) {
                // Ok, we've got a token,
                // Set token and refresh token to the SSO service
                this.ssoService.currentToken.next(response['access_token']);
                this.ssoService.currentRefreshToken.next(response['refresh_token']);
                // And refresh the token periodically
                this.ssoService.alwaysRefreshToken();
              }
              return true;
            }, error => {
              console.log('error ', error);
              // Navigate to the login page
              this.routerService.navigate(['/login'], {
                queryParams: {
                  redirectUrl: next.routeConfig.path
                }
              });
              return false;
            }),
            map(response => response)
          );
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

    return this.canActivate(next, state);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return true;
  }
}
