import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { NotificationService } from 'src/app/_services/notification.service';

import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';
import { ExtendeFieldTranslationModel } from 'src/app/_models/extended-field-translation.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'vl-admin-edit-metadata',
  templateUrl: './admin-edit-metadata.component.html',
  styleUrls: ['./admin-edit-metadata.component.scss']
})
export class AdminEditMetadataComponent implements OnInit {
  @Input() metadata: ExtendedFieldModel;

  @Output() success = new EventEmitter<boolean>();
  @Output() fail = new EventEmitter<boolean>();
  @Output() aborted = new EventEmitter<boolean>();

  // VAR Form
  form: FormGroup;

  // VAR
  isSendingData = false;
  frTranslation: ExtendeFieldTranslationModel = null;     // update existing fr translation

  constructor(private http: HttpClient, private notificationService: NotificationService) { }

  ngOnInit() {
    if (this.metadata.extendedFieldTranslations && this.metadata.extendedFieldTranslations.length > 0) {
      this.metadata.extendedFieldTranslations.forEach(translation => {
        if (translation.languageIsoCode === 'fr') { this.frTranslation = translation; }
      });
    }

    this.form = new FormGroup({
      // ExtendedField
      fieldId: new FormControl({value: this.metadata.fieldId, disabled: true}, [Validators.required]),
      projectName: new FormControl({value: this.metadata.projectName, disabled: true}, [Validators.required]),
      dataType: new FormControl({value: this.metadata.dataType, disabled: true}, [Validators.required]),
      isVisible: new FormControl(this.metadata.isVisible, [Validators.required]),
      isEditable: new FormControl(this.metadata.isEditable, [Validators.required]),
      isMandatory: new FormControl(this.metadata.isMandatory, [Validators.required]),
      minValue: new FormControl({value: this.metadata.minValue, disabled: true}),
      maxValue: new FormControl({value: this.metadata.maxValue, disabled: true}),
      regExp: new FormControl({value: this.metadata.regexp, disabled: true}),
      unit: new FormControl(this.metadata.unit),
      // filters
      filterStep: new FormControl(this.metadata.filterStep),
      filterLogarithmic: new FormControl(this.metadata.filterLogarithmic),
      // Translation (fr)
      label: new FormControl(this.frTranslation ? this.frTranslation.label : '', [Validators.required]),
      description: new FormControl(this.frTranslation ? this.frTranslation.description : null),
      defaultValue: new FormControl(this.metadata.defaultValue ? this.metadata.defaultValue : null),
      errorMessage: new FormControl(this.frTranslation ? this.frTranslation.errorMessage : null),
      // tslint:disable-next-line:quotemark
      languageIsoCode: new FormControl({value: "'fr'", disabled: true})
    });
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  patchMetadata(): void {
    this.isSendingData = true;
    const metadataToUpdate = {
      isVisible: this.form.controls.isVisible.value,
      isEditable: this.form.controls.isEditable.value,
      isMandatory: this.form.controls.isMandatory.value,
      defaultValue: this.form.controls.defaultValue.value ? this.form.controls.defaultValue.value.toString() : null,
      unit: this.form.controls.unit.value,
      filterStep: this.form.controls.filterStep.value ? +this.form.controls.filterStep.value : null,
      filterLogarithmic: this.form.controls.filterLogarithmic.value
    };

    const translationToUpdate = {
      label: this.form.controls.label.value,
      description: this.form.controls.description.value,
      errorMessage: this.form.controls.errorMessage.value
    };

    this.http.patch(`${environment.apiBaseUrl}/extended_fields/${this.metadata.id}`, metadataToUpdate).subscribe(
      success1 => {
        this.http.patch(`${environment.apiBaseUrl}/extended_field_translations/${this.frTranslation.id}`, translationToUpdate).subscribe(
          success2 => {
            this.isSendingData = false;
            this.success.next(true);
          }, error2 => {
            this.isSendingData = false;
            this.notificationService.error(`Nous ne parvenons pas à modifier la traduction de la métadaonnée "${this.metadata.fieldId}"`);
            this.fail.next(true);
          }
        );
      }, error1 => {
        this.isSendingData = false;
        this.notificationService.error(`Nous ne parvenons pas à modifier la métadaonnée "${this.metadata.fieldId}"`);
        this.fail.next(true);
      }
    );
  }

  abort(): void {
    this.aborted.next(true);
  }
}
