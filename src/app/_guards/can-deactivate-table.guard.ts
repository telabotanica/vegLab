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
    state: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    const isTableDirty = component.tableService.isTableDirty.getValue();

    if (isTableDirty === false) {
      return true;
    } else {
      return component.dialogService.confirmTableRouteDeactivate('La tableau courant n\'est pas sauvegardé. Voulez-vous quitter la page ?');
    }
  }
}
