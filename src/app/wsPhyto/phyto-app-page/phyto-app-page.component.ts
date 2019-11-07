import { Component, OnInit, EventEmitter } from '@angular/core';

import { wsPhytoMenu as WSPMenu } from '../../_menus/main-menus';

import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { WsPhytoService } from '../_services/ws-phyto.service';
import { TableService } from 'src/app/_services/table.service';

import { Router } from '@angular/router';

@Component({
  selector: 'vl-phyto-app-page',
  templateUrl: './phyto-app-page.component.html',
  styleUrls: ['./phyto-app-page.component.scss']
})
export class PhytoAppPageComponent implements OnInit {
  // tableLoading = false;

  infoPanelActive = true;
  infoAreaActive = false;
  chartAreaActive = false;
  mapAreaActive = true;
  pdfAreaActive = false;

  panelsSizeChanged = new EventEmitter<boolean>();

  constructor(private menuService: MenuService,
              private tableService: TableService,
              private wsService: WorkspaceService,
              private wsPhytoService: WsPhytoService,
              public router: Router) { }

  ngOnInit() {
    this.wsService.currentWS.next('phyto');
    this.menuService.setMenu(WSPMenu);
  }

  actionPanelDragEnd(gutterNum: number, sizes: Array<number>): void {
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  infoPanelDragEnd(gutterNum: number, sizes: Array<number>): void {
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  infoSubPanelDragEnd(gutterNum: number, sizes: Array<number>): void {
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  panelsSizeOrPositionHaveBeenUpdated(): void {
    this.panelsSizeChanged.next(true);
    setTimeout(() => { this.panelsSizeChanged.next(false); }, 50);
  }

  toggleInfoPanel(): void {
    this.infoPanelActive = !this.infoPanelActive;
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  closeInfoPanel(): void {
    this.infoPanelActive = false;
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  openInfoPanel(): void {
    this.infoPanelActive = true;
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  toggleSplitInfoPanel(): void {
    this.wsPhytoService.toggleInfoPanelSplitDirection();
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  toggleInfo(): void {
    this.infoAreaActive = !this.infoAreaActive;
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  toggleChart(): void {
    this.chartAreaActive = !this.chartAreaActive;
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  toggleMap(): void {
    this.mapAreaActive = !this.mapAreaActive;
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  togglePdf(): void {
    this.pdfAreaActive = !this.pdfAreaActive;
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

}
