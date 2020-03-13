import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Observer } from '../_models/observer.model';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class ObserverService {

  constructor(private http: HttpClient) { }

  search(query: string, fuzzy = false): Observable<Array<Observer>> {
    const headers = new HttpHeaders('Accept: application/json');

    if (!fuzzy) {
      return this.http.get<Array<Observer>>(`${environment.apiBaseUrl}/observers?name=${query.toLowerCase()}`, {headers});
    } else {
      // make manual request
      const parsedQuery = query.toLowerCase().replace(/\./gm, ''); // lower case and remove dot
      const explodedQuery: Array<string> = parsedQuery.split(' ').join('~').split('-').join('~').split('~');
      for (let explod of explodedQuery) {
        explod = explod.replace(/[^a-z0-9]+/ig, '');     // replace all non alpha-numeric characters
      }

      // build ES fuzzy parts query
      const fuzzyPartsQuery: Array<string> = [];
      let i = 0;
      for (const explodItem of explodedQuery) {
        const esQueryPart = `
        {
          "fuzzy": {
            "name": {
              "value": "${explodItem.toLowerCase()}",
              "fuzziness": "AUTO",
              "prefix_length": 0,
              "transpositions": "true"
            }
          }
        }
        `;
        fuzzyPartsQuery.push(esQueryPart);
        i++;
      }

      // build ES main query
      const esQuery = `
        {
          "query": {
            "bool": {
              "must": [
                ${fuzzyPartsQuery}
              ]
            }
          }
        }
      `;

      headers.append('Content-Type', 'application/json');
      return this.http.post<Array<Observer>>(`${environment.esBaseUrl}/vl_observers/_search`, JSON.parse(esQuery), {headers}).pipe(
        map(result => _.map(result['hits']['hits'], hit => hit['_source']))
      );
    }
  }

  /*getObserverById(id: number): Observable<Observer> {
    //
  }*/

  updateObserver(observer: Observer) {
    //
  }

  deleteObserver(observer: Observer) {
    //
  }

  createObserver(name: string): Observable<any> {
    const headers = new HttpHeaders('Content-type: application/json');
    return this.http.post(`${environment.apiBaseUrl}/observers`, {name}, {headers});
  }
}
