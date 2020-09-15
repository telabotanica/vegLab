import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';

import * as _ from 'lodash';

@Component({
  selector: 'vl-data-sources-page',
  templateUrl: './data-sources-page.component.html',
  styleUrls: ['./data-sources-page.component.scss']
})
export class DataSourcesPageComponent implements OnInit {

  constructor(public router: Router, private http: HttpClient) { }

  _annuaireHealth: 'offline' | 'online' | 'pending' = 'pending';

  _apiHealth: 'offline' | 'online' | 'pending' = 'pending';
  _apiOccurrencesHealth: 'offline' | 'online' | 'pending' = 'pending';
  // _apiTablesHealth: 'offline' | 'online' | 'pending' = 'pending';

  _esHealth: 'offline' | 'online' | 'pending' = 'pending';
  _esMapping: 'empty' | 'notEmpty' | 'error'| 'pending' = 'pending';
  _esOccurrences: 'offline' | 'online' | 'pending' = 'pending';
  _esTables: 'offline' | 'online' | 'pending' = 'pending';
  _esObservers: 'offline' | 'online' | 'pending' = 'pending';
  _esBiblio: 'offline' | 'online' | 'pending' = 'pending';

  ngOnInit() {
    this.checkHealth();
  }

  checkHealth() {
    this._annuaireHealth = 'pending';

    this._apiHealth = 'pending';
    this._apiOccurrencesHealth = 'pending';
    // this._apiTablesHealth = 'pending';

    this._esHealth = 'pending';
    this._esMapping = 'pending';
    this._esOccurrences = 'pending';
    this._esTables = 'pending';
    this._esObservers = 'pending';
    this._esBiblio = 'pending';

    this.annuaireIsOnline().subscribe(online => { online === true ? this._annuaireHealth = 'online' : this._annuaireHealth = 'offline'; }, error => { this._annuaireHealth = 'offline'; });

    this.apiIsOnline().subscribe(online => { online === true ? this._apiHealth = 'online' : this._apiHealth = 'offline'; }, error => { this._apiHealth = 'offline'; });
    // this.apiRessourceHealth('occurrences').subscribe(online => { online === true ? this._apiOccurrencesHealth = 'online' : this._apiOccurrencesHealth = 'offline'; }, error => { this._apiOccurrencesHealth = 'offline'; });
    // this.apiTableHealth('tables').subscribe(online => { online === true ? this._apiTablesHealth = 'online' : this._apiTablesHealth = 'offline'; }, error => { this._apiTablesHealth = 'offline'; });

    this.esIsOnline().subscribe(online => { online === true ? this._esHealth = 'online' : this._esHealth = 'offline'; }, error => { this._esHealth = 'offline'; });
    this.esMapping().subscribe(response => { this._esMapping = response; }, error => { this._esMapping = 'error'; });
    this.esCollectionHealth('cel2_occurrences').subscribe(online => { online === true ? this._esOccurrences = 'online' : this._esOccurrences = 'offline'; }, error => { this._esOccurrences = 'offline'; });
    this.esCollectionHealth('vl_tables').subscribe(online => { online === true ? this._esTables = 'online' : this._esTables = 'offline'; }, error => { this._esTables = 'offline'; });
    this.esCollectionHealth('observers').subscribe(online => { online === true ? this._esObservers = 'online' : this._esObservers = 'offline'; }, error => { this._esObservers = 'offline'; });
    this.esCollectionHealth('biblio_phytos').subscribe(online => { online === true ? this._esBiblio = 'online' : this._esBiblio = 'offline'; }, error => { this._esBiblio = 'offline'; });
  }

  annuaireIsOnline(): Observable<boolean> {
    return this.http.get(environment.sso.baseUrl, {observe: 'response'}).pipe(
      map(data => {
        if (data && data !== null && data.status) {
          if (data.status === 200) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
    );
  }

  apiIsOnline(): Observable<boolean> {
    return this.http.get(environment.apiBaseUrl, {observe: 'response'}).pipe(
      map(data => {
        if (data && data !== null && data.status) {
          if (data.status === 200) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
    );
  }

  apiRessourceHealth(ressource: string): Observable<boolean> {
    return this.http.get(`${environment.apiBaseUrl}/${ressource}`, {observe: 'response'}).pipe(
      map(data => {
        if (data && data !== null && data.status) {
          if (data.status === 200) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
    );
  }

  esIsOnline(): Observable<boolean> {
    return this.http.get(environment.esBaseUrl, {observe: 'response'}).pipe(
      map(data => {
        if (data && data !== null && data.status) {
          if (data.status === 200) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
    );
  }

  esMapping(): Observable<'empty' | 'notEmpty' | 'error'> {
    return this.http.get(`${environment.esBaseUrl}/_mapping`, {observe: 'response'}).pipe(
      map(data => {
        if (data && data !== null && data.status) {
          if (data.status === 200) {
            if (_.isEmpty(data.body)) { return 'empty'; } else { return 'notEmpty'; }
          } else {
            return 'error';
          }
        } else {
          return 'error';
        }
      })
    );
  }

  esCollectionHealth(collection: string): Observable<boolean> {
    return this.http.get(`${environment.esBaseUrl}/${collection}`, {observe: 'response'}).pipe(
      map(data => {
        if (data && data !== null && data.status) {
          if (data.status === 200) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
    );
  }

}
