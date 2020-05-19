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
      // We've got a token which should always be fresh
      return this.userService.isAdmin();
    }
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
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
      // We've got a token which should always be fresh
      return this.userService.isAdmin();
    }
  }
}
