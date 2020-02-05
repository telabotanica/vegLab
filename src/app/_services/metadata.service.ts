import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, Validators, ValidatorFn } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';

import { ExtendedFieldModel } from '../_models/extended-field.model';
import { FieldDataType } from '../_enums/field-data-type-enum';

import { environment } from '../../environments/environment';

import * as moment from 'moment';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  public metadataList = new BehaviorSubject<Array<ExtendedFieldModel>>(undefined);
  public isLoadingMetadataList = false;

  constructor(private http: HttpClient) { }

  refreshMetadataList(): void {
    this.isLoadingMetadataList = true;
    this.http.get(`${environment.apiBaseUrl}/extended_fields.json?projectName=veglab`).subscribe(
      result => {
        this.isLoadingMetadataList = false;
        this.setMetadataList(result as Array<ExtendedFieldModel>);
      }, error => {
        this.isLoadingMetadataList = false;
        this.setMetadataList([]);
      }
    );
  }

  getMetadataByFieldId(fieldId: string, refreshList = true): ExtendedFieldModel {
    if (fieldId !== null) {
      // refresh meta list from local storage
      if (refreshList) { this.refreshMetadataList(); }
      const metaList = this.metadataList.getValue();
      if (metaList !== null && metaList.length > 0) {
        const meta = _.find(metaList, ml => ml.fieldId === fieldId);
        if (meta !== null) { return meta; } else { return null; }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  postMetadata(metadata: ExtendedFieldModel): Observable<ExtendedFieldModel> {
    return this.http.post<ExtendedFieldModel>(`${environment.apiBaseUrl}/extended_fields`, metadata);
  }

  setMetadataList(list: Array<ExtendedFieldModel>): void {
    this.metadataList.next(list);
    this.localSaveMetadataList();
  }

  localSaveMetadataList() {
    localStorage.setItem('metadataList', JSON.stringify(this.metadataList.getValue()));
  }

  retrieveMetadataList() {
    const storedData = localStorage.getItem('metadataList');
    const list = JSON.parse(storedData);
    if (list instanceof Array && list.length > 0) {
      this.metadataList.next(list);
    } else {
      this.metadataList.next([]);
    }
  }

  createInput(metadataType: ExtendedFieldModel): FormControl {
    let validators: Array<ValidatorFn> = [];
    if (metadataType.isMandatory) { validators.push(Validators.required); }
    let control: FormControl;
    switch (metadataType.dataType) {
      case 'Décimal':
        validators = [...validators, MetadataService.isANumberValidator, Validators.min(metadataType.minValue), Validators.max(metadataType.maxValue)];
        control = new FormControl({value: '', disabled: !metadataType.isEditable}, Validators.compose(validators));
        return control;
      case 'Entier':
        validators = [...validators, MetadataService.isANumberValidator, Validators.min(metadataType.minValue), Validators.max(metadataType.maxValue)];
        control = new FormControl({value: '', disabled: !metadataType.isEditable}, Validators.compose(validators));
        return control;
      case 'Texte':
        if (metadataType.regexp !== null) {
          validators = [...validators, Validators.pattern(metadataType.regexp)];
        } else {
          validators = [...validators];
        }
        control = new FormControl({value: '', disabled: !metadataType.isEditable}, validators);
        return control;
      case 'Date':
        validators = [...validators];
        control = new FormControl({value: '', disabled: !metadataType.isEditable}, validators);
        return control;
      case 'Booléen':
        validators = [...validators];
        control = new FormControl({value: false, disabled: !metadataType.isEditable}, validators);
        return control;
      default:
        return control;
    }
  }

  /**
   * Return an object associating a metadata (ExtendedFieldModel) and a control (FormControl)
   */
  createExtendedInput(metadataType: ExtendedFieldModel): { metadata: ExtendedFieldModel, control: FormControl } {
    return { metadata: metadataType, control: this.createInput(metadataType) };
  }

  // tslint:disable-next-line:member-ordering
  static isANumberValidator(control: FormControl) {
    if (!isNaN(control.value)) { return null; }
    return { NaN: true };
  }

  public checkMetadataValue(metadataType: ExtendedFieldModel, value: any): { isValid: boolean, consolidedValue: any, errorMessage: string } {
    let isValid = false;
    let consolidedValue: any;
    let errorMessage: string;

    switch (metadataType.dataType) {
      // BOOLEAN
      case FieldDataType.BOOL:
        // check "true" / "false" values
        if (value.toLowerCase() === 'true')  { isValid = true; consolidedValue = true;
        } else if (value.toLowerCase() === '1')     { isValid = true; consolidedValue = true;
        } else if (value.toLowerCase() === 'false') { isValid = true; consolidedValue = false;
        } else if (value.toLowerCase() === '0')     { isValid = true; consolidedValue = false;
        } else {
          isValid = false;
          errorMessage = 'Format non valide';
        }
        return { isValid, consolidedValue, errorMessage };
      // DATE
      case FieldDataType.DATE:
        // split value
        const dateArray = value.split('/');
        // a JS Date must contains year, month and day values
        const jsReadableDate = value.replace(/00\//g, '01/').replace(/\/0\//g, '/01/');

        if (dateArray.length !== 3
            || isNaN(Number(dateArray[0]))
            || isNaN(Number(dateArray[1]))
            || isNaN(Number(dateArray[2]))
            ) {
          // not a valid data
          isValid = false;
          consolidedValue = null;
          errorMessage = 'Format non valide';
        } else {
          isValid = true;
          consolidedValue = moment(jsReadableDate, 'DD/MM/YYYY').toDate();
          errorMessage = null;
        }
        return { isValid, consolidedValue, errorMessage };
      case FieldDataType.DECIMAL:
        const decimal = Number(value.replace(',', '.'));
        if (isNaN(decimal)) {
          isValid = false;
          consolidedValue = null;
          errorMessage = 'Format non valide';
        } else {
          if (metadataType.minValue || metadataType.maxValue) {
            // min & max values
            if (metadataType.minValue && metadataType.maxValue) {
              if (decimal < metadataType.minValue || decimal > metadataType.maxValue) {
                // outside interval
                isValid = false;
                consolidedValue = null;
                errorMessage = 'Valeur en dehors de l\'interval';
              } else {
                isValid = true;
                consolidedValue = decimal;
                errorMessage = null;
              }
            } else if (metadataType.minValue) {
              if (decimal < metadataType.minValue) {
                // outside interval
                isValid = false;
                consolidedValue = null;
                errorMessage = 'Valeur en dehors de l\'interval';
              } else {
                isValid = true;
                consolidedValue = decimal;
                errorMessage = null;
              }
            } else if (metadataType.maxValue) {
              if (decimal > metadataType.maxValue) {
                // outside interval
                isValid = false;
                consolidedValue = null;
                errorMessage = 'Valeur en dehors de l\'interval';
              } else {
                isValid = true;
                consolidedValue = decimal;
                errorMessage = null;
              }
            }
          } else {
            isValid = true;
            consolidedValue = decimal;
            errorMessage = null;
          }
        }
        return { isValid, consolidedValue, errorMessage };
      case FieldDataType.INTEGER:
        const dotNumber = value.replace(',', '.');
        const integer = Number(Number(dotNumber).toFixed());
        if (isNaN(integer)) {
          isValid = false;
          consolidedValue = null;
          errorMessage = 'Format non valide';
        } else {
          if (metadataType.minValue || metadataType.maxValue) {
            // min & max values
            if (metadataType.minValue && metadataType.maxValue) {
              if (integer < metadataType.minValue || integer > metadataType.maxValue) {
                // outside interval
                isValid = false;
                consolidedValue = null;
                errorMessage = 'Valeur en dehors de l\'interval';
              } else {
                isValid = true;
                consolidedValue = integer;
                errorMessage = null;
              }
            } else if (metadataType.minValue) {
              if (integer < metadataType.minValue) {
                // outside interval
                isValid = false;
                consolidedValue = null;
                errorMessage = 'Valeur en dehors de l\'interval';
              } else {
                isValid = true;
                consolidedValue = integer;
                errorMessage = null;
              }
            } else if (metadataType.maxValue) {
              if (integer > metadataType.maxValue) {
                // outside interval
                isValid = false;
                consolidedValue = null;
                errorMessage = 'Valeur en dehors de l\'interval';
              } else {
                isValid = true;
                consolidedValue = integer;
                errorMessage = null;
              }
            }
          } else {
            isValid = true;
            consolidedValue = integer;
            errorMessage = null;
          }
        }
        return { isValid, consolidedValue, errorMessage };
      case FieldDataType.TEXT:
        isValid = true;
        consolidedValue = value.toString();
        errorMessage = null;
        return { isValid, consolidedValue, errorMessage };
      default:
        break;
    }
  }

}
