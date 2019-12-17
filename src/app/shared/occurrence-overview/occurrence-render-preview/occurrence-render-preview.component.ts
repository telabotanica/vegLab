import { Component, OnInit, Input } from '@angular/core';
import { OccurrenceModel as EsOccurrenceModel } from 'src/app/_models/occurrence.model';

import * as _ from 'lodash';

@Component({
  selector: 'vl-occurrence-render-preview',
  templateUrl: './occurrence-render-preview.component.html',
  styleUrls: ['./occurrence-render-preview.component.scss']
})
export class OccurrenceRenderPreviewComponent implements OnInit {
  @Input() set occurrence(value: EsOccurrenceModel) {
    this.occurrencePreview = value !== null && value.childrenPreview && value.childrenPreview.length > 0 ? _.clone(value.childrenPreview) : [];
  }

  occurrencePreview: Array<any> = [];

  constructor() { }

  ngOnInit() { }

}
