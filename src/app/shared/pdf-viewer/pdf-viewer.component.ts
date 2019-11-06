import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { TableService } from 'src/app/_services/table.service';
import { Table } from 'src/app/_models/table.model';
import { Subscription } from 'rxjs';
import { PDFProgressData, PDFDocumentProxy } from 'pdfjs-dist';

@Component({
  selector: 'vl-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  tableSubscriber: Subscription;
  table: Table;
  isLoadingFile = false;
  errorLoadingFile = false;

  constructor(private tableService: TableService) { }

  ngOnInit() {
    // Check current table at startup
    const currentTable = this.tableService.getCurrentTable();
    if (currentTable) { this.table = currentTable; }

    // Subscribe to table change
    this.tableSubscriber = this.tableService.currentTableChanged.subscribe(value => {
      if (value === true) {
        this.table = this.tableService.getCurrentTable();
      }
    });
  }

  ngOnDestroy() {
    this.tableSubscriber.unsubscribe();
  }

  getPdfBiblioSource(): string {
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
  }

  onError(error: any) {
    this.errorLoadingFile = true;
 }
}
