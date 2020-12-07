import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'vl-tb-user-label',
  templateUrl: './tb-user-label.component.html',
  styleUrls: ['./tb-user-label.component.scss']
})
export class TbUserLabelComponent implements OnInit {
  @Input() userId: string;

  constructor() { }

  ngOnInit() {
  }

}
