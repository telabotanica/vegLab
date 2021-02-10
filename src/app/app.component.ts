import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as moment from 'moment';
import { interval } from 'rxjs';

import { environment } from '../environments/environment';

import { RepositoryService } from './_services/repository.service';
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

  constructor(private repoService: RepositoryService,
              private metadataService: MetadataService,
              private tableService: TableService,
              private observerService: ObserverService,
              private wsService: WorkspaceService,
              private http: HttpClient,
              private ssoService: SsoService) { }

  ngOnInit() {
    this.repoService.initRepositories();
    this.wsService.currentWS.next('none');
    this.metadataService.retrieveMetadataList();  // Retrieve metadatas from local storage
    this.metadataService.refreshMetadataList();   // Get metadatas from API
    this.tableService.setCurrentTable(this.tableService.createTable()); // Create a fresh table and set it as current table
    moment.locale('fr');

    // Try to login the user at startup
    // Do we have a refresh token in local storage ?
    if (this.ssoService.isRefreshTokenSet()) {
      const refreshToken = this.ssoService.getRefreshToken();
      if (refreshToken !== null) {
        this.ssoService.refreshToken(refreshToken).subscribe(
          response => {
            if (response['access_token'] && response['refresh_token']) {
              // Ok, we've got a token,
              // Set token and refresh token to the SSO service
              this.ssoService.currentToken.next(response['access_token']);
              this.ssoService.currentRefreshToken.next(response['refresh_token']);
              // And refresh the token periodically
              this.ssoService.alwaysRefreshToken();
            }
          }, error => {
            console.log('error ', error);
          }
        );
      }
    }
  }

}
