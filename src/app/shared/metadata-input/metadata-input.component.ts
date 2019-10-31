import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';

import { MetadataService } from 'src/app/_services/metadata.service';
import { ExtendeFieldTranslationModel } from 'src/app/_models/extended-field-translation.model';


@Component({
  selector: 'vl-metadata-input',
  templateUrl: './metadata-input.component.html',
  styleUrls: ['./metadata-input.component.scss']
})
export class MetadataInputComponent implements OnInit {
  @Input() metadata?: ExtendedFieldModel;
  @Input() control?: FormControl;

  metadataContext: {metadata: ExtendedFieldModel, control: FormControl};
  metadataTranslation: ExtendeFieldTranslationModel = null; // For now, we take the first available. @TODO internationalize

  constructor(private metadataService: MetadataService) { }

  ngOnInit() {
    if (!this.metadata || !this.control) {
      this.metadataContext = this.metadataService.createExtendedInput(this.metadata);
    } else {
      this.metadataContext = {metadata: this.metadata, control: this.control};
    }

    if (this.metadataContext.metadata.extendedFieldTranslations.length > 0) {
      this.metadataTranslation = this.metadataContext.metadata.extendedFieldTranslations[0];
    } else {
      this.metadataTranslation = null;
    }
  }

}
