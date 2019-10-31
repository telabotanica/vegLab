import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  menu = new BehaviorSubject<{label: string, path?: string, children?: Array<{label: string, path: string}>}>(undefined);

  constructor() { }

  setMenu(data) {
    this.menu.next(data);
  }
}
