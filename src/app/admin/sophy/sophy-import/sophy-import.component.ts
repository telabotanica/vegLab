import { Component, OnInit, ViewChild } from '@angular/core';

import { FileData } from 'tb-dropfile-lib/lib/_models/fileData';
import { RejectedFileData } from 'tb-dropfile-lib/lib/_models/rejectedFileData';

import { TableService } from 'src/app/_services/table.service';

import { TableImportComponent } from 'src/app/shared/table-import/table-import.component';
import * as _ from 'lodash';
import { Table } from 'src/app/_models/table.model';
import { MetadataService } from 'src/app/_services/metadata.service';

@Component({
  selector: 'vl-sophy-import',
  templateUrl: './sophy-import.component.html',
  styleUrls: ['./sophy-import.component.scss']
})
export class SophyImportComponent implements OnInit {
  // @ViewChild(TableImportComponent) tableImportCmpt: TableImportComponent;
  // Vars File
  allowedFileTypes = ['csv'];
  maxFileSize = 50000;
  uploadedFile: File;
  uploadedFileName: string;

  // files queue
  fq: Array<{
    file: FileData;
    stepFile: 'complete' | 'warning' | 'error' | 'pending',
    stepNames: 'complete' | 'warning' | 'error' | 'pending',
    stepPlaces: 'complete' | 'warning' | 'error' | 'pending',
    stepAuthorsDates: 'complete' | 'warning' | 'error' | 'pending',
    stepMetadata: 'complete' | 'warning' | 'error' | 'pending',
    stepBiblio: 'complete' | 'warning' | 'error' | 'pending',
    stepValidation: 'complete' | 'warning' | 'error' | 'pending',
    isSaving: boolean,
    saveFinish: boolean,
    saveError: boolean
  }> = [];
  setTable = false;

  fileToProcess: FileData = null;
  fileToProcessIndex = 0;

  displayedColumns = ['filename', 'stepFile', 'stepNames', 'stepPlaces', 'stepAuthorsDates', 'stepMetadata', 'stepBiblio', 'stepValidation', 'saving'];

  constructor(private tableService: TableService, private metadataService: MetadataService) { }

  ngOnInit() {
  }

  acceptedFiles(files: Array<FileData>): void {

    this.resetComponent();

    this.fq = _.map(files, file => {
      return {
        file,
        stepFile: null,
        stepNames: null,
        stepPlaces: null,
        stepAuthorsDates: null,
        stepMetadata: null,
        stepBiblio: null,
        stepValidation: null,
        isSaving: false,
        saveFinish: false,
        saveError: false
      };
    });

    console.log(this.fq);

    this.processNextFile();
  }

  rejectedFiles(data: Array<RejectedFileData>): void {

  }

  deletedFiles(data: Array<FileData>): void {
    this.resetComponent();
  }

  resetComponent(): void {
    // Reset all vars
    this.fileToProcessIndex = 0;
    this.fq = [];
    this.fileToProcess = null;

  }

  processNextFile(): void {
    // Set file to process
    this.fileToProcess = this.fq[this.fileToProcessIndex].file;

  }

  allStepsComplete(process: any): boolean {
    if (process.stepFile === 'complete' &&
        (process.stepNames === 'complete' || process.stepNames === 'warning') &&
        process.stepPlaces === 'complete' &&
        process.stepAuthorsDates === 'complete' &&
        process.stepMetadata === 'complete' &&
        process.stepBiblio === 'complete' &&
        (process.stepValidation === 'complete' || process.stepValidation === 'warning')) {
          return true;
        }
  }

  checkStepsProgression(): void {
    const currentProcess = this.fq[this.fileToProcessIndex];
    if (this.allStepsComplete(currentProcess)) {
          // All steps complete
          // currentProcess.isSaving = true;
          // save file subscribe => ok => set fileToProcess == null, wait 100, process next file
          this.setTable = true;
          setTimeout(() => { this.setTable = false; }, 100);
        }
  }

