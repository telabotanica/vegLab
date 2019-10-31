import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'vl-fatal-error-page',
  templateUrl: './fatal-error-page.component.html',
  styleUrls: ['./fatal-error-page.component.scss']
})
export class FatalErrorPageComponent implements OnInit {

  routeParams: any;
  data: any;

  constructor(
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.routeParams = this.activatedRoute.snapshot.queryParams;
    this.data = this.activatedRoute.snapshot.data;
  }

}
