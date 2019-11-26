import { Component, OnInit, OnDestroy } from '@angular/core';

import { EcologicalTraitsService } from 'src/app/_services/ecological-traits.service';
import { TableService } from 'src/app/_services/table.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { Subscription } from 'rxjs';
import { Options } from 'ng5-slider';

@Component({
  selector: 'vl-ecological-diagram',
  templateUrl: './ecological-diagram.component.html',
  styleUrls: ['./ecological-diagram.component.scss']
})
export class EcologicalDiagramComponent implements OnInit, OnDestroy {
  currentWs: string;

  tableChangeSubscriber: Subscription;
  ecoTraitsSubscriber: Subscription;

  constructor(private ecoTraitsService: EcologicalTraitsService,
              private tableService: TableService,
              private wsService: WorkspaceService,
              private notificationService: NotificationService) { }

  ngOnInit() {
    const a = this.ecoTraitsService.listEcoTraitsAvailableRepository();
    const b = this.ecoTraitsService.getEcoTraitsRepoAccordingToRepoAndWs('bdtfx', 'phyto');
    console.log(a, b);

    // Get current Workspace
    const ws = this.wsService.currentWS.getValue();
    if (ws) { this.currentWs = ws; } else {
      // Can't do anything
      // @Todo inform user
      this.notificationService.warn('Nous ne parvenons pas à récupérer les informations nécessaires à l\'affichage du module \'Diagramme écologique\'');
      return;}

    // Subscribe to WS change ?
    // I don't think it's necessary for now. It's not planed to have hot change in WS.
    // This component should be used in different WS but, in this case, it will be destroyed and recreated

    // Init ecological traits service (load initial values)
    // Get table value from table.rowDefinitions
    const rowDef = this.tableService.getCurrentTable().rowsDefinition;
    if (rowDef && rowDef.length > 0) {
      this.ecoTraitsService.setCurrentTraitsRepoValuesFromTableRowDefinition(rowDef, this.currentWs);
    }

    // Subscribe to table change

    // Subscribe to ecological traits change
    this.ecoTraitsService.currentTraitsValues.subscribe(
      traits => {
        if (traits) {
          console.log('traits:');
          console.log(traits);
        } else {
          console.log('no traits...');
        }
      }, error => {
        // @Todo manage error
        console.log(error);
      }
    );
  }

  ngOnDestroy() {
    if (this.ecoTraitsSubscriber) { this.ecoTraitsSubscriber.unsubscribe(); }
    if (this.tableChangeSubscriber) { this.tableChangeSubscriber.unsubscribe(); }
  }

}
