import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { TableService } from '../../../_services/table.service';
import { RepositoryService } from 'tb-tsb-lib';

import { TableRowDefinition } from 'src/app/_models/table-row-definition.model';
import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { Sye } from 'src/app/_models/sye.model';

import * as _ from 'lodash';
import { Level } from 'src/app/_enums/level-enum';

@Component({
  selector: 'vl-table-selected-element',
  templateUrl: './table-selected-element.component.html',
  styleUrls: ['./table-selected-element.component.scss']
})
export class TableSelectedElementComponent implements OnInit, OnDestroy {
  tableSelectionSubscriber: Subscription;

  elementType: 'row' | 'column' | 'syntheticColumn' | 'groupTitle' | 'groupName' | 'occurrenceValue' | 'syntheticValue' = null;
  elementTypeDisplay: string = null;

  // Row elements to show
  rowElements: Array<{
    rowRepo: string,
    rowName: string,
    rowValidName: string,
    rowIdiotaxonFamily: string,
    rowIdiotaxonGenus: string
  }> = [];

  // Column elements to show
  columnElements: Array<OccurrenceModel> = [];

  // Sye to show (selected synthetic column)
  syeElement: Sye = null;

  constructor(private tableService: TableService, private repoService: RepositoryService) { }

  ngOnInit() {
    this.tableSelectionSubscriber = this.tableService.tableSelectionElement.subscribe(selectedElement => {
      if (selectedElement === null) { return; } // null element may be send
      this.elementType = null;
      this.elementTypeDisplay = null;
      this.rowElements = [];
      this.columnElements = [];
      this.syeElement = null;

      if (selectedElement.element === 'row') {
        // row
        this.elementType = 'row';
        this.elementTypeDisplay = 'Ligne';
        if (!selectedElement.multipleSelection) {
          // one row selected
          if (selectedElement.rowId) {
            const rowOccurrence = this.tableService.getRowOccurrenceByRowId(selectedElement.startPosition);
            this.rowElements.push({
              rowRepo: rowOccurrence.repository,
              rowName: rowOccurrence.displayName,
              rowValidName: null,
              rowIdiotaxonFamily: null,
              rowIdiotaxonGenus: null
            });
          }
        } else {
          // several rows selected
          const rowOccurences: Array<TableRowDefinition> = [];
          const iterations = selectedElement.endPosition - selectedElement.startPosition + 1;
          for (let index = 0; index < iterations; index++) {
            rowOccurences.push(this.tableService.getRowOccurrenceByRowId(selectedElement.startPosition + index));
          }
          for (const rowOccurrence of rowOccurences) {
            this.rowElements.push({
              rowRepo: rowOccurrence.repository,
              rowName: rowOccurrence.displayName,
              rowValidName: null,
              rowIdiotaxonFamily: null,
              rowIdiotaxonGenus: null
            });
          }
        }
      } else if (selectedElement.element === 'column') {
        // column
        if (selectedElement.occurrenceIds.length > 0 && selectedElement.occurrenceIds[0] !== null) {
          this.elementType = 'column';
          this.elementTypeDisplay = 'Colonne';
          for (const occurrenceId of selectedElement.occurrenceIds) {
            const occurrence = this.tableService.getReleveById(occurrenceId);
            if (occurrence) { this.columnElements.push(occurrence); }
          }
        } else if (selectedElement.occurrenceIds.length === 0 || selectedElement.occurrenceIds[0] == null) {
          this.elementType = 'syntheticColumn';
          this.elementTypeDisplay = 'Colonne synthétique';
          this.syeElement = this.tableService.getSyeById(this.tableService.getCurrentTable(), selectedElement.syeId);
        }
      } else if (selectedElement.element === 'groupTitle') {
        // row definition group title
        this.elementType = 'groupTitle';
        this.elementTypeDisplay = 'Titre du groupe de taxons';
        if (!selectedElement.multipleSelection) {
          // one title group selected
        } else {
          // several titles groups selected
        }
      } else if (selectedElement.element === 'groupName') {
        // row definition cell item (taxon / syntaxon name)
        this.elementType = 'groupName';
        this.elementTypeDisplay = 'Taxon';
        if (!selectedElement.multipleSelection) {
          // one name group selected
        } else {
          // several names groups selected
        }
      } else if (selectedElement.element === 'occurrenceValue') {
        // coef cell
        this.elementType = 'occurrenceValue';
        this.elementTypeDisplay = 'Coefficient';
        if (!selectedElement.multipleSelection) {
          // one occurrence value (coef) selected
        } else {
          // several occurrences values (coef) selected
        }
      } else if (selectedElement.element === 'syntheticValue') {
        // synthetic value cell
        this.elementType = 'syntheticValue';
        this.elementTypeDisplay = 'Coefficient synthétique';
        if (!selectedElement.multipleSelection) {
          // one synthetic value (synthetic coef) selected
        } else {
          // several synthetics values (synthetics coef) selected
        }
      }
    }, error => {
      // @Todo manage error
    });
  }

  ngOnDestroy() {
    if (this.tableSelectionSubscriber) { this.tableSelectionSubscriber.unsubscribe(); }
  }

  getMicrocenosisSubLevels(occurrence: OccurrenceModel): string {
    const levels: Array<string> = [];
    if (occurrence.level !== Level.MICROCENOSIS) { return; }
    for (const child of occurrence.children) {
      if (child.level) { levels.push(child.level); }
    }
    return levels.toString();
  }

  getOccurrenceVlObservers(occurrence: OccurrenceModel): string {
    if (occurrence && occurrence.vlObservers) {
      const authorStr: Array<string> = [];
      for (const vlObs of occurrence.vlObservers) {
        authorStr.push(vlObs.name);
      }
      return authorStr.toString().replace(',', ', ');
    } else {
      return null;
    }
  }

  getOccurrenceValidation(occurrence: OccurrenceModel): string {
    if (occurrence && occurrence.validations && occurrence.validations.length > 0) {
      return `[${occurrence.validations[0].repository}] ${occurrence.validations[0].validatedName}`;
    } else {
      return 'Relevé non identifié';
    }
  }

  getSyeValidation(sye: Sye): string {
    if (sye && sye.validations && sye.validations.length > 0) {
      return `[${sye.validations[0].repository}] ${sye.validations[0].validatedName}`;
    } else {
      return 'Sye non identifié';
    }
  }

}
