import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { TableService } from 'src/app/_services/table.service';
import { EFloreService, EfloreImages, EfloreImageData } from 'src/app/_services/e-flore.service';
import { TableSelectedElement } from 'src/app/_models/table/table-selected-element.model';

@Component({
  selector: 'vl-idiotaxon-images',
  templateUrl: './idiotaxon-images.component.html',
  styleUrls: ['./idiotaxon-images.component.scss']
})
export class IdiotaxonImagesComponent implements OnInit, OnDestroy {
  tableSelectionSubscriber: Subscription;
  images: Array<EfloreImageData> = [];
  errorLoadingImages = false;
  isLoadingImages = false;
  currentImageIndex: number = null;
  badSelection = false;

  constructor(private tableService: TableService, private efloreService: EFloreService) { }

  ngOnInit() {
    // Watch table selection change
    this.tableSelectionSubscriber = this.tableService.tableSelectionElement.subscribe(selectedElement => {
      this.process(selectedElement);
    });

    // Get table selection at startup
    const se = this.tableService.tableSelectionElement.getValue();
    if (se) { this.process(se); }

  }

  ngOnDestroy() {
    if (this.tableSelectionSubscriber) { this.tableSelectionSubscriber.unsubscribe(); }
  }

  process(selectedElement: TableSelectedElement): void {
    if (selectedElement === null) { return; } // null element may be send
    this.images = [];
    this.currentImageIndex = null;
    this.badSelection = false;
    if (selectedElement.element === 'groupName' || (selectedElement.element === 'row' && selectedElement.startPosition === selectedElement.endPosition)) {
      // row definition cell item (taxon / syntaxon name)
      if (selectedElement.rowId) {
        // get occurrence from table rowDefinitions
        const rowDef = this.tableService.getCurrentTable().rowsDefinition[selectedElement.rowId];
        if (rowDef && rowDef.repository && rowDef.repositoryIdTaxo && rowDef.repository === 'bdtfx') {
          // ok we can get eflore informations about a bdtfx taxonomic item
          this.isLoadingImages = true;
          this.efloreService.getBdtfxImages([Number(rowDef.repositoryIdTaxo)]).subscribe(
            images => {
              this.errorLoadingImages = false;
              this.isLoadingImages = false;
              for (const key in images.resultats) {
                if (images.resultats.hasOwnProperty(key)) {
                  const image = images.resultats[key];
                  this.images.push(image);
                }
              }
              if (this.images.length > 0) {
                this.currentImageIndex = 0;
              }
            },
            error => {
              // @Todo manage error
              this.isLoadingImages = false;
              this.errorLoadingImages = true;
              this.images = [];
              console.log('Nous ne parvenons pas à récupérer les images associées à cette occurrence');
            }
          );
        }
      }
    } else if (selectedElement.element === 'row' && selectedElement.startPosition !== selectedElement.endPosition) {
      // multiple rows selected
      this.badSelection = true;
    } else if (selectedElement.element === 'row' && !selectedElement.startPosition && !selectedElement.endPosition) {
      // multiple rows selected
      this.badSelection = true;
    } else {
      // other element selected
      this.badSelection = true;
    }
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) { this.currentImageIndex--; }
  }
  nextImage(): void {
    if (this.images && this.images.length > 0) {
      if (this.currentImageIndex < this.images.length - 1) { this.currentImageIndex++; }
    }
  }

}
