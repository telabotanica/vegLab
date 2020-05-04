import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EsTableModel } from 'src/app/_models/es-table.model';

@Component({
  selector: 'vl-table-preview',
  templateUrl: './table-preview.component.html',
  styleUrls: ['./table-preview.component.scss']
})
export class TablePreviewComponent implements OnInit {
  @Input() table: EsTableModel;

  @Output() close = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() { }

  closeMe() {
    this.close.next(true);
  }

}
