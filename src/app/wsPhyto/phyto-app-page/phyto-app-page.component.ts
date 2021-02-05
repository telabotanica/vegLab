import { Component, OnInit, OnDestroy, EventEmitter, ElementRef, ViewChild } from '@angular/core';

import { wsPhytoMenu as WSPMenu } from '../../_menus/main-menus';

import { AppConfigService } from 'src/app/_config/app-config.service';
import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { WsPhytoService, WsPhytoPanels } from '../_services/ws-phyto.service';
import { TableService } from 'src/app/_services/table.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { DialogService } from 'src/app/_services/dialog.service';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'vl-phyto-app-page',
  templateUrl: './phyto-app-page.component.html',
  styleUrls: ['./phyto-app-page.component.scss']
})
export class PhytoAppPageComponent implements OnInit, OnDestroy {
  @ViewChild('tableArea') tableAreaDomElement: ElementRef;

  // App config cars
  _tableView: string;
  tableViewSubscription: Subscription;
  _infoPanelDisabled: boolean;
  infoPanelDisabledSubscription: Subscription;

  // Panels vars
  infoPanelActive = false;
  infoAreaActive = false;
  idioPhotoAreaActive = false;
  chartAreaActive = false;
  mapAreaActive = true;
  pdfAreaActive = false;
  validationAreaActive = false;
  panelsSizeChanged = new EventEmitter<boolean>();
  actionPanelOpenCloseSubscription: Subscription;
  actionPanelCloseButtonVisibleSubscription: Subscription;
  displayClosePanelButton = true;


  constructor(private appConfig: AppConfigService,
              private menuService: MenuService,
              public tableService: TableService,
              private wsService: WorkspaceService,
              public wsPhytoService: WsPhytoService,
              private notificationService: NotificationService,
              public router: Router,
              public dialogService: DialogService) { }

  ngOnInit() {
    // Ws config
    this.wsService.currentWS.next('phyto');

    // Menu config
    this.menuService.setMenu(WSPMenu);

    // App config
    this.tableViewSubscription = this.appConfig.tableView.subscribe(value => {
      if (this._tableView !== value) { this._tableView = value; }
    });
    this.infoPanelDisabledSubscription = this.appConfig.infoPanelDisabled.subscribe(value => {
      if (this._infoPanelDisabled !== value) {
        if (value === true) { this.closeInfoPanel(); }
        this._infoPanelDisabled = value;
      }
    });

    // Subscribe to action panel open / close
    this.actionPanelOpenCloseSubscription = this.wsPhytoService.panels.subscribe((panels: WsPhytoPanels) => {
      this.panelsSizeOrPositionHaveBeenUpdated();
      this.tableAreaChanged();
    });

    this.actionPanelCloseButtonVisibleSubscription = this.appConfig.showActionPanelCloseButton.subscribe(showButton => this.displayClosePanelButton = showButton);
  }

  ngOnDestroy() {
    if (this.actionPanelOpenCloseSubscription) { this.actionPanelOpenCloseSubscription.unsubscribe(); }
    if (this.tableViewSubscription) { this.tableViewSubscription.unsubscribe(); }
    if (this.infoPanelDisabledSubscription) { this.infoPanelDisabledSubscription.unsubscribe(); }
  }

  actionPanelDragEnd(/*gutterNum: number, sizes: Array<number>*/): void {
    this.panelsSizeOrPositionHaveBeenUpdated();
    this.tableAreaChanged();
  }

  infoPanelDragEnd(/*gutterNum: number, sizes: Array<number>*/): void {
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

  infoPanelToggleButtonLabel(): string | null {
    if (this._infoPanelDisabled) {
      return 'Le panneau d\'informations n\'est pas accessible';
    } else if (this.infoPanelActive) {
      return 'Masquer le panneau d\'informations';
    } else if (!this.infoAreaActive) {
      return 'Afficher le panneau d\'informations';
    } else {
      return null;
    }
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

  toggleIdioPhoto(): void {
    this.idioPhotoAreaActive = !this.idioPhotoAreaActive;
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

  toggleValidation(): void {
    this.validationAreaActive = !this.validationAreaActive;
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
    setTimeout(() => {
      this.tableService.tableAreaDimensions.next({width: this.tableAreaDomElement.nativeElement.offsetWidth, height: this.tableAreaDomElement.nativeElement.offsetHeight});
    }, 100);
  }

  /**
   * Returns true if no one sub-info panel (ie info, map, chart, pdf, ...) is active
   */
  noActiveArea(): boolean {
    return !this.infoAreaActive && !this.idioPhotoAreaActive && !this.chartAreaActive && !this.mapAreaActive && !this.pdfAreaActive && !this.validationAreaActive;
  }

}
