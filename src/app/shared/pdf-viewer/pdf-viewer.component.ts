import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { TableService } from 'src/app/_services/table.service';
import { Table } from 'src/app/_models/table.model';
import { Subscription } from 'rxjs';
// import { PDFProgressData, PDFDocumentProxy } from 'pdfjs-dist';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'vl-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  tableSubscriber: Subscription;
  table: Table;
  // isLoadingFile = false;
  // errorLoadingFile = false;

  sanitizedUrl: SafeResourceUrl | null;

  constructor(private tableService: TableService, public sanitizer: DomSanitizer) { }

  ngOnInit() {
    // Check current table at startup
    const currentTable = this.tableService.getCurrentTable();
    if (currentTable) {
      this.table = currentTable;
      this.sanitizedUrl = this.table.pdf && this.table.pdf.contentUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(environment.pdfBaseUrl + this.table.pdf.contentUrl) : null;
    }

    // Subscribe to table change
    this.tableSubscriber = this.tableService.currentTableChanged.subscribe(value => {
      if (value === true) {
        this.table = this.tableService.getCurrentTable();
        this.sanitizedUrl = this.table.pdf && this.table.pdf.contentUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(environment.pdfBaseUrl + this.table.pdf.contentUrl) : null;
      }
    });
  }

  ngOnDestroy() {
    if (this.tableSubscriber) { this.tableSubscriber.unsubscribe(); }
  }

  /*getPdfBiblioSource(): string {
    if (this.table && this.table.pdf && this.table.pdf.vlBiblioSource) {
      return this.table.pdf.vlBiblioSource.title;
    } else {
      return null;
    }
  }

  loadingFile(progressData: PDFProgressData) {
    if (progressData.loaded === progressData.total) { // progressData.totalis not always provided !
      this.isLoadingFile = false;
    } else {
      this.isLoadingFile = true;
    }
  }*/

  /*getContentUrl() {
    if (this.table && this.table.pdf && this.table.pdf.contentUrl) {
      return `https://localhost:8443/media/veglab/pdf/${this.table.pdf.contentUrl}`;
    }
  }*/

  /*onError(error: any) {
    this.errorLoadingFile = true;
  }*/
}
