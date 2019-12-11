import { Component, OnInit, Input } from '@angular/core';
import { EsTableModel } from 'src/app/_models/es-table.model';
import * as _ from 'lodash';

@Component({
  selector: 'vl-table-render-preview',
  templateUrl: './table-render-preview.component.html',
  styleUrls: ['./table-render-preview.component.scss']
})
export class TableRenderPreviewComponent implements OnInit {
  @Input() set table(value: EsTableModel) {
    this.tablePreview = _.clone(this.setTablePreview(value));
  }

  tablePreview: Array<any> = [];

  constructor() { }

  ngOnInit() { }

  private setTablePreview(table: EsTableModel): Array<string[]> {
    const result: Array<string[]> = [];
    if (table && table.preview && table.preview.length > 0) {
      for (const item of table.preview) {
        const row = item.split('~');
        row[0] = row[0].replace('#', '  ');
        result.push(row);
      }
    }
    return result;
  }

}
