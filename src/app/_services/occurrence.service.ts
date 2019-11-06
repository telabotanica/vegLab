import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { OccurrenceModel } from '../_models/occurrence.model';
import { InputSource } from '../_enums/input-source-enum';

import { Observable, of, zip } from 'rxjs';
import { map, flatMap, tap, concatMap } from 'rxjs/operators';
import { EsOccurrencesResultModel } from '../_models/es-occurrences-result.model';

import * as _ from 'lodash';
import { EsOccurrencesDocsResultModel } from '../_models/es-occurrences-docs.model';
import { WorkspaceService } from './workspace.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OccurrenceService {

  constructor(private http: HttpClient, private wsService: WorkspaceService) { }

  getFreshOccurrence(): OccurrenceModel {
    return {
      level: null,
      parentLevel: null,
      children: [],

      isIdentiplanteValidated: false,
      isPublic: true,
      isVisibleInCel: false,
      isVisibleInVegLab: true,
      observer: null,
      observerInstitution: null,
      signature: null,
      taxoRepo: null,

      userEmail: null,
      userId: null,
      userProfile: null,

      validations: [],

      dateCreated: null,
      dateObserved: null,

      delUpdateNotifications: null,
      extendedFieldOccurrences: null,

      inputSource: InputSource.VEGLAB,
      vlWorkspace: this.wsService.currentWS.getValue()
    };
  }

  getOccurrenceById(id: number): Observable<OccurrenceModel> {
    const dataObs = this.http.get<OccurrenceModel>(`${environment.apiBaseUrl}/occurrences/${id}.json`).pipe(
      map(occ => this.parseGeometryAndIntegerifyElevation(occ))
    );
    return dataObs;
  }

  getEsOccurrenceById(id: number): Observable<OccurrenceModel> {
    return this.http.get(`${environment.esBaseUrl}/cel2_occurrences/_search?q=id:${id}`).pipe(
      map(result => result as EsOccurrencesResultModel),
      map(result => result.hits.hits[0]._source)
    );
  }

  getEsOccurrencesByIds(ids: Array<number>): Observable<Array<OccurrenceModel>> {
    let parts = '';
    let i = 0;
    for (const id of ids) {
      parts += `"${id}"`;
      if (i < ids.length - 1) { parts += ', '; }
      i++;
    }

    const headers = new HttpHeaders({ 'Content-type': 'application/json' });
    const query = `{ "ids": [${parts}] }`;
    return this.http.post(`${environment.esBaseUrl}/cel2_occurrences/_mget`, query, { headers }).pipe(
      map(data => data as EsOccurrencesDocsResultModel),
      map(data0 => data0.docs),
      map(data2 => _.map(data2, item => item._source))
    );
  }

  getEsOccurrenceWithChildrenById(id: number): Observable<OccurrenceModel> {
    let occurrence: OccurrenceModel;
    return this.getEsOccurrenceById(id).pipe(
      concatMap((occ) => {
        occurrence = occ;
        return this.getEsOccurrencesByIds(occ.childrenIds);
      }),
      concatMap((occs) => {
        occurrence.children = occs;
        // Should we retrieve a second level deepth ?
        const children = _.flatMap(occurrence.children);
        const childrenIds = _.flatten(_.map(children, c => c.childrenIds));
        if (childrenIds.length === 0) {
          // no we shouldn't
          return of(null);
        } else {
          // yes we should
          const obs: Array<Observable<Array<OccurrenceModel>>> = [];
          for (const subocc of occurrence.children) { obs.push(this.getEsOccurrencesByIds(subocc.childrenIds)); }
          return zip(...obs);
        }
      }),
      concatMap(suboccs => {
        if (suboccs) {
          let i = 0;
          for (const subocc of suboccs) {
            occurrence.children[i].children = subocc;
            i++;
          }
        }
        return of(occurrence);
      })
    );
  }

  //
  public parseGeometryAndIntegerifyElevation(occurrence: OccurrenceModel): OccurrenceModel {
    // for (const occ of sye.occurrences) {
    occurrence.geometry = occurrence.geometry ? JSON.parse(occurrence.geometry) : null;
    occurrence.centroid = occurrence.centroid ? JSON.parse(occurrence.centroid) : null;
    occurrence.elevation = occurrence.elevation ? +occurrence.elevation : null;
    if (occurrence.level === 'synusy') {
      for (const child of occurrence.children) {
        child.geometry = child.geometry ? JSON.parse(child.geometry) : null;
        child.centroid = child.centroid ? JSON.parse(child.centroid) : null;
        child.elevation = child.elevation ? +child.elevation : null;
      }
    } else if (occurrence.level === 'microcenosis') {
      for (const child of occurrence.children) {
        child.geometry = child.geometry ? JSON.parse(child.geometry) : null;
        child.centroid = child.centroid ? JSON.parse(child.centroid) : null;
        child.elevation = child.elevation ? +child.elevation : null;
        for (const grandChild of child.children) {
          grandChild.geometry = grandChild.geometry ? JSON.parse(grandChild.geometry) : null;
          grandChild.centroid = grandChild.centroid ? JSON.parse(grandChild.centroid) : null;
          grandChild.elevation = grandChild.elevation ? +grandChild.elevation : null;
        }
      }
    }

    return occurrence;
  }

  // --------
  // COUNTERS
  // --------
  /**
   * Count the releves in db for a given workspace
   * @param workspaces ['phyto', 'forest']...
   * @param onlyTopLevel ie if a microcenosis contains 2 synusies, the total count is 1 (children releves are ignored)
   */
  public countReleves(workspaces?: Array<string>, levels?: Array<string>, onlyTopLevel = true): Observable<{count: number}> {
    let query: string;
    const headers = new HttpHeaders('Accept: application/json');
    headers.append('Content-Type', 'application/json');

    const topLevelQueryPart = `
    {
      "exists": {
        "field": "parentLevel"
      }
    }
    `;

    const levelsQueryParts: Array<string> = [];
    if (levels) {
      for (const level of levels) {
        levelsQueryParts.push(`
        {
          "term": {
            "level": "${level}"
          }
        }
        `);
      }
    }
    const mustLevelsQuersyPart = levelsQueryParts && levelsQueryParts.length > 0 ? `"must": [${levelsQueryParts}]` : null;

    if (!workspaces || workspaces.length === 0) {
      query = `
      {
        "query": {
          "bool":{
            "must_not": [
              {
                "term": {
                  "level": "idiotaxon"
                }
              }
              ${onlyTopLevel ? ', ' + topLevelQueryPart : ''}
            ]${mustLevelsQuersyPart ? ', ' + mustLevelsQuersyPart : ''}
          }
        }
      }
      `;
      return this.http.post<{count: number}>(`${environment.esBaseUrl}/cel2_occurrences/_count`, JSON.parse(query), {headers});
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
            ],
            "must_not": [
              {
                "term": {
                  "level": "idiotaxon"
                }
              }
              ${onlyTopLevel ? ', ' + topLevelQueryPart : ''}
            ]${mustLevelsQuersyPart ? ', ' + mustLevelsQuersyPart : ''}
          }
        }
      }
      `;
      return this.http.post<{count: number}>(`${environment.esBaseUrl}/cel2_occurrences/_count`, JSON.parse(query), {headers});
    } else {
      return of({count: 0});
    }
  }

  public countIdiotaxons(workspaces?: Array<string>): Observable<{count: number}> {
    let query: string;
    const headers = new HttpHeaders('Accept: application/json');
    headers.append('Content-Type', 'application/json');

    if (!workspaces || workspaces.length === 0) {
      query = `
      {
        "query": {
          "bool":{
            "must": [{
              "term": {
                "level": "idiotaxon"
              }
            }]
          }
        }
      }
      `;
      return this.http.post<{count: number}>(`${environment.esBaseUrl}/cel2_occurrences/_count`, JSON.parse(query), {headers});
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
            ],
            "must": [
              {
                "term": {
                  "level": "idiotaxon"
                }
              }
            ]
          }
        }
      }
      `;
      return this.http.post<{count: number}>(`${environment.esBaseUrl}/cel2_occurrences/_count`, JSON.parse(query), {headers});
    } else {
      return of({count: 0});
    }
  }
}
