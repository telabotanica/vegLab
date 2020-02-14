import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor() { }

  /**
   * Ask user to confirm an action. `message` explains the action and choices.
   * Returns observable resolving to `true`=confirm or `false`=cancel
   */
  confirmTableRouteDeactivate(message?: string): Observable<boolean> {
    const confirmation = window.confirm(message || 'Continuer ?');
    return of(confirmation);
  }
}
