import { Component, OnInit, Input } from '@angular/core';
import { EsTableModel } from 'src/app/_models/es-table.model';

@Component({
  selector: 'vl-table-preview',
  templateUrl: './table-preview.component.html',
  styleUrls: ['./table-preview.component.scss']
})
export class TablePreviewComponent implements OnInit {
  @Input() table: EsTableModel;

  constructor() { }

  ngOnInit() { }

}
