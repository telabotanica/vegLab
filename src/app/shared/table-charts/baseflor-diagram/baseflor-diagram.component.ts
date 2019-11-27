import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { EcologicalTraitsService } from 'src/app/_services/ecological-traits.service';
import { TableService } from 'src/app/_services/table.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { NotificationService } from 'src/app/_services/notification.service';

import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'vl-baseflor-diagram',
  templateUrl: './baseflor-diagram.component.html',
  styleUrls: ['./baseflor-diagram.component.scss']
})
export class BaseflorDiagramComponent implements OnInit, OnDestroy {
  @Input() set trait(value: string) {
    this._trait = value;
    this.setTraits();
  }
  @Input() width = 400;
  @Input() chartType: 'horizontalBar' | 'pie' = 'horizontalBar';

  currentWs: string;

  _trait: string = null;

  tableChangeSubscriber: Subscription;
  ecoTraitsSubscriber: Subscription;

  totalItems: number = null;
  baseflorTraitsItems: Array<any> = [];

  baseflorTraits: Array<{name: string, value: number}> = [];

  // Chart options
  showXAxis = false;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = false;
  showYAxisLabel = false;
  yAxisLabel = 'Famille';
  showDataLabel = true;

  colorScheme = {
    domain: ['#DEF1FF', '#CAE3E8', '#CAE8DC', '#CAE8D1', '#CBDAEA', '#E2DEFF', '#FFDBD6', '#E8D4C3', '#F3CBFE', '#EBB9C9']
  };

  constructor(private ecoTraitsService: EcologicalTraitsService,
              private tableService: TableService,
              private wsService: WorkspaceService,
              private notificationService: NotificationService) { }

