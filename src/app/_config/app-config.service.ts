import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  // Table view : `edit` view is for an editable table (handsontable), `view` only show table as an HTML `<table>`
  tableView = new BehaviorSubject<'edit' | 'view'>('edit');

  constructor() { }

  setTableViewable() {
    this.tableView.next('view');
  }

  setTableEditable() {
    this.tableView.next('edit');
  }
}
