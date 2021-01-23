import { Injectable } from '@angular/core';

import { OccurrenceValidationModel } from '../_models/occurrence-validation.model';
import { SyntheticColumn } from '../_models/synthetic-column.model';
import { Sye } from '../_models/sye.model';
import { Table } from '../_models/table.model';
import { OccurrenceModel } from '../_models/occurrence.model';
import { EsOccurrenceModel } from '../_models/es-occurrence-model';

import * as _ from 'lodash';
import { EsTableModel } from '../_models/es-table.model';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  tablePreferedRepositoriesId            = ['baseveg', 'pvf2'];
  syePreferedRepositoriesId              = ['baseveg', 'pvf2'];
  relevePreferedRepositoriesId           = ['baseveg', 'pvf2'];
  syntheticColumnPreferedRepositoriesId  = ['baseveg', 'pvf2'];
  idiotaxonPreferedRepositoriesId        = ['bdtfx'];

  constructor() { }

  isATableType(element: any): boolean {
    const type = (el: any): el is Table => true;
    type(element);
    return false;
  }

  isASyeType(element: any): boolean {
    const type = (el: any): el is Sye => true;
    type(element);
    return false;
  }

  isAnOccurrenceType(element: any): boolean {
    const type = (el: any): el is OccurrenceModel => true;
    type(element);
    return false;
  }

  isASyntheticColumnType(element: any): boolean {
    const type = (el: any): el is OccurrenceModel => true;
    type(element);
    return false;
  }

  isAnESOccurrenceType(element: any): boolean {
    const type = (el: any): el is EsOccurrenceModel => true;
    type(element);
    return false;
  }

  isAnESTableType(element: any): boolean {
    const type = (el: any): el is EsTableModel => true;
    type(element);
    return false;
  }

  getPreferedValidation(element: Table | Sye | OccurrenceModel | SyntheticColumn | EsOccurrenceModel): OccurrenceValidationModel {
    let preferedRepositories: Array<string>;

    if (element && element.validations) {
      if (element.validations.length === 0) {
        return null;
      } else if (element.validations.length === 1) {
        return element.validations[0];
      } else {

        // Check element type to get suitable preferedRepositories
        if (this.isATableType(element) || this.isAnESTableType(element)) {
          preferedRepositories = this.tablePreferedRepositoriesId;
        } else if (this.isASyeType(element)) {
          preferedRepositories = this.syePreferedRepositoriesId;
        } else if (this.isAnOccurrenceType(element) || this.isAnESOccurrenceType(element)) {
          try {
            const occ = element as OccurrenceModel;
            if (occ.level === 'idiotaxon') {
              // Get an idiotaxon
              preferedRepositories = this.idiotaxonPreferedRepositoriesId;
            } else if (occ.level === 'synusy' || occ.level === 'microcenosis') {
              // Get a synusy or a microcenosis
              preferedRepositories = this.relevePreferedRepositoriesId;
            } else {
              // @Todo implements other types
            }
          } catch (error) {
            return null;
          }
        } else if (this.isASyntheticColumnType(element)) {
          preferedRepositories = this.syntheticColumnPreferedRepositoriesId;
        }
      }

      // Got the prefered repositories according to element type
      if (preferedRepositories == null) { return null; }

      for (const validation of element.validations) {
        for (const preferedRepo of preferedRepositories) {
          if (validation.repository === preferedRepo) {
            return validation;
          }
        }
      }

      // No prefered validation ?
      return element.validations.find(x => x !== undefined); // get the first available item (the first item could not be validations[0] !)

    } else {
      return null;
    }
  }

  getSingleName(element: Table | Sye | OccurrenceModel | SyntheticColumn | EsOccurrenceModel): string {
    const preferedValidation = this.getPreferedValidation(element);
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
