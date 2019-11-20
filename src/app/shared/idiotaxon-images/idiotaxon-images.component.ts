import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { TableService } from 'src/app/_services/table.service';
import { EFloreService, EfloreImages, EfloreImageData } from 'src/app/_services/e-flore.service';

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

  constructor(private tableService: TableService, private efloreService: EFloreService) { }

  ngOnInit() {
    this.tableSelectionSubscriber = this.tableService.tableSelectionElement.subscribe(selectedElement => {
      if (selectedElement === null) { return; } // null element may be send
      this.images = [];
      this.currentImageIndex = null;
      if (selectedElement.element === 'groupName') {
        // row definition cell item (taxon / syntaxon name)
        if (selectedElement.rowId) {
          // get occurrence from table rowDefinitions
          const rowDef = this.tableService.getCurrentTable().rowsDefinition[selectedElement.rowId];
          if (rowDef.repository && rowDef.repositoryIdTaxo && rowDef.repository === 'bdtfx') {
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
                this.images = null;
                console.log('Nous ne parvenons pas à récupérer les images associées à cette occurrence');
              }
            );
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.tableSelectionSubscriber) { this.tableSelectionSubscriber.unsubscribe(); }
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
