import { Component, OnInit, OnDestroy, EventEmitter, ElementRef, ViewChild } from '@angular/core';

import { wsPhytoMenu as WSPMenu } from '../../_menus/main-menus';

import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { WsPhytoService, WsPhytoPanels } from '../_services/ws-phyto.service';
import { TableService } from 'src/app/_services/table.service';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'vl-phyto-app-page',
  templateUrl: './phyto-app-page.component.html',
  styleUrls: ['./phyto-app-page.component.scss']
})
export class PhytoAppPageComponent implements OnInit, OnDestroy {
  @ViewChild('tableArea') tableAreaDomElement: ElementRef;

  infoPanelActive = true;
  infoAreaActive = false;
  chartAreaActive = false;
  mapAreaActive = true;
  pdfAreaActive = false;

  panelsSizeChanged = new EventEmitter<boolean>();

  actionPanelOpenCloseSubscription: Subscription;

  constructor(private menuService: MenuService,
              private tableService: TableService,
              private wsService: WorkspaceService,
              private wsPhytoService: WsPhytoService,
              public router: Router) { }

  ngOnInit() {
    this.wsService.currentWS.next('phyto');
    this.menuService.setMenu(WSPMenu);

    // Subscribe to action panel open / close
    this.actionPanelOpenCloseSubscription = this.wsPhytoService.panels.subscribe((panels: WsPhytoPanels) => {
      this.panelsSizeOrPositionHaveBeenUpdated();
      this.tableAreaChanged();
    });
  }

  ngOnDestroy() {
    if (this.actionPanelOpenCloseSubscription) { this.actionPanelOpenCloseSubscription.unsubscribe(); }
  }

  actionPanelDragEnd(gutterNum: number, sizes: Array<number>): void {
    this.panelsSizeOrPositionHaveBeenUpdated();
    this.tableAreaChanged();
  }

  infoPanelDragEnd(gutterNum: number, sizes: Array<number>): void {
    this.panelsSizeOrPositionHaveBeenUpdated();
    this.tableAreaChanged();
  }

  infoSubPanelDragEnd(gutterNum: number, sizes: Array<number>): void {
    this.panelsSizeOrPositionHaveBeenUpdated();
  }

  toggleInfoPanel(): void {
    this.infoPanelActive = !this.infoPanelActive;
    this.panelsSizeOrPositionHaveBeenUpdated();
    this.tableAreaChanged();
  }

  closeInfoPanel(): void {
    this.infoPanelActive = false;
    this.panelsSizeOrPositionHaveBeenUpdated();
    this.tableAreaChanged();
  }

  openInfoPanel(): void {
    this.infoPanelActive = true;
    this.panelsSizeOrPositionHaveBeenUpdated();
    this.tableAreaChanged();
  }

  toggleSplitInfoPanel(): void {
    this.wsPhytoService.toggleInfoPanelSplitDirection();
    this.panelsSizeOrPositionHaveBeenUpdated();
    setTimeout(() => {
      this.tableAreaChanged();
    }, 50);
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

  /**
   * Emit a boolean 'panelsSizeChanged' when a panel has been updated (open / close, drag)
   * Used in several sub-component to update their own views (eg: a leaflet component should subscribe and resize the map)
   */
  panelsSizeOrPositionHaveBeenUpdated(): void {
    this.panelsSizeChanged.next(true);
    setTimeout(() => { this.panelsSizeChanged.next(false); }, 50);
  }

  /**
   * Emit width and height of the table
   */
  tableAreaChanged(): void {
    console.log(`width: ${this.tableAreaDomElement.nativeElement.offsetWidth}  /  height: ${this.tableAreaDomElement.nativeElement.offsetHeight}`);
    this.tableService.tableAreaDimensions.next({width: this.tableAreaDomElement.nativeElement.offsetWidth, height: this.tableAreaDomElement.nativeElement.offsetHeight});
  }

}