  newTable(newTable: Table) {
    const sophyTableId = this.metadataService.getOccurrenceMetadataByFieldId(newTable.sye[0].occurrences[0], 'sophy_import_numero_tableau');
    const sophyBiblioId = this.metadataService.getOccurrenceMetadataByFieldId(newTable.sye[0].occurrences[0], 'sophy_import_numero_publication');
    newTable.title = `Import SOPHY tab.${sophyTableId ? sophyTableId : '?'} bib.${sophyBiblioId ? sophyBiblioId : '?'}`;
    newTable.description = 'Tableau issu de la base de données SOPHY.';
    console.log(newTable);

    // Post new table
    this.fq[this.fileToProcessIndex].isSaving = true;
    this.tableService.postTable(newTable).subscribe(
      success => {
        this.fq[this.fileToProcessIndex].isSaving = false;
        this.fq[this.fileToProcessIndex].saveFinish = true;
        this.fq[this.fileToProcessIndex].saveError = false;

        this.fileToProcess = null;

        setTimeout(() => {
          this.fileToProcessIndex = this.fileToProcessIndex + 1;
          if (this.fileToProcessIndex < this.fq.length) {
            this.processNextFile();
          }
        }, 1000);
      }, error => {
        this.fq[this.fileToProcessIndex].isSaving = false;
        this.fq[this.fileToProcessIndex].saveFinish = true;
        this.fq[this.fileToProcessIndex].saveError = false;

        this.fileToProcess = null;

        setTimeout(() => {
          this.fileToProcessIndex = this.fileToProcessIndex + 1;
          if (this.fileToProcessIndex < this.fq.length) {
            this.processNextFile();
          }
        }, 1000);
      }
    );
  }

  /**
   * FILE
   */
  currentFileProcessingStepFileChanges(value: 'complete' | 'warning' | 'error' | 'pending'): void {
    console.log('STEP FILE', value);
    this.fq[this.fileToProcessIndex].stepFile = value;
    this.checkStepsProgression();
  }

  /**
   * NAMES
   */
  currentFileProcessingStepNamesChanges(value: 'complete' | 'warning' | 'error' | 'pending'): void {
    console.log('STEP NAMES', value);
    this.fq[this.fileToProcessIndex].stepNames = value;
    this.checkStepsProgression();
  }

  /**
   * PLACES
   */
  currentFileProcessingStepPlacesChanges(value: 'complete' | 'warning' | 'error' | 'pending'): void {
    console.log('STEP PLACES', value);
    this.fq[this.fileToProcessIndex].stepPlaces = value;
    this.checkStepsProgression();
  }

  /**
   * AUTHORS & DATES
   */
  currentFileProcessingStepAuthorsDatesChanges(value: 'complete' | 'warning' | 'error' | 'pending'): void {
    console.log('STEP AUTHOR & DATE', value);
    this.fq[this.fileToProcessIndex].stepAuthorsDates = value;
    this.checkStepsProgression();
  }

  /**
   * METADATA
   */
  currentFileProcessingStepMetadataChanges(value: 'complete' | 'warning' | 'error' | 'pending'): void {
    console.log('STEP METADATA', value);
    this.fq[this.fileToProcessIndex].stepMetadata = value;
    this.checkStepsProgression();
  }

  /**
   * BIBLIO
   */
  currentFileProcessingStepBiblioChanges(value: 'complete' | 'warning' | 'error' | 'pending'): void {
    console.log('STEP BIBLIO', value);
    this.fq[this.fileToProcessIndex].stepBiblio = value;
    this.checkStepsProgression();
  }

  /**
   * VALIDATION
   */
  currentFileProcessingStepValidationChanges(value: 'complete' | 'warning' | 'error' | 'pending'): void {
    console.log('STEP VALIDATION', value);
    this.fq[this.fileToProcessIndex].stepValidation = value;
    this.checkStepsProgression();
  }


}
