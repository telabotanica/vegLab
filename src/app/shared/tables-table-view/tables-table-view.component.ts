import { Component, OnInit, ViewChild, Input, Output, EventEmitter, OnDestroy } from '@angular/core';

import { TableService } from 'src/app/_services/table.service';

import { EsTableModel } from 'src/app/_models/es-table.model';

import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatCheckboxChange } from '@angular/material';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

@Component({
  selector: 'vl-tables-table-view',
  templateUrl: './tables-table-view.component.html',
  styleUrls: ['./tables-table-view.component.scss']
})
export class TablesTableViewComponent implements OnInit, OnDestroy {
  @ViewChild('TablesPaginator') paginator: MatPaginator;

  @Input()  count: number;
  @Input()  size: number;
  @Input()  pageIndex: number;
  @Input()  set tables(value: Array<EsTableModel>) {
    if (value !== null) {
      this._tables = _.clone(value);
      this.setTablesAlreadyInCurrentTable();
      this.restoreSelection();
    }
  }
  @Input()  isLoading: boolean;
  @Input()  selectable: boolean;
  @Input()  deleteOption = false;
  @Input()  displayedColumns: Array<string> = ['custom_col_selectable', 'id', 'custom_col_validation', 'dateCreated', 'custom_col_actions'];
  @Output() pageChange: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  @Output() previewTable: EventEmitter<EsTableModel> = new EventEmitter<EsTableModel>();
  @Output() deleteTable: EventEmitter<EsTableModel> = new EventEmitter<EsTableModel>();
  @Output() selectedTables = new EventEmitter<Array<number>>();

  _tables: Array<EsTableModel> = [];
  _selectedTables: Array<number> = [];
  currentTableChangeSubscription: Subscription;
  _tablesIdsInCurrentTable: Array<number> = [];

  constructor(private tableService: TableService) { }

  ngOnInit() {
    // Get current table & set it's id to _tablesIdsInCurrentTable
    const currentTable = this.tableService.getCurrentTable();
    if (this.tableService.isTableEmpty(currentTable)) {
      // Current table is empty OR no current table (should not happen)
      this._tablesIdsInCurrentTable = [];
    } else {
      this._tablesIdsInCurrentTable = currentTable.id !== null ? [currentTable.id] : [];
      this.setTablesAlreadyInCurrentTable();
    }
    // Subscribe to table change
    this.currentTableChangeSubscription = this.tableService.currentTableChanged.subscribe(
      currentTableHasChanged => {
        if (currentTableHasChanged === true) {
          const newCurrentTable = this.tableService.getCurrentTable();
          this._tablesIdsInCurrentTable = newCurrentTable && newCurrentTable.id ? [newCurrentTable.id] : [];
          this.setTablesAlreadyInCurrentTable();
        }
      },
      error => { /* @TODO manage error */ }
    );
  }

  ngOnDestroy() {
    if (this.currentTableChangeSubscription) { this.currentTableChangeSubscription.unsubscribe(); }
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
    if (!this.deleteOption) { return; }
    this.deleteTable.next(table);
  }

  tableSelectedChange(table: EsTableModel, event: MatCheckboxChange): void {
    if (event.checked) {
      this.addTablesToSelection([table]);
    } else {
      this.removeTablesToSelection([table]);
    }
  }

  tablesAllSelectedChange(event: MatCheckboxChange): void {
    if (event.checked) {
      // select all
      for (const table of this._tables) { table.selected = true; }
      this.addTablesToSelection(this._tables);
    } else {
      // unselect all
      for (const table of this._tables) { table.selected = false; }
      this.removeTablesToSelection(this._tables);
    }
  }

  /**
   * Add tables ids to _selectedTables array
   * And emit values
   */
  addTablesToSelection(tables: Array<EsTableModel>): void {
    if (tables !== null && tables.length > 0) {
      tables.forEach(table => {
        // Avoid duplicate selection
        if (_.find(this._selectedTables, st => st === table.id)) { /* Already selected */ return; }
        if (table.id) { this._selectedTables.push(table.id); } else { /* No id ? */ return; }
      });
    }
    // Emit selection
    this.selectedTables.next(this._selectedTables);
  }

  /**
   * Remove tables ids to _selectedTables array
   * And emit values
   */
  removeTablesToSelection(tables: Array<EsTableModel>): void {
    if (tables !== null && tables.length > 0) {
      tables.forEach(table => {
        _.remove(this._selectedTables, st => st === table.id);
      });
    }
    // Emit selection
    this.selectedTables.next(this._selectedTables);
  }

  /**
   * Is one of the tables result already the current table ?
   */
  private setTablesAlreadyInCurrentTable(): void {
    for (const tab of this._tables) {
      tab.isCurrentTable = false;
      if (_.find(this._tablesIdsInCurrentTable, idInTable => tab.id && tab.id === idInTable)) {
        tab.isCurrentTable = true;
      }
    }
  }

  /**
   * Restore the selected elements after page change (new request = new Input tables)
   */
  restoreSelection(): void {
    this._selectedTables.forEach(st => {
      const tableThatShouldBeSelected = _.find(this._tables, tab => tab.id && tab.id === st);
      if (tableThatShouldBeSelected) { tableThatShouldBeSelected.selected = true; }
    });
  }

}
