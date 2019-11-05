import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';

import { NotificationService } from 'src/app/_services/notification.service';
import { ExtendedFieldOccurrence } from 'src/app/_models/extended-field-occurrence';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'vl-admin-remove-metadata',
  templateUrl: './admin-remove-metadata.component.html',
  styleUrls: ['./admin-remove-metadata.component.scss']
})
export class AdminRemoveMetadataComponent implements OnInit {
  @Input() metadata: ExtendedFieldModel;

  @Output() success = new EventEmitter<boolean>();
  @Output() fail = new EventEmitter<boolean>();
  @Output() aborted = new EventEmitter<boolean>();

  isLoadingOccurrenceMetadataValues = false;
  loadedOccurrenceMetadataValuesComplete = false;
  metadataOccurrencesValues: Array<ExtendedFieldOccurrence> = [];

  constructor(private http: HttpClient, private notificationService: NotificationService) { }

  ngOnInit() {
    this.isLoadingOccurrenceMetadataValues = true;
    this.http.get(`${environment.apiBaseUrl}/extended_fields/${this.metadata.id}/extended_field_occurrences`).subscribe(result => {
      console.log(result);
      this.metadataOccurrencesValues = result as Array<ExtendedFieldOccurrence>;
      this.isLoadingOccurrenceMetadataValues = false;
      this.loadedOccurrenceMetadataValuesComplete = true;
    }, error => {
      // If we can't know how many occurrences are linked to this extended field, we should not remove it !
      this.loadedOccurrenceMetadataValuesComplete = false;
    });
  }

  deleteMetadata(): void {
    this.http.delete(`${environment.apiBaseUrl}/extended_fields/${this.metadata.id}`).subscribe(
      success => { this.success.emit(true); },
      error => {
        this.fail.next(true);
        this.notificationService.error(`Impossible de supprimer la métadonnée "${this.metadata.fieldId}"`);
      }
    );
  }

  abort(): void {
    this.aborted.next(true);
  }

}
