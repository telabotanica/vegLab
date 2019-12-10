import { Component, OnInit, ViewChild } from '@angular/core';

import { UserModel } from 'src/app/_models/user.model';
import { EsTableResultModel } from 'src/app/_models/es-table-result.model';
import { EsTableModel } from 'src/app/_models/es-table.model';
import { EsOccurrencesResultModel } from 'src/app/_models/es-occurrences-result.model';
import { OccurrenceModel } from 'src/app/_models/occurrence.model';

import { UserService } from 'src/app/_services/user.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { TableService } from 'src/app/_services/table.service';
import { OccurrenceService } from 'src/app/_services/occurrence.service';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { MatSidenav } from '@angular/material/sidenav';


@Component({
  selector: 'vl-my-data-page',
  templateUrl: './my-data-page.component.html',
  styleUrls: ['./my-data-page.component.scss']
})
export class MyDataPageComponent implements OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;  // @Todo check : doc add {static: false}

  currentUser: UserModel;
  currentUserSubscription: Subscription;
  loggedOut: boolean;

  // My tables var
  myTablesLoading = false;
  myTablesSet = false;
  myTablesRaw: EsTableResultModel;
  myTablesCount: number;
  myTables: Array<EsTableModel> = [];
  myTablesPageIndex = 0;        // updated by _occurrencePageChanged()
  myTablesPaginatorFrom = 0;    // updated by _occurrencePageChanged()
  myTablesPaginatorSize = 5;
  tableInfo: EsTableModel = null;     // table to preview
  tableToDelete: EsTableModel = null; // table to be deleted

  // My occurrences var
  myOccurrencesLoading = false;
  myOccurrencesSet = false;
  myOccurrencesRaw: EsOccurrencesResultModel;
  myOccurrencesCount: number;
  myOccurrences: Array<OccurrenceModel> = [];
  myOccurrencesPageIndex = 0;        // updated by _occurrencePageChanged()
  myOccurrencesPaginatorFrom = 0;    // updated by _occurrencePageChanged()
  myOccurrencesPaginatorSize = 5;
  occurrenceInfo: OccurrenceModel = null;     // occurrence to preview
  occurrenceToDelete: OccurrenceModel = null; // occurrence to be deleted

  constructor(private userService: UserService,
              private notificationService: NotificationService,
              private tableService: TableService,
              private occurrenceService: OccurrenceService) { }

  ngOnInit() {
    // Get current user
    this.currentUser = this.userService.currentUser.getValue();
    if (this.currentUser == null) {
      this.loggedOut = true;
      // @Todo see below : user login through SSO could be achieved after onInit,
      //                   in this case, don't send a "you're not logged in any longer" message to the user
      // this.notificationService.warn('Il semble que vous ne soyez plus connecté. Veuillez vous connecter à nouveau.');
    } else { this.loggedOut = false; }

    // Current user change
    // Note : if app is started at a psecific page (eg my-data),
    //        ngOnInit and userService.currentUser.getValue() should
    //        be called before the token is set and refreshed (base app.component)
    this.currentUserSubscription = this.userService.currentUser.subscribe(
      user => { this.loggedOut = false; this.currentUser = user; this.getMyTables(); this.getMyOccurrences(); }
    );

    // Get user tables & relevés
    this.getMyTables();
    this.getMyOccurrences();
  }

  getMyTables(from: number = 0, size: number = this.myTablesPaginatorSize): void {
    if (this.currentUser == null) {
      this.loggedOut = true;
      return;
    }
    this.myTablesLoading = true;
    this.tableService.getEsTablesForCurrentUser(from, size).subscribe(
      userTables => {
        this.myTablesLoading = false;
        this.myTablesSet = true;
        this.myTablesRaw = userTables;
        this.myTablesCount = this.myTablesRaw.hits.total;
        this.myTables = _.map(this.myTablesRaw.hits.hits, tr => tr._source);
      }, error => {
        // @Todo manage error
        this.myTablesLoading = false;
        this.notificationService.warn('Nous ne parvenons pas à récupérer vos tableaux en base de données.');
      }
    );
  }

  /**
   * Get user's relevés. Search is restricited to myOccurrences paginators values (From & Size)
   */
  getMyOccurrences(from: number = 0, size: number = this.myOccurrencesPaginatorSize): void {
    if (this.currentUser == null) {
      this.loggedOut = true;
      return;
    }
    this.myOccurrencesLoading = true;
    this.occurrenceService.getEsOccurrencesForCurrentUser(from, size).subscribe(
      userOcc => {
        this.myOccurrencesLoading = false;
        this.myOccurrencesSet = true;
        this.myOccurrencesRaw = userOcc;
        this.myOccurrencesCount = this.myOccurrencesRaw.hits.total;
        this.myOccurrences = _.map(this.myOccurrencesRaw.hits.hits, tr => tr._source);
      }, error => {
        // @Todo manage error
        this.myOccurrencesLoading = false;
        this.notificationService.warn('Nous ne parvenons pas à récupérer vos relevés en base de données.');
      }
    );
  }

  getUserName(): string {
    return this.userService.getUserName();
  }

  _occurrencePageChanged(pageEvent: PageEvent): void {
    if (pageEvent == null) { return; }

    // page index update
    this.myOccurrencesPageIndex = pageEvent.pageIndex;

    // number of items per page update
    if (pageEvent.pageSize !== this.myOccurrencesPaginatorSize) {
      this.myOccurrencesPaginatorSize = pageEvent.pageSize;
    }

    this.getMyOccurrences(this.myOccurrencesPageIndex * this.myOccurrencesPaginatorSize);
  }

  _tablePageChanged(pageEvent: PageEvent): void {
    if (pageEvent == null) { return; }

    // page index update
    this.myTablesPageIndex = pageEvent.pageIndex;

    // number of items per page update
    if (pageEvent.pageSize !== this.myTablesPaginatorSize) {
      this.myTablesPaginatorSize = pageEvent.pageSize;
    }

    this.getMyTables(this.myTablesPageIndex * this.myTablesPaginatorSize);
  }

  previewTableAction(table: EsTableModel): void {
    this.resetInfoAndDeleteValues();
    this.tableInfo = table;
    this.sidenav.open();
  }

  deleteTableAction(table: EsTableModel): void {
    this.resetInfoAndDeleteValues();
    this.tableToDelete = table;
    this.sidenav.open();
  }

  previewOccurrenceAction(occurrence: OccurrenceModel): void {
    this.resetInfoAndDeleteValues();
    this.occurrenceInfo = occurrence;
    this.sidenav.open();
  }

  deleteOccurrenceAction(occurrence: OccurrenceModel): void {
    this.resetInfoAndDeleteValues();
    this.occurrenceToDelete = occurrence;
    this.sidenav.open();
  }

  resetInfoAndDeleteValues(): void {
    this.tableInfo = null;
    this.occurrenceInfo = null;
    this.tableToDelete = null;
    this.occurrenceToDelete = null;
  }

  /**
   * Sidenav panel has been closed
   */
  close() {
    this.resetInfoAndDeleteValues();
  }

}
