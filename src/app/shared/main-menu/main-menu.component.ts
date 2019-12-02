import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserModel } from 'src/app/_models/user.model';

import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { UserService } from 'src/app/_services/user.service';


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

  constructor(private menuService: MenuService,
              private router: Router,
              private wsService: WorkspaceService) { }

  ngOnInit() {
    // this.menuTree = this.menuService.getMenu();
    this.menuSubscriber = this.menuService.menu.subscribe(menuData => {
      this.menuTree = menuData;
    });

    // Current Workspace subscription
    this.wsService.currentWS.subscribe(ws => this.currentWorkspace = ws);

  }

  ngOnDestroy(): void {
    if (this.menuSubscriber) { this.menuSubscriber.unsubscribe(); }
  }

  goTaPage(path) {
    this.router.navigate([path]);
  }

}
