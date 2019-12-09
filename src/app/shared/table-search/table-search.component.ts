import { Component, OnInit } from '@angular/core';

import { TableService } from 'src/app/_services/table.service';

import { Table } from 'src/app/_models/table.model';
import { RepositoryItemModel } from 'tb-tsb-lib';

import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { EsTableModel } from 'src/app/_models/es-table.model';
import { trigger, transition, style, animate } from '@angular/animations';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'vl-table-search',
  templateUrl: './table-search.component.html',
  styleUrls: ['./table-search.component.scss'],
  animations: [ // https://medium.com/google-developer-experts/angular-applying-motion-principles-to-a-list-d5cdd35c899e
    trigger('items', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),  // initial
        animate('0.2s cubic-bezier(.8, -0.6, 0.2, 1.5)',
          style({ transform: 'scale(1)', opacity: 1 }))  // final
      ])
    ])
  ]
})
export class TableSearchComponent implements OnInit {
  tables: Array<EsTableModel> = [];

  // VAR Table filters
  tableValidation: RepositoryItemModel = null;
  tableMustBeADiagnosis = false;
  tableMustHaveAPdf = false;

  // VAR Col Occurrence filters
  mustContainColOccurrences: Array<RepositoryItemModel> = [];
  mustNotContainColOccurrences: Array<RepositoryItemModel> = [];

  // VAR Row Occurrence filters
  mustContainRowOccurrences: Array<RepositoryItemModel> = [];
  mustNotContainRowOccurrences: Array<RepositoryItemModel> = [];

  // VAR other
  tbRepositoriesConfig = environment.tbRepositoriesConfig;
  isSearching = false;
  showResultsDiv = true;

  constructor(private tableService: TableService) { }

  ngOnInit() {
  }

  // -------------
  // TABLE FILTERS
  // -------------
  setTableValidationFilter(item: RepositoryItemModel): void {
    this.tableValidation = item;
    this.search();
  }

  removeTableValidationFilter(): void {
    this.tableValidation = null;
    this.search();
  }

  // -----------------------
  // COL OCCURRENCES FILTERS
  // ("relevé" level)
  // -----------------------
  addColOccurrenceToFilter(item: RepositoryItemModel): void {
    if (_.find(this.mustContainColOccurrences, i => i === item )) { return; }
    if (_.find(this.mustNotContainColOccurrences, i => i === item )) { return; }
    this.mustContainColOccurrences.push(item);
    this.search();
  }

  dropColOccurrenceBetweenLists(event: CdkDragDrop<RepositoryItemModel[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
    this.search();
  }

  removeColOccurrenceFromMustContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustContainColOccurrences.forEach(item => {
      if (item === itemToRemove) { this.mustContainColOccurrences.splice(i, 1); }
      i++;
    });
    this.search();
  }

  removeColOccurrenceFromMustNotContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustNotContainColOccurrences.forEach(item => {
      if (item === itemToRemove) { this.mustNotContainColOccurrences.splice(i, 1); }
      i++;
    });
    this.search();
  }

  // -----------------------
  // ROW OCCURRENCES FILTERS
  // "specie" level
  // -----------------------
  addRowOccurrenceToFilter(item: RepositoryItemModel): void {
    console.log(item);
    if (_.find(this.mustContainRowOccurrences, i => i === item )) { return; }
    if (_.find(this.mustNotContainRowOccurrences, i => i === item )) { return; }
    this.mustContainRowOccurrences.push(item);
    console.log(item);
    this.search();
  }

  dropRowOccurrenceBetweenLists(event: CdkDragDrop<RepositoryItemModel[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
    this.search();
  }

  removeRowOccurrenceFromMustContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustContainRowOccurrences.forEach(item => {
      if (item === itemToRemove) { this.mustContainRowOccurrences.splice(i, 1); }
      i++;
    });
    this.search();
  }

  removeRowOccurrenceFromMustNotContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustNotContainRowOccurrences.forEach(item => {
      if (item === itemToRemove) { this.mustNotContainRowOccurrences.splice(i, 1); }
      i++;
    });
    this.search();
  }

  // ------
  // SEARCH
  // ------
  search() {
    // At less one of the filters (occurrence, geolocation, ...) must be applied
    if (this.noFilterApplied()) { this.tables = []; return; }

    this.isSearching = true;

    const query = this.esQueryAssembler();
    console.log(query);

    this.tableService.findEsTableByQuery(query).subscribe(
      esTables => {
        console.log('ES TABLES', esTables);
        this.isSearching = false;
        this.tables = esTables;
      },
      errorEsTables => {
        this.isSearching = false;
        console.log(errorEsTables);
      }
    );
  }

  // -------
  // FILTERS
  // -------
  noFilterApplied(): boolean {
    if (this.tableValidation === null &&
      this.tableMustBeADiagnosis === false && // @Todo user should filter on NO diagnosis
      this.mustContainColOccurrences.length === 0 &&
      this.mustNotContainColOccurrences.length === 0 &&
      this.mustContainRowOccurrences.length === 0 &&
      this.mustNotContainRowOccurrences.length === 0
    ) {
      return true;
    }
    return false;
  }

  tableMustBeADiagnosisChange(event: any): void {
    this.tableMustBeADiagnosis = event.checked;
    this.search();
  }

  tableMustHaveAPdfisChange(event: any): void {
    this.tableMustHaveAPdf = event.checked;
    this.search();
  }

  // ---------------------------
  // ES QUERY PARTS & ASSEMBLERS
  // ---------------------------
  esQueryAssembler(): string {
    const mustPart = this.esMustClauseAssembler();
    let mustNotPart = this.esMustNotClauseAssembler();

    mustNotPart = (mustNotPart !== '' && mustPart !== '' ) ? ', ' + mustNotPart : mustNotPart;

    const query = `
    {
      "size": 100,
      "query": {
        "bool": {
          ${mustPart}
          ${mustNotPart}
        }
      }
    }
    `;

    return query;
  }

  /**
   * Constructs the ElasticSearch MUST query part
   * Output example :
   * `
   *   "must": [
   *     { "match_phrase": { "tableValidation": "bdtfx~164534" } },
   *     { "match_phrase": { "rowsValidations": "bdtfx~164534" } }
   *   ]
   * `
   */
  esMustClauseAssembler(): string {
    const tableValidation: Array<string> = this.esMustTableValidationQueryPart();
    const tableMustBeADiagnosis: Array<string> = this.esMustTableBeDiagnosisPart();
    const tableMustHaveAPdf: Array<string> = this.esMustTableHaveAPdfPart();
    const rowOcc: Array<string> = this.esRowOccurrencesMustQueryPart(this.mustContainRowOccurrences);
    const colOcc: Array<string> = this.esColOccurrencesMustQueryPart(this.mustContainColOccurrences);

    const parts = [].concat(...tableValidation, ...tableMustBeADiagnosis, ...tableMustHaveAPdf, ...colOcc, ...rowOcc);

    let stringParts = '';
    let i = 0;
    parts.forEach(p => {
      stringParts = stringParts + p + (i < parts.length - 1 ? ', ' : '');
      i++;
    });
    const mustString = parts.length > 0 ? `"must": [${stringParts}]` : '';
    return mustString;
  }

  /**
   * Constructs the EalsticSearch query part "MUST contains thoses column occurrences".
   * Output example :
   * `
   *   { "match_phrase": { "occurrencesValidations": "baseveg~50284" } },
   *   { "match_phrase": { "occurrencesValidations": "baseveg~50912" } }
   * `
   */
  esColOccurrencesMustQueryPart(colOccurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    colOccurrenceValidations.forEach(colOccurrenceValidation => {
      let idTaxo: any = null;
      if (colOccurrenceValidation.idTaxo !== null) { idTaxo = colOccurrenceValidation.idTaxo; } else if (colOccurrenceValidation.validOccurence.idNomen !== null) { idTaxo = colOccurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${colOccurrenceValidation.idTaxo}]${colOccurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "occurrencesValidations": "${colOccurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

  /**
   * Constructs the EalsticSearch query part "MUST contains thoses row occurrences".
   * Output example :
   * `
   *   { "match_phrase": { "rowsValidations": "bdtfx~50284" } },
   *   { "match_phrase": { "rowsValidations": "bdtfx~50912" } }
   * `
   */
  esRowOccurrencesMustQueryPart(rowOccurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    rowOccurrenceValidations.forEach(rowOccurrenceValidation => {
      let idTaxo: any = null;
      if (rowOccurrenceValidation.idTaxo !== null) { idTaxo = rowOccurrenceValidation.idTaxo; } else if (rowOccurrenceValidation.validOccurence.idNomen !== null) { idTaxo = rowOccurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${rowOccurrenceValidation.idTaxo}]${rowOccurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "rowsValidations": "${rowOccurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

  /**
   * Constructs the ElasticSearch MUST NOT query part
   * Output example :
   * `
   *   "must_not": [
   *     { "match_phrase": { "tableValidation": "bdtfx~164534" } },
   *     { "match_phrase": { "rowsValidations": "bdtfx~164534" } }
   *   ]
   * `
   */
  esMustNotClauseAssembler(): string {
    const rowOcc: Array<string> = this.esRowOccurrencesMustNotQueryPart(this.mustNotContainRowOccurrences);
    const colOcc: Array<string> = this.esColOccurrencesMustNotQueryPart(this.mustNotContainColOccurrences);

    const parts = [].concat(...colOcc, ...rowOcc);

    let stringParts = '';
    let i = 0;
    parts.forEach(p => {
      stringParts = stringParts + p + (i < parts.length - 1 ? ', ' : '');
      i++;
    });
    const mustNotString = parts.length > 0 ? `"must_not": [${stringParts}]` : '';
    return mustNotString;
  }

  /**
   * Constructs the EalsticSearch query part "MUST NOT contains thoses col occurrences (ie relevés)".
   * Output example :
   * `
   *   { "match_phrase": { "occurrencesValidations": "bdtfx~50284" } },
   *   { "match_phrase": { "occurrencesValidations": "bdtfx~50912" } }
   * `
   */
  esColOccurrencesMustNotQueryPart(colOccurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    colOccurrenceValidations.forEach(colOccurrenceValidation => {
      let idTaxo: any = null;
      if (colOccurrenceValidation.idTaxo !== null) { idTaxo = colOccurrenceValidation.idTaxo; } else if (colOccurrenceValidation.validOccurence.idNomen !== null) { idTaxo = colOccurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${colOccurrenceValidation.idTaxo}]${colOccurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "occurrencesValidations": "${colOccurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

  /**
   * Constructs the EalsticSearch query part "MUST NOT contains thoses row occurrences (ie 'species')".
   * Output example :
   * `
   *   { "match_phrase": { "rowsValidations": "bdtfx~50284" } },
   *   { "match_phrase": { "rowsValidations": "bdtfx~50912" } }
   * `
   */
  esRowOccurrencesMustNotQueryPart(rowOccurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    rowOccurrenceValidations.forEach(rowOccurrenceValidation => {
      let idTaxo: any = null;
      if (rowOccurrenceValidation.idTaxo !== null) { idTaxo = rowOccurrenceValidation.idTaxo; } else if (rowOccurrenceValidation.validOccurence.idNomen !== null) { idTaxo = rowOccurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${rowOccurrenceValidation.idTaxo}]${rowOccurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "rowsValidations": "${rowOccurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

  esMustTableValidationQueryPart(): Array<string> {
    const parts: Array<string> = [];
    if (this.tableValidation) {
      const matchPhrase = `{ "match_phrase": { "tableValidation": "${this.tableValidation.repository}~${this.tableValidation.idTaxo}" } }`;
      parts.push(matchPhrase);
    }
    return parts;
  }

  esMustTableBeDiagnosisPart(): Array<string> {
    const parts: Array<string> = [];
    if (this.tableMustBeADiagnosis) {
      const matchPhrase = `{ "term": { "isDiagnosis": true } }`;
      parts.push(matchPhrase);
    }
    return parts;
  }

  esMustTableHaveAPdfPart(): Array<string> {
    const parts: Array<string> = [];
    if (this.tableMustBeADiagnosis && this.tableMustHaveAPdf) {
      const matchPhrase = `{ "term": { "hasPdf": true } }`;
      parts.push(matchPhrase);
    }
    return parts;
  }

}
