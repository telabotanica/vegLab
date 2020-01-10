import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';

import { Table } from '../_models/table.model';
import { OccurrenceModel } from '../_models/occurrence.model';

import { UserService } from './user.service';
import { SyeService } from './sye.service';
import { NotificationService } from './notification.service';
import { ErrorService } from './error.service';
import { SyntheticColumnService } from './synthetic-column.service';
import { WorkspaceService } from './workspace.service';
import { ValidationService } from './validation.service';

import { TableViewRowName } from '../_models/table-view-row-name.model';
import { TableRowDefinition, TableRow } from '../_models/table-row-definition.model';
import { SyntheticItem } from '../_models/synthetic-item.model';
import { SyntheticColumn } from '../_models/synthetic-column.model';
import { Sye } from '../_models/sye.model';
import { PdfFileJsonLd } from '../_models/pdf-file.model';
import { OccurrenceValidationModel } from '../_models/occurrence-validation.model';
import { EsTableResultModel } from '../_models/es-table-result.model';
import { EsTableModel } from '../_models/es-table.model';
import { GroupPositions } from '../_models/table/group-positions.model';
import { TableSelectedElement } from '../_models/table/table-selected-element.model';
import { UserModel } from '../_models/user.model';

import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { TableRelatedSyntaxon } from '../_models/table-related-syntaxon';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private currentTable: Table;
  public currentTableOccurrencesIds = new BehaviorSubject<Array<number>>([]);
  public currentTableChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  public tableDataView: EventEmitter<Array<TableRow>> = new EventEmitter<Array<TableRow>>();
  public groupsPositions: Array<GroupPositions> = [];
  public columnsPositions: Array<ColumnPositions> = [];
  public isSavingCurrentTable = false;
  public savingCurrentTableMessage = '';
  public isLoadingData: EventEmitter<boolean> = new EventEmitter<boolean>();
  public tableAreaDimensions: EventEmitter<{width: number, height: number}> = new EventEmitter();
  public tableSelectionElement: BehaviorSubject<TableSelectedElement> = new BehaviorSubject<TableSelectedElement>(null);

  constructor(
    private userService: UserService,
    private syeService: SyeService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private syntheticColumnService: SyntheticColumnService,
    private http: HttpClient,
    private wsService: WorkspaceService,
    private validationService: ValidationService) { }

  // --------------
  // TABLE I/O (DB)
  // --------------
  /**
   * Get a table
   */
  getTableById(id: number): Observable<Table> {
    const currentUser = this.userService.currentUser.getValue();
    return this.http.get<Table>(`${environment.apiBaseUrl}/tables/${id}`).pipe(
      map(t => this.parseGeometryAndIntegerifyElevation(t)),
      map(t => this.orderSye(t)),
      map(t => this.orderSyeOccurrences(t)),
      map(t => {
        // Is table owned by current user ?
        if (currentUser !== null) {
          t.ownedByCurrentUser = currentUser && Number(currentUser.id) === t.createdBy;
        } else {
          t.ownedByCurrentUser = false;
        }
        return t;
      })
    );
  }

  /**
   * Create a table
   */
  postTable(table: Table): Observable<Table> {
    console.log('table', table);
    if (typeof(table.id) === 'number') {
      // throw throwError('The current table already exists in DB, could not POST it');
      console.log('The current table already exists in DB, could not POST it');
      // @Todo log error
      return of(null);
    }

    // Stringify geometry before POST
    this.stringifyGeometryAndIntegerifyElevation(table);

    // Set syes order
    table.syeOrder = this.getSyeOrder(table);

    // Set syes occurrencesOrder
    for (const sye of table.sye) {
      sye.occurrencesOrder = this.syeService.getOccurrencesOrder(sye);
    }

    // Post table
    return this.http.post<Table>(`${environment.apiBaseUrl}/tables`, table).pipe(
      map(t => this.parseGeometryAndIntegerifyElevation(t)),
      map(t => this.orderSyeOccurrences(t))
    );

  }

  /**
   * Replace a table
   */
  putTable(table: Table, data?: {title: string, description: string, createdAt: Date, createdBy: string, relatedSyntaxons: Array<TableRelatedSyntaxon>}) {
    // PUT (replace) current table
    if (!table.id) {
      // throw throwError('The current table doesn\'t exists in DB, could not PATCH it');
      console.log('The current table doesn\'t exists in DB, could not PATCH it');
      // @Todo log error
      return of(null);
    }

    // Stringify geometry before POST
    this.stringifyGeometryAndIntegerifyElevation(table);

    // Set syes order
    table.syeOrder = this.getSyeOrder(table);

    // Set syes occurrencesOrder
    for (const sye of table.sye) {
      sye.occurrencesOrder = this.syeService.getOccurrencesOrder(sye);
    }

    // Remove empty fields before PATCH
    this.removeEmpty(table);

    // Post table
    return this.http.put<Table>(`${environment.apiBaseUrl}/tables/${table.id}`, table).pipe(
      map(t => this.parseGeometryAndIntegerifyElevation(t)),
      map(t => this.orderSyeOccurrences(t))
    );
  }

  linkTableToPdfFile(table: Table, pdfFileIri: string): Observable<Table> {
    if (!table.id) {
      console.log('The current table doesn\'t exists in DB, could not PATCH pdf files for it');
      return;
    }
    const linkHttpHeaders = {'Content-Type': 'application/ld+json'};
    return this.http.patch<Table>(`${environment.apiBaseUrl}/tables/${table.id}`, {pdf: pdfFileIri}, {headers: linkHttpHeaders}).pipe(
      map(t => this.parseGeometryAndIntegerifyElevation(t))
    );
  }


  // --------------
  // TABLE I/O (ES)
  // --------------
  getEsTables(): Observable<Array<EsTableModel>> {
    const currentUser = this.userService.currentUser.getValue();
    return this.http.get<EsTableResultModel>(`${environment.esBaseUrl}/vl_tables/_search`).pipe(
      map(result => _.map(result.hits.hits, hit => hit._source)),
      map(result => {
        // Are tables owned by current user ?
        for (const esTable of result) {
          esTable.ownedByCurrentUser = currentUser && Number(currentUser.id) === esTable.userId;
        }
        return result;
      })
    );
  }

  getEsTablesForCurrentUser(from?: number, size?: number): Observable<EsTableResultModel> | Observable<null> {
    const currentUser = this.userService.currentUser.getValue();
    if (!currentUser && !currentUser.id) {
      return of(null);
    }
    const headers = new HttpHeaders({ 'Content-type': 'application/json' });
    const fromSizeQueryPart = from && size ? `"from": ${from}, "size": ${size},` : '';
    const query = `
    {
      ${fromSizeQueryPart}
      "query": {
        "bool": {
          "must": [{
            "term": {
              "userId": "${Number(currentUser.id)}"
            }
          }]
        }
      }
    }`;
    return this.http.post<EsTableResultModel>(`${environment.esBaseUrl}/vl_tables/_search`, query, {headers});
  }

  findEsTableByQuery(esQuery: string): Observable<{tables: Array<EsTableModel>, count: number}> {
    const headers = new HttpHeaders({ 'Content-type': 'application/json' });
    const currentUser = this.userService.currentUser.getValue();
    let count = 0;
    return this.http.post<EsTableResultModel>(`${environment.esBaseUrl}/vl_tables/_search`, esQuery, {headers}).pipe(
      tap(result => count = result.hits.total),
      map(result => _.map(result.hits.hits, hit => hit._source)),
      map(result => {
        // Are tables owned by current user ?
        for (const esTable of result) {
          esTable.ownedByCurrentUser = currentUser && Number(currentUser.id) === esTable.userId;
        }
        return {tables: result, count};
      })
    );
  }

  // -------
  // HELPERS
  // -------

  private removeEmpty = (obj: object) => {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object') { this.removeEmpty(obj[key]); } else if (obj[key] == null) { delete obj[key]; }
    });
  }

  private stringifyGeometryAndIntegerifyElevation(table: Table): void {
    for (const sye of table.sye) {
      for (const occ of sye.occurrences) {
        occ.geometry = this.stringify(occ.geometry);
        occ.centroid = this.stringify(occ.centroid);
        occ.elevation = occ.elevation ? +occ.elevation : null;
        if (occ.level === 'synusy') {
          for (const child of occ.children) {
            child.geometry = this.stringify(child.geometry);
            child.centroid = this.stringify(child.centroid);
            child.elevation = child.elevation ? +child.elevation : null;
          }
        } else if (occ.level === 'microcenosis') {
          for (const child of occ.children) {
            child.geometry = this.stringify(child.geometry);
            child.centroid = this.stringify(child.centroid);
            child.elevation = child.elevation ? +child.elevation : null;
            for (const grandChild of child.children) {
              grandChild.geometry = this.stringify(grandChild.geometry);
              grandChild.centroid = this.stringify(grandChild.centroid);
              grandChild.elevation = grandChild.elevation ? +grandChild.elevation : null;
            }
          }
        }
      }
    }
  }

  public parseGeometryAndIntegerifyElevation(table: Table): Table {
    for (const sye of table.sye) {
      for (const occ of sye.occurrences) {
        occ.geometry = this.parseJson(occ.geometry);
        occ.centroid = this.parseJson(occ.centroid);
        occ.elevation = occ.elevation ? +occ.elevation : null;
        if (occ.level === 'synusy') {
          for (const child of occ.children) {
            child.geometry = this.parseJson(child.geometry);
            child.centroid = this.parseJson(child.centroid);
            child.elevation = child.elevation ? +child.elevation : null;
          }
        } else if (occ.level === 'microcenosis') {
          for (const child of occ.children) {
            child.geometry = this.parseJson(child.geometry);
            child.centroid = this.parseJson(child.centroid);
            child.elevation = child.elevation ? +child.elevation : null;
            for (const grandChild of child.children) {
              grandChild.geometry = this.parseJson(grandChild.geometry);
              grandChild.centroid = this.parseJson(grandChild.centroid);
              grandChild.elevation = grandChild.elevation ? +grandChild.elevation : null;
            }
          }
        }
      }
    }

    return table;
  }

  private stringify(data: any): string {
    if (!data) {
      return null;
    } else {
      if (typeof(data) === 'object') {
        return JSON.stringify(data);
      } else if (typeof(data) === 'string') {
        return data;
      } else {
        // @Todo log error
        return null;
      }
    }
  }

  private parseJson(data: any): object {
    if (!data) {
      return null;
    } else {
      if (typeof(data) === 'string') {
        return JSON.parse(data);
      } else if (typeof(data) === 'object') {
        return data;
      } else {
        // @Todo log error
        return null;
      }
    }
  }

  private getSyeOrder(table: Table): string {
    const order: Array<number> = [];
    for (const sye of table.sye) {
      if (sye.id) { order.push(sye.id); }
    }
    if (order.length > 0) {
      return order.toString();
    } else {
      return null;
    }
  }

  /**
   * Order sye according to table.syeOrder
   * This function alterates table.sye
   */
  private orderSye(table: Table): Table {
    if (table.sye && table.sye.length > 0) {
      const order = table.syeOrder;
      if (!order || order === '') { return table; }

      const orderedArray = order.split(',');
      const orderedArrayNumber: Array<number> = [];
      _.map(orderedArray, oa => orderedArrayNumber.push(Number(oa)));

      const countSye = table.sye.length;

      if (countSye !== orderedArray.length) {
        // @Todo log error
        return table;
      }

      const orderedSye: Array<Sye> = [];
      // Order sye according to orderSye
      for (const orderedSyeId of orderedArrayNumber) {
        const sye = _.find(table.sye, syeT => syeT.id === orderedSyeId);
        if (sye) { orderedSye.push(sye); }
      }

      if (orderedSye.length === table.sye.length) {
        table.sye = orderedSye;
      }

      return table;
    } else { return table; }
  }

  public orderSyeOccurrences(table: Table): Table {
    for (const sye of table.sye) {
      this.syeService.orderOccurrences(sye);
    }
    return table;
  }

  // @Todo MOVE funtion into table form component
  public getTableValidationFromRelatedSyntaxonFormData(table: Table, relatedSyntaxon: TableRelatedSyntaxon): OccurrenceValidationModel {
    const name: string = relatedSyntaxon.validation.name + (relatedSyntaxon.validation.author ? ' ' + relatedSyntaxon.validation.author : '');
    const tableValidation: OccurrenceValidationModel = {
      inputName: name,
      repository: relatedSyntaxon.validation.repository,
      repositoryIdNomen: +relatedSyntaxon.validation.idNomen,
      repositoryIdTaxo: relatedSyntaxon.validation.idTaxo.toString(),
      validName: name,
      validatedAt: new Date(),
      validatedBy: table.createdBy,
      validatedName: name
    };
    return tableValidation;
  }

  // ---------------
  // TABLE MANAGMENT
  // ---------------
  setCurrentTable(table: Table, forceReloadDataView = false): void {
    this.currentTable = table;
    this.setCurrentTableOccurrencesIds();
    if (forceReloadDataView) { this.tableDataView.next(this.createDataView(this.currentTable)); }
    this.currentTableChanged.next(true);
  }

  getCurrentTable(): Table {
    return this.currentTable;
  }

  /**
   * Returns first level occurrences for each sye in current table
   */
  getReleves(): Array<OccurrenceModel> {
    const releves: Array<OccurrenceModel> = [];
    if (this.currentTable && this.currentTable.sye) {
      for (const sye of this.currentTable.sye) {
        if (sye.occurrences && sye.occurrences.length > 0) {
          releves.push(...sye.occurrences);
        }
      }
    }
    return releves;
  }

  updateDataView(table: Table) {
    this.tableDataView.next(this.createDataView(table));
  }

  private setCurrentTableOccurrencesIds(): void {
    let tableOccurrences: Array<OccurrenceModel> = [];
    if (this.currentTable) {
      for (const sye of this.currentTable.sye) {
        tableOccurrences = this.getAllOccurrences(this.currentTable, true);
      }
    }
    this.currentTableOccurrencesIds.next(_.map(tableOccurrences, to => to.id));
    console.log('CURRENT TABLE OCC IDS', this.currentTableOccurrencesIds.getValue());
  }

  createTable(): Table {
    const currentUser = this.userService.currentUser.getValue();
    const table: Table = {
      id: null,

      userId: currentUser ? Number(currentUser.id) : null,
      userEmail: currentUser ? currentUser.sub : null,
      userPseudo: currentUser ? currentUser.pseudo : null,
      ownedByCurrentUser: currentUser !== null,     // a new table is owned by its creator

      isDiagnosis: false,
      validations: [],

      createdBy: currentUser ? Number(currentUser.id) : null,
      createdAt: new Date(Date.now()),
      updatedBy: null,
      updatedAt: null,

      rowsDefinition: null,

      sye: [this.syeService.createSye(0)],
      syeOrder: '',
      syntheticColumn: null,

      vlWorkspace: this.wsService.currentWS.getValue()
    };

    return table;
  }

  isTableEmpty(table: Table): boolean {
    if (table == null) { return true; }
    if (table.sye == null || table.sye && table.sye.length === 0) { return true; }
    if (table.sye && table.sye.length === 1) {
      if (table.sye[0].occurrences == null || table.sye[0].occurrences.length === 0) { return true; }
    }
    return false;
  }

  // -----------------------
  // ADD / REMOVE OCCURRENCE
  // -----------------------

  /**
   * Add occurrences (relevés) to a table
   * The provided occurrences must have ids (persisted in db)
   * Occurrences are added in the first sye (table.sye[0])
   * @param occurrences the relevés to be added
   * @param table the table to add occurrences
   */
  addOccurrencesToTable(occurrences: Array<OccurrenceModel>, table: Table): Table {
    // Avoid duplicates
    const occurrencesToAdd: Array<OccurrenceModel> = [];
    occurrences.forEach(occToAdd => {
      // An occurrence must have an id to be added in a table
      if (occToAdd.id !== null) {
        if (_.find(this.currentTableOccurrencesIds.getValue(), currentId => occToAdd.id === currentId)) {
          // Already in table
        } else {
          // Not in table
          occurrencesToAdd.push(occToAdd);
        }
      }
    });

    // SyE
    // Select current sye and add occurrences
    if (table.sye.length === 0) {
      // Create a new sye
    } else if (table.sye.length === 1) {
      // Push occurrences to sye
      table.sye[0].occurrences.push(...occurrencesToAdd);
      table.sye[0].occurrencesCount += occurrencesToAdd.length;
    } else if (table.sye.length > 1) {
      // @Todo
      // Select the 'good' sye and push occurrences to it
      let i = 0;
      for (const occurrence of occurrencesToAdd) {
        table.sye[0].occurrences.push(occurrence);
        table.sye[0].occurrencesCount += occurrencesToAdd.length;
        i++;
      }
    }

    this.setCurrentTableOccurrencesIds();

    return table;
  }

  private removeOccurrencesToTable(occurrences: Array<OccurrenceModel>, table: Table)/*: Table */ {
    // this.setCurrentTableOccurrencesIds();
  }

  public addOccurrencesToCurrentTable(occurrences: Array<OccurrenceModel>, currentUser: UserModel) {
    const newTable = this.addOccurrencesToTable(occurrences, this.currentTable);
    this.createSyntheticColumnsForSyeOnTable(newTable, currentUser);
    this.createTableSyntheticColumn(newTable, currentUser);
    this.currentTable = Object.assign({}, newTable);
    this.currentTable.rowsDefinition = this.createRowsDefinition(this.currentTable);
    this.updateColumnsPositions(this.currentTable);
    this.tableDataView.next(this.createDataView(this.currentTable));
    this.setCurrentTableOccurrencesIds();
    this.currentTableChanged.next(true);
  }

  public removeOccurencesToCurrentTable(occurrences: Array<OccurrenceModel>) {

    // this.setCurrentTableOccurrencesIds();
  }

  // ----------------
  // SYNTHETIC COLUMN
  // ----------------

  public createSyntheticColumnsForSyeOnTable(table: Table, currentUser: UserModel) {
    for (const sye of table.sye) {
      const syntheticColumn = this.createSyntheticColumn(sye.occurrences, currentUser, sye);
      sye.syntheticColumn = syntheticColumn;
    }
  }

  public createTableSyntheticColumn(table: Table, currentUser: UserModel) {
    table.syntheticColumn = this.createSyntheticColumn(this.getAllOccurrences(table), currentUser);
  }

  // ---------------------------
  // DATA VIEW & ROWS DEFINITION
  // ---------------------------

  public getNames(occurrences: Array<OccurrenceModel>): Array<TableViewRowName> {
    const names: Array<TableViewRowName> = [];
    for (const occ of occurrences) {
      if (occ.level !== 'microcenosis') {
        for (const childOcc of occ.children) {
          const occLayer = childOcc.layer;
          if (childOcc.validations.length === 0) {
            // @Todo it should never append because an 'idiotaxon' level occurrence must have at less one validation !
          } else if (childOcc.validations.length === 1) {
            let name: string;
            name = childOcc.validations[0].repository === 'otherunknown' ? childOcc.validations[0].inputName : childOcc.validations[0].validatedName;
            const newName = {
              group: {id: 0, label: 'default'}, // Add a default group
              // group: {id: group.id, label: group.label}, // TEST
              layer: occLayer,
              repository: childOcc.validations[0].repository,
              repositoryIdNomen: childOcc.validations[0].repositoryIdNomen,
              repositoryIdTaxo: childOcc.validations[0].repositoryIdTaxo,
              name
            };
            names.push(newName);
          } else if (childOcc.validations.length > 1) {
            // @Todo it should not append most of the cases
            // @Todo check if there are several validations. Select a "prefered" one regarding app parameters, location, etc.
          }
        }
      } else {
        for (const childOcc of occ.children) {
          for (const grandChild of childOcc.children) {
            const occLayer = grandChild.layer;
            if (grandChild.validations.length === 0) {
              // @Todo it should never append because an 'idiotaxon' level occurrence must have at less one validation !
            } else if (grandChild.validations.length === 1) {
              let name: string;
              name = grandChild.validations[0].repository === 'otherunknown' ? grandChild.validations[0].inputName : grandChild.validations[0].validatedName;
              const newName = {
                group: {id: 0, label: 'default'}, // Add a default group
                layer: occLayer,
                repository: grandChild.validations[0].repository,
                repositoryIdNomen: grandChild.validations[0].repositoryIdNomen,
                repositoryIdTaxo: grandChild.validations[0].repositoryIdTaxo,
                name
              };
              names.push(newName);
            } else if (grandChild.validations.length > 1) {
              // @Todo it should not append most of the cases
              // @Todo check if there are several validations. Select a "prefered" one regarding app parameters, location, etc.
            }
          }
        }
      }
    }

    return names;
  }

  /**
   * Returns all child occurrences
   * @param occurrence if it's a microcenosis, returns idiotaxons level occurrences
   */
  public getChildOccurrences(occurrence: OccurrenceModel): Array<OccurrenceModel> {
    const childOcc: Array<OccurrenceModel> = [];
    if (occurrence.level !== 'microcenosis') {
      occurrence.children.forEach(child => {
        childOcc.push(child);
      });
    } else {
      occurrence.children.forEach(child => {
        child.children.forEach(grandChild => {
          childOcc.push(grandChild);
        });
      });
    }
    return childOcc;
  }

  public getCurrentTableDataView(): Observable<Array<TableRow>> {
    return of(this.createDataView(this.currentTable));
  }

  /**
   * Create the table data view that is usable by Handsontable library
   * It's a more flatten structure than original TableModel concept
   */
  private createDataView(table: Table): Array<TableRow> {
    console.log('CREATE DATA VIEW');
    const t0 = performance.now();
    // @ Todo Get row definition if table comes from db
    if (!table.rowsDefinition) { table.rowsDefinition = this.createRowsDefinition(table); }
    this.updateColumnsPositions(table);

    const rows: Array<TableRow> = [];

    const nbOccurrencesInTable = this.countOccurrencesInTable(table);

    for (const row of table.rowsDefinition) {
      const rowItem: TableRow = {} as TableRow;
      _.assign(rowItem, row); // As TableRow (ie rowItem) model extends TableRowDefinition (ie row) model, we can assign all row object values to the rowItem object

      if (row.type === 'group') {
        rowItem.items = [];

        for (const columnPositions of this.columnsPositions) {
          const syeOccs = table.sye[columnPositions.id].occurrences;
          const syeOccsIds = _.concat([], _.map(syeOccs, o => o.id));

          if (columnPositions.onlyShowSyntheticColumn) {
            // Only push synthetic column
            if (columnPositions.syntheticColumnPosition !== null) {
              rowItem.items.push({type: 'cellSynColValue', syeId: columnPositions.id, occurrenceId: null, value: null});
            }
          } else {
            // push relevés columns and synthetic column
            // sye contains one or several occurrences
            if (columnPositions.startColumnPosition !== columnPositions.endColumnPosition
                || columnPositions.startColumnPosition === columnPositions.endColumnPosition && columnPositions.endColumnPosition !== columnPositions.syntheticColumnPosition) {
              let n = 0;
              // push items
              for (let m = columnPositions.startColumnPosition; m <= columnPositions.endColumnPosition; m++) {
                rowItem.items.push({type: 'rowValue', syeId: columnPositions.id, occurrenceId: syeOccsIds[n], value: null});
                n++;
              }
              // push synthetic column item
              if (columnPositions.syntheticColumnPosition !== null) {
                rowItem.items.push({type: 'cellSynColValue', syeId: columnPositions.id, occurrenceId: null, value: null});
              }
            }
            // special case : sye is empty (only one synthtic column)
            if (columnPositions.syntheticColumnPosition === columnPositions.startColumnPosition && columnPositions.syntheticColumnPosition === columnPositions.endColumnPosition) {
              rowItem.items.push({type: 'cellSynColValue', syeId: columnPositions.id, occurrenceId: null, value: null});
            }
          }
        }

        // push table synthetic column item (if exists) + add 1 to counter
        // @Todo

        rowItem.count = nbOccurrencesInTable + table.sye.length;
        rows.push(rowItem);
      } else {
        rowItem.items = [];
        rowItem.count = nbOccurrencesInTable + table.sye.length;

        let minRowCoef = '?';
        let maxRowCoef = '?';

        // For every sye...
        for (const sye of table.sye) {
          // GET COLUMN POSITIONS
          const columnPositions = this.getColumnPositionsForSyeById(sye.syeId);
          if (columnPositions.onlyShowSyntheticColumn) {
            // Push synthetic column
            // row item push synthetic column value
            const syeItem = {type: null, syeId: null, occurrenceId: null, value: null};                                                                               // DUPLICATE CODE --A-- SEE BELOW
            syeItem.type = 'cellSynColValue';
            syeItem.syeId = sye.syeId;
            syeItem.occurrenceId = null;

            if (!sye.syntheticColumn || sye.syntheticColumn === null) {
              // @Todo notify user
              this.errorService.log('[Internal error] Try to create a new table dataView but no synthetic column provided');
            }
            for (const syeCellItem of sye.syntheticColumn.items) {
              // @Todo check that there is only one child occurrence that match the if statment
              if (syeCellItem.repositoryIdTaxo === row.repositoryIdTaxo && syeCellItem.layer === row.layer) {
                // synthetic column value to show
                // syeItem.value = syeCellItem.occurrencesCount + ' / ' + sye.occurrencesCount;
                syeItem.value = this.syntheticColumnService.getReadableCoef('roman', sye.occurrencesCount, syeCellItem.occurrencesCount, minRowCoef, maxRowCoef);     //
              }
            }
            rowItem.items.push(syeItem);

          } else {
            // Push relevés columns and synthetic columns
            // ...get child occurrences of each sye occurrence and create a row item
            for (const occ of sye.occurrences) {
              // Create occurrence row item
              const item = {type: null, syeId: null, occurrenceId: null, value: null};
              item.type = 'cellOccValue';
              item.syeId = sye.syeId;
              item.occurrenceId = occ.id;

              const childOcc = this.getChildOccurrences(occ);
              for (const cOcc of childOcc) {
                const cOccValidation = cOcc.validations.find(x => x !== undefined); // get the first available item (the first item could not be validations[0] !)
                // @Todo check that there is only one child occurrence that match the if statment
                //       (An occurrence can't contains several identical child occurrences)
                if (cOccValidation.repositoryIdTaxo) {
                  if (cOcc.layer === row.layer && cOccValidation.repositoryIdTaxo === row.repositoryIdTaxo) {
                    minRowCoef = minRowCoef === '?' ? cOcc.coef : this.isLowerCoef(minRowCoef, cOcc.coef) ? cOcc.coef : minRowCoef;
                    maxRowCoef = maxRowCoef === '?' ? cOcc.coef : this.isUpperCoef(maxRowCoef, cOcc.coef) ? cOcc.coef : maxRowCoef;
                    item.value = cOcc.coef;
                  }
                } else {
                  // Validation could not have a repositoryIdTaxo value if the repository is otherunknown
                }

              }
              rowItem.items.push(item);
            }
            // Create the sye synthetic column row item
            const syeItem = {type: null, syeId: null, occurrenceId: null, value: null};                                                                                 // DUPLICATE CODE --A-- SEE ABOVE
            syeItem.type = 'cellSynColValue';
            syeItem.syeId = sye.syeId;
            syeItem.occurrenceId = null;

            if (!sye.syntheticColumn || sye.syntheticColumn === null) {
              // @Todo notify user
              this.errorService.log('[Internal error] Try to create a new table dataView but no synthetic column provided');
            }
            for (const syeCellItem of sye.syntheticColumn.items) {
              // @Todo check that there is only one child occurrence that match the if statment
              if (syeCellItem.repositoryIdTaxo === row.repositoryIdTaxo && syeCellItem.layer === row.layer) {
                // synthetic column value to show
                // syeItem.value = syeCellItem.occurrencesCount + ' / ' + sye.occurrencesCount;
                syeItem.value = this.syntheticColumnService.getReadableCoef('roman', sye.occurrencesCount, syeCellItem.occurrencesCount, minRowCoef, maxRowCoef);       //
              }
            }
            rowItem.items.push(syeItem);
          }
        }
        rows.push(rowItem);
      }
    }
    this.updateGroupsPositions(table);
    this.updateColumnsPositions(table);
    const t1 = performance.now();
    // console.log(`createDataView took ${t1 - t0} milliseconds for +-${table.rowsDefinition.length} occurrences rows and ${nbOccurrencesInTable} occurrences columns`);
    return rows;
  }

  /**
   * @Todo Explain function
   */
  public createRowsDefinition(table: Table): Array<TableRowDefinition> {
    // rows definitions may alreayd exists
    // if (!table.rowsDefinitions || table.rowsDefinitions.length === 0) { }

    const rows: Array<TableRowDefinition> = [];
    const occurrences: Array<OccurrenceModel> = [];
    table.sye.forEach(sye => {
      occurrences.push(...sye.occurrences);
    });
    const names = this.getNames(occurrences);
    const uniquNames = _.uniqBy(names, n => n.layer + n.repository + n.repositoryIdTaxo);
    const uniquNamesGroupedByGroup = _.groupBy(uniquNames, un => un.group.id);

    let i = 0;
    _.forEach(uniquNamesGroupedByGroup, group => {
      const groupId = group[0].group.id;
      const groupTitle = group[0].group.label;

      const rowGroup: TableRowDefinition = {rowId: null, type: null, groupId: null, groupTitle: null, layer: null, displayName: null, repository: null, repositoryIdNomen: null, repositoryIdTaxo : null};
      rowGroup.rowId = i;
      rowGroup.type = 'group';
      rowGroup.groupId = groupId;
      rowGroup.groupTitle = groupTitle;
      rowGroup.displayName = groupTitle;
      rows.push(rowGroup);
      i++;

      for (const nameItem of group) {
        const row: TableRowDefinition = {rowId: null, type: null, groupId: null, groupTitle: null, layer: null, displayName: null, repository: null, repositoryIdNomen: null, repositoryIdTaxo : null};
        row.rowId = i;
        row.type = 'data';
        row.groupId = groupId;
        row.groupTitle = groupTitle;
        row.layer = nameItem.layer;
        row.displayName = nameItem.name;
        row.repository = nameItem.repository;
        row.repositoryIdNomen = nameItem.repositoryIdNomen;
        row.repositoryIdTaxo = nameItem.repositoryIdTaxo;

        rows.push(row);
        i++;
      }
    });
    return rows;
  }

  /**
   * Compare oldTable rowsDefinition to newTable rowDef and returns
   * the oldTable rowsDefinition with newest elements founded in newTable
   * The new elements are added in a new group
   */
  public updateRowsDefinition(oldTable: Table, newTable: Table): Array<TableRowDefinition> {
    if (oldTable == null || newTable == null) { return; }
    if (oldTable.rowsDefinition == null || oldTable.rowsDefinition.length === 0) {
      return this.createRowsDefinition(newTable);
    }

    const oldRowDef = oldTable.rowsDefinition;
    const newRowDef = this.createRowsDefinition(newTable);

    if (oldRowDef == null || newRowDef == null || oldRowDef.length === 0 || newRowDef.length === 0) {
      return this.createRowsDefinition(newTable);
    }

    // Is there new elements ?
    const newElements = _.filter(newRowDef, nrd => {
      if (nrd.type === 'data') {
        return null == _.find(oldRowDef, ord => ord.repository === nrd.repository
                                         && ord.layer === nrd.layer
                                         // && ord.repositoryIdNomen === nrd.repositoryIdNomen
                                         && ord.repositoryIdTaxo === nrd.repositoryIdTaxo);
      }
    });


    if (newElements !== null && newElements.length > 0) {
      // Append new elements to a new group
      const extendedRowDef = _.clone(oldRowDef);
      let nextRowId = oldRowDef.length;
      const nextGroupId = _.max(_.map(oldRowDef, o => o.groupId)) + 1;

      // row group
      const newGroupRow: TableRowDefinition = {
        rowId:             nextRowId,
        type:              'group',
        groupId:           nextGroupId,
        groupTitle:        'Données ajoutées',
        layer:             null,
        displayName:       'Données ajoutées',
        repository:        null,
        repositoryIdNomen: null,
        repositoryIdTaxo:  null,
      };
      nextRowId++;

      // rows data
      for (const row of newElements) {
        row.rowId         = nextRowId;
        row.groupId       = nextGroupId;
        row.groupTitle    = 'Données ajoutées';

        nextRowId++;
      }

      // Append rows
      extendedRowDef.push(newGroupRow);
      extendedRowDef.push(...newElements);

      return extendedRowDef;
    }
  }

  // --------
  // ROW MOVE
  // --------
  /**
   * Before the rows are moved into the view (ie Handsontable view), we move them from the model
   * If the model can be updated, return true, else return false and then, we prevent Handsontable to move rows
   * @param rows contains an array of visual rows position that are going to be moved
   * @param target contains the target row position
   */
  public beforeRowMove(rows: Array<number>, target: number): boolean | {movedRowsStart: number, movedRowsEnd: number} {
    const startRowPosition = _.min(rows);
    const endRowPosition = _.max(rows);

    // If we move row(s) at a target position that is higher than the length of the moved rows (ie rows are moved lower in the table)
    // we have to calculte a new target for cases 1c., 2. & 3. because in these cases :
    //   - first we SPLICE rows in this.currentTable.rowsDefinition so rowsDefinition[] indexes changes and we have to calculate a rectified target
    //   - and then we insert the spliced rows at the rectifiedTarget position
    //
    // eg case 2. splice code :
    // this.currentTable.rowsDefinition.splice(rectifiedTarget, 0, ...this.currentTable.rowsDefinition.splice(firstRowMoved, lastRowMoved - firstRowMoved + 1));
    //                                         |                   |-> 1st we splice and so rowsDefinition indexes changes / ie initial target = 10 and we spliced 2 rows, rectifiedTart = (10 - 2)
    //                                         |-> 2nd we insert spliced rows
    let rectifiedTarget: number = target;

    // Update groupsPositions
    this.updateGroupsPositions(this.currentTable);

    if (target > rows[0] && target > rows[rows.length - 1]) {
      rectifiedTarget = target - rows.length;
      if (rectifiedTarget < 0) { rectifiedTarget = 0; }
      // target = rectifiedTarget;
    }

    const firstRowMoved = startRowPosition;
    const lastRowMoved = endRowPosition;

    // Check moved rows belongs to only one group
    // @Todo / already done in TableComponent

    // Get moved group and target group
    const belongingMovedGroup = this.getBelongingMovedGroup(rows);
    const belongingTargetGroup = this.getBelongingTargetGroup(target);

    // belongingMovedGroup && belongingTargetGroup must be defined
    if (belongingMovedGroup && belongingMovedGroup.groupId === null || belongingTargetGroup && belongingTargetGroup.groupId === null) {
      // @Todo manage error and notify user
      return false;
    }

    // 1. Entire group move
    if (startRowPosition === belongingMovedGroup.titleRowPosition) {
      // can't move group inside another
      // lately, we should implement this functionnality : if a group is moved inside another one, move entire group under or above the target group
      // for now, disabled
      // note : exception if target is the last row of the table
      if (target >= belongingTargetGroup.startRowPosition && target <= belongingTargetGroup.endRowPosition && target !== this.currentTable.rowsDefinition.length) {
        // @Todo notify user "Vous ne pouvez pas déplacer un groupe à l'intérieur d'un autre"
        this.notificationService.warn('Vous ne pouvez pas déplacer un groupe à l\'intérieur d\'un autre');
        return false;
      }
      // move group...

      // splice rows to be moved
      // this alterate this.currentTable.rowsDefinition
      // after this operation, use the rectifiedTarget !
      const rowsToBeMoved = this.spliceGroupWhithinTableRowsDefinitionById(belongingMovedGroup.groupId);

      this.updateGroupsPositions(this.currentTable);

      // groups positions have change because we splice rowsToBeMoved from this.currentTable.rowsDefinitions
      // so we must get the new target group
      const newBelongingTargetGroup = this.getGroupPositionsById(this.currentTable, belongingTargetGroup.groupId);

      // insert rowsToBeMoved
      if (rectifiedTarget === 0) {
        /// 1a. move at the top of the table
        this.insertRowsAboveGroup(rowsToBeMoved, this.groupsPositions[0]);
      } else if (rectifiedTarget > 0 && rectifiedTarget < this.currentTable.rowsDefinition.length) {
        // 1b. move under target group
        this.insertRowsUnderGroup(rowsToBeMoved, newBelongingTargetGroup);
      } else if (rectifiedTarget === this.currentTable.rowsDefinition.length) {
        // 1c. move at the bottom of the table
        this.insertRowsAtTheBottom(rowsToBeMoved);
      } else {
        // @Todo log 'Nous ne parvenons pas à modifier le tableau'
        return false;
      }

      this.updateGroupsPositions(this.currentTable);

      // update rowId values
      let j = 0; for (const row of this.currentTable.rowsDefinition) { row.rowId = j; j++; }

      // Emit new dataView
      // Maybe we should improve by updating only the dataView instead of creating a new one servered to handsontable instance...
      this.tableDataView.next(this.createDataView(this.currentTable));

      // return
      const movedGroupNewRowsPositions = this.getGroupPositionsById(this.currentTable, belongingMovedGroup.groupId);
      return {movedRowsStart: movedGroupNewRowsPositions.titleRowPosition, movedRowsEnd:  movedGroupNewRowsPositions.endRowPosition};
    }

    // 2. Rows are moved into the same group
    if (belongingMovedGroup.groupId === belongingTargetGroup.groupId) {
      // move rows
      this.currentTable.rowsDefinition.splice(rectifiedTarget, 0, ...this.currentTable.rowsDefinition.splice(firstRowMoved, lastRowMoved - firstRowMoved + 1));

      // update rowId values
      let i = 0; for (const row of this.currentTable.rowsDefinition) { row.rowId = i; i++; }

      // update groupsPositions
      this.updateGroupsPositions(this.currentTable);

      // Emit new dataView
      // Maybe we should improve by updating only the dataView instead of creating a new one servered to handsontable instance...
      this.tableDataView.next(this.createDataView(this.currentTable));

      // return
      const firstRowToSelect = rectifiedTarget;
      return {movedRowsStart: firstRowToSelect, movedRowsEnd:  firstRowToSelect + lastRowMoved - firstRowMoved};
    }

    // 3. Rows are moved between groups
    if (belongingMovedGroup.groupId !== belongingTargetGroup.groupId) {
      // move rows
      this.currentTable.rowsDefinition.splice(rectifiedTarget, 0, ...this.currentTable.rowsDefinition.splice(firstRowMoved, lastRowMoved - firstRowMoved + 1));

      // update rowId values
      let j = 0; for (const row of this.currentTable.rowsDefinition) { row.rowId = j; j++; }

      // update groupId and groupTitle with belongingTargetGroup values for moved rows
      for (let index = 0; index < rows.length; index++) {
        this.currentTable.rowsDefinition[rectifiedTarget + index].groupId = belongingTargetGroup.groupId;
        this.currentTable.rowsDefinition[rectifiedTarget + index].groupTitle = belongingTargetGroup.label;
      }

      // update groupsPositions
      this.updateGroupsPositions(this.currentTable);

      // Emit new dataView
      // Maybe we should improve by updating only the dataView instead of creating a new one servered to handsontable instance...
      this.tableDataView.next(this.createDataView(this.currentTable));

      // return
      const firstRowToSelect = rectifiedTarget;
      return {movedRowsStart: firstRowToSelect, movedRowsEnd:  firstRowToSelect + lastRowMoved - firstRowMoved};
    }

    return false;
  }

  /**
   * Returns the group that is being moved
   * @param movedRows is an array of number representing the rows offsets that are moved
   */
  private getBelongingMovedGroup(movedRows: Array<number>): GroupPositions | null {
    const firstRowMoved = _.min(movedRows);
    const lastRowMoved  = _.max(movedRows);
    for (const groupPositions of this.groupsPositions) {
      if (firstRowMoved === groupPositions.titleRowPosition) {
        return groupPositions;
      } else if (firstRowMoved >= groupPositions.startRowPosition && lastRowMoved <= groupPositions.endRowPosition) {
        return groupPositions;
      }
    }
    return null;
  }

  /**
   * Returns the target group
   * @param target is the row target
   */
  private getBelongingTargetGroup(target: number): GroupPositions | null {
    let g = 0;
    for (const groupPositions of this.groupsPositions) {
      // If target === 0 (start table)
      if (target === 0) {
        return this.groupsPositions[0];
      }
      // If 1st row is a group title
      // If rows are moved in an empty group
      if (groupPositions.startRowPosition === groupPositions.endRowPosition && groupPositions.startRowPosition === groupPositions.titleRowPosition && target === groupPositions.titleRowPosition + 1) {
        return groupPositions;
      }
      // If rows are moved at the end of a group
      if (target === groupPositions.titleRowPosition && target !== 0) {
        return this.groupsPositions[g - 1];
      }
      // If rows are moved at the end of the table
      if (g === this.groupsPositions.length - 1 && target === groupPositions.endRowPosition + 1) {
        return groupPositions;
      }
      // Else, rows are moved inside an existing group rows interval
      if (target >= groupPositions.startRowPosition && target <= groupPositions.endRowPosition) {
        return groupPositions;
      }
      g++;
    }
    return null;
  }

  /**
   * Splice and return a group within this.groupsPositions
   * Be careful, this function alterates this.groupsPositions
   */
  private spliceGroupWhithinTableRowsDefinitionById(id: number) {
    const groupToSplice = this.getGroupPositionsById(this.currentTable, id);
    const splicedGroup = this.currentTable.rowsDefinition.splice(groupToSplice.titleRowPosition, groupToSplice.endRowPosition - groupToSplice.titleRowPosition + 1);
    return splicedGroup ? splicedGroup : null;
  }

  private insertRowsAboveGroup(rowsToInsert: Array<TableRowDefinition>, aboveGroup: GroupPositions): void {
    let positionToInsert = aboveGroup.titleRowPosition;
    if (positionToInsert < 0 ) { positionToInsert = 0; }
    this.currentTable.rowsDefinition.splice(aboveGroup.titleRowPosition, 0, ...rowsToInsert);
  }

  private insertRowsUnderGroup(rowsToInsert: Array<TableRowDefinition>, underGroup: GroupPositions): void {
    let positionToInsert = underGroup.endRowPosition + 1;
    if (positionToInsert > this.currentTable.rowsDefinition.length) { positionToInsert = this.currentTable.rowsDefinition.length; }
    this.currentTable.rowsDefinition.splice(positionToInsert, 0, ...rowsToInsert);
  }

  private insertRowsAtTheBottom(rowsToInsert: Array<TableRowDefinition>): void {
    this.currentTable.rowsDefinition.push(...rowsToInsert);
  }

  /**
   * Create a new rows group
   */
  public moveRangeRowsToNewGroup(startRowPosition: number, endRowPosition: number): {success: boolean, newGroupId: number} {
    this.updateGroupsPositions(this.currentTable);

    // get rows groups positions
    const startRowGroupPositions = this.getGroupPositionsForRowId(this.currentTable, startRowPosition);
    const endRowGroupPositions = this.getGroupPositionsForRowId(this.currentTable, endRowPosition);

    if (startRowGroupPositions !== endRowGroupPositions) {
      this.notificationService.warn('Impossible de créer un nouveau groupe à partir de ces lignes');
      return;
    }

    const splicedGroupId = startRowGroupPositions.groupId;

    let sourceRowDefinitionsIndex: number = null;
    // let sourceRowDefinitions: TableRowDefinition = null;
    let i = 0;
    for (const rowsGroupDef of this.currentTable.rowsDefinition) {
      if (rowsGroupDef.groupId === splicedGroupId) { sourceRowDefinitionsIndex = i; break; }
      i++;
    }

    if (sourceRowDefinitionsIndex !== null) {
      // splice occurrences
      const splicedRows = this.currentTable.rowsDefinition.splice(startRowPosition, (endRowPosition - startRowPosition + 1));

      // count groups
      let nbGroups = 0;
      const groupsIds = _.map(_.uniqBy(this.currentTable.rowsDefinition, rDef => rDef.groupId), row => row.rowId);
      nbGroups = groupsIds.length;
      const newGroupId = nbGroups;

      // create a new title row
      const newTitleRow: TableRowDefinition = {rowId: null, type: null, groupId: null, groupTitle: null, layer: null, displayName: null, repository: null, repositoryIdNomen: null, repositoryIdTaxo : null};
      // newTitleRow.rowId = startRowGroupPositions.endRowPosition + 1;
      newTitleRow.type = 'group';
      newTitleRow.groupId = newGroupId;
      newTitleRow.groupTitle = 'Nouveau groupe';
      newTitleRow.displayName = 'Nouveau groupe';

      // update spliced rows groupId
      let j = 1;
      for (const splicedRow of splicedRows) {
        // splicedRow.rowId = startRowGroupPositions.endRowPosition + j + 1;
        splicedRow.groupId = newGroupId;
        j++;
      }

      // place new group title after spliced elements
      this.currentTable.rowsDefinition.splice(startRowGroupPositions.endRowPosition - splicedRows.length + 1, 0, newTitleRow);

      // move spliced rows after new group title
      this.currentTable.rowsDefinition.splice(startRowGroupPositions.endRowPosition - splicedRows.length  + 2, 0, ...splicedRows);

      // update row ids
      let rId = 0;
      for (const row of this.currentTable.rowsDefinition) {
        row.rowId = rId;
        rId++;
      }

      // emit new dataView
      this.tableDataView.next(this.createDataView(this.currentTable));

      return {success: true, newGroupId};
    }

    // @Todo notify user
    return {success: false, newGroupId: null};
  }

  /**
   * Move a row group 1 level below
   */
  public moveGroupToBottom(startRowPosition: number): boolean | {movedRowsStart: number, movedRowsEnd: number} {
    const belongingRowsGroup = this.getGroupPositionsForRowId(this.currentTable, startRowPosition);
    const nextGroupPositions = this.getNextGroupPositionsForRowId(this.currentTable, startRowPosition);

    if (belongingRowsGroup.groupId === nextGroupPositions.groupId) { return false; } // Can't move anymore, end of table

    if (nextGroupPositions) {
      const splicedRows = this.currentTable.rowsDefinition.splice(belongingRowsGroup.titleRowPosition, belongingRowsGroup.endRowPosition - belongingRowsGroup.titleRowPosition + 1);
      this.currentTable.rowsDefinition.splice(nextGroupPositions.endRowPosition - splicedRows.length + 1, 0, ...splicedRows);

      this.updateGroupsPositions(this.currentTable);

      // update rowId values
      let j = 0; for (const row of this.currentTable.rowsDefinition) { row.rowId = j; j++; }

      // Emit new dataView
      // Maybe we should improve by updating only the dataView instead of creating a new one servered to handsontable instance...
      this.tableDataView.next(this.createDataView(this.currentTable));

      // return
      const newMovedGroupPositions = this.getGroupPositionsById(this.currentTable, belongingRowsGroup.groupId);
      return { movedRowsStart: newMovedGroupPositions.startRowPosition, movedRowsEnd: newMovedGroupPositions.endRowPosition };
    }
    return false;
  }

  /**
   * Move a row group 1 level above
   */
  public moveGroupToTop(startRowPosition: number): boolean | {movedRowsStart: number, movedRowsEnd: number} {
    const belongingRowsGroup = this.getGroupPositionsForRowId(this.currentTable, startRowPosition);
    const previousGroupPositions = this.getPreviousGroupPositionsForRowId(this.currentTable, startRowPosition);

    if (belongingRowsGroup.groupId === previousGroupPositions.groupId) { return false; } // Can't move anymore, end of table

    if (previousGroupPositions) {
      const splicedRows = this.currentTable.rowsDefinition.splice(belongingRowsGroup.titleRowPosition, belongingRowsGroup.endRowPosition - belongingRowsGroup.titleRowPosition + 1);
      this.currentTable.rowsDefinition.splice(previousGroupPositions.titleRowPosition, 0, ...splicedRows);

      this.updateGroupsPositions(this.currentTable);

      // update rowId values
      let j = 0; for (const row of this.currentTable.rowsDefinition) { row.rowId = j; j++; }

      // Emit new dataView
      // Maybe we should improve by updating only the dataView instead of creating a new one servered to handsontable instance...
      this.tableDataView.next(this.createDataView(this.currentTable));

      // return
      const newMovedGroupPositions = this.getGroupPositionsById(this.currentTable, belongingRowsGroup.groupId);
      return { movedRowsStart: newMovedGroupPositions.startRowPosition, movedRowsEnd: newMovedGroupPositions.endRowPosition };
    }
    return false;
  }

  // -----------
  // ROW SORTING
  // -----------
  public sortRowsByFrequency(sorteredSye: Sye, order: 'asc' | 'desc', startRow: number, endRow: number): void {
    let syntheticColumn: SyntheticColumn;
    if (sorteredSye === null) {
      syntheticColumn = this.currentTable.syntheticColumn;
    } else {
      syntheticColumn = sorteredSye.syntheticColumn;
    }

    let titleGroupsBeforeSelectionCount = 1;
    for (const groupPostions of this.groupsPositions) {
      if (startRow >= groupPostions.startRowPosition && endRow <= groupPostions.endRowPosition) { break; }
      titleGroupsBeforeSelectionCount++;
    }

    // const syntheticColumnPart = syntheticColumn.items.splice(startRow - titleGroupsBeforeSelectionCount, endRow - startRow + 1);
    const splicedRows = this.currentTable.rowsDefinition.splice(startRow, endRow - startRow + 1);
    // synthetic column is not ordered
    const syntheticColumnPart = [];
    for (const rowDefinition of splicedRows) {
      let exists = false;
      for (const synthPart of syntheticColumn.items) {
        if (synthPart.repositoryIdTaxo === rowDefinition.repositoryIdTaxo
            && synthPart.layer === rowDefinition.layer) {
              exists = true;
              syntheticColumnPart.push(synthPart);
            }
      }
      if (!exists) {
        const fakeSyntheticItem: SyntheticItem = {id: null, userId: null, userEmail: null, userPseudo: null, repository: null, repositoryIdNomen: null, repositoryIdTaxo: null, displayName: null, layer: null, isOccurrenceCountEstimated: false, occurrencesCount: 0, frequency: 0};
        syntheticColumnPart.push(fakeSyntheticItem);
      }
    }

    const syntheticColumnFrequencies = _.map(syntheticColumnPart, item => item.frequency);

    // const splicedRows = this.currentTable.rowsDefinition.splice(startRow, endRow - startRow + 1);
    const splicedRowsWithFrequency: Array<{row: TableRowDefinition, frequency: number}> = [];

    if (syntheticColumnFrequencies.length === splicedRows.length) {
      for (let index = 0; index < splicedRows.length; index++) {
        splicedRowsWithFrequency.push({row: splicedRows[index], frequency: syntheticColumnFrequencies[index]});
      }
      const sorteredRowsWithFrequency = _.orderBy(splicedRowsWithFrequency, item => item.frequency, order); // sorting
      const sorteredRows = _.map(sorteredRowsWithFrequency, item => item.row);
      this.currentTable.rowsDefinition.splice(startRow, 0, ...sorteredRows);

      this.tableDataView.next(this.createDataView(this.currentTable));
    } else {
      // @Todo manage error
      console.log('syntheticColumnFrequencies.length !== splicedRows.length');
    }
  }

  // -----------
  // ROW HELPERS
  // -----------

  updateGroupsPositions(table: Table): void {
    const groupsPositions: Array<GroupPositions> = [];

    let h = 0;
    table.rowsDefinition.forEach(row => {
      if (row.type === 'group') { groupsPositions.push({ groupId: row.groupId, label: row.groupTitle, titleRowPosition: h, startRowPosition: null, endRowPosition: null }); }
      h++;
    });
    groupsPositions.forEach(group => {
      let i = 0;
      let startGroupPos = null;
      let endGroupPos = 0;
      let j = 0;
      let nbDataItemsInGroup = 0;
      table.rowsDefinition.forEach(row => {
        if (row.type === 'data' && row.groupId === group.groupId) {
          nbDataItemsInGroup++;
          if (!startGroupPos) { startGroupPos = j; }
          endGroupPos = j;
        }
        j++;
      });
      if (nbDataItemsInGroup === 0) {
        group.startRowPosition = group.titleRowPosition;
        group.endRowPosition = group.titleRowPosition;
      } else {
        group.startRowPosition = startGroupPos;
        group.endRowPosition = endGroupPos;
      }
      i++;
    });
    this.groupsPositions = groupsPositions;
  }

  getGroupPositionsForRowId(table: Table, rowId: number): GroupPositions {
    if (this.groupsPositions.length === 0) { this.updateGroupsPositions(table); }
    for (const groupPositions of this.groupsPositions) {
      if (groupPositions.titleRowPosition === rowId || (groupPositions.startRowPosition <= rowId && groupPositions.endRowPosition >= rowId)) { return groupPositions; }
    }
    return undefined;
  }

  getNextGroupPositionsForRowId(table: Table, rowPosition: number): GroupPositions {
    if (this.groupsPositions.length === 0) { this.updateGroupsPositions(table); }
    let currentGroupPositionIndex: number;
    let i = 0;

    for (const groupPositions of this.groupsPositions) {
      if (groupPositions.titleRowPosition === rowPosition || (groupPositions.startRowPosition <= rowPosition && groupPositions.endRowPosition >= rowPosition)) {
        currentGroupPositionIndex = i;
        if (groupPositions.titleRowPosition === rowPosition) { return this.groupsPositions[i]; }
      }
      i++;
    }

    if (currentGroupPositionIndex === this.groupsPositions.length - 1) {
      return this.groupsPositions[this.groupsPositions.length - 1];
    } else if (this.groupsPositions.length >= currentGroupPositionIndex + 1) {
      return this.groupsPositions[currentGroupPositionIndex + 1];
    }
    return undefined;
  }

  getPreviousGroupPositionsForRowId(table: Table, rowPosition: number): GroupPositions {
    if (this.groupsPositions.length === 0) { this.updateGroupsPositions(table); }
    let currentGroupPositionIndex: number;
    let i = 0;

    for (const groupPositions of this.groupsPositions) {
      if (groupPositions.titleRowPosition === rowPosition || (groupPositions.startRowPosition <= rowPosition && groupPositions.endRowPosition >= rowPosition)) {
        currentGroupPositionIndex = i;
      }
      i++;
    }

    if (currentGroupPositionIndex === 0) {
      return this.groupsPositions[0];
    } else if (this.groupsPositions.length >= currentGroupPositionIndex - 1) {
      return this.groupsPositions[currentGroupPositionIndex - 1];
    }
    return undefined;
  }

  getGroupPositionsById(table: Table, groupId: number): GroupPositions {
    if (this.groupsPositions.length === 0) { this.updateGroupsPositions(table); }
    return _.find(this.groupsPositions, g => g.groupId === groupId);
  }

  isMultipleGroupsSelected(table: Table, selectedRowStart: number, selectedRowEnd: number): boolean {
    const groupStart = this.getGroupPositionsForRowId(table, selectedRowStart);
    const groupEnd = this.getGroupPositionsForRowId(table, selectedRowEnd);
    return groupStart.groupId !== groupEnd.groupId ? true : false;
  }

  getRowOccurrenceByRowId(id: number): TableRowDefinition {
    if (!this.currentTable || !this.currentTable.rowsDefinition) { return null; }
    for (const row of this.currentTable.rowsDefinition) {
      if (row.rowId === id) { return row; }
    }
  }

  // ------------
  // COLUMNS MOVE
  // ------------
  /**
   * Before handontable moves a column
   *   - we splice occurrences
   *   - and then emit new dataView
   *
   * I first tried to only "redraw handsontable data" when its absolutly necessary : when columns are moved from a sye to another
   * But handsontable doesn't bind columns order, it only bind data !!
   * So we emit new dataView for any column move
   * It should be better to implement a time-saver solution because loading new data into handsontable take 100x more time than just for ie moving a column whithout reloading data
   */
  public beforeColumnMove(columns: Array<number>, target: number, currentUser: UserModel): boolean | {movedColumnsStart: number, movedColumnsEnd: number} {
    const startColPosition = _.min(columns);
    const endColPosition = _.max(columns);
    const movingDirection: 'ltr' | 'rtl' = startColPosition < target ? 'ltr' : 'rtl';

    let sourceIndex: number;       // target whithin the source sye
    const nbColumnsToMove = _.max(columns) - _.min(columns) + 1;
    let targetIndex: number;  // target whithin the destination sye

    // Update columnsPositions
    this.updateColumnsPositions(this.currentTable);

    // Get sye columns & syeId that moved columns (source) belong to
    let sourceSyeColumnsDef: ColumnPositions = null;
    const firstColMoved = startColPosition;
    const lastColMoved = endColPosition;
    this.columnsPositions.forEach(columnPositions => {
      if (firstColMoved >= columnPositions.startColumnPosition && lastColMoved <= columnPositions.syntheticColumnPosition) {
        sourceSyeColumnsDef = columnPositions;
      }
    });

    // Get sye columnPositions that the target belong to
    let destinationSyeColumnsDef: ColumnPositions = null;
    this.columnsPositions.forEach(columnPositions => {
      // if columns are moved in an empty sye
      if (columnPositions.startColumnPosition === columnPositions.endColumnPosition && target === columnPositions.syntheticColumnPosition - 1) {
        destinationSyeColumnsDef = columnPositions;
      }
      // if columns are moved at the end of a sye
      if (target === columnPositions.syntheticColumnPosition && target !== 0) {
        destinationSyeColumnsDef = columnPositions;
      }
      // if columns are moved at the end of the table
      // @Todo should we create a new sye in this case ?

      // else, columns are moved inside an existing sye columns interval
      if (target >= columnPositions.startColumnPosition && target <= columnPositions.endColumnPosition) {
        destinationSyeColumnsDef = columnPositions;
      }
    });

    // Set targets
    sourceIndex = startColPosition - 1;
    targetIndex = target - 1;
    for (const columnPositions of this.columnsPositions) {
      if (sourceSyeColumnsDef.id === columnPositions.id) { break; }
      sourceIndex -= (columnPositions.syntheticColumnPosition - columnPositions.startColumnPosition + 1);
    }

    // Destination target inside sye target = rectifiedtargetIndex - [all previous sye length]
    if (destinationSyeColumnsDef !== null) {
      for (const columnPositions of this.columnsPositions) {
        if (destinationSyeColumnsDef.id === columnPositions.id) { break; }
        targetIndex -= (columnPositions.syntheticColumnPosition - columnPositions.startColumnPosition + 1);
      }
    } else {
      // No defined target
      // this could happen only if we move an entire sye at the end of the table
      if (startColPosition !== sourceSyeColumnsDef.startColumnPosition && endColPosition !== sourceSyeColumnsDef.syntheticColumnPosition) {
        this.notificationService.warn('Vous ne pouvez pas déplacer des colonnes en dehors d\'un groupe existant');
        return false;
      }
    }

    // 1. Entire sye move
    if (startColPosition === sourceSyeColumnsDef.startColumnPosition && endColPosition === sourceSyeColumnsDef.syntheticColumnPosition) {
      let splicedSye: Array<Sye> = null;
      // get source sye props
      const syeSource: Sye = _.find(this.currentTable.sye, sye => sye.syeId === sourceSyeColumnsDef.id) as Sye;
      let syeSourcePositionInTable: number = null;
      let i = 0;
      for (const sye of this.currentTable.sye) {
        if (sye.syeId === syeSource.syeId) { syeSourcePositionInTable = i; break; }
        i++;
      }

      if (destinationSyeColumnsDef === null) {
        // no target sye
        // move sye at the end of the table
        splicedSye = this.currentTable.sye.splice(syeSourcePositionInTable, 1);
        this.currentTable.sye.splice(this.currentTable.sye.length, 0, ...splicedSye);
      } else {
        // get target sye props
        const syeTarget: Sye = _.find(this.currentTable.sye, sye => sye.syeId === destinationSyeColumnsDef.id) as Sye;
        let syeTargetPositionInTable: number = null;
        let j = 0;
        for (const sye of this.currentTable.sye) {
          if (sye.syeId === syeTarget.syeId) { syeTargetPositionInTable = j; break; }
          j++;
        }
        // move sye
        splicedSye = this.currentTable.sye.splice(syeSourcePositionInTable, 1);
        this.currentTable.sye.splice(syeTargetPositionInTable, 0, ...splicedSye);
      }

      // update sye occurrences count
      this.updateSyeCount(this.currentTable);

      // update columnsPositions
      this.updateColumnsPositions(this.currentTable);

      // Emit new dataView
      // Maybe we should improve by updating only the dataView instead of creating a new one servered to handsontable instance...
      this.tableDataView.next(this.createDataView(this.currentTable));

      // moved sye columns positions
      const movedSyeColumnsPosision = this.getSyePositionsById(this.currentTable, splicedSye[0].syeId);

      // table component afterColumnMove hook is in charge to manually select moved columns because
      return {movedColumnsStart: movedSyeColumnsPosision.startColumnPosition, movedColumnsEnd:  movedSyeColumnsPosision.syntheticColumnPosition};
    }

    // 2. Columns are moved into the same sye
    if (sourceSyeColumnsDef === destinationSyeColumnsDef) {
      // move occurrences
      this.currentTable.sye[sourceSyeColumnsDef.id].occurrences.splice(targetIndex, 0, ...this.currentTable.sye[sourceSyeColumnsDef.id].occurrences.splice(sourceIndex, nbColumnsToMove));

      // update sye occurrences count
      this.updateSyeCount(this.currentTable);

      // update columnsPositions
      this.updateColumnsPositions(this.currentTable);

      // Emit new dataView
      this.tableDataView.next(this.createDataView(this.currentTable));

      // table component afterColumnMove hook is in charge to manually select moved columns because
      const firstColumnToSelect = movingDirection === 'ltr' ? target - nbColumnsToMove : target;
      return {movedColumnsStart: firstColumnToSelect, movedColumnsEnd:  firstColumnToSelect + nbColumnsToMove - 1};
    }

    // 3. Columns are moved between sye
    if (sourceSyeColumnsDef !== destinationSyeColumnsDef && destinationSyeColumnsDef !== null) {
      const syeSource = _.find(this.currentTable.sye, sye => sye.syeId === sourceSyeColumnsDef.id);
      const syeTarget = _.find(this.currentTable.sye, sye => sye.syeId === destinationSyeColumnsDef.id);

      // move occurrences
      syeTarget.occurrences.splice(targetIndex, 0, ...syeSource.occurrences.splice(sourceIndex, nbColumnsToMove));

      // create new synthetic columns
      syeSource.syntheticColumn = this.createSyntheticColumn(syeSource.occurrences, currentUser, syeSource);
      syeTarget.syntheticColumn = this.createSyntheticColumn(syeTarget.occurrences, currentUser, syeTarget);

      // update sye occurrences count
      this.updateSyeCount(this.currentTable);

      // update columnsPositions
      this.updateColumnsPositions(this.currentTable);

      // Emit new dataView
      this.tableDataView.next(this.createDataView(this.currentTable));

      // table component afterColumnMove hook is in charge to manually select moved columns because
      const firstColumnToSelect = movingDirection === 'ltr' ? target - nbColumnsToMove : target;
      return {movedColumnsStart: firstColumnToSelect, movedColumnsEnd:  firstColumnToSelect + nbColumnsToMove - 1};
    }

    return false;
  }

  public moveRangeColumnsToNewSye(startColPosition: number, endColPosition: number, currentUser: UserModel): {success: boolean, newSyeId: number} {
    if (this.columnsPositions.length === 0) { this.updateColumnsPositions(this.currentTable); }

    // get source sye, source index and source columns whithin this sye
    const targetObj = this.getSyeIndexPositionsColumnsFromVisualColumn(this.currentTable, startColPosition);
    const sourceSye = targetObj.sye;
    const syeIndexInTable = targetObj.syeIndexInTable;
    const sourceIndex = targetObj.index;
    const sourceColPositions = targetObj.columnPositions;

    if (sourceSye !== null && sourceIndex !== null && sourceColPositions !== null) {
      // splice occurrences
      const splicedOccurrences = sourceSye.occurrences.splice(sourceIndex, (endColPosition - startColPosition + 1));

      // create a new sye with spliced occurrences
      const newSye = this.syeService.createSye(this.currentTable.sye.length);
      newSye.occurrences = splicedOccurrences;
      newSye.syntheticColumn = this.createSyntheticColumn(newSye.occurrences, currentUser, newSye);

      // place new sye after spliced one in current table
      this.currentTable.sye.splice(syeIndexInTable  + 1, 0, newSye);

      // update sye occurrences count
      this.updateSyeCount(this.currentTable);

      // update source sye synthetic column
      sourceSye.syntheticColumn = this.createSyntheticColumn(sourceSye.occurrences, currentUser, sourceSye);

      // emit new dataView
      this.tableDataView.next(this.createDataView(this.currentTable));

      return {success: true, newSyeId: newSye.syeId};
    }

    // @Todo notify user;
    return {success: false, newSyeId: null};
  }

  public moveSyeToRight(currentCol: number): boolean | {positions: ColumnPositions} {
    const sourceSye = this.getSyeForColId(this.currentTable, currentCol);
    const nextSourceSyePositions = this.getNextSyePositionsForColId(this.currentTable, currentCol);

    if (nextSourceSyePositions) {
      // move source Sye 1 step after Sye
      let syeSourcePositionInTable: number = null;
      let i = 0;
      for (const sye of this.currentTable.sye) {
        if (sye.syeId === sourceSye.syeId) { syeSourcePositionInTable = i; break; }
        i++;
      }

      let syeTargetPositionInTable: number;
      if (syeSourcePositionInTable === this.currentTable.sye.length - 1 ) { return false; } else { syeTargetPositionInTable = syeSourcePositionInTable + 1; }
      const splicedSye = this.currentTable.sye.splice(syeSourcePositionInTable, 1);
      this.currentTable.sye.splice(syeTargetPositionInTable, 0, ...splicedSye);

      // Emit new dataView
      this.tableDataView.next(this.createDataView(this.currentTable));

      return { positions: this.getSyePositionsById(this.currentTable, sourceSye.syeId) };
    }
    return false;
  }

  public moveSyeToLeft(currentCol: number): boolean | {positions: ColumnPositions} {
    const sourceSye = this.getSyeForColId(this.currentTable, currentCol);
    const previousSourceSyePositions = this.getPreviousSyePositionsForColId(this.currentTable, currentCol);

    if (previousSourceSyePositions) {
      // move source Sye 1 step after Sye
      let syeSourcePositionInTable: number = null;
      let i = 0;
      for (const sye of this.currentTable.sye) {
        if (sye.syeId === sourceSye.syeId) { syeSourcePositionInTable = i; break; }
        i++;
      }

      let syeTargetPositionInTable: number;
      if (syeSourcePositionInTable === 0 ) { return false; } else { syeTargetPositionInTable = syeSourcePositionInTable - 1; }
      const splicedSye = this.currentTable.sye.splice(syeSourcePositionInTable, 1);
      this.currentTable.sye.splice(syeTargetPositionInTable, 0, ...splicedSye);

      // Emit new dataView
      this.tableDataView.next(this.createDataView(this.currentTable));

      return { positions: this.getSyePositionsById(this.currentTable, sourceSye.syeId) };
    }
    return false;
  }

  // --------------
  // COLUMN SORTING
  // --------------

  /**
   * Sort columns by frequency
   * @param order 'asc' or 'desc'
   * @param startCol postion
   * @param endCol position
   * @param coefArrayToSort optional. You can provide an array of array representing the visual table data to be sorted. Used for sorting partial columns (ie. table 'bloc')
   */
  public sortColumnsByFrequency(order: 'asc' | 'desc', startCol: number, endCol: number, coefArrayToSort?: Array<Array<any>>): void {
    const startColSye = this.getSyeForColId(this.currentTable, startCol);
    const endColSye = this.getSyeForColId(this.currentTable, endCol);

    if (startColSye !== endColSye) { /* @Todo log error */ console.log('trying to sort different sye'); return; }

    // get target sye and target index whithin this sye
    const targetObj = this.getSyeIndexPositionsColumnsFromVisualColumn(this.currentTable, startCol);
    const targetSye = targetObj.sye;
    const targetIndex = targetObj.index;
    const targetColPositions = targetObj.columnPositions;

    if (startCol >= targetColPositions.startColumnPosition && endCol <= targetColPositions.endColumnPosition && targetSye !== null) {

      // splice sye occurrences from targetIndex to (endCol - startCol + 1)
      const splicedOccurrences = targetSye.occurrences.splice(targetIndex, endCol - startCol + 1);

      // get sortable array
      const sortableArray: Array<number> = [];
      if (!coefArrayToSort) {
        for (const splicedOccurrence of splicedOccurrences) {
          const childrenOccurrences = this.getChildOccurrences(splicedOccurrence);
          childrenOccurrences ? sortableArray.push(childrenOccurrences.length) : sortableArray.push(0);
        }
      } else {
        const rowCount = coefArrayToSort.length;
        const colCount = coefArrayToSort[0].length;
        for (let col = 0; col < colCount; col++) {
          let colNbItems = 0;
          for (let row = 0; row < rowCount; row++) {
            if (coefArrayToSort[row][col] !== null) { colNbItems++; }
          }
          sortableArray.push(colNbItems);
        }
      }

      // merge spliced occurrences with sortable array
      const splicedOccurrencesWithCount: Array<{occurrence: OccurrenceModel, count: number}> = [];
      for (let index = 0; index < splicedOccurrences.length; index++) {
        splicedOccurrencesWithCount.push({occurrence: splicedOccurrences[index], count: sortableArray[index]});
      }

      // sort spliced occurrences
      const sorteredOccurrencesWithCount = _.orderBy(splicedOccurrencesWithCount, item => item.count, order);

      // replace sorted occurrences
      const sorteredOccurrences = _.map(sorteredOccurrencesWithCount, item => item.occurrence);
      targetSye.occurrences.splice(targetIndex, 0, ...sorteredOccurrences);

      this.tableDataView.next(this.createDataView(this.currentTable));
    }
  }

  // ---------------
  // COLUMNS HELPERS
  // ---------------

  /**
   * Update the table columns positions references
   * @Todo rename 'syePositions'
   */
  updateColumnsPositions(table: Table): void {
    const columnsPositions: Array<ColumnPositions> = [];

    let i = 0;

    for (const sye of table.sye) {
      i++;
      const columnPositions: ColumnPositions = {
        id: null, label: null, startColumnPosition: null, endColumnPosition: null, syntheticColumnPosition: null, onlyShowSyntheticColumn: sye.onlyShowSyntheticColumn
      };

      columnPositions.id = sye.syeId;
      columnPositions.label = 'sye';  // @Todo bind sye validation[x] name

      if (columnPositions.onlyShowSyntheticColumn) {
        columnPositions.startColumnPosition = i;
        columnPositions.endColumnPosition = i;
        columnPositions.syntheticColumnPosition = i;
      } else {
        columnPositions.startColumnPosition = i;
        columnPositions.endColumnPosition = sye.occurrences.length > 0 ? i + sye.occurrences.length - 1 : i;
        columnPositions.syntheticColumnPosition = i + sye.occurrences.length;
      }

      columnsPositions.push(columnPositions);
      i = columnPositions.onlyShowSyntheticColumn ? i : i + sye.occurrences.length;
    }
    this.columnsPositions = columnsPositions;
  }

   /**
    * Returns columns positions for a given visual column index
    * @param columnId : visual column index
    */
  getColumnPositionsForColumnId(columnId: number): ColumnPositions {
    for (const columnPositions of this.columnsPositions) {
      if (columnId >= columnPositions.startColumnPosition && columnId <= columnPositions.syntheticColumnPosition) {
        return columnPositions;
      }
    }
  }

  /**
   * Returns ColumnPositions for a given syeId
   * Be careful, columnPositions.id = sye.syeId;
   */
  getColumnPositionsForSyeById(syeId: number): ColumnPositions {
    for (const columnPositions of this.columnsPositions) {
      if (columnPositions.id === syeId) { return columnPositions; }
    }
    return null;
  }

  /**
   * Working on handsontable instance, columns indexes are visual indexes
   * Returns an object with sye, index and column positions that visual column index belongs to
   * Or return undefined
   */
  private getSyeIndexPositionsColumnsFromVisualColumn(table: Table, visulaColumnPosition: number): { sye: Sye, syeIndexInTable: number, index: number, columnPositions: ColumnPositions } {
    if (!this.columnsPositions || this.columnsPositions.length === 0) { this.updateColumnsPositions(this.currentTable); }

    let columnPositions: ColumnPositions = null;
    let syeId: number = null;
    let sye: Sye = null;
    let syeIndexInTable: number = null;

    // Get sye id & column positions
    for (const colPositions of this.columnsPositions) {
      if (visulaColumnPosition >= colPositions.startColumnPosition && visulaColumnPosition <= colPositions.syntheticColumnPosition) {
        columnPositions = colPositions;
        syeId = colPositions.id;
        break;
      }
    }
    if (syeId === null) { console.log(`STOP syeId: ${syeId}`); return undefined; }

    // Get sye
    let i = 0;
    for (const syeItem of table.sye) {
      if (syeItem.syeId === syeId) { sye = syeItem; syeIndexInTable = i; }
      i++;
    }
    if (sye === null) { console.log(`STOP sye: ${sye}`); return undefined; }

    // Get the index fo visual column index whithin sye
    let index = visulaColumnPosition - 1; // -1 for the first table column (names groups)
    for (const colPositions of this.columnsPositions) {
      if (sye.syeId === colPositions.id) { break; }
      index -= (colPositions.syntheticColumnPosition - colPositions.startColumnPosition + 1);
    }

    return {sye, syeIndexInTable, index, columnPositions};
  }

  getSyePositionsForColId(table: Table, colPosition: number): ColumnPositions {
    if (this.columnsPositions.length === 0) { this.updateColumnsPositions(table); }
    for (const columnPosition of this.columnsPositions) {
      if (columnPosition.syntheticColumnPosition === colPosition || (columnPosition.startColumnPosition <= colPosition && columnPosition.endColumnPosition >= colPosition)) { return columnPosition; }
    }
    return undefined;
  }

  getNextSyePositionsForColId(table: Table, colPosition: number): ColumnPositions {
    if (this.columnsPositions.length === 0) { this.updateColumnsPositions(table); }
    let currentColPositionIndex: number;
    let i = 0;
    for (const columnPosition of this.columnsPositions) {
      if (columnPosition.syntheticColumnPosition === colPosition || (columnPosition.startColumnPosition <= colPosition && columnPosition.endColumnPosition >= colPosition)) {
        currentColPositionIndex = i;
      }
      i++;
    }
    if (colPosition === 1) {
      return this.columnsPositions[0];
    } else if (currentColPositionIndex === this.columnsPositions.length - 1) {
      return this.columnsPositions[this.columnsPositions.length - 1];
    } else if (this.columnsPositions.length >= currentColPositionIndex + 1) {
      return this.columnsPositions[currentColPositionIndex + 1];
    }
    return undefined;
  }

  getPreviousSyePositionsForColId(table: Table, colPosition: number): ColumnPositions {
    if (this.columnsPositions.length === 0) { this.updateColumnsPositions(table); }
    let currentColPositionIndex: number;
    let i = 0;
    for (const columnPosition of this.columnsPositions) {
      if (columnPosition.syntheticColumnPosition === colPosition || (columnPosition.startColumnPosition <= colPosition && columnPosition.endColumnPosition >= colPosition)) {
        currentColPositionIndex = i;
      }
      i++;
    }

    if (colPosition === 0) {
      return this.columnsPositions[0];
    } else if (this.columnsPositions.length >= currentColPositionIndex - 1) {
      return this.columnsPositions[currentColPositionIndex - 1 < 0 ? 0 : currentColPositionIndex];
    }
    return undefined;
  }

  getSyePositionsById(table: Table, syeId: number): ColumnPositions {
    if (this.columnsPositions.length === 0) { this.updateColumnsPositions(table); }
    for (const columnPosition of this.columnsPositions) {
      if (columnPosition.id === syeId) { return columnPosition; }
    }
    return undefined;
  }

  getSyeForColId(table: Table, colPosition: number): Sye {
    const syePositions = this.getSyePositionsForColId(table, colPosition);
    if (syePositions) {
      const sye = _.find(table.sye, s => s.syeId === syePositions.id);
      return sye;
    }
    return undefined;
  }

  getSyeById(table: Table, id: number) {
    if (this.columnsPositions.length === 0) { this.updateColumnsPositions(table); }
    for (const sye of table.sye) {
      if (sye.syeId === id) { return sye; }
    }
    return undefined;
  }

  isMultipleSyeSelected(table: Table, selectedColStart: number, selectedColEnd: number): boolean {
    const syeStart = this.getSyePositionsForColId(table, selectedColStart);
    const syeEnd = this.getSyePositionsForColId(table, selectedColEnd);
    return syeStart.id !== syeEnd.id ? true : false;
  }

  getReleveById(id: number): OccurrenceModel {
    for (const sye of this.currentTable.sye) {
      for (const occurrence of sye.occurrences) {
        if (occurrence.id === id) { return occurrence; }
      }
    }
    return null;
  }

  // -----------
  // CELL CHANGE
  // -----------
  public beforeTitleGroupCellChange(groupId: number, initialTitle: string, newTitle: string): boolean {
    const group = this.getGroupPositionsById(this.currentTable, groupId);
    if (newTitle && group.label !== newTitle && newTitle !== '') {
      // update rowDefinition group names
      let rowDefinitionsUpdated = false;
      for (const rowDefinitions of this.currentTable.rowsDefinition) {
        if (rowDefinitions.groupId === groupId) {
          rowDefinitions.groupTitle = newTitle;
          if (rowDefinitions.type === 'group') { rowDefinitions.displayName = newTitle; }
          rowDefinitionsUpdated = true;
        }
      }
      if (rowDefinitionsUpdated) {
        group.label = newTitle;
        return true;
      } else {
        // @Note this should happen only if handsontable front data (dataView) are desynchronized
        // @Todo manage desynchronization (reload table ? maybe its better to implement immutable table and, if desynchronization occurs, roll back table to latest synchronized version)
        // @Todo implement immutable table ?
        // @Todo implements checkDataSynchronization function ?
        this.notificationService.warn('Nous ne parvenons pas à mettre à jour les données en arrière-plan');
        return false;
      }
    }
    return false;
  }

  private countOccurrencesInTable(table: Table): number {
    let count = 0;
    for (const sye of table.sye) {
      for (const occ of sye.occurrences) {
        count++;
      }
    }
    return count;
  }

  // -----------------
  // SYNTHETIC COLUMNS
  // -----------------

  /**
   * Create a new synthetic column from given occurrences
   * If a sye is provided AND has an id, we keep this id (and also @id) for PATCH/PUT requests
   */
  createSyntheticColumn(occurrences: Array<OccurrenceModel>, currentUser: UserModel, sye?: Sye): SyntheticColumn {
    console.log('occurrences', occurrences);
    const syntheticColumn: SyntheticColumn = {
      '@id': sye && sye['@id'] ? sye['@id'] : null,
      id: (sye && sye.id && sye.syntheticColumn) ? sye.syntheticColumn.id : null,    // If the sye already has a synthetic column, set id & sye properties
      // sye: (sye && sye.id) ? sye : null,                                          // so the table PATCH operations will also patch sye & synthetic column
      userId: Number(currentUser.id),
      userEmail: currentUser.sub,
      userPseudo: currentUser.pseudo,
      sye: null,
      validations: [],
      items: [],
      vlWorkspace: this.wsService.currentWS.getValue()
    };

    const names = this.getNames(occurrences);
    const uniquNames = _.uniqBy(names, n => n.layer + n.name + n.repositoryIdTaxo);

    for (const name of uniquNames) {
      const syntheticItem: SyntheticItem = {
        id: null,
        userId: Number(currentUser.id),
        userEmail: currentUser.sub,
        userPseudo: currentUser.pseudo,
        layer: null,
        repository: null,
        repositoryIdNomen: null,
        repositoryIdTaxo: null,
        displayName: null,
        occurrencesCount: null,
        isOccurrenceCountEstimated: false,
        frequency: 0,
        coef: null,
        minCoef: null,
        maxCoef: null};
      syntheticItem.layer = name.layer;
      syntheticItem.repository = name.repository;
      syntheticItem.repositoryIdNomen = name.repositoryIdNomen;
      syntheticItem.repositoryIdTaxo = name.repositoryIdTaxo;

      let displayName = '?';
      let occurrencesCount = 0;
      let minCoef = '?';
      let maxCoef = '?';


      for (const occurrence of occurrences) {
        const childrenOccurrences = this.getChildOccurrences(occurrence);
        // @Todo manage no coef error
        for (const child of childrenOccurrences) {
          if (minCoef === '?' && maxCoef === '?') {
            if (child.coef && child.coef !== '' && child.validations[0].repositoryIdTaxo === name.repositoryIdTaxo && child.layer === name.layer) {
              minCoef = child.coef;
              maxCoef = child.coef;
            }
          }
          if (child.validations[0].repositoryIdTaxo === name.repositoryIdTaxo && child.layer === name.layer) {
            occurrencesCount++;
            displayName = this.validationService.getSingleName('releve', child.validations);
            minCoef = this.isLowerCoef(minCoef, child.coef) ? child.coef : minCoef;
            maxCoef = this.isUpperCoef(maxCoef, child.coef) ? child.coef : maxCoef;
          }
        }
      }
      syntheticItem.occurrencesCount = occurrencesCount;
      syntheticItem.frequency =  occurrencesCount === 0 ?  0 : (occurrencesCount * 100) / occurrences.length;
      syntheticItem.coef = this.syntheticColumnService.getRomanCoef(syntheticItem.frequency);
      syntheticItem.displayName = displayName;
      syntheticItem.minCoef = minCoef;
      syntheticItem.maxCoef = maxCoef;
      syntheticColumn.items.push(syntheticItem);
    }

    return syntheticColumn;
  }

  isLowerCoef(coef: string, coefToCompare: string): boolean {
    // @Todo manage no coef error
    if (!coef) { console.log('isLowerCoef(): NO COEF PROVIDED !'); return false; }
    const orderedCoefs = [
      { index: 0, value: '+' },
      { index: 1, value: '1' },
      { index: 2, value: '2' },
      { index: 3, value: '3' },
      { index: 4, value: '4' },
      { index: 5, value: '5' },
    ];
    const coefIndex = _.find(orderedCoefs, o => o.value === coef);
    const coefToCompareIndex = _.find(orderedCoefs, o => o.value === coefToCompare);

    try {
      return coefToCompareIndex.index < coefIndex.index ? true : false;
    } catch (error) {
      return false;
    }
  }

  isUpperCoef(coef: string, coefToCompare: string): boolean {
    if (!coef) { console.log('isUpperCoef(): NO COEF PROVIDED !'); return false; }
    const orderedCoefs = [
      { index: 0, value: '+' },
      { index: 1, value: '1' },
      { index: 2, value: '2' },
      { index: 3, value: '3' },
      { index: 4, value: '4' },
      { index: 5, value: '5' },
    ];
    const coefIndex = _.find(orderedCoefs, o => o.value === coef);
    const coefToCompareIndex = _.find(orderedCoefs, o => o.value === coefToCompare);
    try {
      return coefToCompareIndex.index > coefIndex.index ? true : false;
    } catch (error) {
      return false;
    }
  }

  // --------
  // COUNTERS
  // --------
  /**
   * Count the tables in ES db for a given workspace
   */
  public countTables(workspaces?: Array<string>): Observable<{count: number}> {
    let query: string;
    const headers = new HttpHeaders('Accept: application/json');
    headers.append('Content-Type', 'application/json');

    if (!workspaces || workspaces.length === 0) {
      return this.http.get<{count: number}>(`${environment.esBaseUrl}/vl_tables/_count`, {headers});
    } else if (workspaces.length > 0) {
      const shouldParts: Array<string> = [];
      for (const workspace of workspaces) {
        shouldParts.push(`
        {
          "term": {
            "vlWorkspace": "${workspace}"
          }
        }
        `);
      }
      query = `
      {
        "query": {
          "bool": {
            "should": [
              ${shouldParts}
            ]
          }
        }
      }
      `;
      return this.http.post<{count: number}>(`${environment.esBaseUrl}/vl_tables/_count`, JSON.parse(query), {headers});
    } else {
      return of({count: 0});
    }

  }

  // -------------------------------------
  // ADD / MERGE SYE OR RELEVES TO A TABLE
  // -------------------------------------
  /**
   * Add occurrences (relevés) to a table
   * This also recreate synthetic columns for syes and table
   *
   * @param occurrencesToAdd the occurrences (relevés) to be added
   * @param table the table to add occurrences
   * @param currentUser must be provided for synthetic columns creation
   */
  setRelevesToTable(occurrencesToAdd: Array<OccurrenceModel>, table: Table, currentUser: UserModel): Table {
    const _table = _.clone(table);

    // const _occurrencesToAdd = this.filterDuplicatesRelevesWithTable(occurrencesToAdd, table);

    this.addOccurrencesToTable(occurrencesToAdd, _table);
    this.createSyntheticColumnsForSyeOnTable(_table, currentUser);
    this.createTableSyntheticColumn(_table, currentUser);

    _table.rowsDefinition = this.updateRowsDefinition(table, _table);

    return _table;
  }

  /**
   * Merge occurrences (relevés) to a table
   * If the table contains several syes, relevés are merged in a new sye to avoid confusion
   * This also recreate synthetic columns for syes and table
   *
   * @param occurrencesToMerge the occurrences (relevés) to be merged
   * @param table the table to merge occurrences
   * @param currentUser must be provided for synthetic columns creation
   */
  mergeRelevesToTable(occurrencesToMerge: Array<OccurrenceModel>, table: Table, currentUser: UserModel): Table {
    const _table = _.clone(table);

    // const _occurrencesToMerge = this.filterDuplicatesRelevesWithTable(occurrencesToMerge, table);

    // is table empty ?
    if (this.isTableEmpty(_table)) {
      // yes => just set relevés
      return this.setRelevesToTable(occurrencesToMerge, _table, currentUser);
    } else {
      // no => where to place relevés in table (wich sye ?)
      // If only One sye, could add relevés to it
      // If several syes, it may be better to merge relevés in a new sye to avoid confusion
      // @Todo let user choose
      if (_table && _table.sye && _table.sye.length === 1) {
        // merge relevés in sye[0]
        _table.sye[0].occurrences.push(...occurrencesToMerge);
        this.updateSyeCount(_table);
        this.createSyntheticColumnsForSyeOnTable(_table, currentUser);
        this.createTableSyntheticColumn(_table, currentUser);
      } else if (_table && _table.sye && _table.sye.length > 1) {
        // Merge relevés in a new sye
        const newSye = this.syeService.createSye(); // Be carefull, the new sye has no `syeId` property
        newSye.occurrences = occurrencesToMerge;
        newSye.occurrencesOrder = this.syeService.getOccurrencesOrder(newSye);  // set sye occurrences order

        _table.sye.push(newSye);
        this.updateSyeIds(_table);
        _table.syeOrder = this.getSyeOrder(_table);                             // update table sye order
        console.log('_TABLE', _table);

        this.updateSyeCount(_table);
        this.createSyntheticColumnsForSyeOnTable(_table, currentUser);
        this.createTableSyntheticColumn(_table, currentUser);
      }
    }

    _table.rowsDefinition = this.updateRowsDefinition(table, _table);

    return _table;
  }

  /**
   * Set (replace) syes to a Table
   * This also recreate synthetic columns for syes and table
   *
   * @param syesToAdd the syes to be set
   * @param table the table to add sye
   * @param currentUser must be provided for synthetic columns creation
   */
  setSyesToTable(syesToAdd: Array<Sye>, table: Table, currentUser: UserModel): Table {
    const _table = _.clone(table);
    _table.sye = syesToAdd;
    this.updateSyeIds(_table);
    // Check that syes have a synthetic column
    syesToAdd.forEach(sye => {
      if (sye.syntheticColumn == null) { sye.syntheticColumn = this.createSyntheticColumn(sye.occurrences, currentUser, sye); }
    });

    _table.rowsDefinition = this.updateRowsDefinition(table, _table);

    // Recreate table synthetic column
    this.createTableSyntheticColumn(_table, currentUser);
    return _table;
  }

  /**
   * Merge syes to a table
   * This also recreate synthetic columns for syes and table
   * @param syesToMerge the syes to be merged
   * @param table the table to merge syes
   * @param currentUser must be provided for synthetic columns creation
   */
  mergeSyesToTable(syesToMerge: Array<Sye>, table: Table, currentUser: UserModel): Table {
    const _table = _.clone(table);
    // is table empty ?
    if (this.isTableEmpty(_table)) {
      // yes => just set sye
      return this.setSyesToTable(syesToMerge, _table, currentUser);
    } else {
      // no => merge
      _table.sye.push(...syesToMerge);
      this.updateSyeIds(_table);
      // Check that syes have a synthetic column
      syesToMerge.forEach(sye => {
        if (sye.syntheticColumn == null) { sye.syntheticColumn = this.createSyntheticColumn(sye.occurrences, currentUser, sye); }
      });

      _table.rowsDefinition = this.updateRowsDefinition(table, _table);

      this.createTableSyntheticColumn(_table, currentUser);
      return _table;
    }

  }

  // -----
  // OTHER
  // -----
  /**
   * Returns occurrences (relevés) that are not in table
   */
  filterDuplicatesRelevesWithTable(occurrences: Array<OccurrenceModel>, table: Table): Array<OccurrenceModel> {
    let _response: Array<OccurrenceModel> = [];
    if (occurrences && table && occurrences.length > 0 && table.sye) {
      if (table.sye.length > 0) {
        // should have occurrences (relevés)
        const tableOccurrences: Array<OccurrenceModel> = [];
        table.sye.forEach(ts => {if (ts.occurrences && ts.occurrences.length > 0) { tableOccurrences.push(...ts.occurrences); }});
        if (tableOccurrences && tableOccurrences.length > 0) {
          // ok, there is relevés
          // filter
          const filteredReleves = _.filter(occurrences, occ => {
            return _.find(tableOccurrences, tOcc => tOcc.id === occ.id) !== null;
          });
          _response = filteredReleves;
        } else {
          // got sye but no relevés
          _response = occurrences;
        }
      } else {
        // no sye, no need to filter
        _response = occurrences;
      }
    }
    return _response;
  }

  /**
   * Update all `sye.occurrencesCount` values for a given table
   */
  private updateSyeCount(table: Table): void {
    for (const sye of table.sye) {
      sye.occurrencesCount = sye.occurrences.length;
    }
  }

  /**
   * Update all sye `syeId` values for a given table
   * Note: syeId is used for table manipulations (handsontable) and differs from sye.id (database id)
   */
  updateSyeIds(table: Table): void {
    let i = 0;
    if (table !== null && table.sye !== null && table.sye.length > 0) {
      for (const sye of table.sye) {
        sye.syeId = i;
        i++;
      }
    }
  }

  /**
   * Returns the maximum index of `syeId` for a given table
   */
  getMaxSyeIdValue(table: Table): number {
    const syesIds: Array<number> = [];
    if (table && table.sye && table.sye.length > 0) {
      for (const sye of table.sye) { syesIds.push(sye.id); }
    } else { return null; }
    _.compact(syesIds);
    return _.max(syesIds);
  }

  /**
   * Get all occurences within a table
   * @param table if the table to parse
   * @param parseMicrocenosis will returns microcenosis level and it's children synusies
   */
  private getAllOccurrences(table: Table, parseMicrocenosis = false) {
    const occurrences: Array<OccurrenceModel> = [];
    for (const sye of table.sye) {
      occurrences.push(...sye.occurrences);
      if (parseMicrocenosis) {
        for (const occ of sye.occurrences) {
          if (occ.level === 'microcenosis') { occurrences.push(...occ.children); }
        }
      }
    }
    return occurrences;
  }

  /**
   * Returns a simple representation of a table that you can log for debuging
   * Example output:
   * Group1        | ----------
   *   Poa annua   | .++1.+..11
   *   Poa infirma | +12..++..1
   * Group2        | ----------
   *   ...         | ...
   */
  toString(table: Table, firstColMaxLength = 40, noCoefStr = ' '): string {
    const rowDef: Array<string> = _.map(table.rowsDefinition, rd => rd.type === 'data' ? '  ' + rd.displayName.slice(0, firstColMaxLength).padEnd(firstColMaxLength, ' ') : rd.displayName.slice(0, firstColMaxLength).padEnd(firstColMaxLength + 2, ' '));
    const spacer = new Array(rowDef.length).fill('|');
    const colDef: Array<Array<string>> = [];
    for (const sye of table.sye) {
      for (const rel of sye.occurrences) {
        const occurrences = this.getChildOccurrences(rel);
        const colItems: Array<string> = [];
        for (const rd of table.rowsDefinition) {
          const occurrence = _.find(occurrences, occ => occ.layer === rd.layer && occ.validations[0].repository === rd.repository && occ.validations[0].repositoryIdNomen === rd.repositoryIdNomen);
          if (occurrence) {
            colItems.push(_.take(occurrence.coef, 1)[0]);
          } else {
            if (rd.type === 'group') { colItems.push('-'); } else { colItems.push(noCoefStr); }
          }
        }
        colDef.push(colItems);
      }
    }
    const log = [rowDef, ...colDef];
    let output = '';

    for (let rowNb = 0; rowNb < rowDef.length; rowNb++) {
      output += rowDef[rowNb] + ' | ';
      for (let colNb = 0; colNb < colDef.length; colNb++) {
        output += colDef[colNb][rowNb];
      }
      output += '\n';
    }

    return output;
  }

}


interface ColumnPositions {
  id: number;
  label: string;
  startColumnPosition: number;
  endColumnPosition: number;
  syntheticColumnPosition: number;
  onlyShowSyntheticColumn: boolean;
}
