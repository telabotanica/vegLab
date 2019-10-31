import { Component, OnInit } from '@angular/core';

import { wsPhytoMenu as WSPMenu } from '../../_menus/main-menus';

import { MenuService } from '../../_services/menu.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';

@Component({
  selector: 'vl-phyto-app-page',
  templateUrl: './phyto-app-page.component.html',
  styleUrls: ['./phyto-app-page.component.scss']
})
export class PhytoAppPageComponent implements OnInit {

  constructor(private menuService: MenuService, private wsService: WorkspaceService) { }

  ngOnInit() {
    this.wsService.currentWS.next('phyto');
    this.menuService.setMenu(WSPMenu);
  }

}
