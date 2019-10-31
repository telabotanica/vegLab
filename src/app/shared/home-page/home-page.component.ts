import { Component, OnInit } from '@angular/core';

import { MenuService } from '../../_services/menu.service';
import { OccurrenceService } from 'src/app/_services/occurrence.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';

@Component({
  selector: 'vl-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  homeMenu = [];

  constructor(private menuService: MenuService,
              private occurrenceService: OccurrenceService,
              private wsService: WorkspaceService) { }

  ngOnInit() {
    this.wsService.currentWS.next('*');
    this.menuService.setMenu(this.homeMenu);

    /*const o = this.occurrenceService.getEsOccurrenceWithChildrenById(47);
    o.subscribe(result => { console.log(result); });

    const o2 = this.occurrenceService.getEsOccurrenceWithChildrenById(50);
    o2.subscribe(result => { console.log(result); });*/
   }

}
