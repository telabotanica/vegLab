import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as _ from 'lodash';
import { Router, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class WsPhytoService {
  // PANLES VARS
  panelStart: WsPhytoPanels = { actionPanel: {opened: false, size: 50}, infoPanel: {opened: true, size: 20, splitDirection: 'vertical'} };
  panels = new BehaviorSubject<WsPhytoPanels>(this.panelStart);

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.urlAfterRedirects.startsWith('/phyto/app/')) {
          this.openActionPanel();
        } else if (event.urlAfterRedirects === '/phyto/app') {
          this.closeActionPanel();
        }
      }
    });
  }

  // ******
  // PANELS
  // ******

  public obsPanels(): Observable<WsPhytoPanels> {
    return this.panels.asObservable();
  }

  public isActionPanelOpened(): boolean {
    return this.panels.getValue().actionPanel.opened;
  }

  public isInfoPanelOpened(): boolean {
    return this.panels.getValue().infoPanel.opened;
  }

  public getActionPanelSize(): number {
    return this.panels.getValue().actionPanel.size;
  }

  public getInfoPanelSize(): number {
    return this.panels.getValue().infoPanel.size;
  }

  public getInfoPanelSplitDirection(): 'horizontal' | 'vertical' {
    return this.panels.getValue().infoPanel.splitDirection;
  }

  public toggleActionPanelVisibility(): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.actionPanel.opened = !_panels.actionPanel.opened;
    this.panels.next(_panels);
  }

  public openActionPanel(): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.actionPanel.opened = true;
    this.panels.next(_panels);
  }

  public closeActionPanel(): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.actionPanel.opened = false;
    this.panels.next(_panels);
  }

  public toggleInfoPanelVisibility(): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.infoPanel.opened = !_panels.infoPanel.opened;
    this.panels.next(_panels);
  }

  public setActionPanelSize(size: number): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.actionPanel.size = size;
    this.panels.next(_panels);
  }

  public setInfoPanelSize(size: number): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.infoPanel.size = size;
    this.panels.next(_panels);
  }

  public setInfoPanelSplitDirection(splitDirection: 'horizontal' | 'vertical'): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.infoPanel.splitDirection = splitDirection;
    this.panels.next(_panels);
  }

  public toggleInfoPanelSplitDirection(): void {
    const _panels = _.clone(this.panels.getValue());
    _panels.infoPanel.splitDirection = _panels.infoPanel.splitDirection === 'horizontal' ? 'vertical' : 'horizontal';
    this.panels.next(_panels);
  }

}

export interface WsPhytoPanels {
  actionPanel: {
    opened: boolean,
    size: number
  };
  infoPanel: {
    opened: boolean,
    size: number,
    splitDirection: 'horizontal' | 'vertical'
  };
}
