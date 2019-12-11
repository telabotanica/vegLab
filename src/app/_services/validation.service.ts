import { Injectable } from '@angular/core';

import { OccurrenceValidationModel } from '../_models/occurrence-validation.model';
import { SyntheticColumn } from '../_models/synthetic-column.model';
import { Sye } from '../_models/sye.model';
import { Table } from '../_models/table.model';
import { OccurrenceModel } from '../_models/occurrence.model';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  tablePreferedRepositoriesId      = ['baseveg', 'pvf2'];
  syePreferedRepositoriesId        = ['baseveg', 'pvf2'];
  relevePreferedRepositoriesId     = ['baseveg', 'pvf2'];
  idiotaxonPreferedRepositoriesId  = ['bdtfx'];

  constructor() { }

  getPreferedValidation(element: 'table' | 'sye' | 'releve' | 'idiotaxon', validations: Array<OccurrenceValidationModel>): OccurrenceValidationModel {
    let preferedRepositories: Array<string>;
    switch (element) {
      case 'table':
        preferedRepositories = this.tablePreferedRepositoriesId;
        break;
      case 'sye':
        preferedRepositories = this.syePreferedRepositoriesId;
        break;
      case 'releve':
        preferedRepositories = this.relevePreferedRepositoriesId;
        break;
      case 'idiotaxon':
        preferedRepositories = this.idiotaxonPreferedRepositoriesId;
        break;
      default:
        break;
    }
    if (preferedRepositories !== null && validations && validations.length > 0) {
      for (const validation of validations) {
        for (const preferedRepo of preferedRepositories) {
          if (validation.repository === preferedRepo) {
            return validation;
          }
        }
      }
      // No prefered validation ?
      return validations[0];
    } else {
      return null;
    }
  }


}
