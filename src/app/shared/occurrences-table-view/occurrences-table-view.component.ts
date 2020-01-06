import { Component, OnInit, Input, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// import { OccurrenceModel as EsOccurrenceModel } from 'src/app/_models/occurrence.model';
import { MatCheckboxChange } from '@angular/material';

import { EsOccurrenceModel } from 'src/app/_models/es-occurrence-model';

import { TableService } from 'src/app/_services/table.service';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';


@Component({
  selector: 'vl-occurrences-table-view',
  templateUrl: './occurrences-table-view.component.html',
  styleUrls: ['./occurrences-table-view.component.scss']
})
export class OccurrencesTableViewComponent implements OnInit, OnDestroy {
  @ViewChild('OccurrencesPaginator') paginator: MatPaginator;

  @Input()  count: number;
  @Input()  size: number;
  @Input()  pageIndex: number;
  @Input() set occurrences(value: Array<EsOccurrenceModel>) {
    if (value !== null) {
      this._occurrences = _.clone(value);
      this.setOccurrencesAlreadyInTableValues();
      this.restoreSelection();
    }
  }
  @Input() set orderedOccurrences(value: Array<{occurrence: {occurrence: EsOccurrenceModel, score?: number}, childOccurrences?: Array<{occurrence: EsOccurrenceModel, score?: number}>}>) {
    // Manage ordered occurrences
    const occ: Array<EsOccurrenceModel> = [];
    if (value !== null) {
      // Flatten ordered occurrences
      for (const v of value) {
        if (v.occurrence) {
          occ.push(v.occurrence.occurrence);
          if (v.childOccurrences && v.childOccurrences.length > 0) {
            for (const c of v.childOccurrences) {
              c.occurrence.isChildrenOf = v.occurrence.occurrence.id ? v.occurrence.occurrence.id : null;
              occ.push(c.occurrence);
            }
          }
        }
      }
      this._occurrences = _.clone(occ);
      this.setOccurrencesAlreadyInTableValues();
      this.restoreSelection();
    }
  }
  @Input()  isLoading: boolean;
  @Input()  displayedColumns: Array<string> = ['custom_col_selectable', 'id', 'level', 'layer', 'custom_col_validation', 'dateObserved', 'locality', 'vlLocationAccuracy', 'custom_col_actions'];
  @Input()  selectable = false;
  @Output() pageChange: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  @Output() previewOccurrence: EventEmitter<EsOccurrenceModel> = new EventEmitter<EsOccurrenceModel>();
  @Output() deleteOccurrence: EventEmitter<EsOccurrenceModel> = new EventEmitter<EsOccurrenceModel>();
  @Output() selectedOccurrences = new EventEmitter<Array<number>>();

  _occurrences: Array<EsOccurrenceModel> = [];
  _selectedOccurrences: Array<number> = [];
  occurrencesIdsInCurrentTableSubscription: Subscription;
  _occurrencesIdsInCurrentTable: Array<number> = [];

  constructor(private tableService: TableService) { }

  ngOnInit() {
    // Get table occurrences ids
    this._occurrencesIdsInCurrentTable = this.tableService.currentTableOccurrencesIds.getValue();
    this.setOccurrencesAlreadyInTableValues();
    // Subscribe to table occurrences ids change
    this.occurrencesIdsInCurrentTableSubscription = this.tableService.currentTableOccurrencesIds.subscribe(
      ids => {
        this._occurrencesIdsInCurrentTable = _.clone(ids);
        this.setOccurrencesAlreadyInTableValues();
      },
      error => { /* @TODO manage error */ }
    );
  }

  ngOnDestroy() {
    if (this.occurrencesIdsInCurrentTableSubscription) { this.occurrencesIdsInCurrentTableSubscription.unsubscribe(); }
  }

  getValidation(occurrence: EsOccurrenceModel): string {
    if (occurrence && occurrence.validations && occurrence.validations.length > 0) {
      return occurrence.validations[0].validatedName;
    } else {
      return '?';
    }
  }

  getLocality(occurrence: EsOccurrenceModel): string {
    if (occurrence && occurrence.locality) {
      return occurrence.locality;
    } else {
      return '?';
    }
  }

  getLayer(occurrence: EsOccurrenceModel): string {
    return occurrence.layer ? occurrence.layer : null;
  }

  _pageChange(pageEvent: PageEvent): void {
    this.pageChange.next(pageEvent);
  }

  /**
   * Action : Preview occurrence
   */
  previewOccurrenceAction(occurrence: EsOccurrenceModel): void {
    this.previewOccurrence.next(occurrence);
  }

  /**
   * Action : Delete occurrence
   */
  deleteOccurrenceAction(occurrence: EsOccurrenceModel): void {
    this.deleteOccurrence.next(occurrence);
  }

  /**
   * Is occurrence id is in _selectedOccurrences array ?
   */
  isOccurrenceSelected(occurrence: EsOccurrenceModel): boolean {
    return occurrence.selected;
  }

  /**
   * Restore the selected elements after page change (new request = new Input occurrences)
   */
  restoreSelection(): void {
    this._selectedOccurrences.forEach(so => {
      const occurrenceThatShouldBeSelected = _.find(this._occurrences, occ => occ.id && occ.id === so);
      if (occurrenceThatShouldBeSelected) { occurrenceThatShouldBeSelected.selected = true; }
    });
  }

  /**
   * One occurrence has been (un)selected
   */
  occurrenceSelectedChange(occurrence: EsOccurrenceModel, event: MatCheckboxChange): void {
    if (event.checked) {
      this.addOccurrencesToSelection([occurrence]);
    } else {
      this.removeOccurrencesToSelection([occurrence]);
    }
  }

  /**
   * All occurrences have be (un)selected
   */
  occurrencesAllSelectedChange(event: MatCheckboxChange): void {
    if (event.checked) {
      // select all
      for (const occ of this._occurrences) { occ.selected = true; }
      this.addOccurrencesToSelection(this._occurrences);
    } else {
      // unselect all
      for (const occ of this._occurrences) { occ.selected = false; }
      this.removeOccurrencesToSelection(this._occurrences);
    }
  }

  /**
   * Add occurrences ids to _selectedOccurrences array
   * And emit values
   */
  addOccurrencesToSelection(occurrences: Array<EsOccurrenceModel>): void {
    if (occurrences !== null && occurrences.length > 0) {
      // this._selectedOccurrences.push(occurrence.id);
      occurrences.forEach(occ => {
        // Avoid duplicate selection
        if (_.find(this._selectedOccurrences, so => so === occ.id)) { /* Already selected */ return; }
        if (occ.id) { this._selectedOccurrences.push(occ.id); } else { /* No id ? */ return; }
      });
    }
    // Emit selection
    this.selectedOccurrences.next(this._selectedOccurrences);
  }

  /**
   * Remove occurrences ids to _selectedOccurrences array
   * And emit values
   */
  removeOccurrencesToSelection(occurrences: Array<EsOccurrenceModel>): void {
    if (occurrences !== null && occurrences.length > 0) {
      occurrences.forEach(occ => {
        _.remove(this._selectedOccurrences, so => so === occ.id);
      });
    }
    // Emit selection
    this.selectedOccurrences.next(this._selectedOccurrences);
  }

  /**
   * Are occurrences already in current table ?
   */
  private setOccurrencesAlreadyInTableValues(): void {
    for (const occ of this._occurrences) {
      if (_.find(this._occurrencesIdsInCurrentTable, idInTable => occ.id && occ.id === idInTable)) {
        occ.isInCurrentTable = true;
        if (occ.parentId) {
          // Set parent hasChildInCurrentTable
          const parent = _.find(this._occurrences, o => o.id === occ.parentId);
          if (parent) { parent.hasChildInCurrentTable = true; }
        }
      }
    }
  }

}
