import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import { TableService } from 'src/app/_services/table.service';

import { Table } from 'src/app/_models/table.model';
import { EsTableModel } from 'src/app/_models/es-table.model';
import { NotificationService } from 'src/app/_services/notification.service';


@Component({
  selector: 'vl-table-card',
  templateUrl: './table-card.component.html',
  styleUrls: ['./table-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCardComponent implements OnInit {
  @Input() table: EsTableModel;

  showPreview = false;
  showDetails = false;

  constructor(private tableService: TableService, private notificationService: NotificationService) { }

  ngOnInit() {
  }

  setCurrentTable(id: number): void {
    this.tableService.getTableById(id).subscribe(
      table => {
        console.log(this.tableService.toString(table));
        this.tableService.setCurrentTable(table, true);
      }, errorTable => {
        this.notificationService.error('Nous ne parvenons pas à récupérer le tableau en base de données');
        // @Todo log error
      }
    );
  }

  getPreview(): Array<Array<string>> {
    const preview: Array<Array<string>> = [];
    for (const row of this.table.preview) {
      const explodedRow = row.split('~');
      preview.push([explodedRow[0], (explodedRow[1] ? explodedRow[1] + '%' : '')]);
    }
    return preview;
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

}
