import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { Biblio } from '../_models/biblio.model';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class BiblioService {

  constructor(private http: HttpClient) { }

  search(query: string, fuzzy = false): Observable<Array<Biblio>> {
    const headers = new HttpHeaders('Accept: application/json');

    if (!fuzzy) {
      return this.http.get<Array<Biblio>>(`${environment.apiBaseUrl}/biblio_phytos?title=${query.toLowerCase()}`, {headers});
    } else {
      // make manual request
      const parsedQuery = query.toLowerCase().replace(/\./gm, ''); // lower case and remove dot
      const explodedQuery: Array<string> = parsedQuery.split(' ');
      /*for (let explod of explodedQuery) {
        explod = explod.replace(/[^a-z0-9]+/ig, '');     // replace all non alpha-numeric characters
      }*/

      // build ES fuzzy parts query
      const fuzzyPartsQuery: Array<string> = [];
      let i = 0;
      for (const explodItem of explodedQuery) {
        const esQueryPart = `
        {
          "fuzzy": {
            "title": {
              "value": "${explodItem}",
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
      return this.http.post<Array<Biblio>>(`${environment.esBaseUrl}/vl_biblio_phytos/_search`, JSON.parse(esQuery), {headers}).pipe(
        map(result => _.map(result['hits']['hits'], hit => hit['_source']))
      );
    }
  }

  /*getBiblioById(id: number): Observable<Biblio> {
    //
  }*/

  updateBiblio(biblio: Biblio) {
    //
  }

  deleteBiblio(biblio: Biblio) {
    //
  }

  createBiblio(title: string): Observable<any> {
    const headers = new HttpHeaders('Content-type: application/json');
    return this.http.post(`${environment.apiBaseUrl}/biblio_phytos`, {title}, {headers});
  }
}
