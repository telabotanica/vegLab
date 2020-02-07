import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  // Table view : `edit` view is for an editable table (handsontable), `view` only show table as an HTML `<table>`
  tableView = new BehaviorSubject<'edit' | 'view'>('edit');

  // Is Info panel diasabled
  infoPanelDisabled = new BehaviorSubject<boolean>(false);

  constructor() { }

  setTableViewable(): void {
    this.tableView.next('view');
  }

  setTableEditable(): void {
    this.tableView.next('edit');
  }

  enableInfoPanel(): void {
    this.infoPanelDisabled.next(false);
  }

  disableInfoPanel(): void {
    this.infoPanelDisabled.next(true);
  }
}
