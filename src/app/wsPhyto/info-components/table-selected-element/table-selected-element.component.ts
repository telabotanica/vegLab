import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { TableService } from '../../../_services/table.service';
import { EFloreService } from 'src/app/_services/e-flore.service';


@Component({
  selector: 'vl-table-selected-element',
  templateUrl: './table-selected-element.component.html',
  styleUrls: ['./table-selected-element.component.scss']
})
export class TableSelectedElementComponent implements OnInit, OnDestroy {
  tableSelectionSubscriber: Subscription;

  elementType: 'row' | 'column' | 'groupTitle' | 'groupName' | 'occurrenceValue' | 'syntheticValue' = null;

  constructor(private tableService: TableService) { }

  ngOnInit() {
    this.tableSelectionSubscriber = this.tableService.tableSelectionElement.subscribe(selectedElement => {
      this.elementType = null;
      console.log(selectedElement);
      if (selectedElement.element === 'row') {
        // row
        this.elementType = 'row';
      } else if (selectedElement.element === 'column') {
        // column
        this.elementType = 'column';
      } else if (selectedElement.element === 'groupTitle') {
        // row definition group title
        this.elementType = 'groupTitle';
      } else if (selectedElement.element === 'groupName') {
        // row definition cell item (taxon / syntaxon name)
        this.elementType = 'groupName';

        if (selectedElement.rowId) {
          // get occurrence from table rowDefinitions
          const rowDef = this.tableService.getCurrentTable().rowsDefinition[selectedElement.rowId];
          // console.log(rowDef);
          
        }
      } else if (selectedElement.element === 'occurrenceValue') {
        // coef cell
        this.elementType = 'occurrenceValue';
      } else if (selectedElement.element === 'syntheticValue') {
        // synthetic value cell
        this.elementType = 'syntheticValue';
      }
    }, error => {
      // @Todo manage error
    });
  }

  ngOnDestroy() {
    if (this.tableSelectionSubscriber) { this.tableSelectionSubscriber.unsubscribe(); }
  }

}
