import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TableService } from './table.service';
import { WorkspaceService } from './workspace.service';
import { RepositoryService } from 'tb-tsb-lib';

import * as _ from 'lodash';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TableRowDefinition } from '../_models/table-row-definition.model';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class EcologicalTraitsService {
  currentTraitsValues = new BehaviorSubject<Array<{
    initial: { repo: string, idTaxo: string, idNomen: number, name: string },
    traitsRepo: any
  }>>(null);

  constructor(private tableService: TableService,
              private repoService: RepositoryService,
              private wsService: WorkspaceService,
              private http: HttpClient) { }

  listEcoTraitsAvailableRepository(): Array<string> {
    const availableRepo = this.repoService.listAllRepositories();
    const response: Array<string> = [];
    if (availableRepo && availableRepo.length > 0) {
      if (_.find(availableRepo, ar => ar.id === 'baseflor')) { response.push('baseflor'); }
    }
    return response;
  }

  /**
   * Returns an ecological traits repository according to a repository and a workspace
   * eg. for the 'bdtfx' repo on ws 'phyto', the function should returns 'baseveg' because it's the ecoTraits repo related to 'bdtfx'
   */
  getEcoTraitsRepoAccordingToRepoAndWs(repo: string, ws: string): string {
    if (!repo || !ws) { return null; }
    // const availableEcoTraitsRepo = this.listEcoTraitsAvailableRepository();
    // if (availableEcoTraitsRepo && availableEcoTraitsRepo.length > 0) {
    if (ws === 'phyto') {
      switch (repo) {
        case 'bdtfx':
          return 'baseflor';
        default:
          return null;
      }
    }
    // } else {
    //   return null;
    // }
  }

  setCurrentTraitsRepoValues(values: Array<any>): void {
    const currentTraits = this.currentTraitsValues.getValue();
    if (!currentTraits || currentTraits.length === 0) {
      // set values
    } else if (currentTraits && currentTraits.length > 0) {
      // update values
    } else {
      // should not happen
      return;
    }
  }

  setCurrentTraitsRepoValuesFromTableRowDefinition(rowDef: Array<TableRowDefinition>, ws: string): void {
    // @Todo check workspace value
    const currentTraits: Array<EcoTraitsItem> = this.currentTraitsValues.getValue();
    const nextTraits: Array<EcoTraitsItem> = [];
    const availableRepositories = this.repoService.listAllRepositories();

    // Current traits are not yet defined
    if (!currentTraits || currentTraits.length === 0) {
      // set traits
      this.buildCurrentTraits(rowDef, nextTraits, availableRepositories);
    } else if (currentTraits && currentTraits.length > 0) {
      // Current traits exists : update values if necessary

      // @Note compact newRepoValues to remove 'undefined' values when if condition fails
      // @Note sortBy to be sure order data is the same in each list
      const actualRepoTraitsValues = _.sortBy(_.map(currentTraits, ct => ct.initial.repo + '~' + ct.initial.idNomen.toString() + '~' + ct.initial.idTaxo + '~' + ct.initial.name));
      const newRepoTraitsValues = _.sortBy(_.compact(_.map(rowDef, rd => {
        if (rd.type === 'data') { return rd.repository + '~' + rd.repositoryIdNomen.toString() + '~' + rd.repositoryIdTaxo + '~' + rd.displayName; }
      })));

      // compare actual & new repo values
      const shouldUpdateTraits = !_.isEqual(actualRepoTraitsValues, newRepoTraitsValues);

      // @Todo update just necessary
      // For now, we just get the entire set
      // Get an observable to grab traits according to input repository
      // eg for input 'bdtfx', the related traits repository is 'baseflor'
      if (shouldUpdateTraits) {
        this.buildCurrentTraits(rowDef, nextTraits, availableRepositories);
      }
    } else {
      // should not happen
      return;
    }
  }

  private getRepoTraitsObservable(repo: string, idNomen): Observable<any> {
    switch (repo) {
      case 'bdtfx':
        const bdtfxIdNomen = idNomen;
        return this.getBaseflorTraitsByIdNomen('bdtfx', bdtfxIdNomen);
      default:
        break;
    }
  }

  private buildCurrentTraits(rowDef: Array<TableRowDefinition>, nextTraits: Array<EcoTraitsItem>, availableRepositories: Array<any>): void {
    let i = 0;
    for (const rd of rowDef) {
      if (rd.type === 'data') {
        // @Todo? zip API calls
        // @TODO IMPORTANT FIX TB-TSB-LIB if repository is null, undefined or 'otherunknown' => returns null
        if (rd.repository === 'otherunknown') {
          nextTraits.push({
            initial: {repo: rd.repository, idTaxo: rd.repositoryIdTaxo, idNomen: rd.repositoryIdNomen, name: rd.displayName },
            traitsRepo: null
          });
          i++;
          // next traits
          if (i === rowDef.length - 1) { this.currentTraitsValues.next(nextTraits); return; }
        } else if (_.find(availableRepositories, ar => ar.id === rd.repository)) {
          // Repository exists

          // Get an observable to grab traits according to input repository
          // eg for input 'bdtfx', the related traits repository is 'baseflor'
          const repoTraitsObservable = this.getRepoTraitsObservable(rd.repository, rd.repositoryIdNomen);
          const traitsRepository = this.getEcoTraitsRepoAccordingToRepoAndWs(rd.repository, this.wsService.currentWS.getValue());

          if (repoTraitsObservable && traitsRepository) {
            repoTraitsObservable.subscribe(
              result => {
                const traits = { repository: traitsRepository, traits: result };
                nextTraits.push({
                  initial: {repo: rd.repository, idTaxo: rd.repositoryIdTaxo, idNomen: rd.repositoryIdNomen, name: rd.displayName },
                  traitsRepo: result == null ? null : traits
                });
                i++;
                // next traits
                if (i === rowDef.length - 1) { this.currentTraitsValues.next(nextTraits); return; }
              }, error => {
                // @Todo manage error
                console.log(error);
                i++;
                // next traits
                if (i === rowDef.length - 1) { this.currentTraitsValues.next(nextTraits); return; }
              }
            );
          }
        } else if (!rd.repository) {
          // ? A (syn)taxon whitout repository ?
          nextTraits.push({
            initial: {repo: rd.repository, idTaxo: rd.repositoryIdTaxo, idNomen: rd.repositoryIdNomen, name: rd.displayName },
            traitsRepo: null
          });
          i++;
          if (i === rowDef.length - 1) { this.currentTraitsValues.next(nextTraits); return; }
        } else {
          // Otherwise
          nextTraits.push({
            initial: {repo: rd.repository, idTaxo: rd.repositoryIdTaxo, idNomen: rd.repositoryIdNomen, name: rd.displayName },
            traitsRepo: null
          });
          i++;
          if (i === rowDef.length - 1) { this.currentTraitsValues.next(nextTraits); return; }
        }
      } else {
        i++;
        // next traits
        if (i === rowDef.length - 1) { this.currentTraitsValues.next(nextTraits); return; }
      }
    }
  }

  /**
   * Get baseflor traits from a BDTFX nomen id
   */
  getBaseflorTraitsByIdNomen(repo: string, bdtfxNomen: number): Observable<any> {
    if (repo !== 'bdtfx') {
      return of(null);
    } else {
      return this.http.get<any>(`${environment.esBaseUrl}/baseflor/_search?q=bdnff_nomen_id:${bdtfxNomen}`).pipe(
        map(result => _.map(result.hits.hits, hit => hit._source)[0])
      );
    }
  }
}

export interface EcoTraitsItem {
  initial: { repo: string, idTaxo: string, idNomen: number, name: string };
  traitsRepo: any;
}
