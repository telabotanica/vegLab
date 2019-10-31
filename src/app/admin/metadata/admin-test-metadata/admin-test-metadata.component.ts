import { Component, OnInit } from '@angular/core';
import { MetadataService } from 'src/app/_services/metadata.service';
import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';
import * as _ from 'lodash';

@Component({
  selector: 'vl-admin-test-metadata',
  templateUrl: './admin-test-metadata.component.html',
  styleUrls: ['./admin-test-metadata.component.scss']
})
export class AdminTestMetadataComponent implements OnInit {
  metadata = this.metadataService.metadataList.getValue();
  metadataList: Array<ExtendedFieldModel> = [];

  constructor(private metadataService: MetadataService) { }

  ngOnInit() {
    this.metadataList = _.sortBy(this.metadata, (m) => m.fieldId);
  }

}
