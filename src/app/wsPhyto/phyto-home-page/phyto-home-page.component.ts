import { Component, OnInit } from '@angular/core';

import { wsPhytoMenu as WSPMenu } from '../../_menus/main-menus';

import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { TableService } from 'src/app/_services/table.service';
import { OccurrenceService } from 'src/app/_services/occurrence.service';

@Component({
  selector: 'vl-phyto-home-page',
  templateUrl: './phyto-home-page.component.html',
  styleUrls: ['./phyto-home-page.component.scss']
})
export class PhytoHomePageComponent implements OnInit {
  countReleves: number;
  countRelevesMicrocenosis: number;
  countRelevesSynusies: number;
  countIdiotaxons: number;
  countTables: number;

  countTopLevelsReleves = true;

  constructor(private menuService: MenuService,
              private tableService: TableService,
              private occurrenceService: OccurrenceService,
              private wsService: WorkspaceService) { }

  ngOnInit() {
    this.wsService.currentWS.next('phyto');
    this.menuService.setMenu(WSPMenu);
    this.setCounters();
  }

  setCounters(): void {
    this.tableService.countTables(['phyto', 'none']).subscribe(result => this.countTables = result.count);
    this.occurrenceService.countReleves(['phyto', 'none'], [], this.countTopLevelsReleves).subscribe(result => this.countReleves = result.count);
    this.occurrenceService.countReleves(['phyto', 'none'], ['microcenosis'], this.countTopLevelsReleves).subscribe(result => this.countRelevesMicrocenosis = result.count);
    this.occurrenceService.countReleves(['phyto', 'none'], ['synusy'], this.countTopLevelsReleves).subscribe(result => this.countRelevesSynusies = result.count);
    this.occurrenceService.countIdiotaxons(['phyto', 'none']).subscribe(result => this.countIdiotaxons = result.count);
  }

}
