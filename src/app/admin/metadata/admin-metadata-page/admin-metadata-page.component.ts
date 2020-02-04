import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';
import { map } from 'rxjs/operators';

import { NotificationService } from '../../../_services/notification.service';
import { MetadataService } from '../../../_services/metadata.service';
import { environment } from '../../../../environments/environment';
import { MetadataInitialSet } from '../_initial-data/metadata-initial-data';
import { Observable, zip } from 'rxjs';

@Component({
  selector: 'vl-admin-metadata-page',
  templateUrl: './admin-metadata-page.component.html',
  styleUrls: ['./admin-metadata-page.component.scss']
})
export class AdminMetadataPageComponent implements OnInit {

  // VAR
  allMetadata: Array<ExtendedFieldModel> = [];
  isLoadingMetadata = false;
  isCreatingMetadata = false;
  isEditingMetadata = false;
  metadataToRemove: ExtendedFieldModel = null;
  metadataToEdit: ExtendedFieldModel = null;
  settingInitialMetadata = false;

  // VAR Table
  columns = ['fieldId', 'projectName', 'dataType', 'isVisible', 'isEditable', 'isMandatory', 'minValue', 'maxValue', 'regexp', 'unit'];
  displayedColumns = [...this.columns, 'actions'];

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private metadataService: MetadataService) { }

  ngOnInit() {
    this.getMetadata();
  }

  // ----
  // POST
  // ----
  createMetadata(): void {
    this.isCreatingMetadata = true;
  }

  metadataPostSuccess(metadata: ExtendedFieldModel): void {
    this.isCreatingMetadata = false;
    this.getMetadata();
    this.refreshGlobalAppMetadataList();
  }

  metadataPostFail() {
    this.isCreatingMetadata = false;
  }

  metadataPostAborted() {
    this.isCreatingMetadata = false;
  }

  // -----
  // PATCH
  // -----
  editMetadata(metadata: ExtendedFieldModel): void {
    this.isEditingMetadata = true;
    this.metadataToEdit = metadata;
  }

  metadataPatchSuccess(metadata: ExtendedFieldModel) {
    this.isEditingMetadata = false;
    this.metadataToEdit = null;
    this.getMetadata();
    this.refreshGlobalAppMetadataList();
  }

  metadataPatchFail() {
    this.isEditingMetadata = false;
    this.metadataToEdit = null;
  }

  metadataPatchAborted() {
    this.isEditingMetadata = false;
    this.metadataToEdit = null;
  }

  // ------
  // DELETE
  // ------
  removeMetadata(metadata: ExtendedFieldModel): void {
    this.metadataToRemove = metadata;
  }

  metadataDeleteSuccess(success: boolean): void {
    if (success) {
      this.metadataToRemove = null;
    } else {
      this.metadataToRemove = null;
    }
    this.getMetadata();
    this.refreshGlobalAppMetadataList();
  }

  metadataDeleteFail(fail: boolean): void {
    if (fail) { this.metadataToRemove = null; }
  }

  metadataDeleteAborted(aborted: boolean): void {
    if (aborted) { this.metadataToRemove = null; }
  }

  // ----------------
  // INITIAL METADATA
  // ----------------
  checkAndUpdateInitialMetadata(): void {
    if (MetadataInitialSet == null || MetadataInitialSet.length === 0) {
      // No initial metadata to check/set
      this.notificationService.notify('Aucune métadonnée à vérifier');
    } else {
      const obs: Array<Observable<ExtendedFieldModel>> = [];
      for (const meta of MetadataInitialSet) {
        if (this.metadataService.getMetadataByFieldId(meta.fieldId) == null) {
          // meta does not exists
          obs.push(this.metadataService.postMetadata(meta));
        }
      }
      if (obs && obs.length > 0) {
        this.settingInitialMetadata = true;
        zip(...obs).subscribe(
          result => {
            this.settingInitialMetadata = false;
            this.getMetadata();
            this.notificationService.notify('Les métadonnées initiales ont été créées');
          }, error => {
            this.settingInitialMetadata = false;
            this.notificationService.error('Nous ne parvenons pas à créer les métadonnées initales');
          }
        );
      } else if (obs && obs.length === 0) {
        this.notificationService.notify('Toutes les métadonnées initiales existent.');
      }
    }
  }

  // -----
  // Other
  // -----

  refreshGlobalAppMetadataList(): void {
    this.metadataService.refreshMetadataList();
  }

  getMetadata(): void {
    this.isLoadingMetadata = true;
    this.http.get(`${environment.apiBaseUrl}/extended_fields.json`).pipe(
      map(data => data as Array<ExtendedFieldModel>)
    ).subscribe(
      data => {
        this.isLoadingMetadata = false;
        this.allMetadata = data;
      },
      error => {
        this.isLoadingMetadata = false;
        this.allMetadata = [];
      }
    );
  }

}
