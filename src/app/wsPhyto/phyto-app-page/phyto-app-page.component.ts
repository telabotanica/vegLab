import { Component, OnInit } from '@angular/core';

import { wsPhytoMenu as WSPMenu } from '../../_menus/main-menus';

import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { WsPhytoService } from '../_services/ws-phyto.service';
import { Router } from '@angular/router';

@Component({
  selector: 'vl-phyto-app-page',
  templateUrl: './phyto-app-page.component.html',
  styleUrls: ['./phyto-app-page.component.scss']
})
export class PhytoAppPageComponent implements OnInit {
  infoPanelActive = true;
  infoAreaActive = false;
  chartAreaActive = false;
  mapAreaActive = false;
  pdfAreaActive = true;

  constructor(private menuService: MenuService,
              private wsService: WorkspaceService,
              private wsPhytoService: WsPhytoService,
              private router: Router) { }

  ngOnInit() {
    this.wsService.currentWS.next('phyto');
    this.menuService.setMenu(WSPMenu);
  }

  toggleInfoPanel(): void {
    this.infoPanelActive = !this.infoPanelActive;
  }

  closeInfoPanel(): void {
    this.infoPanelActive = false;
  }

  openInfoPanel(): void {
    this.infoPanelActive = true;
  }

  toggleSplitInfoPanel(): void {
    this.wsPhytoService.toggleInfoPanelSplitDirection();
  }

  toggleInfo(): void {
    this.infoAreaActive = !this.infoAreaActive;
  }

  toggleChart(): void {
    this.chartAreaActive = !this.chartAreaActive;
  }

  toggleMap(): void {
    this.mapAreaActive = !this.mapAreaActive;
  }

  togglePdf(): void {
    this.pdfAreaActive = !this.pdfAreaActive;
  }

}
