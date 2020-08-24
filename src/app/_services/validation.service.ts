import { Injectable } from '@angular/core';

import { OccurrenceValidationModel } from '../_models/occurrence-validation.model';
import { SyntheticColumn } from '../_models/synthetic-column.model';
import { Sye } from '../_models/sye.model';
import { Table } from '../_models/table.model';
import { OccurrenceModel } from '../_models/occurrence.model';

import * as _ from 'lodash';

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
      return validations.find(x => x !== undefined); // get the first available item (the first item could not be validations[0] !)
      // return validations[0];
    } else {
      return null;
    }
  }

  getSingleName(element: 'table' | 'sye' | 'releve' | 'idiotaxon', validations: Array<OccurrenceValidationModel>): string {
    const preferedValidation = this.getPreferedValidation(element, validations);
    if (preferedValidation) {
      if (preferedValidation.repository === 'otherunknown') {
        return preferedValidation.inputName && preferedValidation.inputName !== '' ? preferedValidation.inputName : '?';
      } else {
        return preferedValidation.validatedName ? preferedValidation.validatedName : preferedValidation.inputName;
      }
    } else {
      return '?';
    }
  }

  /**
   * Remove the Validation ids ('id' and '@id' plus other ld+json values if exists)
   */
  removeIds(validation: OccurrenceValidationModel): OccurrenceValidationModel {
    const _validation = _.clone(validation);

    if (_validation == null) {
      throw new Error('Can\'t remove validation ids for a non existing validation !');
    }

    if (_validation !== null && _validation.id !== null) {
      // Remove validation id
      _validation.id = null;
    }

    // Remove '@id' property (ld+json support)
    if (_validation['@id'] !== null) {
      delete _validation['@id'];

      // Remove other ld+json fields
      if (_validation['@context'] !== null) { delete _validation['@context']; }
      if (_validation['@type'] !== null) { delete _validation['@type']; }
    }

    return _validation;
  }


}
