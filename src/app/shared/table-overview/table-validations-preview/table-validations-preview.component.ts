import { Component, OnInit, Input } from '@angular/core';
import { EsTableModel } from 'src/app/_models/es-table.model';
import { OccurrenceValidationModel } from 'src/app/_models/occurrence-validation.model';

import { ValidationService } from 'src/app/_services/validation.service';

import * as _ from 'lodash';

@Component({
  selector: 'vl-table-validations-preview',
  templateUrl: './table-validations-preview.component.html',
  styleUrls: ['./table-validations-preview.component.scss']
})
export class TableValidationsPreviewComponent implements OnInit {
  @Input() set table(value: EsTableModel) {
    this.validations = _.clone(this.setValidations(value));
  }

  validations: any;

  constructor(private validationService: ValidationService) { }

  ngOnInit() { }

  setValidations(table: EsTableModel): any {
    let data = null;
    if (table && table.validations) {
      if (typeof(table.validations) === 'string') {
        data = JSON.parse(table.validations);
      } else if (typeof(table.validations) === 'object') {
        data = table.validations;
      }
    }

    const validations: Array<any> = [];

    validations.push({element: 'table', label: 'Tableau', value: data.table});
    for (const sye of data.syes) {
      validations.push({element: 'sye', label: 'Sye', value: sye});
      for (const releve of sye.releves) {
        validations.push({element: 'releve', label: 'Relevé', value: releve});
      }
    }

    return validations;
  }

  getValidationLabel(element: 'table' | 'sye' | 'releve', validations: Array<OccurrenceValidationModel>): string {
    const preferedValidation = this.validationService.getPreferedValidation(element, validations);
    if (preferedValidation) {
      return preferedValidation.validatedName;
    } else {
      return 'Non identifié';
    }
  }

}
