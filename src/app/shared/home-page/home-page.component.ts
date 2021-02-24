import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MenuService } from '../../_services/menu.service';
import { OccurrenceService } from 'src/app/_services/occurrence.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { TableService } from 'src/app/_services/table.service';

@Component({
  selector: 'vl-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  homeMenu = [];
  selectedWorkflowItem = 2;

  countReleves: number;
  countRelevesMicrocenosis: number;
  countRelevesSynusies: number;
  countIdiotaxons: number;
  countTables: number;
  countTopLevelsReleves = true;

  constructor(private menuService: MenuService,
              private tableService: TableService,
              private occurrenceService: OccurrenceService,
              private wsService: WorkspaceService,
              public router: Router) { }

  ngOnInit() {
    this.wsService.currentWS.next('none');
    this.menuService.setMenu(this.homeMenu);
    this.setCounters();
   }

   setCounters(): void {
    this.tableService.countTables(['phyto', 'none']).subscribe(result => this.countTables = result.count, error => { this.countTables = 0; console.log(error); });
    this.occurrenceService.countReleves(['phyto', 'none'], [], this.countTopLevelsReleves).subscribe(result => this.countReleves = result.count, error => { this.countReleves = 0; console.log(error); });
    this.occurrenceService.countReleves(['phyto', 'none'], ['microcenosis'], this.countTopLevelsReleves).subscribe(result => this.countRelevesMicrocenosis = result.count, error => { this.countRelevesMicrocenosis = 0; console.log(error); });
    this.occurrenceService.countReleves(['phyto', 'none'], ['synusy'], this.countTopLevelsReleves).subscribe(result => this.countRelevesSynusies = result.count, error => { this.countRelevesSynusies = 0; console.log(error); });
    this.occurrenceService.countIdiotaxons(['phyto', 'none']).subscribe(result => this.countIdiotaxons = result.count, error => { this.countIdiotaxons = 0; console.log(error); });
  }

}
