import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { OccurrenceModel as EsOccurrenceModel } from 'src/app/_models/occurrence.model';
import { GeoJsonObject } from 'geojson';

@Component({
  selector: 'vl-occurrence-preview',
  templateUrl: './occurrence-preview.component.html',
  styleUrls: ['./occurrence-preview.component.scss']
})
export class OccurrencePreviewComponent implements OnInit {
  @Input() occurrence: EsOccurrenceModel;

  @Output() close = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

  getGeoJsonArray(occurrence: EsOccurrenceModel): Array<GeoJsonObject> {
    if (occurrence !== null && occurrence.geometry) {
      return [occurrence.geometry];
    } else {
      return [];
    }
  }

  closeMe() {
    this.close.next(true);
  }

}
