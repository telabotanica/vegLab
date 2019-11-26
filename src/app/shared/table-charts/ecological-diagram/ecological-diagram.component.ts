import { Component, OnInit, OnDestroy } from '@angular/core';

import { EcologicalTraitsService } from 'src/app/_services/ecological-traits.service';
import { TableService } from 'src/app/_services/table.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { NotificationService } from 'src/app/_services/notification.service';

import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'vl-ecological-diagram',
  templateUrl: './ecological-diagram.component.html',
  styleUrls: ['./ecological-diagram.component.scss']
})
export class EcologicalDiagramComponent implements OnInit, OnDestroy {
  currentWs: string;

  tableChangeSubscriber: Subscription;
  ecoTraitsSubscriber: Subscription;

  diagramWidth = 200; // in px

  totalItems: number = null;
  baseflorTraitsItems: Array<any> = [];

  baseflorTraits = {
    pj_light: {
      label: 'Lum.',
      name: 'Lumière',
      start: 1,
      end: 9,
      active: null,
      values: ['hypersciaphiles', 'perisciaphiles', 'sciaphiles', 'hémisciaphiles', 'sciaclines à hélioclines', 'hémihéliophiles', 'héliophiles', 'perihéliophiles', 'hyperhéliophiles']
    },
    pj_temperature: {
      label: 'Temp.',
      name: 'Température',
      start: 1,
      end: 9,
      active: null,
      values: ['alpines à nivales, altiméditerranéennes', 'subalpines, oroméditerranéennes', 'montagnardes', 'collinéennes, planitiaires psychrophiles (psychro-atlantiques, psychrocentro-européennes)', 'planitiaires à montagnardes', 'planitiaires thermophiles (thermo-atlantiques, thermocentro-européennes) et sub- à supraméditerranéennes', 'euryméditerranéennes, méditerranéo-atlantiques', 'mésoméditerranéennes', 'thermoméditerranéennes à subdésertiques (inframéditerranéennes)']
    },
    pj_continentality: {
      label: 'Cont.',
      name: 'Continentalité',
      start: 1,
      end: 9,
      active: null,
      values: ['marines à maritimes', 'hyperocéaniques', 'océaniques', 'subocéaniques', 'intermédiaires', 'précontinentales', 'subcontinentales', 'continentales', 'hypercontinentales']
    },
    pj_atmospheric_humidity: {
      label: 'Hum. atm.',
      name: 'Humidité atmospérique',
      start: 1,
      end: 9,
      active: null,
      values: ['aéroxérophiles', 'intermédiaires', 'aéromésoxérophiles', 'intermédiaires', 'aéromésohydriques', 'intermédiaires', 'aéromésohygrophiles', 'intermédiaires', 'aérohydrophiles']
    },
    pj_soil_humidity: {
      label: 'Hum. éda.',
      name: 'Humidité édaphique',
      start: 1,
      end: 12,
      active: null,
      values: ['hyperxérophiles (sclérophiles, ligneuses microphylles, réviviscentes)', 'perxérophiles (caulocrassulescentes subaphylles, coussinets)', 'xérophiles (velues, aiguillonnées, cuticule épaisse)', 'mésoxérophiles', 'mésohydriques', 'mésohygroclines, mésohygrophiles', 'hygrophiles (durée d\'inondation en semaines)', 'hydrophiles (durée d\'inondation en mois)', 'amphibies saisonnières (hélophytes exondés une partie minoritaire de l’année)', 'amphibies permanentes (hélophytes semi-émergés à base toujours noyée)', 'aquatiques superficielles (0-50 cm) ou flottantes', 'aquatiques profondes (1-3 m) ou intra-aquatiques']
    },
    pj_soil_ph: {
      label: 'pH',
      name: 'Réaction du sol',
      start: 1,
      end: 9,
      active: null,
      values: ['hyperacidophiles(3,0<pH<4,0)', 'peracidophiles (4,0<pH<4,5)', 'acidophiles (4,5<pH<5,0)', 'acidoclines (5,0<pH<5,5)', 'neutroclines (5,5<pH<6,5)', 'basoclines (6,5<pH<7,0)', 'basophiles (7,0<pH<7,5)', 'perbasophiles (7,5<pH<8,0)', 'hyperbasophiles (8,0<pH<9,0)']
    },
    pj_trophic_level: {
      label: 'Nutr. sol',
      name: 'Nutriments du sol (surtout anions azotés et phosphatés, puis également cations potassiques)',
      start: 1,
      end: 9,
      active: null,
      values: ['hyperoligotrophiles', 'peroligotrophiles', 'oligotrophiles', 'méso-oligotrophiles', 'mésotrophiles', 'méso-eutrophiles', 'eutrophiles', 'pereutrophiles', 'hypereutrophiles']
    },
    pj_salinity: {
      label: 'Sal.',
      name: 'Salinité (surtout Chlorures, également sodium)',
      start: 0,
      end: 9,
      active: null,
      values: ['ne supportant pas le sel', 'hyperoligohalines, [0-1‰ Cl-]', 'peroligohalines, [1-3‰ Cl-]', 'oligohalines, [3-5‰ Cl-]', 'méso-oligohalines, [5-7‰ Cl-]', 'mésohalines, [7-9‰ Cl-]', 'méso-euhalines, [9-12‰ Cl-]', 'euhalines, [12-16‰ Cl-]', 'pereuhalines, [16-23‰ Cl-]', 'hypereuhalines, [>23‰ Cl-]']
    },
    pj_texture: {
      label: 'Text. sol',
      name: 'Texture du sol',
      start: 1,
      end: 9,
      active: null,
      values: ['argile', 'intermédiaire', 'limon', 'sable fin', 'sable grossier', 'graviers', 'galets', 'blocs, fentes des parois', 'dalle']
    },
    pj_organic_material: {
      label: 'Mat. org.',
      name: 'Matière organique du sol et type d\'humus',
      start: 1,
      end: 9,
      active: null,
      values: ['lithosol, peyrosol, régosol', 'mull carbonaté', 'mull actif', 'mull acide', 'moder', 'mor, hydromor, xéromor', 'ranker, tangel', 'anmoor, gyttja', 'tourbe']
    }
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

    // Subscribe to WS change ?
    // I don't think it's necessary for now. It's not planed to have hot change in WS.
    // This component should be used in different WS but, in this case, it will be destroyed and recreated

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
          this.setBaseflorTraitsValues();
          // get baseflor items
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

  private resetTraits(): void {
    this.baseflorTraits.pj_light.active = null;
    this.baseflorTraits.pj_temperature.active = null;
    this.baseflorTraits.pj_continentality.active = null;
    this.baseflorTraits.pj_atmospheric_humidity.active = null;
    this.baseflorTraits.pj_soil_humidity.active = null;
    this.baseflorTraits.pj_soil_ph.active = null;
    this.baseflorTraits.pj_trophic_level.active = null;
    this.baseflorTraits.pj_salinity.active = null;
    this.baseflorTraits.pj_texture.active = null;
    this.baseflorTraits.pj_organic_material.active = null;
  }

  private setBaseflorTraitsValues(): void {
    if (this.totalItems && this.totalItems > 0 && this.baseflorTraitsItems && this.baseflorTraitsItems.length > 0) {
      const pj_light: Array<number>                = [];
      const pj_temperature: Array<number>          = [];
      const pj_continentality: Array<number>       = [];
      const pj_atmospheric_humidity: Array<number> = [];
      const pj_soil_humidity: Array<number>        = [];
      const pj_soil_ph: Array<number>              = [];
      const pj_trophic_level: Array<number>        = [];
      const pj_salinity: Array<number>             = [];
      const pj_texture: Array<number>              = [];
      const pj_organic_material: Array<number>     = [];
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_light)                { pj_light.push(Number(bfti.traitsRepo.traits.pj_light)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_temperature)          { pj_temperature.push(Number(bfti.traitsRepo.traits.pj_temperature)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_continentality)       { pj_continentality.push(Number(bfti.traitsRepo.traits.pj_continentality)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_atmospheric_humidity) { pj_atmospheric_humidity.push(Number(bfti.traitsRepo.traits.pj_atmospheric_humidity)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_soil_humidity)        { pj_soil_humidity.push(Number(bfti.traitsRepo.traits.pj_soil_humidity)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_soil_ph)              { pj_soil_ph.push(Number(bfti.traitsRepo.traits.pj_soil_ph)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_trophic_level)        { pj_trophic_level.push(Number(bfti.traitsRepo.traits.pj_trophic_level)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_salinity)             { pj_salinity.push(Number(bfti.traitsRepo.traits.pj_salinity)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_texture)              { pj_texture.push(Number(bfti.traitsRepo.traits.pj_texture)); } } );
      _.map(this.baseflorTraitsItems, bfti => { if (bfti.traitsRepo.traits.pj_organic_material)     { pj_organic_material.push(Number(bfti.traitsRepo.traits.pj_organic_material)); } } );

      const pj_light_avg: number                = pj_light.reduce((a, b) => a + b, 0) / pj_light.length;
      const pj_temperature_avg: number          = pj_temperature.reduce((a, b) => a + b, 0) / pj_temperature.length;
      const pj_continentality_avg: number       = pj_continentality.reduce((a, b) => a + b, 0) / pj_continentality.length;
      const pj_atmospheric_humidity_avg: number = pj_atmospheric_humidity.reduce((a, b) => a + b, 0) / pj_atmospheric_humidity.length;
      const pj_soil_humidity_avg: number        = pj_soil_humidity.reduce((a, b) => a + b, 0) / pj_soil_humidity.length;
      const pj_soil_ph_avg: number              = pj_soil_ph.reduce((a, b) => a + b, 0) / pj_soil_ph.length;
      const pj_trophic_level_avg: number        = pj_trophic_level.reduce((a, b) => a + b, 0) / pj_trophic_level.length;
      const pj_salinity_avg: number             = pj_salinity.reduce((a, b) => a + b, 0) / pj_salinity.length;
      const pj_texture_avg: number              = pj_texture.reduce((a, b) => a + b, 0) / pj_texture.length;
      const pj_organic_material_avg: number     = pj_organic_material.reduce((a, b) => a + b, 0) / pj_organic_material.length;

      this.baseflorTraits.pj_light.active                = pj_light_avg !== null ? Math.round(pj_light_avg) : null;
      this.baseflorTraits.pj_temperature.active          = pj_temperature_avg !== null ? Math.round(pj_temperature_avg) : null;
      this.baseflorTraits.pj_continentality.active       = pj_continentality_avg !== null ? Math.round(pj_continentality_avg) : null;
      this.baseflorTraits.pj_atmospheric_humidity.active = pj_atmospheric_humidity_avg !== null ? Math.round(pj_atmospheric_humidity_avg) : null;
      this.baseflorTraits.pj_soil_humidity.active        = pj_soil_humidity_avg !== null ? Math.round(pj_soil_humidity_avg) : null;
      this.baseflorTraits.pj_soil_ph.active              = pj_soil_ph_avg !== null ? Math.round(pj_soil_ph_avg) : null;
      this.baseflorTraits.pj_trophic_level.active        = pj_trophic_level_avg !== null ? Math.round(pj_trophic_level_avg) : null;
      this.baseflorTraits.pj_salinity.active             = pj_salinity_avg !== null ? Math.round(pj_salinity_avg) : null;
      this.baseflorTraits.pj_texture.active              = pj_texture_avg !== null ? Math.round(pj_texture_avg) : null;
      this.baseflorTraits.pj_organic_material.active     = pj_organic_material_avg !== null ? Math.round(pj_organic_material_avg) : null;

    }
  }

}
