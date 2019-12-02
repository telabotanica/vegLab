import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';

import { UserService } from './_services/user.service';
import { MetadataService } from './_services/metadata.service';
import { TableService } from './_services/table.service';
import { ObserverService } from './_services/observer.service';
import { WorkspaceService } from './_services/workspace.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  }

  login() {
    // const headers = {'Content-Type': 'text/plain'}; // 'Accept': 'text/plain'     'Content-Type': 'text/plain'
    this.ssoService.login('login', 'pass');
  }

  logout() {
    this.ssoService.logout();
  }

}