  ngOnInit() {
    // Get current Workspace
    const ws = this.wsService.currentWS.getValue();
    if (ws) { this.currentWs = ws; } else {
      // Can't do anything
      // @Todo inform user
      this.notificationService.warn('Nous ne parvenons pas à récupérer les informations nécessaires à l\'affichage du module \'Diagramme écologique\'');
      return;
    }

    // Init ecological traits service (load initial values)
    // Get table value from table.rowDefinitions
    let rowDef = this.tableService.getCurrentTable().rowsDefinition;
    if (rowDef && rowDef.length > 0) {
      this.ecoTraitsService.setCurrentTraitsRepoValuesFromTableRowDefinition(rowDef, this.currentWs);
    }

    // Subscribe to table change
    this.tableChangeSubscriber = this.tableService.currentTableChanged.subscribe(value => {
      if (value === true) {
        rowDef = this.tableService.getCurrentTable().rowsDefinition;
        if (rowDef && rowDef.length > 0) {
          this.ecoTraitsService.setCurrentTraitsRepoValuesFromTableRowDefinition(rowDef, this.currentWs);
        }
      }
    });

    // Subscribe to ecological traits change
    this. ecoTraitsSubscriber = this.ecoTraitsService.currentTraitsValues.subscribe(
      traits => {
        this.resetTraits();
        if (traits) {
          this.totalItems = traits.length;
          this.baseflorTraitsItems = _.filter(traits, t => t.traitsRepo && t.traitsRepo.repository === 'baseflor');
          this.setTraits();
        } else {
          // console.log('no traits...');
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

  public getHeight(): number {
    if (this.chartType === 'pie') { return this.width; }
    if (this.baseflorTraits) {
      return this.baseflorTraits.length * 20;
    } else {
      return 0;
    }
  }

  private resetTraits(): void {
    this.baseflorTraits = [];
  }

  private setTraits(): void {
    // Does trait exists ?
    if (! this._trait || !this.baseflorTraitsItems || this.baseflorTraitsItems.length === 0) {
      // no traits
      return;
    }

    const traits = _.map(this.baseflorTraitsItems, bfti => bfti.traitsRepo.traits[this._trait]);
    const groupedTraits = _.countBy(traits);
    // groupedTraits is a Dictionnary, transform to object
    const groupedTraitsObj: Array<{name: string, value: number}> = [];
    for (const key in groupedTraits) {
      if (groupedTraits.hasOwnProperty(key)) {
        const element = groupedTraits[key];
        groupedTraitsObj.push({name: key, value: element});
      }
    }
    const groupedAndSortedTraitsObj = _.orderBy(groupedTraitsObj, gfo => gfo.value, 'desc');

    let sumValues = 0;
    for (const item of groupedAndSortedTraitsObj) {
      sumValues += item.value;
    }

    const countMissingData = this.totalItems - sumValues;

    groupedAndSortedTraitsObj.push({name: '?', value: countMissingData});

    this.baseflorTraits = _.clone(groupedAndSortedTraitsObj);
  }

  customColors(): any {
    if (this._trait) {
      switch (this._trait) {
        case 'repartition':
          return baseflor_repartition_color_scheme;
        case 'plant_formation':
          return baseflor_plant_formation_color_scheme;
        case 'biological_type':
          return baseflor_biological_type_color_scheme;
        case 'flower_color':
          return baseflor_flower_color_scheme;
        default:
          break;
      }
    }
  }

}

export const baseflor_plant_formation_color_scheme = [
  { name: '?', value: '#EDEDED' },
  { name: 'thérophytaie', value: '#F8FF82' },
  { name: 'hémicryptophytaie', value: '#C4F2AC' },
  { name: 'géophytaie', value: '#AEE6BE' },
  { name: 'parvochaméphytaie', value: '#DCB1FF' },
  { name: 'chaméphytaie', value: '#AC95E8' },
  { name: 'magnochaméphytaie', value: '#A4A3FF' },
  { name: 'nanophanérophytaie', value: '#FFD293' },
  { name: 'microphanérophytaie', value: '#E8C67B' },
  { name: 'parvophanérophytaie', value: '#E8AB7B' },
  { name: 'magnophanérophytaie', value: '#CC966C' }
];

export const baseflor_biological_type_color_scheme = [
  { name: '?', value: '#EDEDED' },
{ name: 'a-cad', value: '#E8AB7B' },
{ name: 'A-lia-cad', value: '#CC966C' },
{ name: 'a-lia-semp', value: '#E8AB7B' },
{ name: 'A-semp', value: '#CC966C' },
{ name: 'b-cad', value: '#FFD293' },
{ name: 'B-cad-lia', value: '#E8C67B' },
{ name: 'b-cad(Hrub)', value: '#FFD293' },
{ name: 'b-lia', value: '#FFD293' },
{ name: 'b-lia-cad', value: '#FFD293' },
{ name: 'b-lia-semp', value: '#FFD293' },
{ name: 'b-semp', value: '#FFD293' },
{ name: 'B-semp-lia', value: '#E8C67B' },
{ name: 'b-suc', value: '#FFD293' },
{ name: 'C-suc', value: '#AC95E8' },
{ name: 'ccou', value: '#AC95E8' },
{ name: 'ccou-suc', value: '#AC95E8' },
{ name: 'cfru', value: '#AC95E8' },
{ name: 'Cfru-cad', value: '#AC95E8' },
{ name: 'cfru-hpar-semp-épi', value: '#AC95E8' },
{ name: 'Cfru-lia', value: '#AC95E8' },
{ name: 'cfru-par', value: '#AC95E8' },
{ name: 'cfru-semp', value: '#AC95E8' },
{ name: 'Cfru-suc', value: '#AC95E8' },
{ name: 'csuc', value: '#AC95E8' },
{ name: 'csuf', value: '#AC95E8' },
{ name: 'csuf-csuc', value: '#AC95E8' },
{ name: 'csuf-suc', value: '#AC95E8' },
{ name: 'csuf(grhi)', value: '#AC95E8' },
{ name: 'gbul', value: '#AEE6BE' },
{ name: 'Gbul-lia', value: '#AEE6BE' },
{ name: 'Gbul-lia(b-lia)', value: '#AEE6BE' },
{ name: 'gbul-par', value: '#AEE6BE' },
{ name: 'gbul-par(test-par)', value: '#AEE6BE' },
{ name: 'gbul(test)', value: '#AEE6BE' },
{ name: 'grhi', value: '#AEE6BE' },
{ name: 'Grhi-aqua', value: '#AEE6BE' },
{ name: 'Grhi-lia', value: '#AEE6BE' },
{ name: 'grhi-par', value: '#AEE6BE' },
{ name: 'Grhi(Grhi-aqua)', value: '#AEE6BE' },
{ name: 'grhi(hces)', value: '#AEE6BE' },
{ name: 'Grhi(Heri)', value: '#AEE6BE' },
{ name: 'Gtub', value: '#AEE6BE' },
{ name: 'hbis', value: '#C4F2AC' },
{ name: 'Hbis-aqua', value: '#C4F2AC' },
{ name: 'hbis-hpar(hros-hpar)', value: '#C4F2AC' },
{ name: 'hbis-hpar(test-hpar)', value: '#C4F2AC' },
{ name: 'hbis-suc', value: '#C4F2AC' },
{ name: 'hbis(csuf)', value: '#C4F2AC' },
{ name: 'Hbis(Heri-Test)-lia', value: '#C4F2AC' },
{ name: 'hbis(heri,test)-suc', value: '#C4F2AC' },
{ name: 'hbis(heri)', value: '#C4F2AC' },
{ name: 'hbis(hros)', value: '#C4F2AC' },
{ name: 'hbis(hsto)', value: '#C4F2AC' },
{ name: 'hbis(hsto)-suc', value: '#C4F2AC' },
{ name: 'Hbis(Test)', value: '#C4F2AC' },
{ name: 'hbis(tver)', value: '#C4F2AC' },
{ name: 'hces', value: '#C4F2AC' },
{ name: 'hces-aqua', value: '#C4F2AC' },
{ name: 'hces-car', value: '#C4F2AC' },
{ name: 'hces-hpar', value: '#C4F2AC' },
{ name: 'hces(test)', value: '#C4F2AC' },
{ name: 'heri', value: '#C4F2AC' },
{ name: 'heri-aqua', value: '#C4F2AC' },
{ name: 'heri-hpar', value: '#C4F2AC' },
{ name: 'Heri-lia', value: '#C4F2AC' },
{ name: 'Heri-lia-suc-semp', value: '#C4F2AC' },
{ name: 'heri-par', value: '#C4F2AC' },
{ name: 'heri-semp', value: '#C4F2AC' },
{ name: 'Heri-semp-lia', value: '#C4F2AC' },
{ name: 'heri-suc', value: '#C4F2AC' },
{ name: 'Heri(Grhi)', value: '#C4F2AC' },
{ name: 'heri(test)', value: '#C4F2AC' },
{ name: 'hrhi', value: '#C4F2AC' },
{ name: 'hros', value: '#C4F2AC' },
{ name: 'hros-aqua', value: '#C4F2AC' },
{ name: 'hros-car', value: '#C4F2AC' },
{ name: 'hros-hpar', value: '#C4F2AC' },
{ name: 'hros(hbis)', value: '#C4F2AC' },
{ name: 'hros(test)', value: '#C4F2AC' },
{ name: 'Hrub', value: '#C4F2AC' },
{ name: 'Hrub(b)', value: '#C4F2AC' },
{ name: 'hsto', value: '#C4F2AC' },
{ name: 'hsto-aqua', value: '#C4F2AC' },
{ name: 'hsto-aqua-car', value: '#C4F2AC' },
{ name: 'hsto-hpar', value: '#C4F2AC' },
{ name: 'Hsto-lia', value: '#C4F2AC' },
{ name: 'Hsto-lia(Grhi-lia)', value: '#C4F2AC' },
{ name: 'hsto(grhi)', value: '#C4F2AC' },
{ name: 'hsto(hbis-test)', value: '#C4F2AC' },
{ name: 'hsto(test)', value: '#C4F2AC' },
{ name: 'hsto(test)-aqua', value: '#C4F2AC' },
{ name: 'tes', value: '#F8FF82' },
{ name: 'tes(hbis)', value: '#F8FF82' },
{ name: 'test', value: '#F8FF82' },
{ name: 'test-aqua', value: '#F8FF82' },
{ name: 'test-aqua-car', value: '#F8FF82' },
{ name: 'test-hpar', value: '#F8FF82' },
{ name: 'test-lia', value: '#F8FF82' },
{ name: 'test-lia-cad', value: '#F8FF82' },
{ name: 'test-lia-par', value: '#F8FF82' },
{ name: 'test-par', value: '#F8FF82' },
{ name: 'test-suc', value: '#F8FF82' },
{ name: 'Test(Grhi)', value: '#F8FF82' },
{ name: 'test(gtub)', value: '#F8FF82' },
{ name: 'test(hbis)', value: '#F8FF82' },
{ name: 'test(hces)', value: '#F8FF82' },
{ name: 'test(heri)', value: '#F8FF82' },
{ name: 'test(hros)', value: '#F8FF82' },
{ name: 'test(hsto)', value: '#F8FF82' },
{ name: 'test(tver)', value: '#F8FF82' },
{ name: 'tver', value: '#F8FF82' },
{ name: 'tver-lia', value: '#F8FF82' },
{ name: 'tver-suc', value: '#F8FF82' },
{ name: 'tver(hbis)', value: '#F8FF82' },
{ name: 'tver(heri)', value: '#F8FF82' },
{ name: 'tver(hros)', value: '#F8FF82' }
];

export const baseflor_repartition_color_scheme = [
  { name: '?', value: '#EDEDED' },
  { name: 'aquitain', value: '#FFE54F' },
  { name: 'arctico-alpin', value: '#BFE5FF' },
  { name: 'artico-alpin', value: '#BFE5FF' },
  { name: 'atlantique', value: '#FFE54F' },
  { name: 'atlantique (aquitain)', value: '#FFE54F' },
  { name: 'atlantique (basque)', value: '#FFE54F' },
  { name: 'atlantique méridional', value: '#FFE54F' },
  { name: 'atlantique septentrional', value: '#FFE54F' },
  { name: 'atlantique(eury)', value: '#FFE54F' },
  { name: 'baléarico-corso-sarde', value: '#AEE6BE' },
  { name: 'catalan', value: '#FFE54F' },
  { name: 'catalano-languedocien', value: '#FFE54F' },
  { name: 'catalano-provençal', value: '#FFE54F' },
  { name: 'circumboréal', value: '#BFE5FF' },
  { name: 'corse', value: '#E8BD3C' },
  { name: 'corso-sarde', value: '#E8BD3C' },
  { name: 'cosmopolite', value: '#FFFFFF' },
  { name: 'cosmopolite(psychro)', value: '#BFE5FF' },
  { name: 'cosmopolite(thermo)', value: '#FFE54F' },
  { name: 'endémique Alpes-Maritimes', value: '#FFE54F' },
  { name: 'endémique aquitain', value: '#FFE54F' },
  { name: 'endémique bourguignon', value: '#FFE54F' },
  { name: 'endémique camarguais', value: '#FFE54F' },
  { name: 'endémique caussenard', value: '#FFE54F' },
  { name: 'endémique centre-occidental de la France', value: '#FFE54F' },
  { name: 'endémique cévenol', value: '#FFE54F' },
  { name: 'endémique Corbières', value: '#FFE54F' },
  { name: 'endémique Gorges du Verdon', value: '#FFE54F' },
  { name: 'endémique La Clape', value: '#FFE54F' },
  { name: 'endémique ligérien', value: '#FFE54F' },
  { name: 'endémique lorrain', value: '#FFE54F' },
  { name: 'endémique lyonnais', value: '#FFE54F' },
  { name: 'endémique séquanien', value: '#FFE54F' },
  { name: 'endémique varois', value: '#FFE54F' },
  { name: 'eurasiatique', value: '#DCB1FF' },
  { name: 'eurasiatique méridional', value: '#DCB1FF' },
  { name: 'eurasiatique occidental', value: '#DCB1FF' },
  { name: 'eurasiatique septentrional', value: '#DCB1FF' },
  { name: 'eurasiatique tempéré', value: '#DCB1FF' },
  { name: 'européen', value: '#FFE54F' },
  { name: 'européen ', value: '#FFE54F' },
  { name: 'européen central', value: '#FFE54F' },
  { name: 'européen méridional', value: '#FFE54F' },
  { name: 'européen occidental', value: '#FFE54F' },
  { name: 'européen oriental', value: '#FFE54F' },
  { name: 'européen septentrional', value: '#FFE54F' },
  { name: 'européen tempéré', value: '#FFE54F' },
  { name: 'holarctique', value: '#BFE5FF' },
  { name: 'holarctique méridional', value: '#BFE5FF' },
  { name: 'holarctique septentrional', value: '#BFE5FF' },
  { name: 'introduit (Afrique du sud)', value: '#EDEDED' },
  { name: 'introduit (Afrique or.)', value: '#EDEDED' },
  { name: 'introduit (Afrique tropicale)', value: '#EDEDED' },
  { name: 'introduit (Afrique)', value: '#EDEDED' },
  { name: 'introduit (Amér. centrale)', value: '#EDEDED' },
  { name: 'introduit (Amér. du nord occ.)', value: '#EDEDED' },
  { name: 'introduit (Amér. du nord or.)', value: '#EDEDED' },
  { name: 'introduit (Amér. du nord sept.)', value: '#EDEDED' },
  { name: 'introduit (Amér. du nord)', value: '#EDEDED' },
  { name: 'introduit (Amér. du sud)', value: '#EDEDED' },
  { name: 'introduit (Amér. tropicale)', value: '#EDEDED' },
  { name: 'introduit (Amér.)', value: '#EDEDED' },
  { name: 'introduit (Amérique centrale)', value: '#EDEDED' },
  { name: 'introduit (Amérique du nord or.)', value: '#EDEDED' },
  { name: 'introduit (Amérique du nord)', value: '#EDEDED' },
  { name: 'introduit (Amérique du sud)', value: '#EDEDED' },
  { name: 'introduit (Antarctique)', value: '#EDEDED' },
  { name: 'introduit (Asie centr.)', value: '#EDEDED' },
  { name: 'introduit (Asie mér.)', value: '#EDEDED' },
  { name: 'introduit (Asie occ.)', value: '#EDEDED' },
  { name: 'introduit (Asie or.)', value: '#EDEDED' },
  { name: 'introduit (Asie orient.)', value: '#EDEDED' },
  { name: 'introduit (Asie orientale)', value: '#EDEDED' },
  { name: 'introduit (Asie sept.)', value: '#EDEDED' },
  { name: 'introduit (Asie)', value: '#EDEDED' },
  { name: 'introduit (Australie)', value: '#EDEDED' },
  { name: 'introduit (Balkans)', value: '#EDEDED' },
  { name: 'introduit (Canaries)', value: '#EDEDED' },
  { name: 'introduit (Caucase)', value: '#EDEDED' },
  { name: 'introduit (Himalaya)', value: '#EDEDED' },
  { name: 'introduit (Japon)', value: '#EDEDED' },
  { name: 'introduit (Madagascar)', value: '#EDEDED' },
  { name: 'introduit (Madeira)', value: '#EDEDED' },
  { name: 'introduit (Madère)', value: '#EDEDED' },
  { name: 'introduit (Maghreb)', value: '#EDEDED' },
  { name: 'introduit (Nouvelle-Calédonie)', value: '#EDEDED' },
  { name: 'introduit (Nouvelle-Zélande)', value: '#EDEDED' },
  { name: 'introduit (Turquie)', value: '#EDEDED' },
  { name: 'languedocien', value: '#FFE54F' },
  { name: 'languedocien-provençal', value: '#FFE54F' },
  { name: 'ligure', value: '#FFE54F' },
  { name: 'méditerranéen', value: '#E8BD3C' },
  { name: 'méditerranéen (catalan)', value: '#E8BD3C' },
  { name: 'méditerranéen (corse)', value: '#E8BD3C' },
  { name: 'méditerranéen (corso-sarde)', value: '#E8BD3C' },
  { name: 'méditerranéen (provençal)', value: '#E8BD3C' },
  { name: 'méditerranéen (tyrrhénien)', value: '#E8BD3C' },
  { name: 'méditerranéen central', value: '#E8BD3C' },
  { name: 'méditerranéen méridional', value: '#E8BD3C' },
  { name: 'méditerranéen occidental', value: '#E8BD3C' },
  { name: 'méditerranéen oriental', value: '#E8BD3C' },
  { name: 'méditerranéen septentrional', value: '#E8BD3C' },
  { name: 'méditerranéen-atlantique', value: '#E8BD3C' },
  { name: 'méditerranéen(eury)', value: '#E8BD3C' },
  { name: 'méditerranéen(eury)-atlantique(eury)', value: '#E8BD3C' },
  { name: 'orophyte', value: '#A2BAE8' },
  { name: 'orophyte alpien', value: '#A2BAE8' },
  { name: 'orophyte alpien mér.', value: '#A2BAE8' },
  { name: 'orophyte alpien mérid.', value: '#A2BAE8' },
  { name: 'orophyte alpien occ.', value: '#A2BAE8' },
  { name: 'orophyte alpien or.', value: '#A2BAE8' },
  { name: 'orophyte alpien sept.', value: '#A2BAE8' },
  { name: 'orophyte apennins', value: '#A2BAE8' },
  { name: 'orophyte auvergnat', value: '#A2BAE8' },
  { name: 'orophyte baléarico-corso-sarde', value: '#A2BAE8' },
  { name: 'orophyte catalan', value: '#A2BAE8' },
  { name: 'orophyte cévenol', value: '#A2BAE8' },
  { name: 'orophyte corse', value: '#A2BAE8' },
  { name: 'orophyte corso-sarde', value: '#A2BAE8' },
  { name: 'orophyte dauphinois', value: '#A2BAE8' },
  { name: 'orophyte eurasiatique', value: '#A2BAE8' },
  { name: 'orophyte européen', value: '#A2BAE8' },
  { name: 'orophyte holarctique', value: '#A2BAE8' },
  { name: 'orophyte ibérique', value: '#A2BAE8' },
  { name: 'orophyte ibéro-marocain', value: '#A2BAE8' },
  { name: 'orophyte jurassien', value: '#A2BAE8' },
  { name: 'orophyte méditerranéen', value: '#A2BAE8' },
  { name: 'orophyte méditerranéen central', value: '#A2BAE8' },
  { name: 'orophyte méditerranéen occ.', value: '#A2BAE8' },
  { name: 'orophyte méridional', value: '#A2BAE8' },
  { name: 'orophyte occidental', value: '#A2BAE8' },
  { name: 'orophyte pyrénéen', value: '#A2BAE8' },
  { name: 'orophyte pyrénéo-auvergnat', value: '#A2BAE8' },
  { name: 'orophyte savoyard', value: '#A2BAE8' },
  { name: 'orophyte septentrional', value: '#A2BAE8' },
  { name: 'orophyte vosgien', value: '#A2BAE8' },
  { name: 'provençal', value: '#E8BD3C' },
  { name: 'sicilien', value: '#E8BD3C' },
  { name: 'subtropical', value: '#FF934F' },
  { name: 'subtropical(paléo)', value: '#FF934F' },
  { name: 'tyrrhénien', value: '#E8BD3C' }
];

export const baseflor_flower_color_scheme = [
  { name: '?', value: '#EDEDED' },
  { name: 'blanc', value: '#FFFFFF' },
  { name: 'blanc, bleu, rose', value: '#FFFFFF' },
  { name: 'blanc, jaune', value: '#FFFFFF' },
  { name: 'blanc, jaune, bleu', value: '#FFFFFF' },
  { name: 'blanc, jaune, marron', value: '#FFFFFF' },
  { name: 'blanc, jaune, rose', value: '#FFFFFF' },
  { name: 'blanc, rose', value: '#FFFFFF' },
  { name: 'blanc, vert', value: '#FFFFFF' },
  { name: 'blanc, vert, rose', value: '#FFFFFF' },
  { name: 'bleu', value: '#9BB8F2' },
  { name: 'bleu, blanc', value: '#9BB8F2' },
  { name: 'bleu, blanc, rose', value: '#9BB8F2' },
  { name: 'bleu, jaune', value: '#9BB8F2' },
  { name: 'bleu, jaune, rose', value: '#9BB8F2' },
  { name: 'bleu, rose', value: '#9BB8F2' },
  { name: 'jaune', value: '#F2E205' },
  { name: 'jaune, marron', value: '#F2E205' },
  { name: 'jaune, noir', value: '#F2E205' },
  { name: 'jaune, rose', value: '#F2E205' },
  { name: 'jaune, vert', value: '#F2E205' },
  { name: 'marron', value: '#A67C49' },
  { name: 'marron, jaune, rose', value: '#A67C49' },
  { name: 'marron, rose', value: '#A67C49' },
  { name: 'noir', value: '#212126' },
  { name: 'rose', value: '#D962A3' },
  { name: 'rose, blanc', value: '#D962A3' },
  { name: 'rose, bleu', value: '#D962A3' },
  { name: 'rose, jaune', value: '#D962A3' },
  { name: 'rose, jaune, blanc', value: '#D962A3' },
  { name: 'rose, marron', value: '#D962A3' },
  { name: 'vert', value: '#84BF04' },
  { name: 'vert, bleu', value: '#84BF04' },
  { name: 'vert, bleu, blanc', value: '#84BF04' },
  { name: 'vert, bleu, jaune', value: '#84BF04' },
  { name: 'vert, bleu, rose', value: '#84BF04' },
  { name: 'vert, jaune, rose', value: '#84BF04' },
  { name: 'vert, marron', value: '#84BF04' },
  { name: 'vert, rose', value: '#84BF04' }
];
