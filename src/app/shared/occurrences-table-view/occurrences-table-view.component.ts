import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { OccurrenceModel as EsOccurrenceModel } from 'src/app/_models/occurrence.model';

@Component({
  selector: 'vl-occurrences-table-view',
  templateUrl: './occurrences-table-view.component.html',
  styleUrls: ['./occurrences-table-view.component.scss']
})
export class OccurrencesTableViewComponent implements OnInit {
  @ViewChild('OccurrencesPaginator') paginator: MatPaginator;

  @Input()  count: number;
  @Input()  size: number;
  @Input()  pageIndex: number;
  @Input()  occurrences: Array<EsOccurrenceModel> = [];
  @Input()  isLoading: boolean;
  @Input()  displayedColumns: Array<string> = ['id', 'level', 'layer', 'custom_col_validation', 'dateObserved', 'locality', 'vlLocationAccuracy', 'custom_col_actions'];
  @Output() pageChange: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  @Output() previewOccurrence: EventEmitter<EsOccurrenceModel> = new EventEmitter<EsOccurrenceModel>();
  @Output() deleteOccurrence: EventEmitter<EsOccurrenceModel> = new EventEmitter<EsOccurrenceModel>();

  constructor() { }

  ngOnInit() { }

  getValidation(occurrence: EsOccurrenceModel): string {
    if (occurrence && occurrence.validations && occurrence.validations.length > 0) {
      return occurrence.validations[0].validatedName;
    } else {
      return '?';
    }
  }

  getLocality(occurrence: EsOccurrenceModel): string {
    if (occurrence && occurrence.locality) {
      return occurrence.locality;
    } else {
      return '?';
    }
  }

  getLayer(occurrence: EsOccurrenceModel): string {
    return occurrence.layer ? occurrence.layer : null;
  }

  _pageChange(pageEvent: PageEvent): void {
    this.pageChange.next(pageEvent);
  }

  previewOccurrenceAction(occurrence: EsOccurrenceModel): void {
    this.previewOccurrence.next(occurrence);
  }

  deleteOccurrenceAction(occurrence: EsOccurrenceModel): void {
    this.deleteOccurrence.next(occurrence);
  }

}
