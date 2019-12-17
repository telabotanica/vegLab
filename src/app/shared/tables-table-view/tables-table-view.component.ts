import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { EsTableModel } from 'src/app/_models/es-table.model';

@Component({
  selector: 'vl-tables-table-view',
  templateUrl: './tables-table-view.component.html',
  styleUrls: ['./tables-table-view.component.scss']
})
export class TablesTableViewComponent implements OnInit {
  @ViewChild('TablesPaginator') paginator: MatPaginator;

  @Input()  count: number;
  @Input()  size: number;
  @Input()  pageIndex: number;
  @Input()  tables: Array<EsTableModel> = [];
  @Input()  isLoading: boolean;
  @Input()  displayedColumns: Array<string> = ['id', 'custom_col_validation', 'dateCreated', 'custom_col_actions'];
  @Output() pageChange: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  @Output() previewTable: EventEmitter<EsTableModel> = new EventEmitter<EsTableModel>();
  @Output() deleteTable: EventEmitter<EsTableModel> = new EventEmitter<EsTableModel>();

  constructor() { }

  ngOnInit() {
  }

  getLocality(table: EsTableModel): string {
    return '?';
  }

  _pageChange(pageEvent: PageEvent): void {
    this.pageChange.next(pageEvent);
  }

  previewTableAction(table: EsTableModel): void {
    this.previewTable.next(table);
  }

  deleteTableAction(table: EsTableModel): void {
    this.deleteTable.next(table);
  }

}
