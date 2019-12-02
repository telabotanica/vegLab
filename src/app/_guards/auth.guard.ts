import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Observable, interval } from 'rxjs';

import { environment } from '../../environments/environment';

import { SsoService } from '../_services/sso.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  private readonly ssoAuthWidgetUrl: string = environment.sso.authWidgetUrl;
  private readonly refreshInterval: number  = environment.sso.refreshInterval;
  private readonly unsetTokenValue: string  = environment.app.unsetTokenValue;
  private readonly absoluteBaseUrl: string  = environment.app.absoluteBaseUrl;

  constructor(private ssoService: SsoService) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {


    // Get the token form localStorage
    const token = this.ssoService.getToken();
    console.log(token);

    if (!token || token === this.unsetTokenValue) {
      return false;
      // First access to the app, the token hasn't been retrieved yet
      this.ssoService.getIdentity().subscribe(
        identity => {
          if (identity && identity.token) {
            this.ssoService.setToken(identity.token);

            // The token expires after 15 minutes. We need to refresh it periodically to always keep it fresh
            interval(this.refreshInterval).subscribe((resp) => { console.log('REFRESHING TOKEN'); this.ssoService.refreshToken(); });

            return true;
          }
        }, error => {
          // Navigate to the login page
          console.log('Please LOGIN');
          return false;
        }
      );
    } else if (token) {
      // We've got a token which should always be fresh so return true (grant access)
      return true;
    }

    // Default
    return false;
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Get the token form localStorage
    const token = this.ssoService.getToken();
    console.log(token);

    if (!token || token === this.unsetTokenValue) {
      return false;
      // First access to the app, the token hasn't been retrieved yet
      this.ssoService.getIdentity().subscribe(
        identity => {
          if (identity && identity.token) {
            this.ssoService.setToken(identity.token);

            // The token expires after 15 minutes. We need to refresh it periodically to always keep it fresh
            interval(this.refreshInterval).subscribe((resp) => { console.log('REFRESHING TOKEN'); this.ssoService.refreshToken(); });

            return true;
          }
        }, error => {
          // Navigate to the login page
          console.log('Please LOGIN');
          return false;
        }
      );
    } else if (token) {
      // We've got a token which should always be fresh so return true (grant access)
      return true;
    }

    // Default
    return false;
  }
  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return true;
  }
}
