import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { PhytoAppPageComponent } from '../wsPhyto/phyto-app-page/phyto-app-page.component';

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateTableGuard implements CanDeactivate<PhytoAppPageComponent> {
  canDeactivate(
    component: PhytoAppPageComponent,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    const actions = component.tableService.currentActions.getValue();

    if (actions == null || actions.length === 0) {
      return true;
    } else {
      return component.dialogService.confirmTableRouteDeactivate('La tableau courant n\'est pas sauvegardé. Voulez-vous quitter la page ?');
    }
  }
}
