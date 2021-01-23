import { Component, OnInit, OnDestroy, Input, Output, ChangeDetectionStrategy, EventEmitter } from '@angular/core';


import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { OccurrenceValidationModel } from 'src/app/_models/occurrence-validation.model';

import { TableService } from 'src/app/_services/table.service';
import { ValidationService } from 'src/app/_services/validation.service';

import { OccurrenceValidationsPreviewComponent } from '../occurrence-overview/occurrence-validations-preview/occurrence-validations-preview.component';

import * as _ from 'lodash';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'vl-occurrences-inline',
  templateUrl: './occurrences-inline.component.html',
  styleUrls: ['./occurrences-inline.component.scss']
})
export class OccurrencesInlineComponent implements OnInit, OnDestroy {
  @Input() set orderedOccurrences(value: Array<{occurrence: {occurrence: OccurrenceModel, score?: number, selected?: boolean, isInCurrentTable?: boolean, hasChildInCurrentTable?: boolean}, childOccurrences?: Array<{occurrence: OccurrenceModel, score?: number, selected?: boolean, isInCurrentTable?: boolean, disabled?: boolean}>}>) {
    _.map(value, v => v.childOccurrences && v.childOccurrences.length > 0 ? _.forEach(v.childOccurrences, vco => vco.disabled = false) : null);
    this._orderedOccurrences = value;
    this.orderedOccurrencesHaveChildren = this.isThereChildOccurrences();
    this.setOccurrencesAlreadyInTableValues();
  }

  @Output() selectedOccurrences = new EventEmitter<Array<number>>();

  _orderedOccurrences : Array<{occurrence: {occurrence: OccurrenceModel, score?: number, selected?: boolean, isInCurrentTable?: boolean, hasChildInCurrentTable?: boolean}, childOccurrences?: Array<{occurrence: OccurrenceModel, score?: number, selected?: boolean, isInCurrentTable?: boolean, disabled?: boolean}>}> = [];
  orderedOccurrencesHaveChildren = false;
  _occurrencesIdsInCurrentTable: Array<number> = [];
  occurrencesIdsInCurrentTableSubscription: Subscription;

  constructor(private tableService: TableService, private validationService: ValidationService) { }

  ngOnInit() {
    this.occurrencesIdsInCurrentTableSubscription = this.tableService.currentTableOccurrencesIds.subscribe(
      ids => {
        this._occurrencesIdsInCurrentTable = ids;
        this.setOccurrencesAlreadyInTableValues();
      },
      error => { /* @TODO manage error */ }
    );
  }

  ngOnDestroy() {
    if (this.occurrencesIdsInCurrentTableSubscription) { this.occurrencesIdsInCurrentTableSubscription.unsubscribe(); }
  }

  private isThereChildOccurrences(): boolean {
    for (const item of this._orderedOccurrences) {
      if (item.childOccurrences) { return true; }
    }
  }

  public getObserversPreview(occurrence: OccurrenceModel): string {
    if (occurrence && occurrence.vlObservers && occurrence.vlObservers.length > 0) {
      const vlObservers = occurrence.vlObservers;
      const mainObserver = vlObservers[0].name;
      const countOtherObservers = vlObservers.length - 1;
      let otherObserversStr: string;

      if (countOtherObservers === 1) {
        otherObserversStr = ' +1 autre';
      } else if (countOtherObservers > 1) {
        otherObserversStr = ` +${countOtherObservers} autres`;
      }
      return otherObserversStr ? mainObserver + otherObserversStr : mainObserver;
    } else {
      return '?';
    }
  }

  public occurrenceWithoutChildrenSelectedChange() {
    this.emitSelectedOccurrences();
  }

  public occurrenceParentSelectedChange(id: number) {
    for (const item of this._orderedOccurrences) {
      // if parent occurrence is selected (checked)
      // push parent occurrence id
      // check and diable children occurrences
      if (item.occurrence.selected) {
        if (item.occurrence.occurrence.id === id && item.childOccurrences) {
          for (const childItem of item.childOccurrences) { childItem.selected = true; childItem.disabled = true; }
        }
      } else {
        // enable children occurrences
        if (item.occurrence.occurrence.id === id && item.childOccurrences && item.childOccurrences.length > 0) {
          for (const childItem of item.childOccurrences) { childItem.selected = false; childItem.disabled = false; }
        }
      }
    }
    this.emitSelectedOccurrences();
  }

  public occurrenceChildSelectedChange(id: number) {
    this.emitSelectedOccurrences();
  }

  public allOccurrencesSelectedChange(value: boolean): void {
    if (value) {
      this.selectAllOccurrences();
    } else {
      this.unSelectAllOccurrences();
    }
  }

  private selectAllOccurrences(): void {
    for (const item of this._orderedOccurrences) {
      item.occurrence.selected = item.occurrence.isInCurrentTable || item.occurrence.hasChildInCurrentTable ? item.occurrence.selected : true;
      if (item.childOccurrences) {
        for (const childItem of item.childOccurrences) {
          childItem.selected = childItem.isInCurrentTable ? childItem.selected : true;
          childItem.disabled = childItem.disabled ? childItem.disabled : true;
        }
      }
    }
    this.emitSelectedOccurrences();
  }

  private unSelectAllOccurrences(): void {
    for (const item of this._orderedOccurrences) {
      item.occurrence.selected = item.occurrence.isInCurrentTable || item.occurrence.hasChildInCurrentTable ? item.occurrence.selected : false;
      if (item.childOccurrences) {
        for (const childItem of item.childOccurrences) {
          childItem.selected = childItem.isInCurrentTable ? childItem.selected : false;
          childItem.disabled = childItem.isInCurrentTable ? childItem.disabled : false;
        }
      }
    }
    this.emitSelectedOccurrences();
  }

  private emitSelectedOccurrences(): void {
    const selectedOccurrences: Array<number> = [];
    for (const item of this._orderedOccurrences) {
      if (!item.childOccurrences || item.childOccurrences && item.childOccurrences.length === 0) {
        // no children
        if (item.occurrence.selected) { selectedOccurrences.push(item.occurrence.occurrence.id); }
      } else {
        // children
        if (item.occurrence.selected) {
          selectedOccurrences.push(item.occurrence.occurrence.id);
        } else {
          // parent is not selected. children ?
          if (item.childOccurrences && item.childOccurrences.length > 0) {
            for (const childItem of item.childOccurrences) {
              if (childItem.selected) { selectedOccurrences.push(childItem.occurrence.id); }
            }
          }
        }
      }
    }

    this.selectedOccurrences.next(selectedOccurrences);
  }

  private setOccurrencesAlreadyInTableValues(): void {
    for (const occ of this._orderedOccurrences) {
      if (occ.childOccurrences && occ.childOccurrences.length > 0) {
        for (const childOcc of occ.childOccurrences) {
          if (_.find(this._occurrencesIdsInCurrentTable, idInTable => childOcc.occurrence.id === idInTable)) {
            occ.occurrence.hasChildInCurrentTable = true;
            childOcc.isInCurrentTable = true;
            childOcc.selected = true;
          }
        }
      }
      if (_.find(this._occurrencesIdsInCurrentTable, idInTable => occ.occurrence.occurrence.id === idInTable)) {
        occ.occurrence.isInCurrentTable = true;
        occ.occurrence.selected = true;
      }
    }
  }

  public getPreferedValidation(occurrence: OccurrenceModel): OccurrenceValidationModel {
    return this.validationService.getPreferedValidation(occurrence);
  }

}
