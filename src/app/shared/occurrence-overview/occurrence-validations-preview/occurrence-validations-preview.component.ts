import { Component, OnInit, Input, Inject } from '@angular/core';

import { OccurrenceModel as EsOccurrenceModel } from 'src/app/_models/occurrence.model';
import { OccurrenceValidationModel } from 'src/app/_models/occurrence-validation.model';

import { MomentLocalDatePipe } from 'src/app/_pipes/moment-local-date.pipe';

import { ValidationService } from 'src/app/_services/validation.service';

import * as _ from 'lodash';

@Component({
  selector: 'vl-occurrence-validations-preview',
  templateUrl: './occurrence-validations-preview.component.html',
  styleUrls: ['./occurrence-validations-preview.component.scss']
})
export class OccurrenceValidationsPreviewComponent implements OnInit {
  @Input() occurrence: EsOccurrenceModel;

  validations: Array<OccurrenceValidationModel> = [];
  emptyValidations: boolean;

  constructor(private datePipe: MomentLocalDatePipe) { }

  ngOnInit() {
    console.log('OCC VALIDATION', this.occurrence);
  }

  private getValidations(occurrence: EsOccurrenceModel): Array<OccurrenceValidationModel> {
    let validations: Array<OccurrenceValidationModel> = null;
    const result: Array<{repo: string, name: string, validatedBy: number, validatedAt: any}> = [];

    if (occurrence !== null && occurrence.validations && occurrence.validations.length > 0) {
      validations = occurrence.validations;
    }

    return validations;
  }

  isValidationsEmpty(occurrence: EsOccurrenceModel): boolean {
    if (occurrence !== null) {
      const validations = occurrence.validations;
        if (validations == null || (validations && validations.length === 0)) { return true; }
        let result = true;
        for (const validation of validations) {
          if (validation.validatedBy == null
              && validation.validatedAt == null
              && validation.updatedBy == null
              && validation.updatedAt == null
              && validation.repository == null
              && validation.repositoryIdNomen == null
              && validation.repositoryIdTaxo == null
              && validation.inputName == null
              && validation.validatedName == null
              && validation.validName == null) {
                result = true;
              } else {
                result = false;
              }
        }
        return result;
    } else  {
      return true;
    }
  }

  getValidationName(validation: OccurrenceValidationModel): string {
    if (validation !== null) {
      if (validation.repository === 'otherunknonw') {
        return validation.inputName;
      } else if (validation.repository !== 'otherunknonwn') {
        return validation.validatedName;
      } else {
        return '?';
      }
    } else {
      return 'non identifié';
    }
  }

  getValidationAuthor(validation: OccurrenceValidationModel): string {
    if (validation !== null) {
      if (validation.updatedBy) {
        return validation.updatedBy.toString();   // @Todo show name instead of user id
      } else if (validation.validatedBy) {
        return validation.validatedBy.toString(); // @Todo show name instead of user id
      } else  {
        return '?';
      }
    } else {
      return '-';
    }
  }

  getValidationDate(validation: OccurrenceValidationModel): string {
    if (validation !== null) {
      if (validation.updatedAt) {
        return this.datePipe.transform(validation.updatedAt);
      } else if (validation.validatedAt) {
        return this.datePipe.transform(validation.validatedAt);
      } else  {
        return '?';
      }
    } else {
      return '-';
    }
  }

}
