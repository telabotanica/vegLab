import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from '../_services/user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanActivateChild {

  constructor(private userService: UserService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
    const isAdmin: boolean = this.userService.isAdmin();
    // @TODO if not admin redirect to previous page or to login page
    return isAdmin;
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
    const isAdmin: boolean = this.userService.isAdmin();
    // @TODO if not admin redirect to previous page or to login page
    return isAdmin;
  }
}
