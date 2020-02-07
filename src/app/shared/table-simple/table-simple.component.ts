import { Component, OnInit, OnDestroy } from '@angular/core';

import { TableRow } from 'src/app/_models/table-row-definition.model';

import { TableService } from 'src/app/_services/table.service';

import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'vl-table-simple',
  templateUrl: './table-simple.component.html',
  styleUrls: ['./table-simple.component.scss']
})
export class TableSimpleComponent implements OnInit, OnDestroy {

  currentDataView: Array<TableRow> = null;

  // VAR subscribers
  currentTableSubscription: Subscription;

  constructor(private tableService: TableService) { }

  ngOnInit() {
    // Subscribe to current table changes
    this.currentTableSubscription = this.tableService.tableDataView.subscribe(dataView => {
      this.currentDataView = _.clone(dataView);
    });
  }

  ngOnDestroy() {
    if (this.currentTableSubscription) { this.currentTableSubscription.unsubscribe(); }
  }

}
