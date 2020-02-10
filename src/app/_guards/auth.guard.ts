import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';

import { Observable, interval, of } from 'rxjs';

import { environment } from '../../environments/environment';

import { SsoService } from '../_services/sso.service';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  private readonly refreshInterval: number  = environment.sso.refreshInterval;
  private readonly unsetTokenValue: string  = environment.app.unsetTokenValue;
  private readonly absoluteBaseUrl: string  = environment.app.absoluteBaseUrl;

  constructor(private ssoService: SsoService,
              private routerService: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Get the token form localStorage
    const token = this.ssoService.getToken();

    if (token == null || token === this.unsetTokenValue) {
      // First access to the app, the token hasn't been retrieved yet
      return this.ssoService.getIdentity().pipe(
        map(identity => {
          if (identity && identity.token) {
            this.ssoService.setToken(identity.token);
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
        }, error => {
          // Navigate to the login page
          this.routerService.navigate(['/login'], {
            queryParams: {
              redirectUrl: next.routeConfig.path
            }
          });
          return false;
        }), catchError(error => {
          // Navigate to the login page
          this.routerService.navigate(['/login'], {
            queryParams: {
              redirectUrl: next.routeConfig.path
            }
          });
          return of(false);
        })
      );
    } else if (token) {
      // We've got a token which should always be fresh so return true (grant access)
      return true;
    }
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Get the token form localStorage
    const token = this.ssoService.getToken();

    if (token == null || token === this.unsetTokenValue) {
      // First access to the app, the token hasn't been retrieved yet
      return this.ssoService.getIdentity().pipe(
        map(identity => {
          if (identity && identity.token) {
            this.ssoService.setToken(identity.token);
            return true;
          } else {
            // Navigate to the login page
            this.routerService.navigate(['/login']);
            return false;
          }
        }, error => {
          // Navigate to the login page
          this.routerService.navigate(['/login']);
          return false;
        }), catchError(error => {
          // Navigate to the login page
          this.routerService.navigate(['/login']);
          return of(false);
        })
      );
    } else if (token) {
      // We've got a token which should always be fresh so return true (grant access)
      return true;
    }
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return true;
  }
}
