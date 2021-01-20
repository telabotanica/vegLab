import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { trigger, transition, style, animate } from '@angular/animations';
import { PageEvent, MatSidenav } from '@angular/material';

import { AppConfigService } from 'src/app/_config/app-config.service';
import { TableService } from 'src/app/_services/table.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { UserService } from 'src/app/_services/user.service';
import { SyeService } from 'src/app/_services/sye.service';
import { SyntheticColumnService } from 'src/app/_services/synthetic-column.service';

import { RepositoryItemModel } from 'tb-tsb-lib';
import { EsTableModel } from 'src/app/_models/es-table.model';
import { Sye } from 'src/app/_models/sye.model';
import { Table } from 'src/app/_models/table.model';
import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { UserModel } from 'src/app/_models/user.model';
import { environment } from 'src/environments/environment';

import { TableActionEnum } from 'src/app/_enums/table-action-enum';

import { Subscription, Observable, zip } from 'rxjs';
import * as _ from 'lodash';

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
export class TableSearchComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenav;  // @Todo check : doc add {static: false}

  tables: Array<EsTableModel> = [];
  tableInfo: EsTableModel = null;     // table to preview

  // VAR Table filters
  tableValidation: RepositoryItemModel = null;
  tableMustBeADiagnosis = false;
  tableMustHaveAPdf = false;
  tableMustBeMine = false;

  // VAR Col Occurrence filters
  mustContainColOccurrences: Array<RepositoryItemModel> = [];
  mustNotContainColOccurrences: Array<RepositoryItemModel> = [];

  // VAR Row Occurrence filters
  mustContainRowOccurrences: Array<RepositoryItemModel> = [];
  mustNotContainRowOccurrences: Array<RepositoryItemModel> = [];

  // Var results
  resultCount: number;
  tablesPageIndex = 0;        // updated by _tablePageChanged()
  tablesPaginatorFrom = 0;    // updated by _tablePageChanged()
  tablesPaginatorSize = 5;
  selectedTablesIds: Array<number> = [];

  // VAR other
  tbRepositoriesConfig = environment.tbRepositoriesConfig;
  isSearching = false;
  showResultsDiv = true;
  currentTableSetAndNotEmpty: boolean;          // Is there a current non empty table ? (be carefull : ther is ALWAYS a current table but it's empty at startup : it only contains one empty sye)
  currentTableId: number;                       // Current table id. This property is set only when a single table from database is used
  currentTableChangeSubscription: Subscription;

  // VAR user
  currentUser: UserModel = null;
  currentUserChangeSubscription: Subscription;

  constructor(private appConfig: AppConfigService,
              private tableService: TableService,
              private notificationService: NotificationService,
              private userService: UserService) { }

  ngOnInit() {
    // App config
    setTimeout(() => {                    // Avoid 'ExpressionChangedAfterItHasBeenCheckedError'
      this.appConfig.setTableEditable();
      this.appConfig.enableInfoPanel();
    });

    // get current table id
    let ct = this.tableService.getCurrentTable();
    this.currentTableId = ct && ct.id ? ct.id : null;
    this.currentTableSetAndNotEmpty = !this.tableService.isTableEmpty(ct);
    // subscribe to current table change
    this.currentTableChangeSubscription = this.tableService.currentTableChanged.subscribe(
      currentTableHasChanged => {
        if (currentTableHasChanged === true) {
          ct = this.tableService.getCurrentTable();
          this.currentTableId = ct && ct.id ? ct.id : null;
          this.currentTableSetAndNotEmpty = !this.tableService.isTableEmpty(ct);
          this.selectedTablesChange(this.selectedTablesIds); // update selection
        }
      }, error => {
        // @Todo manage error
        console.log(error);
      }
    );

    // get current user
    this.currentUser = this.userService.currentUser.getValue();
    // subscribe to current user change
    this.currentUserChangeSubscription = this.userService.currentUser.subscribe(
      user => {
        // current user has changed !!
        // should not happen except at startup if this.currentUser == null
        if (this.currentUser == null) {
          this.currentUser = user;
        } else if (this.currentUser && user.id !== this.currentUser.id) {
          // Hey !!
          this.notificationService.warn('L\'utilisateur courant a changé, la session est interrompue');
          // @Todo save data and exit
        }
      }, error => {}
    );
  }

  ngOnDestroy() {
    if (this.currentTableChangeSubscription) { this.currentTableChangeSubscription.unsubscribe(); }
    if (this.currentUserChangeSubscription) { this.currentUserChangeSubscription.unsubscribe(); }
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
    if (_.find(this.mustContainRowOccurrences, i => i === item )) { return; }
    if (_.find(this.mustNotContainRowOccurrences, i => i === item )) { return; }
    this.mustContainRowOccurrences.push(item);
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
  search(from?: number) {
    // At less one of the filters (occurrence, geolocation, ...) must be applied
    if (this.noFilterApplied()) { this.tables = []; return; }

    this.isSearching = true;

    const query = this.esQueryAssembler(from);
    console.log(query);

    this.tableService.findEsTableByQuery(query).subscribe(
      result => {
        this.resultCount = result.count;
        this.isSearching = false;
        this.tables = result.tables;
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
      this.tableMustBeMine === false &&
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

  tableMustBeMineChange(event: any): void {
    this.tableMustBeMine = event.checked;
    this.search();
  }

  // --------------------
  // RESULTS & PAGINATION
  // --------------------
  _tablePageChanged(pageEvent: PageEvent): void {
    if (pageEvent == null) { return; }

    // page index update
    this.tablesPageIndex = pageEvent.pageIndex;

    // number of items per page update
    if (pageEvent.pageSize !== this.tablesPaginatorSize) {
      this.tablesPaginatorSize = pageEvent.pageSize;
    }

    this.search(this.tablesPageIndex * this.tablesPaginatorSize);
  }

  /**
   * When user select tables (ids) from tables-table-view component
   */
  selectedTablesChange(selectedTablesIds: Array<number>): void {
    console.log(this.currentTableId, selectedTablesIds);
    // if selected tables contains the current table, remove it
    if (this.currentTableId !== null && _.find(selectedTablesIds, stids => stids === this.currentTableId)) {
      console.log('CURRENT TABLE IS SELECTED');
      this.selectedTablesIds = _.clone(_.filter(selectedTablesIds, n => n !== this.currentTableId));
      console.log(this.selectedTablesIds);
    } else {
      this.selectedTablesIds = selectedTablesIds;
    }
  }

  resetSelectedTablesIds(): void {
    this.selectedTablesIds = [];
  }

  // -------
  // SIDENAV
  // -------
  previewTableAction(table: EsTableModel): void {
    this.resetInfoAndDeleteValues();
    this.tableInfo = table;
    this.appConfig.showActionPanelCloseButton.next(false);
    this.sidenav.open();
  }

  closePreview(close: boolean): void {
    if (close && close === true) {
      this.sidenav.close();
      this.closeSidenav();
      this.appConfig.showActionPanelCloseButton.next(true);
    }
  }
  resetInfoAndDeleteValues(): void {
    this.tableInfo = null;
  }

  closeSidenav() {
    this.resetInfoAndDeleteValues();
  }

  // ---------------------
  // SET SELECTED TABLE(S)
  // ---------------------

  /**
   * Set selected tables as a current table
   *
   * @param setSye if true, syes will be added independantly. If false, only occurrences (relevés) will be added
   */
  setSelectedTablesAsCurrentTable(setSye = false): void {
    if (this.selectedTablesIds == null || this.selectedTablesIds.length === 0) {
      // Selected tables ids empty
      this.notificationService.error('Aucun tableau n\'est selectionné');
      return;
    }

    this.tableService.isLoadingData.next(true);

    // If only one table (id) is selected, just set it as a new table (and it will keep its id)
    if (this.selectedTablesIds.length === 1) {
      // get table
      this.tableService.getTableById(this.selectedTablesIds[0]).subscribe(
        table => {
          this.tableService.setCurrentTable(table, true);
          this.tableService.isLoadingData.next(false);
        }, error => {
          this.notificationService.error('Nous ne parvenons pas à récupérer le tableau en base de données');
          this.tableService.isLoadingData.next(false);
          // @Todo log error
          console.log(error);
        });
    } else {
      // Several tables (ids) are selected
      // 1. get observables
      const obs: Array<Observable<Table>> = [];
      for (const tableId of this.selectedTablesIds) {
        obs.push(this.tableService.getTableById(tableId));
      }
      // 2. zip & subscribe
      zip(...obs).subscribe(
        results => {
          const syes: Array<Sye> = [];
          const occurrences: Array<OccurrenceModel> = [];
          for (const table of results) {
            // 3. Bind syes & occurrences
            syes.push(...table.sye);
            table.sye.forEach(ts => {if (ts.occurrences && ts.occurrences.length > 0) { occurrences.push(...ts.occurrences); }});
          }
          // 4. Set syes OR occurrences to current table
          const ct = this.tableService.createTable(); // a new Table with an unique empty sye
          if (setSye === true) {
            // keep syes
            // + duplicate table (remove sye synthetic column and validations ids to avoid them to be moved between entities)
            let newTable = this.tableService.setSyesToTable(syes, ct, this.currentUser);
            newTable = this.tableService.duplicateTable(newTable);
            this.tableService.setCurrentTable(newTable, true);
            this.tableService.isLoadingData.next(false);
          } else {
            // keep relevés
            const newTable = this.tableService.setRelevesToTable(occurrences, ct, this.currentUser);
            this.tableService.setCurrentTable(newTable, true);
            this.tableService.isLoadingData.next(false);
          }
        }, error => {
          this.notificationService.error('Nous ne parvenons pas à récupérer les tableaux en base de données');
          this.tableService.isLoadingData.next(false);
          // @Todo log error
          console.log(error);
        }
      );
    }
  }

  /**
   * Merge selected tables with the current table
   *
   * @param setSye if true, syes will be added independantly. If false, only occurrences (relevés) will be added
   */
  mergeSelectedTablesWithCurrentTable(setSye = false): void {
    const ct = this.tableService.getCurrentTable();

    if (this.currentTableId == null) {
      // No current table id
      if (ct == null) {
        this.notificationService.error('Aucun tableau de travail');
        return;
      }
    }

    if (this.selectedTablesIds == null || this.selectedTablesIds.length === 0) {
      // Selected tables ids empty
      this.notificationService.error('Aucun tableau n\'est selectionné');
      return;
    }

    // 1. get observables
    const obs: Array<Observable<Table>> = [];
    for (const tableId of this.selectedTablesIds) {
      obs.push(this.tableService.getTableById(tableId));
    }
    // 2. zip & subscribe
    this.tableService.isLoadingData.next(true);
    zip(...obs).subscribe(
      results => {
        const syes: Array<Sye> = [];
        const occurrences: Array<OccurrenceModel> = [];
        for (const table of results) {
          // 3. Bind syes & occurrences
          syes.push(...table.sye);
          table.sye.forEach(ts => {if (ts.occurrences && ts.occurrences.length > 0) { occurrences.push(...ts.occurrences); }});
        }
        // 4. Set currentTable Syes OR Set occurrences
        if (setSye === true) {
          // keep syes
          // + duplicate table (remove sye synthetic column and validations ids to avoid them to be moved between entities)
          let newTable = this.tableService.mergeSyesToTable(syes, ct, this.currentUser);
          newTable = this.tableService.duplicateTable(newTable);
          this.tableService.setCurrentTable(newTable, true);

          // @Action
          console.log('MERGE TABLE');
          this.tableService.createAction(TableActionEnum.mergeTable);

          this.tableService.isLoadingData.next(false);
        } else {
          // keep relevés
          const newTable = this.tableService.mergeRelevesToTable(occurrences, ct, this.currentUser);
          this.tableService.setCurrentTable(newTable, true);

          // @Action
          console.log('MERGE TABLE');
          this.tableService.createAction(TableActionEnum.mergeTable);

          this.tableService.isLoadingData.next(false);
        }
      }, error => {
        this.notificationService.error('Nous ne parvenons pas à récupérer les tableaux en base de données');
        this.tableService.isLoadingData.next(false);
        // @Todo log error
        console.log(error);
      }
    );
    // }
  }

  // ---------------------------
  // ES QUERY PARTS & ASSEMBLERS
  // ---------------------------
  esQueryAssembler(from?: number): string {
    const mustPart = this.esMustClauseAssembler();
    let mustNotPart = this.esMustNotClauseAssembler();

    mustNotPart = (mustNotPart !== '' && mustPart !== '' ) ? ', ' + mustNotPart : mustNotPart;

    const _from = from ? from : 0;
    const _size = this.tablesPaginatorSize;

    const query = `
    {
      "from": ${_from}, "size": ${_size},
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
    const tableMustBeMine: Array<string> = this.esTableMustBeMineQueryPart();
    const rowOcc: Array<string> = this.esRowOccurrencesMustQueryPart(this.mustContainRowOccurrences);
    const colOcc: Array<string> = this.esColOccurrencesMustQueryPart(this.mustContainColOccurrences);

    const parts = [].concat(...tableValidation, ...tableMustBeADiagnosis, ...tableMustHaveAPdf, ...tableMustBeMine, ...colOcc, ...rowOcc);

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

  esTableMustBeMineQueryPart(): Array<string> {
    const cu = this.currentUser;

    if (cu == null || (cu !== null && cu.id == null)) {
      return [];
    }

    const parts: Array<string> = [];
    if (this.tableMustBeMine) {
      const matchPhrase = `{ "match": { "userId": "${cu.id}" } }`;
      parts.push(matchPhrase);
    }
    return parts;
  }

}
