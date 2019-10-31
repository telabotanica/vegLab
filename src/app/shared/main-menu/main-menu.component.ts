import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';

@Component({
  selector: 'vl-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainMenuComponent implements OnInit, OnDestroy {
  menuTree: any = [];
  menuSubscriber: Subscription;

  currentWorkspace: string;

  constructor(private menuService: MenuService, private router: Router, private wsService: WorkspaceService) { }

  ngOnInit() {
    // this.menuTree = this.menuService.getMenu();
    this.menuSubscriber = this.menuService.menu.subscribe(menuData => {
      this.menuTree = menuData;
    });
    this.wsService.currentWS.subscribe(ws => this.currentWorkspace = ws);
  }

  ngOnDestroy(): void {
    this.menuSubscriber.unsubscribe();
  }

  goTaPage(path) {
    this.router.navigate([path]);
  }

}
