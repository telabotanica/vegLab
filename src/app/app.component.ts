import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as moment from 'moment';
import { interval } from 'rxjs';

import { environment } from '../environments/environment';

import { UserService } from './_services/user.service';
import { MetadataService } from './_services/metadata.service';
import { TableService } from './_services/table.service';
import { ObserverService } from './_services/observer.service';
import { WorkspaceService } from './_services/workspace.service';

import { SsoService } from './_services/sso.service';


@Component({
  selector: 'vl-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private userService: UserService,
              private metadataService: MetadataService,
              private tableService: TableService,
              private observerService: ObserverService,
              private wsService: WorkspaceService,
              private http: HttpClient,
              private ssoService: SsoService) { }

  ngOnInit() {
    this.wsService.currentWS.next('*');
    this.metadataService.retrieveMetadataList();  // Retrieve metadatas from local storage
    this.metadataService.refreshMetadataList();   // Get metadatas from API
    this.tableService.setCurrentTable(this.tableService.createTable()); // Create a fresh table and set it as current table
    moment.locale('fr');

    // Do we have a token ?
    if (this.ssoService.isTokenSet()) {
      const token = this.ssoService.getToken();
      // Token is not empty ?
      if (token !== null) {
        // Refresh token at startup
        this.ssoService.refreshToken();
      }
    }
  }

}
