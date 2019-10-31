import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { NotificationService } from 'src/app/_services/notification.service';

import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';
import { ExtendeFieldTranslationModel } from 'src/app/_models/extended-field-translation.model';

@Component({
  selector: 'vl-admin-create-metadata',
  templateUrl: './admin-create-metadata.component.html',
  styleUrls: ['./admin-create-metadata.component.scss']
})
export class AdminCreateMetadataComponent implements OnInit {
  @Output() createdMetadata = new EventEmitter<ExtendedFieldModel>();
  @Output() fail = new EventEmitter<boolean>();
  @Output() aborted = new EventEmitter<boolean>();

  // VAR Form
  form: FormGroup;

  // VAR
  isSendingData = false;

  constructor(private http: HttpClient, private notificationService: NotificationService) { }

  ngOnInit() {
    this.form = new FormGroup({
      // ExtendedField
      fieldId: new FormControl('', [Validators.required, Validators.pattern('^[a-z]+')]),
      projectName: new FormControl('veglab:*', [Validators.required]),
      dataType: new FormControl('', [Validators.required]),
      isVisible: new FormControl(true, [Validators.required]),
      isEditable: new FormControl(true, [Validators.required]),
      isMandatory: new FormControl(true, [Validators.required]),
      minValue: new FormControl(null),
      maxValue: new FormControl(null),
      regExp: new FormControl(null),
      unit: new FormControl(null),
      // filters
      filterStep: new FormControl(null),
      filterLogarithmic: new FormControl(false),
      // Translation
      label: new FormControl('', [Validators.required]),
      description: new FormControl(null),
      defaultValue: new FormControl(null),
      errorMessage: new FormControl(null),
      languageIsoCode: new FormControl('fr')
    });
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  postMetadata() {
    const metadata: ExtendedFieldModel = {
      id: null,
      fieldId: this.form.controls.fieldId.value,
      projectName: this.form.controls.projectName.value,
      dataType: this.form.controls.dataType.value,
      isVisible: this.form.controls.isVisible.value,
      isEditable: this.form.controls.isEditable.value,
      isMandatory: this.form.controls.isMandatory.value,
      minValue: this.form.controls.minValue.value ? +this.form.controls.minValue.value : null,
      maxValue: this.form.controls.maxValue.value ? +this.form.controls.maxValue.value : null,
      defaultValue: this.form.controls.defaultValue.value ? this.form.controls.defaultValue.value.toString() : null,
      regexp: this.form.controls.regExp.value,
      unit: this.form.controls.unit.value,
      filterStep: this.form.controls.filterStep.value ? +this.form.controls.filterStep.value : null,
      filterLogarithmic: this.form.controls.filterLogarithmic.value,
      extendedFieldTranslations: []
    };
    const frTranslation: ExtendeFieldTranslationModel = {
      id: null,
      projectName: this.form.controls.projectName.value,
      label: this.form.controls.label.value,
      description: this.form.controls.description.value,
      errorMessage: this.form.controls.errorMessage.value,
      languageIsoCode: this.form.controls.languageIsoCode.value
    };
    metadata.extendedFieldTranslations.push(frTranslation);

    this.isSendingData = true;
    this.http.post('http://localhost:8000/api/extended_fields', metadata).subscribe(
      success => {
        this.isSendingData = false;
        this.createdMetadata.next(success as ExtendedFieldModel);
      },
      error => {
        this.isSendingData = false;
        const errorMessage: string = error.error['hydra:description'];
        if (errorMessage.search('Duplicate entry') !== -1) {
          this.notificationService.error(`Une entrée "${metadata.fieldId}" pour le projet "${metadata.projectName}" existe déjà`);
        } else {
          this.notificationService.error('Nous ne parvenons pas à créer la nouvelle métadaonnée');
        }
      }
    );
  }

  abort(): void {
    this.aborted.next(true);
  }

}
