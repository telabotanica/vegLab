import { Component, OnInit, Input } from '@angular/core';

import { EsOccurrenceModel } from 'src/app/_models/es-occurrence-model';
import { EsExtendedFieldModel } from 'src/app/_models/es-extended-field-model';
import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';

import { MetadataService } from 'src/app/_services/metadata.service';

import * as _ from 'lodash';

@Component({
  selector: 'vl-occurrence-metadata-preview',
  templateUrl: './occurrence-metadata-preview.component.html',
  styleUrls: ['./occurrence-metadata-preview.component.scss']
})
export class OccurrenceMetadataPreviewComponent implements OnInit {
  @Input() set occurrence(value: EsOccurrenceModel) {
    this.esMetadataValues = _.clone(this.getEsMetadataValues(value));
    this.metadata = _.clone(this.getMetadata());
    this.emptyMetadata = this.isMetadataEmpty(value);
  }

  esMetadataValues: Array<EsExtendedFieldModel> = [];
  metadata: Array<{fieldId: string, metadata: ExtendedFieldModel}> = [];
  emptyMetadata: boolean;

  constructor(private metadataService: MetadataService) { }

  ngOnInit() { }

  /**
   * Returns ES metadata values from a given occurrence
   */
  private getEsMetadataValues(occurrence: EsOccurrenceModel): Array<EsExtendedFieldModel> {
    if (occurrence !== null && occurrence.extendedFieldValues && occurrence.extendedFieldValues.length > 0) {
      return occurrence.extendedFieldValues;
    } else {
      return [];
    }
  }

  /**
   * Returns full ExtendedFieldModel (Metadata) object related to a fieldId
   */
  private getMetadata(): Array<{fieldId: string, metadata: ExtendedFieldModel}> {
    if (this.esMetadataValues !== null && this.esMetadataValues.length > 0) {
      const response: Array<{fieldId: string, metadata: ExtendedFieldModel}> = [];
      for (const esMetaValue of this.esMetadataValues) {
        const meta = this.metadataService.getMetadataByFieldId(esMetaValue.fieldId);
        response.push({fieldId: esMetaValue.fieldId, metadata: meta});
      }
      return response;
    } else {
      return [];
    }
  }

  /**
   * Returns a full ExtendedFieldModel (Metadata) object for a given fieldId
   */
  public getMetadataForFieldId(fieldId: string): ExtendedFieldModel {
    if (this.metadata !== null && this.metadata.length > 0) {
      return _.find(this.metadata, meta => meta.fieldId === fieldId).metadata;
    } else {
      return null;
    }
  }

  public isMetadataEmpty(occurrence: EsOccurrenceModel): boolean {
    if (occurrence !== null && occurrence.extendedFieldValues && occurrence.extendedFieldValues.length > 0) {
      return false;
    } else {
      return true;
    }
  }

}
