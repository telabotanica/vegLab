import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';

import { environment } from '../environments/environment';

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

  private readonly unsetTokenValue = environment.app.unsetTokenValue;

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
        // Do we need to refresh this token ?
        // Uncomment to refresh the token only if necessary (due expiration date)
        // const needsRefresh = this.ssoService.tokenShouldBeRefreshed(token);
        // if (needsRefresh) { this.ssoService.refreshToken(); }

        // Allways refresh token at startup
        this.ssoService.refreshToken();
      }
    }
  }

}
