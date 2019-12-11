import { Component, OnInit, Input } from '@angular/core';
import { EsTableModel } from 'src/app/_models/es-table.model';

@Component({
  selector: 'vl-table-basic-infos-preview',
  templateUrl: './table-basic-infos-preview.component.html',
  styleUrls: ['./table-basic-infos-preview.component.scss']
})
export class TableBasicInfosPreviewComponent implements OnInit {
  @Input() table: EsTableModel;

  constructor() { }

  ngOnInit() { }

}
