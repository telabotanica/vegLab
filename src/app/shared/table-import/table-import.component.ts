import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { AppConfigService } from 'src/app/_config/app-config.service';
import { NotificationService } from '../../_services/notification.service';
import { RepositoryService } from '../../_services/repository.service';
import { RepositoryService as TsbRepositoryService, RepositoryModel } from 'tb-tsb-lib';
import { GeocodingService, OsmPlaceModel, InseeCommune, ElevationService } from 'tb-geoloc-lib';
import { MetadataService } from 'src/app/_services/metadata.service';
import { LayerService } from '../../_services/layer.service';
import { TableService } from '../../_services/table.service';
import { LocationService } from 'src/app/_services/location.service';
import { ObserverService } from 'src/app/_services/observer.service';
import { BiblioService } from 'src/app/_services/biblio.service';
import { WorkspaceService } from 'src/app/_services/workspace.service';
import { SsoService } from 'src/app/_services/sso.service';
import { UserService } from 'src/app/_services/user.service';

import { FileData } from 'tb-dropfile-lib/lib/_models/fileData';
import { RejectedFileData } from 'tb-dropfile-lib/lib/_models/rejectedFileData';
import { OccurrenceValidationModel } from '../../_models/occurrence-validation.model';
import { LocationModel as TbLocationModel } from 'tb-geoloc-lib';
import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';
import { ExtendedFieldOccurrence } from 'src/app/_models/extended-field-occurrence';
import { Table } from 'src/app/_models/table.model';
import { TableRowDefinition } from 'src/app/_models/table-row-definition.model';
import { Sye } from 'src/app/_models/sye.model';
import { Level } from 'src/app/_enums/level-enum';
import { LayerEnum } from 'src/app/_enums/layer-list';
import { InputSource } from 'src/app/_enums/input-source-enum';
import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { VlAccuracyEnum } from 'tb-geoloc-lib';
import { FieldDataType } from 'src/app/_enums/field-data-type-enum';
import { Observer } from 'src/app/_models/observer.model';
import { Biblio } from 'src/app/_models/biblio.model';
import { UserModel } from 'src/app/_models/user.model';
import { VlUser } from 'src/app/_models/vl-user.model';

import { environment } from '../../../environments/environment';

import * as Papa from 'papaparse';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';

import { RepositoryItemModel } from 'tb-tsb-lib';
import { NominatimObject } from 'tb-geoloc-lib';
import { flatMap, map } from 'rxjs/operators';
import { of, Subscription, BehaviorSubject } from 'rxjs';
import { MatStepper } from '@angular/material';

@Component({
  selector: 'vl-table-import',
  templateUrl: './table-import.component.html',
  styleUrls: ['./table-import.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  encapsulation: ViewEncapsulation.None
})
export class TableImportComponent implements OnInit, OnDestroy {
  @ViewChild('hiddenInput') hiddenInput: ElementRef;  // @Todo ng8 and above : add opts {read: ElementRef, static: false}
  @ViewChild('stepper') stepper: MatStepper;          // @Todo ng8 and above : add opts {read: ElementRef, static: false}

  @Input() forcePostObserver = false;     // create (POST) a new Observer if no result
  @Input() observerFuzzySearch = true;    // fuzzy will use ElastiSearch, else API Platform

  @Input() forcePostBiblio = false;      // create (POST) a new Biblio if no result
  @Input() biblioFuzzySearch = false;    // fuzzy will use ElasticSearch, else API Platform
  @Input() autoSelectIfOneResultBiblio = true;

  @Input() fileToProcess: FileData = null;

  @Input() autoLaunchSteps = false;
  @Input() set getTable(value: boolean) {
    if (value && value === true) { this.table.emit(this.setTable(false)); }
  }

  @Output() stepFileStatus =         new EventEmitter<'complete' | 'warning' | 'error' | 'pending'>();
  @Output() stepNamesStatus =        new EventEmitter<'complete' | 'warning' | 'error' | 'pending'>();
  @Output() stepPlacesStatus =       new EventEmitter<'complete' | 'warning' | 'error' | 'pending'>();
  @Output() stepAuthorsDatesStatus = new EventEmitter<'complete' | 'warning' | 'error' | 'pending'>();
  @Output() stepMetadataStatus =     new EventEmitter<'complete' | 'warning' | 'error' | 'pending'>();
  @Output() stepBiblioStatus =       new EventEmitter<'complete' | 'warning' | 'error' | 'pending'>();
  @Output() stepValidationStatus =   new EventEmitter<'complete' | 'warning' | 'error' | 'pending'>();
  @Output() table = new EventEmitter<Table>();

  // Global vars
  allowedFileTypes = ['csv'];
  uploadedFile: File;
  parsedCsvFile: Array<Array<string>> = [];
  rawHeaders: Array<Array<string>> = [];
  rawLocation: Array<Array<string>> = [];
  rawValidation: Array<Array<string>> = [];
  rawBiblio: Array<Array<string>> = [];
  rawRelevesCount: Array<Array<string>> = [];
  rawMetadata: Array<Array<string>> = [];
  rawContent: Array<Array<string>> = [];

  // User vars
  currentUser: UserModel;
  currentVlUser: VlUser;
  userSubscription: Subscription;
  vlUserSubscription: Subscription;

  // Stepper vars
  STEPS = {
    file:         { index: 0, label: 'Importer un fichier' },
    names:        { index: 1, label: 'Noms' },
    authorsDates: { index: 2, label: 'Auteurs et dates' },
    places:       { index: 3, label: 'Localisation' },
    metadata:     { index: 4, label: 'Métadonnées' },
    biblio:       { index: 5, label: 'Bibliographie' },
    validations:  { index: 6, label: 'Identification' }
  };
  currentStepIndex = 0;
  contentFullWidth = false;

  // step health
  importFileStatus: BehaviorSubject<'complete' | 'warning' | 'error' | 'pending'> = new BehaviorSubject<'complete' | 'warning' | 'error' | 'pending'>('pending');
  importFileMessages: BehaviorSubject<Array<string>> = new BehaviorSubject<Array<string>>([]);

  // importFile: BehaviorSubject<{status: 'complete' | 'warning' | 'error' | 'pending', messages: Array<string>}> = new BehaviorSubject<{status: 'complete' | 'warning' | 'error' | 'pending', messages: Array<string>}>({status: 'pending', messages: []});

  // step status
  stepNames: BehaviorSubject<StepStatus> =        new BehaviorSubject<StepStatus>({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des noms pour commencer', tip: ''});
  stepPlaces: BehaviorSubject<StepStatus> =       new BehaviorSubject<StepStatus> ({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des localisations pour commencer', tip: ''});
  stepAuthorsDates: BehaviorSubject<StepStatus> = new BehaviorSubject<StepStatus> ({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des auteurs et des dates pour commencer', tip: ''});
  stepMetadata: BehaviorSubject<StepStatus> =     new BehaviorSubject<StepStatus> ({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des métadonnées pour commencer', tip: ''});
  stepBiblio: BehaviorSubject<StepStatus> =       new BehaviorSubject<StepStatus> ({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des références bibliographiques pour commencer', tip: '' });
  stepValidation: BehaviorSubject<StepStatus> =   new BehaviorSubject<StepStatus> ({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des identifications pour commencer', tip: '' });

  stepFileSubscription: Subscription;
  stepNamesSubscription: Subscription;
  stepPlacesSubscription: Subscription;
  stepAuthorsDatesSubscription: Subscription;
  stepMetadataSubscription: Subscription;
  stepBiblioSubscription: Subscription;
  stepValidationSubscription: Subscription;

  // File rows / col properties
  GROUP_ROW_POS         = { initialPos: 0,  groupPosition: 0, keywords: ['Groupe'] };
  REFERENCE_ROW_POS     = { initialPos: 1,  groupPosition: 1, keywords: ['Numéro de relevé'] };
  AUTHOR_ROW_POS        = { initialPos: 2,  groupPosition: 2, keywords: ['Auteur'] };
  DATE_ROW_POS          = { initialPos: 4,  groupPosition: 3, keywords: ['Date'] };
  LATITUDE_ROW_POS      = { initialPos: 5,  groupPosition: 0, keywords: ['Latitude'] };
  LONGITUDE_ROW_POS     = { initialPos: 6,  groupPosition: 1, keywords: ['Longitude'] };
  ELEVATION_ROW_POS     = { initialPos: 7,  groupPosition: 2, keywords: ['Altitude'] };
  COUNTRY_ROW_POS       = { initialPos: 8,  groupPosition: 3, keywords: ['Pays'] };
  DEPARTEMENT_ROW_POS   = { initialPos: 9,  groupPosition: 4, keywords: ['Département'] };
  CITY_ROW_POS          = { initialPos: 10, groupPosition: 5, keywords: ['Commune'] };
  PLACE_ROW_POS         = { initialPos: 11, groupPosition: 6, keywords: ['Lieu'] };
  REPOSITORY_ROW_POS    = { initialPos: 12, groupPosition: 0, keywords: ['Référentiel'] };
  REPOSITORY_ID_ROW_POS = { initialPos: 13, groupPosition: 1, keywords: ['Numéro nomenclatural'] };
  BIBLIO_ROW_POS        = { ititialPos: 14, groupPosition: 0, keywords: ['Ref. biblio.'] };
  NUMBER_RELEVES_ROW_POS = { initialPos: 15, groupePosition: 0, keywords: ['Nombre de relevés'] };

  REPO_COL_POS            = { position: 0, keywords: ['Référentiel'] };
  NOMEN_COL_POS           = { position: 1, keywords: ['Nomen'] };
  LAYER_COL_POS           = { position: 2, keywords: ['Strate'] };
  HEADERS_LABELS_COL_POS  = { position: 3 };

  COEF_MATRIX_START_COL = 4;

  EMPTY_CELL_VALUES     = ['', ' ', '-', '/', 'nc', 'na', '-0'];

  ignoreFirstXCols = 4;

  // Taxonomic vars
  tbRepositoriesConfig = environment.tbRepositoriesConfig;
  tbRepositoriesConfigVegetation = environment.tbRepositoriesConfigVegetation;
  availableRepository: Array<any> = [];
  taxonomicList: Array<Taxo> = [];
  displayedTaxonomicColumns = ['customColumn1', 'repository', 'name'];
  isLoadingTaxonomicList = false;
  isEditingTaxon = false;
  resetEditTaxonBox = false;
  editedTaxon: {id: string, validation: OccurrenceValidationModel, rim?: RepositoryItemModel};

  // Location vars
  currentLocation: TbLocationModel;
  locationList: Array<Location> = [];
  showLocationMap = false;
  allowDrawMap = false;
  patchMapAddress: string;
  patchMapLngLatDec: [number, number];
  patchMapGeometry: Array<{ type: string, coordinates: any }>;
  setMapAddress: string;
  setMapInputFocus: boolean;
  locationDetailVisibility = false;
  displayedLocationColumns = ['customColumn2', 'id', 'source', 'locationAccuracy', 'elevation', 'customColumn'];

  // Author & date vars
  authorList: Array<{authorUserInput: string, authorSelected: Observer}> = [];
  dateList: Array<{dateUserInput: string, dateConsolided: Date, dateConsolidedUtc: Date, precision: 'day' | 'month' | 'year'}> = [];
  displayedAuthorColumns = ['customColumn1', 'authorUserInput', 'customColumn2'];
  displayedDateColumns = ['customColumn1', 'dateUserInput', 'customColumn2'];
  expandedElement: Observer | null;
  authorsSeparator = ';';

  // Metadata vars
  metadataList: Array<{ id: string, metadata: Array<MetadataItem> }> = [];
  flatMetadataList: Array<{
    id: string,
    metadataName: string,
    metadataValue: string,
    // consolidedValue: any,
    checkedValue: { isValid: boolean, consolidedValue: any, errorMessage: string },
    metadataModel: ExtendedFieldModel
  }> = [];
  displayedMetadataColumns = ['id', 'metadataName', 'metadataValue', 'metadataModel', 'consolidedValue'];
  // expandedElement: {id: string, metadataName: string, metadataValue: string, consolidedValue: any, metadataModel: ExtendedFieldModel} | null;

  // Identification vars
  validationList: {
    table: {
      validation: ImportValidation,
      sye: Array<{
        id: string,
        validation: ImportValidation,
        syntheticSye?: boolean,
        releves: Array<{
          id: string,
          validation: ImportValidation
        }>
      }>
    }
  } = { table: { validation: null, sye: []}};
  isEditingTableValidation = false;
  isEditingSyeValidation = false;
  isEditingRelevesValidation = false;
  editingReleves: Array<{id: string, validation: ImportValidation}> = [];
  editingSye: {id: string, validation: ImportValidation};

  // Biblio vars
  biblioList: Array<{biblioUserInput: string, biblioSelected: Biblio}> = [];
  displayedBiblioColumns = ['customColumn1', 'biblioUserInput', 'customColumn2'];
  expandedBiblioElement: Biblio | null;

  tablePreviewIsSet = false;

  constructor(
    private appConfig: AppConfigService,
    private notificationService: NotificationService,
    private repositoryService: RepositoryService,
    private tsbRepositoryService: TsbRepositoryService,
    private geocodingService: GeocodingService,
    private elevationService: ElevationService,
    private metadataService: MetadataService,
    private layerService: LayerService,
    private tableService: TableService,
    private locationService: LocationService,
    private observerService: ObserverService,
    private biblioService: BiblioService,
    private wsService: WorkspaceService,
    private ssoService: SsoService,
    private userService: UserService) { }

  ngOnInit() {
    // App config
    setTimeout(() => {                    // Avoid 'ExpressionChangedAfterItHasBeenCheckedError'
      this.appConfig.setTableViewable();
      this.appConfig.disableInfoPanel();
    });

    // Reset component vars
    this.resetComponent();

    // Get current user
    this.currentUser = this.userService.currentUser.getValue();
    this.currentVlUser = this.userService.currentVlUser.getValue();
    if (this.currentUser == null) {
      // No user
      // Should refresh the token ?
      // this.notificationService.warn('Il semble que vous ne soyez plus connecté. Nous ne pouvons pas poursuivre l\'import du tableau.');
      // return;
    }

    // Subscribe to current user
    this.userSubscription = this.userService.currentUser.subscribe(
      user => {
        this.currentUser = user;
      },
      error => {
        // @Todo manage error
      }
    );
    this.vlUserSubscription = this.userService.currentVlUser.subscribe(
      vlUser => {
        this.currentVlUser = vlUser;
      }, error => { console.log(error); }
    );

    this.availableRepository = environment.tbRepositoriesConfig;
    // Get metadata list
    if (this.metadataService.metadataList.getValue().length === 0) {
      this.metadataService.refreshMetadataList();
    }

    // Steps subscriptions
    this.stepFileSubscription         = this.importFileStatus.subscribe(value => { this.stepFileStatus.emit(value); } );
    this.stepNamesSubscription        = this.stepNames.subscribe(value => { this.stepNamesStatus.emit(value.currentStatus); } );
    this.stepPlacesSubscription       = this.stepPlaces.subscribe(value => { this.stepPlacesStatus.emit(value.currentStatus); } );
    this.stepAuthorsDatesSubscription = this.stepAuthorsDates.subscribe(value => { this.stepAuthorsDatesStatus.emit(value.currentStatus); } );
    this.stepMetadataSubscription     = this.stepMetadata.subscribe(value => { this.stepMetadataStatus.emit(value.currentStatus); } );
    this.stepBiblioSubscription       = this.stepBiblio.subscribe(value => { this.stepBiblioStatus.emit(value.currentStatus); } );
    this.stepValidationSubscription   = this.stepValidation.subscribe(value => { this.stepValidationStatus.emit(value.currentStatus); } );

    // Set initial import status
    this.importFileStatus.next('pending');
  }

  ngOnDestroy() {
    if (this.userSubscription) { this.userSubscription.unsubscribe(); }
    if (this.vlUserSubscription) { this.vlUserSubscription.unsubscribe(); }

    if (this.stepFileSubscription) { this.stepFileSubscription.unsubscribe(); }
    if (this.stepNamesSubscription) { this.stepNamesSubscription.unsubscribe(); }
    if (this.stepPlacesSubscription) { this.stepPlacesSubscription.unsubscribe(); }
    if (this.stepAuthorsDatesSubscription) { this.stepAuthorsDatesSubscription.unsubscribe(); }
    if (this.stepMetadataSubscription) { this.stepMetadataSubscription.unsubscribe(); }
    if (this.stepBiblioSubscription) { this.stepBiblioSubscription.unsubscribe(); }
    if (this.stepValidationSubscription) { this.stepValidationSubscription.unsubscribe(); }
  }

  resetComponent(): void {
    this.uploadedFile = undefined;
    this.parsedCsvFile = [];
    this.rawHeaders = [];
    this.rawLocation = [];
    this.rawValidation = [];
    this.rawBiblio = [];
    this.rawRelevesCount = [];
    this.rawMetadata = [];
    this.rawContent = [];

    this.importFileStatus.next('pending');
    this.importFileMessages.next([]);
    this.stepNames.next({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des noms pour commencer', tip: ''});
    this.stepPlaces.next({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des localisations pour commencer', tip: ''});
    this.stepAuthorsDates.next({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des auteurs et des dates pour commencer', tip: ''});
    this.stepMetadata.next({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des métadonnées pour commencer', tip: ''});
    this.stepBiblio.next({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des références bibliographiques pour commencer', tip: '' });
    this.stepValidation.next({ started: false, currentStatus: 'pending', message: 'Lancez la vérification des identifications pour commencer', tip: '' });

    this.taxonomicList = [];
    this.locationList = [];
    this.authorList = [];
    this.dateList = [];
    this.metadataList = [];
    this.flatMetadataList = [];
    this.validationList = { table: { validation: null, sye: []}};
    this.isEditingTableValidation = false;
    this.isEditingSyeValidation = false;
    this.isEditingRelevesValidation = false;
    this.editingReleves = [];
    this.biblioList = [];

    try {
      this.stepper.reset();
    } catch (error) {
      //
    }

    // Is there a file to process ?
    if (this.fileToProcess !== null) {
      this.uploadedFiles([this.fileToProcess]);
    }

    // Table
    this.tableService.createFreshTable();
    this.tablePreviewIsSet = false;

  }

  // **********
  // UPLOAD CSV
  // **********

  /**
   * When user uploaded files through tb-dropfile-lib module
   * @param data array of local uploaded files
   */
  uploadedFiles(data: Array<FileData>): void {
    if (data.length > 1) {
      // Can't upload more than one file
    } else if (data.length === 0) {
      // No file
    } else if (data.length === 1) {
      // Ok, continue
      this.uploadedFile = data[0].file;
      this.readCsvFile();
    }
  }

  /**
   * Files rejected by tb-dropbox-lib module
   * @param data array of rejected files
   */
  rejectedFiles(data: Array<RejectedFileData>): void {
    this.importFileStatus.next('error');
    this.importFileMessagesPush('Le fichier importé n\'est pas au bon format');
  }

  /**
   * Deleted files by tb-dropbox-lib module
   * @param data array of deleted (local) files
   */
  deletedFiles(data: Array<FileData>): void {
    this.resetComponent();
  }

  importFileMessagesPush(message: string): void {
    const _ifMessages = this.importFileMessages.getValue();
    _ifMessages.push(message);
    this.importFileMessages.next(_ifMessages);
  }

  // ********
  // READ CSV
  // ********
  readCsvFile(): void {
    if (this.uploadedFile) {
      Papa.parse(this.uploadedFile, {
        complete: results => {
          if (results.errors.length > 0) {
            // Csv file has some errors, log to user and abort
            console.log(results.errors);
            this.notificationService.error(results.errors.toString());
            this.importFileStatus.next('error');
            this.importFileMessagesPush('Le fichier importé n\'est pas conforme');
          } else {
            this.parsedCsvFile = results.data as any;
            console.log(this.parsedCsvFile);
            this.splitCsvFile();
            this.checkImportedFile(); // chekcs CSV errors and change this.importFile status and messages
            if (this.importFileStatus.getValue() === 'pending') {
              this.importFileStatus.next('complete');
              this.importFileMessagesPush('Votre fichier est conforme');
              if (this.autoLaunchSteps) {
                // Launch all steps
                this.setTaxonomicList();
                this.setAuthorDateList();
                this.setLocationList();
                this.setMetadataList();
                this.setBiblioList();
                this.setValidationList();
              }
            }
          }
        }
      });
    } else {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Le fichier a bien été chargé mais nous n\'arrivons pas à lire les données');
    }
  }

  /**
   * Split the imported csv file into several sections :
   *  - 'headers' that contains sye informations and original references for each relevé
   *  - 'metadata' that contain related metadata (pH, hmv, ...)
   *  - 'content' that contains the list of names (nomen + cited name) and coefficients
   */
  splitCsvFile(): void {
    if (this.parsedCsvFile) {
      // Splice headers
      this.rawHeaders = this.parsedCsvFile.splice(0, 4);
      console.log('raw headers', this.rawHeaders);

      // Splice location attributes
      this.rawLocation = this.parsedCsvFile.splice(0, 7);
      console.log('raw location', this.rawLocation);

      // Splice validation attributes
      this.rawValidation = this.parsedCsvFile.splice(0, 2);
      console.log('raw validation', this.rawValidation);

      // Splice biblio attributes
      this.rawBiblio = this.parsedCsvFile.splice(0, 1);
      console.log('raw biblio', this.rawBiblio);

      // Get row position for 'Nomen'
      let i = 0;
      let rowNomenStartPosition: number;
      for (const row of this.parsedCsvFile) {
        if (row[this.NOMEN_COL_POS.position].toLowerCase() === 'nomen') { rowNomenStartPosition = i; break; }
        i++;
      }

      // Splice number of releves
      this.rawRelevesCount = this.parsedCsvFile.splice(0, 1);
      console.log('raw releves count', this.rawRelevesCount);

      // Splice metadata
      if (rowNomenStartPosition) {
        this.rawMetadata = this.parsedCsvFile.splice(0, rowNomenStartPosition - 1);
        console.log('raw metadata', this.rawMetadata);
      } else {
        /* LOG ERROR AND ABORT */
        // Can't find 'Nomen' position
      }

      // Splice content
      console.log('PARSED CSV FILE : ', this.parsedCsvFile);
      if (this.parsedCsvFile[0][this.REPO_COL_POS.position].toLocaleLowerCase() === 'référentiel'
          && this.parsedCsvFile[0][this.NOMEN_COL_POS.position].toLocaleLowerCase() === 'nomen'
          && this.parsedCsvFile[0][this.LAYER_COL_POS.position].toLowerCase() === 'strate') {
        for (const row of this.parsedCsvFile) {
          if (row[0] === '' || row[1] === '') {
            // empty cell at col1 or col2
            // LOG AND ABORT
          }
        }

        // remove first row ('repository', 'nomen' and 'strate' row)
        this.parsedCsvFile.splice(0, 1);

        // set rawContent
        this.rawContent = this.parsedCsvFile;
        console.log('RAW CONTENT : ', this.rawContent);
        const lastRow = this.rawContent[this.rawContent.length - 1];
        if (lastRow.length  === 1 && lastRow[0] === '') { this.rawContent.splice(this.rawContent.length - 1, 1); } // delete last line if empty
        console.log(this.rawContent);
      } else {
        /* What happened ? */
      }
    }
  }

  // *********
  // CHECK CSV
  // *********

  checkImportedFile(): void {
    // 0. Keywords
    if (this.GROUP_ROW_POS.keywords.indexOf(this.rawHeaders[this.GROUP_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.GROUP_ROW_POS.keywords.toString()}'`);
    }
    if (this.REFERENCE_ROW_POS.keywords.indexOf(this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.REFERENCE_ROW_POS.keywords.toString()}'`);
    }
    if (this.AUTHOR_ROW_POS.keywords.indexOf(this.rawHeaders[this.AUTHOR_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.AUTHOR_ROW_POS.keywords.toString()}'`);
    }
    if (this.DATE_ROW_POS.keywords.indexOf(this.rawHeaders[this.DATE_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.DATE_ROW_POS.keywords.toString()}'`);
    }

    if (this.LATITUDE_ROW_POS.keywords.indexOf(this.rawLocation[this.LATITUDE_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.LATITUDE_ROW_POS.keywords.toString()}'`);
    }
    if (this.LONGITUDE_ROW_POS.keywords.indexOf(this.rawLocation[this.LONGITUDE_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.LONGITUDE_ROW_POS.keywords.toString()}'`);
    }
    if (this.ELEVATION_ROW_POS.keywords.indexOf(this.rawLocation[this.ELEVATION_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.ELEVATION_ROW_POS.keywords.toString()}'`);
    }
    if (this.COUNTRY_ROW_POS.keywords.indexOf(this.rawLocation[this.COUNTRY_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.COUNTRY_ROW_POS.keywords.toString()}'`);
    }
    if (this.DEPARTEMENT_ROW_POS.keywords.indexOf(this.rawLocation[this.DEPARTEMENT_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.DEPARTEMENT_ROW_POS.keywords.toString()}'`);
    }
    if (this.CITY_ROW_POS.keywords.indexOf(this.rawLocation[this.CITY_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.CITY_ROW_POS.keywords.toString()}'`);
    }
    if (this.PLACE_ROW_POS.keywords.indexOf(this.rawLocation[this.PLACE_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.PLACE_ROW_POS.keywords.toString()}'`);
    }

    if (this.REPOSITORY_ROW_POS.keywords.indexOf(this.rawValidation[this.REPOSITORY_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.REPOSITORY_ROW_POS.keywords.toString()}'`);
    }
    if (this.REPOSITORY_ID_ROW_POS.keywords.indexOf(this.rawValidation[this.REPOSITORY_ID_ROW_POS.groupPosition][this.ignoreFirstXCols - 1]) === -1) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Votre tableau ne contient pas de donnée '${this.REPOSITORY_ID_ROW_POS.keywords.toString()}'`);
    }

    // 0. Empty columns
    if (!this.noEmptyColumn(this.spliceStartingCols(this.rawHeaders))) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Votre tableau contient un ou plusieurs colonnes d\'en-tête vide');
    }

    // 0. Rows size
    if (!this.arrayConstantRowSize(this.spliceStartingCols(this.rawHeaders))) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Les valeurs des lignes d\'en-tête doivent contenir un nombre de données identiques');
    }

    // 1. Must contains data for Groupe
    const group = this.spliceXCols(this.rawHeaders[this.GROUP_ROW_POS.groupPosition], this.ignoreFirstXCols);
    if (!this.noEmptyValues(group)) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Les valeurs de \'Groupe\' sont incomplètes');
    }

    // 2. Must contains data for Numéro de relevé + no duplicates + format
    const references = this.spliceXCols(this.rawHeaders[this.REPOSITORY_ID_ROW_POS.groupPosition], this.ignoreFirstXCols);
    if (!this.noEmptyValues(references)) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Les valeurs de \'Numéro de relevé\' sont incomplètes');
    }
    if (!this.noDuplicate(references)) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Les valeurs de \'Numéro de relevé\' contiennent des doublons');
    }
    if (!this.isInteger(references)) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Les valeurs de \'Numéro de relevé\' doivent être des nombres entiers');
    }

    // 3. Must contains data for Auteur + check size
    const author = this.spliceXCols(this.rawHeaders[this.AUTHOR_ROW_POS.groupPosition], this.ignoreFirstXCols);
    if (!this.noEmptyValues(author)) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Les valeurs de \'Auteur\' sont incomplètes');
    }
    // Must contains data for Date + check size
    const date = this.spliceXCols(this.rawHeaders[this.DATE_ROW_POS.groupPosition], this.ignoreFirstXCols);
    if (!this.noEmptyValues(date)) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush('Les valeurs de \'Date\' sont incomplètes');
    }

    // Nomen must be set
    // Uncomment code above to check the layer-nomen concordance. This check involves that a layer must have a given nomen
    /*let i = 1;
    for (const row of this.rawContent) {
      const layerIsEmpty = this.EMPTY_CELL_VALUES.indexOf(row[this.LAYER_COL_POS.position]) === -1 ? false : true;
      const nomenIsEmpty = this.EMPTY_CELL_VALUES.indexOf(row[this.NOMEN_COL_POS.position]) === -1 ? false : true;
      if (nomenIsEmpty && !layerIsEmpty) {
        this.importFile.status = 'error';
        this.importFile.messages.push(`La ligne ${i} possède une valeur 'Strate' mais pas de 'Nomen' associée`);
      } else if (!nomenIsEmpty && layerIsEmpty) {
        this.importFile.status = 'error';
        this.importFile.messages.push(`La ligne ${i} possède une valeur 'Nomen' mais pas de 'Starte' associée`);
      }
      i++;
    }*/

    // Groupe titles must not have coef data
    let j = 1;
    for (const row of this.rawContent) {
      const layerIsEmpty = this.EMPTY_CELL_VALUES.indexOf(row[this.LAYER_COL_POS.position]) === -1 ? false : true;
      const nomenIsEmpty = this.EMPTY_CELL_VALUES.indexOf(row[this.NOMEN_COL_POS.position]) === -1 ? false : true;
      if (layerIsEmpty && nomenIsEmpty) {
        // row should be a 'group title' and so, it should not contain any coef value
        const coefValues = _.takeRight(row, row.length - this.COEF_MATRIX_START_COL);
        if (this.isArrayEmpty(coefValues)) {
          // no coef value
        } else {
          this.importFileStatus.next('error');
          this.importFileMessagesPush(`La ligne ${j} ne contient aucune valeur 'Nomen' ni 'Strate' mais présente des coefficients`);
        }
      }
      j++;
    }

    // Specie must have, at less, 1 coef
    let k = 1;
    for (const row of this.rawContent) {
      const layerIsEmpty = this.EMPTY_CELL_VALUES.indexOf(row[this.LAYER_COL_POS.position]) === -1 ? false : true;
      const nomenIsEmpty = this.EMPTY_CELL_VALUES.indexOf(row[this.NOMEN_COL_POS.position]) === -1 ? false : true;
      if (!layerIsEmpty || !nomenIsEmpty) {
        // row should be a (syn)taxon, it should contain at less 1 coef
        const coefValues = _.takeRight(row, row.length - this.COEF_MATRIX_START_COL);
        if (this.isArrayEmpty(coefValues)) {
          // no coef value
          this.importFileStatus.next('error');
          this.importFileMessagesPush(`La ligne ${k} contient une valeur 'Nomen' ou 'Strate' mais aucun coefficient`);
        }
      }
      k++;
    }

    // Layers must exists
    // @Todo check layers names

    // Location can be empty
    // Repository can be empty but, if present, check repo is available
    // Nomenclatural id can be empty
    // Metadata can be empty but, if present, no ducplicates (layer + metadata name check)

    // A synthetic Sye (group) should only contain 1 synthetic relevé
    const rawRelevesCountCells = this.spliceXCols(this.rawRelevesCount[0], this.ignoreFirstXCols);
    const rawGroupsCells = this.spliceXCols(this.rawHeaders[this.GROUP_ROW_POS.groupPosition], this.ignoreFirstXCols);

    if (rawRelevesCountCells.length !== rawGroupsCells.length) {
      this.importFileStatus.next('error');
      this.importFileMessagesPush(`Les lignes 'Groupe' et 'Nombre de relevés' sont de tailles différentes`);
    } else {
      // @Todo
      const groups = _.groupBy(this.spliceXCols(this.rawHeaders[this.GROUP_ROW_POS.groupPosition], this.ignoreFirstXCols));
      const orderedGroups = {};
      Object.keys(groups).forEach(key => orderedGroups[key] = {count: []});

      for (let i = 0; i < rawGroupsCells.length; i++) {

        const group = rawGroupsCells[i];

        const count = rawRelevesCountCells[i];
        orderedGroups[group].count.push(Number(count));
      }

      Object.keys(groups).forEach(key => orderedGroups[key].uniqCount = _.uniq(orderedGroups[key].count));
      Object.keys(groups).forEach(key => {
        orderedGroups[key].uniqCount.forEach(uCount => {
          if (uCount > 1) {
            // should be a synthetic column
            if (orderedGroups[key].count.length > 1) {
              // Error, a Synthetic group (synthetic Sye) could not contain more than 1 column !
              this.importFileStatus.next('error');
              this.importFileMessagesPush(`Le groupe '${key}' contient à la fois des relevés simples et synthétiques`);
            }
          }
        });
      });
    }

    // A synthetic columns should not contains location data
    // @Todo
  }

  private spliceStartingCols(values: Array<Array<string>>): Array<Array<string>> {
    const _values = _.cloneDeep(values);
    for (const row of _values) {
      row.splice(0, this.ignoreFirstXCols);
    }
    return _values;
  }

  private spliceRowKeywordCol(values: Array<string>): Array<string> {
    const _values = _.cloneDeep(values);
    _values.splice(0, 1);
    return _values;
  }

  private spliceXCols(values: Array<string>, nbColToSplice: number): Array<string> {
    const _values = _.cloneDeep(values);
    _values.splice(0, nbColToSplice);
    return _values;
  }

  private spliceRowsKeywordCol(values: Array<string>): Array<string> {
    const _values = _.cloneDeep(values);
    for (const row of _values) {
      row.slice(0, 1);
    }
    return _values;
  }

  private arrayConstantRowSize(values: Array<Array<string>>): boolean {
    const firstRowSize = values[0].length;
    for (const row of values) {
      if (row.length !== firstRowSize) { return false; }
    }
    return true;
  }

  private noEmptyValues(values: Array<string>): boolean {
    for (const value of values) {
      if (!value || value === '') { return false; }
    }
    return true;
  }

  private isArrayEmpty(values: Array<string>): boolean {
    return _.compact(values).length === 0 ? true : false;
  }

  private noDuplicate(values: Array<string>): boolean {
    const _values = _.cloneDeep(values);
    const uniqValues = _.uniq(_values);
    if (_values.length !== uniqValues.length) {
      return false;
    } else {
      return true;
    }
  }

  private isNumeric(values: Array<string>): boolean {
    for (const value of values) {
      if (isNaN(Number(value))) { return false; }
    }
    return true;
  }

  private isInteger(values: Array<string>): boolean {
    for (const value of values) {
      if (isNaN(Number(Number(value).toFixed(0)))) { return false; }
    }
    return true;
  }

  private getColumns(rows: Array<Array<string>>): Array<Array<string>> {
    const rowNb = rows.length;
    const colNb = rows[0].length;
    const columns: Array<Array<string>> = [];
    for (let i = 0; i < colNb; i++) {
      const column: Array<string> = [];
      for (let j = 0; j < rowNb; j++) {
        column.push(rows[j][i]);
      }
      columns.push(column);
    }
    return columns;
  }

  private noEmptyColumn(values: Array<Array<string>>): boolean {
    // Assumes that each row has the same length
    const columns = this.getColumns(values);
    for (const column of columns) {
      if (_.compact(column).length === 0) {
        return false;
      }
    }
    return true;
  }

  private isEmptyValue(value: string): boolean {
    return this.EMPTY_CELL_VALUES.indexOf(value) !== -1 ? true : false;
  }

  // *********
  // TAXONOMIC
  // *********

  prepareTaxonomicList(): void {
    let group = 'Groupe';
    let groupPosition = 0;
    for (const t of this.rawContent) {
      if (t[this.REPO_COL_POS.position] === '-' && t[this.NOMEN_COL_POS.position] === '-' && t[this.LAYER_COL_POS.position] === '-') {
        group = t[this.HEADERS_LABELS_COL_POS.position];
        groupPosition++;
      }
      if (!(t[this.REPO_COL_POS.position] === '-' && t[this.NOMEN_COL_POS.position] === '-' && t[this.LAYER_COL_POS.position] === '-')) {
        this.taxonomicList.push({
          id: t[this.REPO_COL_POS.position].toString() + '~' + t[this.NOMEN_COL_POS.position].toString() + '~' + t[this.LAYER_COL_POS.position].toString() + '~' + t[this.HEADERS_LABELS_COL_POS.position].toString(),
          repo: t[this.REPO_COL_POS.position].toString(),
          nomen: t[this.NOMEN_COL_POS.position].toString(),
          layer: t[this.LAYER_COL_POS.position].toString(),
          group,
          groupPosition,
          validation: null,
          rim: null});
      }
    }
  }

  removeDuplicatesInTaxonomicList() {
    const taxoList = _.clone(this.taxonomicList);
    if (taxoList && taxoList !== null && taxoList.length > 0) {
      // get duplicates by repository+nomen+layer
      const uniqTaxoList = _.uniqBy(taxoList, tl => tl.repo + '~' + tl.nomen + '~' + tl.layer);
      const diff = _.difference(taxoList, uniqTaxoList);
      if (diff) {
        this.taxonomicList = uniqTaxoList;
      }
    }
  }

  mainRepositoryChange(value): void { }

  updateTaxon(taxon: Taxo, data: RepositoryItemModel): void {
    taxon.validation.repository = data.repository;
    taxon.validation.repositoryIdNomen = Number(data.idNomen);
    taxon.validation.repositoryIdTaxo = data.idTaxo ? data.idTaxo.toString() : data.validOccurence ? data.validOccurence.idNomen.toString() : null;
    taxon.validation.updatedAt = new Date();
    taxon.validation.updatedBy = this.currentUser.id;
    taxon.validation.validName = data.name + (data.author ? ' ' + data.author : '');
    taxon.validation.validatedName = taxon.validation.validName;
    taxon.id = (data.idNomen ? data.idNomen.toString() : 'nc') + '~' + taxon.layer + taxon.validation.validatedName;
    taxon.rim = Object.assign(data);
    this.checkNamesStatus();
  }

  setTaxonomicList(): void {
    this.prepareTaxonomicList();
    this.removeDuplicatesInTaxonomicList();
    const now = new Date();
    const rowNb = this.rawContent.length;
    let countRow = 0;
    this.isLoadingTaxonomicList = true;
    console.log('...', this.rawContent);
    for (const t of this.rawContent) {
      const id = t[this.REPO_COL_POS.position].toString() + '~' + t[this.NOMEN_COL_POS.position].toString() + '~' + t[this.LAYER_COL_POS.position].toString() + '~' + t[this.HEADERS_LABELS_COL_POS.position].toString();
      const currentContent = _.find(this.taxonomicList, tl => tl.id === id);

      const inputRepo = t[this.REPO_COL_POS.position];
      const availableRepositories: Array<RepositoryModel> = this.tsbRepositoryService.listAllRepositories();
      let useRepo = 'otherunknown';
      if (_.find(availableRepositories, ar => ar.id === inputRepo) !== undefined) {
        useRepo = inputRepo;
      } else {
        useRepo = 'otherunknown';
      }

      if (this.isEmptyValue(t[this.NOMEN_COL_POS.position]) && this.isEmptyValue(t[this.LAYER_COL_POS.position])) {
        // Group row
        // do nothing
        countRow++;
        this.isLoadingTaxonomicList = (countRow === rowNb) ? false : true;
      } else if (currentContent !== undefined && Number(t[this.NOMEN_COL_POS.position]) && useRepo !== null && useRepo !== 'otherunknown') {
        // row with nomenclatural data
        this.stepNames.next({currentStatus: 'pending', started: true, message: 'Recherche des informations en cours...', tip: 'Merci de patienter'});

        if (_.find(availableRepositories, ar => ar.id === inputRepo) !== undefined) {
          useRepo = inputRepo;
        } else {
          useRepo = 'otherunknown';
        }
        this.tsbRepositoryService.findDataByIdNomen(useRepo, Number(t[this.NOMEN_COL_POS.position])).pipe(
          map (r => r[0] as RepositoryItemModel) // Ensure type
        ).subscribe(
          result => {
            if (result === undefined || (result !== undefined && result.idTaxo == null)) { // @Todo : duplicate code (see error catching below)
              const randomInteger = _.random(-1, -1000000, false);
              currentContent.validation = {
                validatedBy: this.currentUser.id,
                validatedAt: now,
                user: this.currentVlUser,
                repository: 'otherunknown',
                repositoryIdNomen: randomInteger,
                repositoryIdTaxo: randomInteger.toString(),
                inputName: t[this.HEADERS_LABELS_COL_POS.position],
                validatedName: null,
                validName: null
              };
              currentContent.rim = {
                repository: 'otherunknown',
                idNomen: randomInteger,
                idTaxo: randomInteger.toString(),
                name: t[this.HEADERS_LABELS_COL_POS.position],
                author: ''
              };
            } else {
              currentContent.validation = {
                validatedBy: this.currentUser.id,
                validatedAt: now,
                user: this.currentVlUser,
                repository: useRepo,
                repositoryIdNomen: Number(t[this.NOMEN_COL_POS.position]),
                repositoryIdTaxo: result.idTaxo.toString(),
                inputName: t[this.HEADERS_LABELS_COL_POS.position],
                validatedName: result.name + (result.author !== '' ? ' ' + result.author : ''),
                validName: result.name + (result.author !== '' ? ' ' + result.author : '')
              };
              currentContent.rim = {
                repository: useRepo,
                idNomen: Number(t[this.NOMEN_COL_POS.position]),
                idTaxo: result.idTaxo,
                name: result.name,
                author: result.author
              };
            }

            countRow++;
            // this.isLoadingTaxonomicList = (countRow === rowNb) ? false : true;
            if (countRow === rowNb) {
              this.isLoadingTaxonomicList = false;
              const _stepName = this.stepNames.getValue();
              this.stepNames.next({currentStatus: 'complete', started: _stepName.started, message: _stepName.message, tip: _stepName.tip});
              this.checkNamesStatus();
            } else { this.isLoadingTaxonomicList = true; }
          },
          error => {
            const randomInteger = _.random(-1, -1000000, false);
            currentContent.validation = {
              validatedBy: this.currentUser.id,
              validatedAt: now,
              user: this.currentVlUser,
              repository: 'otherunknown',
              repositoryIdNomen: randomInteger,
              repositoryIdTaxo: randomInteger.toString(),
              inputName: t[this.HEADERS_LABELS_COL_POS.position],
              validatedName: null,
              validName: null
            };
            currentContent.rim = {
              repository: 'otherunknown',
              idNomen: randomInteger,
              idTaxo: randomInteger.toString(),
              name: t[this.HEADERS_LABELS_COL_POS.position],
              author: ''
            };
            countRow++;
            // this.isLoadingTaxonomicList = (countRow === rowNb) ? false : true;
            if (countRow === rowNb) {
              this.isLoadingTaxonomicList = false;
              const _stepNames = this.stepNames.getValue();
              this.stepNames.next({currentStatus: 'error', started: _stepNames.started, message: 'Impossible de récupérer tous les noms', tip: 'Le serveur ne répond pas'});
              this.checkNamesStatus();
            } else { this.isLoadingTaxonomicList = true; }
          }
        );
      } else if (currentContent !== undefined) {
        // row with other/unknown data
        const randomInteger = _.random(-1, -1000000, false);
        currentContent.validation = {
          validatedBy: this.currentUser.id,
          validatedAt: now,
          user: this.currentVlUser,
          repository: 'otherunknown',
          repositoryIdNomen: randomInteger,
          repositoryIdTaxo: randomInteger.toString(),
          inputName: t[this.HEADERS_LABELS_COL_POS.position],
          validatedName: null,
          validName: null
        };
        currentContent.rim = {
          repository: 'otherunknown',
          idNomen: randomInteger,
          idTaxo: randomInteger.toString(),
          name: t[this.HEADERS_LABELS_COL_POS.position],
          author: ''
        };
        countRow++;
        // this.isLoadingTaxonomicList = (countRow === rowNb) ? false : true;
        if (countRow === rowNb) {
          this.isLoadingTaxonomicList = false;
          const _stepNames = this.stepNames.getValue();
          this.stepNames.next({currentStatus: 'complete', started: _stepNames.started, message: _stepNames.message, tip: _stepNames.tip});
          this.checkNamesStatus();
        } else { this.isLoadingTaxonomicList = true; }
      } else {
        countRow++;
        if (countRow === rowNb) {
          this.isLoadingTaxonomicList = false;
          const _stepNames = this.stepNames.getValue();
          this.stepNames.next({currentStatus: 'complete', started: _stepNames.started, message: _stepNames.message, tip: _stepNames.tip});
          this.checkNamesStatus();
        }
      }
    }
  }

  checkNamesStatus(): void {
    let countUnknonwnRepositoryItems = 0;
    for (const item of this.taxonomicList) {
      if (!item.rim || item.rim.repository === 'otherunknown') { countUnknonwnRepositoryItems++; }
    }
    const _stepNames = this.stepNames.getValue();
    if (countUnknonwnRepositoryItems > 0) {
      // At less 1 item with 'other/unknown' repository
      this.stepNames.next({currentStatus: 'warning', started: _stepNames.started, message: 'Certains noms ne sont pas liés à un référentiel', tip: 'Essayez de lier le plus de noms possible à un référentiel dans votre fichier d\'origine. Continuez si certains noms ne sont pas disponibles dans les référentiels'});
    } else {
      // Every item has a repository
      this.stepNames.next({currentStatus: 'complete', started: _stepNames.started, message: 'Parfait !', tip: 'Vous pouvez passer à l\'étape suivante'});
    }
  }

  getTaxoName(taxo: Taxo): string {
    if (taxo.validation && taxo.validation.validName) {
      return taxo.validation.validName;
    } else if (taxo.validation && taxo.validation.inputName) {
      return taxo.validation.inputName;
    } else {
      return '?';
    }
  }

  // ******
  // AUTHOR
  // ******
  prepareAuthorList(): void {
    const authors: Array<string> = [];
    let uniqAuthors: Array<string>;
    if (this.rawHeaders.length > 0) {
      for (let k = 0; k < this.rawHeaders[this.AUTHOR_ROW_POS.groupPosition].length - this.ignoreFirstXCols; k++) {
        authors.push(...this.rawHeaders[this.AUTHOR_ROW_POS.groupPosition][this.ignoreFirstXCols + k].split(this.authorsSeparator));
      }
      uniqAuthors = _.uniq(authors);
      for (const ua of uniqAuthors) {
        this.authorList.push({authorUserInput: ua, authorSelected: null});
      }
    }
  }

  authorInputChange(author: {authorUserInput: string, noResult?: boolean, noResultFor?: string, isAddingObserver?: boolean, authorSelected?: Observer}): void {
    this.expandedElement = null;
    author.authorSelected = null;
    author.noResult = false;
    author.noResultFor = null;
  }

  setAuthorDateList() {
    const _stepAuthorsDates = this.stepAuthorsDates.getValue();
    this.stepAuthorsDates.next({currentStatus: 'pending', started: true, message: 'Recherche des informations en cours', tip: 'Merci de patienter...'});
    // this.stepAuthorsDates.next({currentStatus: 'complete', started: true, message: _stepAuthorsDates.message, tip: _stepAuthorsDates.tip});

    this.prepareAuthorList();
    this.setDateList();
    this.authorList = _.clone(this.authorList);

    this.checkAuthorDateStatus();
  }

  isAuthorComplete(value: {authorUserInput: string, noResult?: boolean, noResultFor?: string, isAddingObserver?: boolean, authorSelected?: Observer}): boolean {
    return value.authorSelected ? true : false;
  }

  setSelectedAuthor(author: {authorUserInput: string, noResult?: boolean, noResultFor?: string, isAddingObserver?: boolean, authorSelected?: Observer}, observer: Observer): void {
    if (author && observer) {
      author.authorSelected = observer;
      this.expandedElement = null;
      this.checkAuthorDateStatus();
    }
  }

  noResultForAuthorStr(author: {authorUserInput: string, noResult?: boolean, noResultFor?: string, isAddingObserver?: boolean, authorSelected?: Observer}, str: string): void {
    author.noResult = true;
    author.noResultFor = str;
    if (this.forcePostObserver === true) {
      this.stepAuthorsDates.next({currentStatus: 'pending', started: true, message: 'Enregistrement d\'un nouvel observateur en cours', tip: 'Merci de patineter...'});

      // Force observer Creation
      this.observerService.createObserver(str).subscribe(
        result => {
          author.isAddingObserver = false;
          author.noResult = false;
          author.noResultFor = null;
          this.expandedElement = null;
          author.authorSelected = result;
          this.checkAuthorDateStatus();
        }, error => {
          author.isAddingObserver = false;
          this.notificationService.error(`Nous ne parvenons pas à ajouter le nouvel observateur ${str}.`);
        }
      );
    }
    this.checkAuthorDateStatus();
  }

  createAndLinkObserver(author: {authorUserInput: string, noResult?: boolean, noResultFor?: string, isAddingObserver?: boolean, authorSelected?: Observer}, newObserver: string): void {
    author.isAddingObserver = true;
    this.observerService.createObserver(newObserver).subscribe(
      result => {
        author.isAddingObserver = false;
        author.noResult = false;
        author.noResultFor = null;
        this.expandedElement = null;
        author.authorSelected = result;
      }, error => {
        author.isAddingObserver = false;
        this.notificationService.error(`Nous ne parvenons pas à ajouter le nouvel observateur ${newObserver}.`);
      }
    );
  }

  checkAuthorDateStatus() {
    let globalStatus = '';
    for (const author of this.authorList) {
      if (author.authorSelected == null) {
        globalStatus = 'warning';
      }
    }
    for (const date of this.dateList) {
      if (date.dateConsolided == null) {
        globalStatus = 'warning';
      }
    }
    const _stepAuthorsDates = this.stepAuthorsDates.getValue();
    if (globalStatus === 'warning') {
      this.stepAuthorsDates.next({currentStatus: 'warning', started: _stepAuthorsDates.started, message: 'Certain(e)s auteurs ou dates ne sont pas valides', tip: 'Essayez de valider tous les auteurs et toutes les dates. Vous pouvez continuer avec des données manquantes'});
    } else {
      this.stepAuthorsDates.next({currentStatus: 'complete', started: _stepAuthorsDates.started, message: 'Parfait !', tip: 'Vous pouvez passer à l\'étape suivante'});
    }
  }

  // ****
  // DATE
  // ****
  prepareDateList(): void {
    const dates: Array<string> = [];
    let uniqDates: Array<string>;
    if (this.rawHeaders.length > 0) {
      for (let k = 0; k < this.rawHeaders[this.DATE_ROW_POS.groupPosition].length - this.ignoreFirstXCols; k++) {
        dates.push(this.rawHeaders[this.DATE_ROW_POS.groupPosition][this.ignoreFirstXCols + k]);
      }
      uniqDates = _.uniq(dates);
      for (const ud of uniqDates) {
        this.dateList.push({dateUserInput: ud, dateConsolided: null, dateConsolidedUtc: null, precision: null});
      }
    }
  }

  setDateList(): void {
    this.prepareDateList();
    this.dateList = _.clone(this.dateList);
    for (const date of this.dateList) {
      const consolidedDate = this.consolidDate(date.dateUserInput);
      date.dateConsolided = consolidedDate.consolidedDate;
      date.dateConsolidedUtc = consolidedDate.consolidedDateUtc;
      date.precision = consolidedDate.precision;
    }
  }


  /**
   * Check the date format and returns consolided values
   *
   * @param date as 'DD/MM/YYYY' format (ie '01/05/2019'). Day or month can be ignored by providing '00' (ie '00/05/2019' for may 2019)
   * @returns consolidedDate    as a Date in user local timezone              (ie: Mon Jan 01 2007 00:00:00 GMT+0100)
   * @returns consolidedDateUtc as a Date in user local timezone + UTC offset (ie: Mon Jan 01 2007 01:00:00 GMT+0100)
   * @returns precision because we're forced to provide a valide Date, day and month have to be set
   * @note about precision : we must provide valid dates (ie js Date object) because dates are persisted into db as datetime
   *                         but user's may want to give an approximate date (especially for older relevés), providing only a month/year or a year value
   *                         ie 00/05/1959 for may 1959 or 00/00/1959 for year 1959
   *                         so the missing part of the date '00' is replaced by '01' and we use the precision attribute to keep the information
   * @note about consolidedDateUtc : mySQL would not keep the timezone information and would use an UTC date
   *                                 so the provided date can be different than the persisted one
   *                                 that's why we manually minor the date with the user UTC offset
   */
  consolidDate(date: string): { consolidedDate: Date, consolidedDateUtc: Date, precision: 'day' | 'month' | 'year' } {
    let newDate: Date;
    let utcNewDate: Date;
    let precision: 'day' | 'month' | 'year';
    let splitedDate: Array<string>;
    let day: string;
    let month: string;
    let year: string;
    let dayIsSet = false;
    let monthIsSet = false;
    let yearIsSet = false;

    splitedDate = date.split('/');

    if (splitedDate.length !== 3) {
      return null;
    } else {
      day = splitedDate[0];
      month = splitedDate[1];
      year = splitedDate[2];

      if (day !== '00' && day !== '0') { dayIsSet = true; }
      if (month !== '00' && month !== '0') { monthIsSet = true; }
      if (year !== '00' && year !== '0') { yearIsSet = true; }

      if (dayIsSet && monthIsSet && yearIsSet) {
        precision = 'day';
      } else if (!dayIsSet && monthIsSet && yearIsSet) {
        precision = 'month';
        day = '01';
      } else if (!dayIsSet && !monthIsSet && yearIsSet) {
        precision = 'year';
        day = '01';
        month = '01';
      } else { return null; }

      try {
        const mergedDate = day + '/' + month + '/' + year + ' 12:00:00';  // start at 12

        newDate = new Date(moment(mergedDate, 'DD/MM/YYYY HH:mm:ss').utc().format('YYYY-MM-DD HH:mm:ssZ'));    // set date in user's timezone

        const userTimzone = moment.tz.guess();                                      // get user timezone
        const utcOffset = moment.tz.zone(userTimzone).utcOffset(newDate.getTime()); // get utc offset (ie -60 or -120 for GMT+0100 or GMT+0200)

        utcNewDate = new Date(moment(newDate).add(-utcOffset, 'minutes').utc().format('YYYY-MM-DD HH:mm:ssZ'));       // minor utc offset

        if (moment.isDate(newDate) && moment.isDate(utcNewDate)) { return {consolidedDate: newDate, consolidedDateUtc: utcNewDate, precision}; } else { return null; }
      } catch (error) {
        return null;
      }
    }
  }

  isDateComplete(date: {dateUserInput: string, dateConsolided?: Date, dateConsolidedUtc?: Date, precision?: 'day' | 'month' | 'year'}): boolean {
    if (date && date.dateConsolided && date.dateConsolidedUtc && date.precision && moment(date.dateConsolided).isValid()) { return true; } else { return false; }
  }

  // ******
  // Biblio
  // ******
  prepareBiblioList(): void {
    const biblios: Array<string> = [];
    let uniqBiblios: Array<string>;
    if (this.rawBiblio.length > 0) {
      for (let k = 0; k < this.rawBiblio[this.BIBLIO_ROW_POS.groupPosition].length - this.ignoreFirstXCols; k++) {
        biblios.push(this.rawBiblio[this.BIBLIO_ROW_POS.groupPosition][this.ignoreFirstXCols + k]);
      }
      uniqBiblios = _.uniq(biblios);
      for (const ub of uniqBiblios) {
        this.biblioList.push({biblioUserInput: ub, biblioSelected: null});
      }
    }
  }

  biblioInputChange(biblio: {biblioUserInput: string, noResult?: boolean, noResultFor?: string, isAddingBiblio?: boolean, biblioSelected?: Biblio}): void {
    this.expandedBiblioElement = null;
    biblio.biblioSelected = null;
    biblio.noResult = false;
    biblio.noResultFor = null;
  }

  setBiblioList() {
    this.prepareBiblioList();
    this.biblioList = _.clone(this.biblioList);
  }

  isBiblioComplete(biblio: {biblioUserInput: string, noResult?: boolean, noResultFor?: string, isAddingBiblio?: boolean, biblioSelected?: Biblio}): boolean {
    return biblio.biblioSelected ? true : false;
  }

  setSelectedBiblio(value: {biblioUserInput: string, noResult?: boolean, noResultFor?: string, isAddingBiblio?: boolean, biblioSelected?: Biblio}, biblio: Biblio): void {
    if (value && biblio) {
      value.biblioSelected = biblio;
      this.expandedBiblioElement = null;
      this.checkBiblioStatus();
    }
  }

  noResultForBiblioStr(biblio: {biblioUserInput: string, noResult?: boolean, noResultFor?: string, isAddingBiblio?: boolean, biblioSelected?: Biblio}, str: string): void {
    biblio.noResult = true;
    biblio.noResultFor = str;

    if (this.forcePostBiblio === true) {
      this.stepBiblio.next({currentStatus: 'pending', started: true, message: 'Enregistrement d\'une nouvelle référence bibliographique en cours', tip: 'Merci de patineter...'});

      // Create a new Biblio
      biblio.isAddingBiblio = true;
      this.biblioService.createBiblio(str).subscribe(
        result => {
          biblio.isAddingBiblio = false;
          biblio.noResult = false;
          biblio.noResultFor = null;
          this.expandedBiblioElement = null;
          biblio.biblioSelected = result;
          this.stepBiblio.next({currentStatus: 'complete', started: true, message: 'Parfait !', tip: 'Vous pouvez passer à l\'étape suivante'});
          this.checkBiblioStatus();
        }, error => {
          biblio.isAddingBiblio = false;
          this.stepBiblio.next({currentStatus: 'error', started: true, message: 'Erreur !', tip: 'Nous ne parvenons pas à ajouter la nouvelle référence bibliographique'});
          this.notificationService.error(`Nous ne parvenons pas à ajouter la nouvelle référence bibliographique ${str}.`);
        }
      );
    }

    this.checkBiblioStatus();
  }

  createAndLinkBiblio(biblio: {biblioUserInput: string, noResult?: boolean, noResultFor?: string, isAddingBiblio?: boolean, biblioSelected?: Biblio}, newBiblio: string): void {
    biblio.isAddingBiblio = true;
    this.biblioService.createBiblio(newBiblio).subscribe(
      result => {
        biblio.isAddingBiblio = false;
        biblio.noResult = false;
        biblio.noResultFor = null;
        this.expandedBiblioElement = null;
        this.stepBiblio.next({currentStatus: 'complete', started: true, message: 'Parfait !', tip: 'Vous pouvez passer à l\'étape suivante'});
        biblio.biblioSelected = result;
      }, error => {
        biblio.isAddingBiblio = false;
        this.stepBiblio.next({currentStatus: 'error', started: true, message: 'Erreur !', tip: 'Nous ne parvenons pas à ajouter la nouvelle référence bibliographique'});
        this.notificationService.error(`Nous ne parvenons pas à ajouter la nouvelle référence bibliographique ${newBiblio}.`);
      }
    );
  }

  checkBiblioStatus() {
    const _stepBiblio = this.stepBiblio.getValue();
    this.stepBiblio.next({currentStatus: _stepBiblio.currentStatus, started: true, message: _stepBiblio.message, tip: _stepBiblio.tip});
    let globalStatus = '';
    for (const biblio of this.biblioList) {
      if (biblio.biblioSelected == null) {
        globalStatus = 'warning';
      }
    }
    if (globalStatus === 'warning') {
      this.stepBiblio.next({currentStatus: 'warning', started: true, message: 'Certaines données biblio. ne sont pas valides', tip: 'Essayez de valider toutes les références. Vous pouvez continuer avec des références manquantes'});
    } else {
      this.stepBiblio.next({currentStatus: 'complete', started: true, message: 'Parfait !', tip: 'Vous pouvez passer à l\'étape suivante'});
    }
  }

  // ********
  // LOCATION
  // ********

  /**
   * Set currentLocation provided by tb-geoloc-lib module
   * @param location is an output of tb-geoloc-lib module
   */
  setCurrentLocation(location: TbLocationModel): void {
    this.currentLocation = location;
  }

  prepareLocationList(): void {
    if (this.rawHeaders.length > 0 && this.rawLocation.length > 0) {
      for (let k = 0; k < this.rawHeaders[1].length - this.ignoreFirstXCols; k++) {
        this.locationList.push({id: this.rawHeaders[1][this.ignoreFirstXCols + k].toString(), latitude: null, longitude: null, isLatLngInitialSetByUser: false, country: null, departement: null, city: null, place: null, isLoading: false, vlAccuracy: null, suggeredLocations: [], selectedLocation: null, location: null});
      }
    }
  }

  setLocationList(): void {
    this.prepareLocationList();
    this.locationList = _.cloneDeep(this.locationList);
    if (this.locationList.length > 0) {
      for (const row of this.rawLocation) {
        for (let m = 0; m < this.locationList.length; m++) {
          if (row[this.ignoreFirstXCols - 1].toLowerCase() === 'latitude')     { this.locationList[m].latitude = row[this.ignoreFirstXCols + m] && row[this.ignoreFirstXCols + m] !== null ? row[this.ignoreFirstXCols + m] : null; }
          if (row[this.ignoreFirstXCols - 1].toLowerCase() === 'longitude')    { this.locationList[m].longitude = row[this.ignoreFirstXCols + m] && row[this.ignoreFirstXCols + m] !== null ? row[this.ignoreFirstXCols + m] : null; }
          if (this.locationList[m].latitude && this.locationList[m].longitude) { this.locationList[m].isLatLngInitialSetByUser = true; }
          if (row[this.ignoreFirstXCols - 1].toLowerCase() === 'altitude')     { this.locationList[m].elevation = row[this.ignoreFirstXCols + m] && row[this.ignoreFirstXCols + m] !== null && !isNaN(+row[this.ignoreFirstXCols + m]) ? +row[this.ignoreFirstXCols + m] : null; }
          if (this.locationList[m].elevation) { this.locationList[m].isElevationEstimated = false; }
          if (row[this.ignoreFirstXCols - 1].toLowerCase() === 'pays')         { this.locationList[m].country = row[this.ignoreFirstXCols + m] && row[this.ignoreFirstXCols + m] !== null ? row[this.ignoreFirstXCols + m] : null; }
          if (row[this.ignoreFirstXCols - 1].toLowerCase() === 'departement'
           || row[this.ignoreFirstXCols - 1].toLowerCase() === 'département')  { this.locationList[m].departement = row[this.ignoreFirstXCols + m] && row[this.ignoreFirstXCols + m] !== null ? row[this.ignoreFirstXCols + m] : null; }
          if (row[this.ignoreFirstXCols - 1].toLowerCase() === 'commune')      { this.locationList[m].city = row[this.ignoreFirstXCols + m] && row[this.ignoreFirstXCols + m] !== null ? row[this.ignoreFirstXCols + m] : null; }
          if (row[this.ignoreFirstXCols - 1].toLowerCase() === 'lieu')         { this.locationList[m].place = row[this.ignoreFirstXCols + m] && row[this.ignoreFirstXCols + m] !== null ? row[this.ignoreFirstXCols + m] : null; }
        }
      }
    }
    this.searchPlaces();
  }

  renewElevation(location: Location): void {
    let lat: number;
    let lon: number;
    if (location.latitude && location.longitude) {
      lat = Number(location.latitude);
      lon = Number(location.longitude);
    } else if (location.tbLocation && location.tbLocation.centroid) {
      lat = Number(location.tbLocation.centroid.geometry[1]);
      lon = Number(location.tbLocation.centroid.geometry[0]);
    } else if (location.selectedLocation) {
      // Get centroid
      const centroid = this.locationService.getCentroid(location.selectedLocation.nominatimLocation.geojson);
      if (centroid) {
        lat = centroid.geometry[1];
        lon = centroid.geometry[0];
      }
    } else {
      this.notificationService.notify('Nous ne pouvons pas estimer l\'altitude. Essayez d\'abord de localiser l\'observation si ce n\'est pas déjà fait.');
    }

    if (lat && lon) {
      this.elevationService.getElevation(lat, lon, 'mapQuest').subscribe(
        result => {
          location.elevation = result;
          location.isElevationEstimated = true;
        }, error => {
          this.notificationService.error('Le serveur fournissant l\'altitude n\'a pas répondu à la requête');
        }
      );
    }
  }

  typeSafeLocationData() {
    // latitude and longitude as decimal number
    // @Todo
  }

  searchPlaces(): void {

    this.stepPlaces.next({currentStatus: 'pending', started: true, message: 'Recherche des informations géographiques', tip: 'Merci de patienter...'});

    if (this.locationList.length > 0) {
      for (const location of this.locationList) {
        // GET location by lat/long coord (reverse geocoding)
        // and elevation (if needed)
        // and INSEE DATA
        if (location.latitude && location.longitude) {
          location.isLoading = true;
          this.locationService.reverseUsingMapQuest(environment.mapQuestApiKey, Number(location.latitude), Number(location.longitude)).pipe(
            flatMap(result => {
              const readableAddress = this.geocodingService.getReadbleAddress(result, 'osm');
              location.suggeredLocations.push({nominatimLocation: result, readableAddress});
              location.selectedLocation = {nominatimLocation: result, readableAddress};
              location.vlAccuracy = VlAccuracyEnum.PRECISE;
              location.country = result.address.country;
              location.city = this.locationService.getCityFromNominatimObject(result);
              location.departement = result.address.postcode.slice(0, 2);
              return of(location);
            // tslint:disable-next-line:no-shadowed-variable
            }), flatMap(location => {
              // get elevation if needed (no elevation or already set by user)
              if (!location.elevation || (location.elevation && location.isElevationEstimated !== false)) {
                return this.elevationService.getElevation(Number(location.latitude), Number(location.longitude), 'mapQuest');
              } else {
                return of(null);
              }
              // return elevation or null;
            // tslint:disable-next-line:no-shadowed-variable
            }), flatMap(elevation => {
              if (elevation) {
                location.elevation = elevation;
                location.isElevationEstimated = true;
              }
              return of(location);
            // tslint:disable-next-line:no-shadowed-variable
            }), flatMap(location => {
              return this.geocodingService.getInseeData(Number(location.latitude), Number(location.longitude));
            })).subscribe(
              inseeData => {
                location.isLoading = false;
                location.inseeData = inseeData;
                this.checkLocationStatus();
              }, error => {
                location.isLoading = false;
                console.log(error);
              });
        // Get location by geocoding
        // and elevation
        // we don't GET INSEE data and elevation because there is several locations (see suggered locations)
        // INSEE data and elevation (if needed) will be filled when user will select a place
        } else {
          location.isLoading = true;
          const country = location.country ? location.country : undefined;
          const county = location.departement ? location.departement : undefined;
          const city = location.city ? location.city : undefined;
          const place = location.place ? location.place : undefined;
          const limit = 1;
          this.locationService.geocodeSpecificUsingMapQuest('ApIFfQWsb8jW6bkYDD2i0Sq5BD9moJ3l', country, county, city, place, limit).subscribe(
            results => {
              location.isLoading = false;
              if (results && results.length === 1) {
                // Only one result : set location
                this.setNominatimLocationAsOccurrenceLocation(location, results[0], this.geocodingService.getReadbleAddress(results[0], 'osm'));
              } else if (results && results.length > 1) {
                for (const result of results) {
                  const readableAddress = this.geocodingService.getReadbleAddress(result, 'osm');
                  location.suggeredLocations.push({nominatimLocation: result, readableAddress});
                }
              }
            }, error => {
              // @Todo manage error
              console.log(error);
              location.isLoading = false;
            }
          );
        }
      }
    }
  }

  showLocationOnMap(location: Location): void {
    if (location) {
      if (location.latitude && location.longitude) {
        this.patchMapLngLatDec = [Number(location.longitude), Number(location.latitude)];
        this.patchMapGeometry = [
          {
            type: 'Point',
            coordinates: [Number(location.longitude), Number(location.latitude)]
          }
        ];
      } else if (location.selectedLocation) {
        this.patchMapGeometry = [{
          type: location.selectedLocation.nominatimLocation.geojson.type,
          coordinates: location.selectedLocation.nominatimLocation.geojson.type === 'Polygon' ? location.selectedLocation.nominatimLocation.geojson.coordinates[0] : location.selectedLocation.nominatimLocation.geojson.type === 'MultiLineString' ? location.selectedLocation.nominatimLocation.geojson.coordinates[0] : location.selectedLocation.nominatimLocation.geojson.coordinates
        }];
      }
    }
  }

  showTbLocationOnMap(location: Location): void {
    if (location) {
      // @Note be careful, location.tbLocation.geometry as type 'any'
      if (location.tbLocation.geometry['type'] === 'Polygon') {
        this.patchMapGeometry = [{
          type: location.tbLocation.geometry['type'],
          coordinates: location.tbLocation.geometry['coordinates'][0]
        }];
      } else {
        this.patchMapGeometry = [{
          type: location.tbLocation.geometry['type'],
          coordinates: location.tbLocation.geometry['coordinates']
        }];
      }
    }
  }

  /**
   * When user's mouse if hover an option (location option), preview the location
   */
  previewLocationOnMap(nominatimLocation: NominatimObject): void {
    this.patchMapGeometry = [{
      type: nominatimLocation.geojson.type,
      coordinates: nominatimLocation.geojson.type === 'Polygon' ? nominatimLocation.geojson.coordinates[0] : nominatimLocation.geojson.type === 'MultiLineString' ? nominatimLocation.geojson.coordinates[0] : nominatimLocation.geojson.coordinates
    }];
  }

  /**
   * When user select a location whitin the locations list preview
   * @param location as a Location object
   * @param data as a NominatimObject with several informations added
   */
  localitySelectionChange(location: Location, data: {source: any, value: {nominatimLocation: NominatimObject, readableAddress: string}}): void {
    this.setNominatimLocationAsOccurrenceLocation(location, data.value.nominatimLocation, data.value.readableAddress);
  }

  private setNominatimLocationAsOccurrenceLocation(locationToBind: Location, nominatimLocation: NominatimObject, readableAddress: string) {
    locationToBind.selectedLocation = {nominatimLocation, readableAddress};

    // Get centroid
    const centroid = this.locationService.getCentroid(nominatimLocation.geojson);

    // Get INSEE data and elevation
    this.geocodingService.getInseeData(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]).pipe(
      flatMap(inseeData => {
        locationToBind.inseeData = inseeData;
        // get elevation if needed (no elevation or already set by user)
        if (!locationToBind.elevation || (locationToBind.elevation && locationToBind.isElevationEstimated !== false)) {
          return this.elevationService.getElevation(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0], 'mapQuest');
        } else {
          return of(null);
        }
      })
    ).subscribe(
      elevation => {
        if (elevation) {
          locationToBind.elevation = elevation;
          locationToBind.isElevationEstimated = true;
        }
      }, error => {
        /* @Todo manage error */
      }
    );

    // Get vl_accuracy
    const vlAccuracy = this.locationService.getAccuracyByNominatimObject(nominatimLocation);
    locationToBind.vlAccuracy = vlAccuracy;

    // Simplify polygon
    // Note if Accuracy is DEPARTEMENT, REGION OR COUNRTY, we use the bounding box
    // Using (turf) simplification for large and complex polygons could lead to a self-intersection
    //    and although a polygon with self-intersection is a valid geoJson, ElasticSearch will fail parsing it
    //    (see https://discuss.elastic.co/t/6-4-to-6-7-1-multipolygon-cannot-be-indexed-anymore-using-new-geo-shape-field/177480/2)
    //
    // @Todo improve geometry management
    if (vlAccuracy === VlAccuracyEnum.DEPARTEMENT || vlAccuracy === VlAccuracyEnum.REGION || vlAccuracy === VlAccuracyEnum.COUNTRY) {
      locationToBind.selectedLocation.nominatimLocation.geojson = this.locationService.bboxToPolygon(locationToBind.selectedLocation.nominatimLocation.boundingbox);
    } else {
      locationToBind.selectedLocation.nominatimLocation.geojson = this.locationService.simplifyPolygon(locationToBind.selectedLocation.nominatimLocation.geojson);
    }

    locationToBind.suggeredLocations = [];

    this.checkLocationStatus();
  }

  /**
   * When user click on the 'localize on map' button
   */
  localizeOnMap(location: Location): void {
    this.setManualLocalization(location);

    // @Todo duplicate code, see below
    // Set tb-geoloc-lib map address
    const address: string = (location.place ? location.place : '')
            + ' ' + (location.city ? location.city : '')
            + ' ' + (location.departement && !(location.place || location.city) ? location.departement : '')
            + ' ' + (location.country ? location.country : '');
    this.setMapAddress = address;

    // Set tb-geoloc-lib map input focus
    this.setMapInputFocus = true;
    setTimeout(() => { this.setMapInputFocus = true; }, 100);
  }

  /**
   * When user has located its relevé from map ('use map location' button clicked)
   */
  localizeFromMap(location: Location): void {
    location.manualLocalization = false;
    if (this.currentLocation && this.currentLocation.geometry['type'] === 'Polygon') {
      // simplify polygon
      this.currentLocation.geometry = this.locationService.simplifyPolygon(this.currentLocation.geometry);
      this.patchMapGeometry = [{
        type: this.currentLocation.geometry.type,
        coordinates: this.currentLocation.geometry.coordinates[0]
      }];
    }
    location.tbLocation = this.currentLocation;
    location.inseeData = this.currentLocation.inseeData ? this.currentLocation.inseeData : null;
    location.vlAccuracy = this.currentLocation.vlLocationAccuracy;
    if (location.tbLocation && location.tbLocation.elevation) {
      if (!location.elevation || (location.elevation && location.isElevationEstimated !== false)) { // we only set elevation value if no value or if a value exists but is an estimated one
        location.elevation = location.tbLocation.elevation;
        location.isElevationEstimated = true;
      }
    }
    this.currentLocation = null;

    this.checkLocationStatus();
  }

  setManualLocalization(location: Location): void {
    for (const l of this.locationList) {
      l.manualLocalization = l === location ? true : false;
    }
  }

  isLocationComplete(location: Location): boolean {
    if (location.tbLocation || location.selectedLocation && location.elevation !== null) {
      return true;
    } else {
      return false;
    }
  }

  checkLocationStatus(): void {
    let nbCompletedLocation = 0;
    for (const location of this.locationList) {
      if (this.isLocationComplete(location)) { nbCompletedLocation++; }
    }
    const _stepPlaces = this.stepPlaces.getValue();
    if (nbCompletedLocation === this.locationList.length) {
      this.stepPlaces.next({currentStatus: 'complete', started: _stepPlaces.started, message: 'Parfait !', tip: 'Vous pouvez passer à l\'étape suivante'});
    } else {
      this.stepPlaces.next({currentStatus: 'warning', started: _stepPlaces.started, message: 'Certains relevés ne sont pas localisés', tip: 'Essayez de localiser le plus de relevés possible. Continuez si certains relevés ne peuvent l\'être'});
    }
  }

  getLocationSource(element: Location): string {
    if (element == null) { return ''; }
    const lat = element.latitude;
    const lon = element.longitude;
    const country = element.country;
    const county = element.departement;
    const city = element.city;
    const place = element.place;

    if (lat !== null && lon !== null) {
      return 'Lat/lon';
    } else if (country !== null || county !== null || city !== null || place !== null) {
      return 'Adresse';
    } else {
      return '?';
    }
  }

  // ********
  // METADATA
  // ********

  prepareMetadataList(): void {
    if (this.rawHeaders.length > 0 && this.rawMetadata.length > 0) {
      for (let l = 0; l < this.rawHeaders[1].length - this.ignoreFirstXCols; l++) {
        this.metadataList.push({id: this.rawHeaders[1][this.ignoreFirstXCols + l].toString(), metadata: []});
      }
    }
  }

  setMetadataList() {
    this.stepMetadata.next({currentStatus: 'pending', started: true, message: 'Chargement des données en cours', tip: 'Merci de patienter...'});
    this.prepareMetadataList();
    if (this.metadataList.length > 0 && this.rawMetadata.length > 0) {
      console.log('RAW META', this.rawMetadata);
      for (let i = 0; i < this.rawMetadata.length; i++) {
        const rowMetadata = this.rawMetadata[i];
        for (let j = 0; j < this.metadataList.length; j++) {
          const metaValues: MetadataItem = {
            uid: _.random(10000, false),
            metadataName: null,
            metadataValue: null,
            restrictedToLayer: !this.isEmptyValue(rowMetadata[this.LAYER_COL_POS.position]) ? rowMetadata[this.LAYER_COL_POS.position] : null,
            metadataModel: null,
            checkedValue: { isValid: null, consolidedValue: null, errorMessage: null },
            isEditing: false};
          metaValues.metadataName = rowMetadata[this.HEADERS_LABELS_COL_POS.position];
          metaValues.metadataValue = rowMetadata[this.ignoreFirstXCols + j];
          metaValues.isEditing = false;
          if (metaValues.metadataValue !== null && metaValues.metadataValue !== '') { this.metadataList[j].metadata.push(metaValues); }
        }
      }
    }
    console.log('METADATA LIST');
    console.log(this.metadataList);
    this.checkMetadata();
    this.flatMetadataList = this.flattenMetadataList(this.metadataList);
    this.checkMetadataStatus();
  }

  checkMetadata() {
    // Bind metadata models (ie. extended fields models)
    for (const item of this.metadataList) {
      for (const metadata of item.metadata) {
        metadata.metadataModel = this.findMetadataByFieldId(metadata.metadataName);
      }
    }

    // check metadata types
    // @Todo

    // check values
    for (const item of this.metadataList) {
      for (const metadata of item.metadata) {
        if (metadata.metadataModel && metadata.metadataValue) {
          metadata.checkedValue = this.metadataService.checkMetadataValue(metadata.metadataModel, metadata.metadataValue);
        }
      }
    }
  }

  checkMetadataStatus(): void {
    let countUncheckedMetadata = 0;
    for (const item of this.metadataList) {
      for (const meta of item.metadata) {
        if (!meta.checkedValue.isValid) { countUncheckedMetadata++; }
      }
    }
    const _stepMetadata = this.stepMetadata.getValue();
    if (countUncheckedMetadata > 0) {
      this.stepMetadata.next({currentStatus: 'warning', started: _stepMetadata.started, message: 'Certaines métadonnées ne sont pas validées', tip: 'Complétez au mieux ces données. Les données incomplètes ne seront pas importées'});
    } else {
      this.stepMetadata.next({currentStatus: 'complete', started: _stepMetadata.started, message: 'Parfait !', tip: 'Vous pouvez passer à l\'étape suivante'});
    }
  }

  findMetadataByFieldId(fieldId: string): ExtendedFieldModel {
    const availableMetadata = this.metadataService.metadataList.getValue();
    const metadataModel = _.find(availableMetadata, m => m.fieldId.toLowerCase() === fieldId.toLowerCase());
    return metadataModel ? metadataModel : null;
  }

  flattenMetadataList(list: Array<MetadataList>): Array<MetadataItemWithId> {
    const response: Array<MetadataItemWithId> = [];

    for (const element of list) {

      for (const meta of element.metadata) {
        response.push({
          id: element.id,
          uid: meta.uid,
          metadataName: meta.metadataName,
          metadataValue: meta.metadataValue,
          checkedValue: meta.checkedValue,
          metadataModel: meta.metadataModel,
          restrictedToLayer: meta.restrictedToLayer ? meta.restrictedToLayer : null,
          isEditing: false
        });
      }
    }
    return response;
  }

  startEditingMetadata(metadata: MetadataItemWithId): void {
    metadata.isEditing = true;
  }

  stopEditingMetadata(metadata: MetadataItemWithId): void {
    metadata.isEditing = false;
  }

  newMetadataValue(metadata: MetadataItemWithId, newValue: string): void {
    // get original metadata
    const _metadata = this.getMetadataByUId(metadata.uid);
    _metadata.metadataValue = newValue;
    metadata.isEditing = false;
    // recheck all
    this.checkMetadata();
    this.flatMetadataList = this.flattenMetadataList(this.metadataList);
    this.checkMetadataStatus();
  }

  getMetadataByUId(uid: number): MetadataItem {
    let result: MetadataItem;
    for (const m of this.metadataList) {
      result = _.find(m.metadata, item => item.uid === uid);
    }
    return result;
  }

  // **********
  // VALIDATION
  // **********
  prepareValidationList(): void {
    const clonedRawHeaders = this.spliceStartingCols(_.cloneDeep(this.rawHeaders));
    const groupsLabels = _.uniq(clonedRawHeaders[this.GROUP_ROW_POS.groupPosition]); // ie. ["A", "B"]
    for (const gl of groupsLabels) {
      const sye = {id: gl, validation: null, isSynthetic: false, releves: []};
      this.validationList.table.sye.push(sye);
    }

    if (this.rawHeaders.length > 0 && this.rawValidation.length > 0) {
      for (let l = 0; l < this.rawHeaders[0].length - this.ignoreFirstXCols; l++) {
        const groupId = this.rawHeaders[0][l + this.ignoreFirstXCols].toString();
        const sye = _.find(this.validationList.table.sye, s => s.id === groupId);
        const isSyntheticColumn = Number(this.rawRelevesCount[0][l + this.ignoreFirstXCols]) > 1 ? true : false;
        sye.syntheticSye = isSyntheticColumn;

        sye.releves.push({
          id: this.rawHeaders[1][this.ignoreFirstXCols + l].toString(),
          validation: {nomen: this.rawValidation[1][l + this.ignoreFirstXCols], repository: this.rawValidation[0][l + this.ignoreFirstXCols], repositoryIsAvailable: false, consolidedValidation: null}
        });
      }
    }
    console.log('VALIDATION LIST:');
    console.log(this.validationList);
  }

  checkRepositoryValues(): void {
    const availableRepositories: Array<RepositoryModel> = this.tsbRepositoryService.listAllRepositories();
    // table repository check
    if (this.validationList.table.validation && this.validationList.table.validation.repository) {
      if (_.find(availableRepositories, ar => ar.id.toLowerCase() === this.validationList.table.validation.repository.toLowerCase())
         || _.find(availableRepositories, ar => ar.label.toLowerCase() === this.validationList.table.validation.repository.toLowerCase())) {
          this.validationList.table.validation.repositoryIsAvailable = true;
      } else {
        this.validationList.table.validation.repositoryIsAvailable = false;
      }
    }

    // sye repository check
    if (this.validationList.table.sye.length > 0) {
      this.validationList.table.sye.forEach(sye => {
        if (sye.validation) {
          if (_.find(availableRepositories, ar => ar.id.toLowerCase() === sye.validation.repository.toLowerCase())
            || _.find(availableRepositories, ar => ar.label.toLowerCase() === sye.validation.repository.toLowerCase())) {
            sye.validation.repositoryIsAvailable = true;
          } else {
            sye.validation.repositoryIsAvailable = false;
          }
        }

        // relevé repository check
        if (sye.releves.length > 0) {
          sye.releves.forEach(releve => {
            if (releve.validation) {
              if (_.find(availableRepositories, ar => ar.id.toLowerCase() === releve.validation.repository.toLocaleLowerCase())
                  || _.find(availableRepositories, ar => ar.label.toLowerCase() === releve.validation.repository.toLowerCase())) {
                    releve.validation.repositoryIsAvailable = true;
              } else {
                releve.validation.repositoryIsAvailable = false;
              }
            }
          });
        }
      });
    }
  }

  consolidRepositoryValues() {
    // First we get uniques repository / nomen values to avoid too much API calls
    const consolidedValues: Array<{ repository: string, nomen: string, consolidedValue?: RepositoryItemModel }> = [];
    if (this.validationList.table.validation && this.validationList.table.validation.repositoryIsAvailable) { consolidedValues.push({repository: this.validationList.table.validation.repository, nomen: this.validationList.table.validation.nomen}); }
    if (this.validationList.table.sye) {
      this.validationList.table.sye.forEach(sye => {
        if (sye.validation && sye.validation.repositoryIsAvailable) { consolidedValues.push({repository: sye.validation.repository, nomen: sye.validation.nomen}); }
        if (sye.releves) {
          sye.releves.forEach(releve => {
            if (releve.validation && releve.validation.repositoryIsAvailable) { consolidedValues.push({repository: releve.validation.repository, nomen: releve.validation.nomen}); }
          });
        }
      });
    }
    const uniqConsolidedValues = _.uniqBy(consolidedValues, rv => rv.repository + rv.nomen);

    // API call
    let i = 0;
    if (uniqConsolidedValues !== null && uniqConsolidedValues.length > 0) {
      for (const ucv of uniqConsolidedValues) {
        this.tsbRepositoryService.findDataByIdNomen(ucv.repository, ucv.nomen).subscribe(
          result => {
            i++;
            result[0].repository = ucv.repository; // @Todo fix TSB 'findDataByIdNomen' service : it's not returning 'repository' value all the time !!
            ucv.consolidedValue = result[0];
            if (i === uniqConsolidedValues.length) {
              this.applyConsolidation(uniqConsolidedValues);
              this.consolidSyeAndTableValidation();
              this.updateStepValidationStatus();
            }
          },
          error => console.log(error)
        );
      }
    } else {
      this.updateStepValidationStatus();
    }
  }

  private applyConsolidation(uniqConsolidedValue: Array<{ repository: string, nomen: string, consolidedValue?: RepositoryItemModel }>): void {
    const table = this.validationList.table;
    if (table.validation && table.validation.repositoryIsAvailable) {
      const consolidedTableValidation = _.find(uniqConsolidedValue, ucv => ucv.nomen === table.validation.nomen && ucv.repository === table.validation.repository);
      table.validation.consolidedValidation = consolidedTableValidation ? consolidedTableValidation.consolidedValue : null;
    }
    if (table.sye && table.sye.length > 0) {
      for (const sye of table.sye) {
        if (sye.validation) {
          const consolidedSyeValidation = _.find(uniqConsolidedValue, ucv => ucv.nomen === sye.validation.nomen && ucv.repository === sye.validation.repository);
          sye.validation.consolidedValidation = consolidedSyeValidation ? consolidedSyeValidation.consolidedValue : null;
        }

        if (sye.releves && sye.releves.length > 0) {
          for (const releve of sye.releves) {
            if (releve.validation) {
              const consolidedReleveValidation = _.find(uniqConsolidedValue, ucv => ucv.nomen === releve.validation.nomen && ucv.repository === releve.validation.repository);
              releve.validation.consolidedValidation = consolidedReleveValidation ? consolidedReleveValidation.consolidedValue : null;
            }
          }
        }
      }
    }
  }

  /**
   * Set table and syes `validation`and `consolidedValue` according to releves values
   * (within a sye, if all releves have got the same validation, then set this validation to the sye)
   * (whithin a table, if all syes have got the same validation, then set this validation to the table)
   */
  private consolidSyeAndTableValidation(): void {
    const table = this.validationList.table;
    for (const sye of table.sye) {
      if (this.checkRelevesValidationConsistency(sye.releves)) {
        sye.validation = sye.releves[0].validation;
      }
    }
    if (this.checkSyeValidationConsistency(table.sye)) {
      table.validation = table.sye[0].validation;
    }
  }

  getUniqConsolidedValidation(items: Array<{id: string, validation: ImportValidation}>): Array<RepositoryItemModel> {
    if (items && items.length > 0) {
      const consolidedValidations = [];
      for (const i of items) { if (i.validation && i.validation.consolidedValidation) { consolidedValidations.push(i.validation.consolidedValidation); } }
      return _.uniqBy(consolidedValidations, cv => (cv.idNomen ? cv.idNomen : cv.name) + cv.repository);
    } else {
      return null;
    }
  }

  countUnconsolidedValidation(items: Array<{id: string, validation: ImportValidation}>): number {
    let count = 0;
    for (const i of items) { if (!i.validation || !i.validation.consolidedValidation) { count++; }}
    return count;
  }

  setValidationList(): void {
    this.stepValidation.next({currentStatus: 'pending', started: true, message: 'Chargement des données', tip: 'Merci de patienter'});
    this.prepareValidationList();
    this.checkRepositoryValues();
    this.consolidRepositoryValues();  // asynchronous
  }

  updateStepValidationStatus(): void {
    // count unconsolided data
    let unconsolidedData = 0;
    if (!this.validationList.table.validation || !this.validationList.table.validation.consolidedValidation) { unconsolidedData++; }
    if (this.validationList.table.sye) {
      unconsolidedData += this.countUnconsolidedValidation(this.validationList.table.sye);
      for (const sye of this.validationList.table.sye) {
        if (sye.releves) {
          unconsolidedData += this.countUnconsolidedValidation(sye.releves);
        }
      }
    }

    const _stepValidation = this.stepValidation.getValue();
    if (unconsolidedData === 0) {
      this.stepValidation.next({currentStatus: 'complete', started: _stepValidation.started, message: 'Parfait !', tip: ''});
    } else {
      this.stepValidation.next({currentStatus: 'warning', started: _stepValidation.started, message: 'Certains éléments ne sont pas identifiés', tip: 'Complétez au mieux les identifications et essayant de nommer les végétations d\'après un référentiel. Cette étape n\'est pas obligatoire.'});
    }
  }

  /**
   * Return true if every `releve` have the same validation value
   */
  checkRelevesValidationConsistency(releves: Array<{id: string, validation: ImportValidation}>): boolean {
    if (!releves || releves.length === 0) { return false; }
    let previousValidation: ImportValidation = null;
    for (const releve of releves) {
      if (previousValidation && !_.isEqual(releve.validation, previousValidation)) {
        return false;
      }
      previousValidation = releve.validation;
    }
    return true;
  }

  /**
   * Return true if every `releve` have a consolided validation
   */
  checkRelevesHaveConsolidedValidation(releves: Array<{id: string, validation: ImportValidation}>): boolean {
    if (!releves || releves.length === 0) { return false; }
    for (const releve of releves) {
      if (!releve.validation || !releve.validation.consolidedValidation) {
        return false;
      }
    }
    return true;
  }

  /**
   * Return true if every `releve` have the same validation value
   */
  checkSyeValidationConsistency(syes: Array<{id: string, validation: ImportValidation}>): boolean {
    if (!syes || syes.length === 0) { return false; }
    let previousValidation: ImportValidation = null;
    for (const sye of syes) {
      if (previousValidation && !_.isEqual(sye.validation, previousValidation)) {
        return false;
      }
      previousValidation = sye.validation;
    }
    return true;
  }

  fakeConsolidation(releve: {id: string, validation?: ImportValidation}): RepositoryItemModel {
    const rim: RepositoryItemModel = {
      repository: 'otherunknow',
      idNomen: null,
      name: null !== releve.validation ? releve.validation.nomen : '',
      author: ''
    };
    return rim;
  }

  getReleveById(id: string): {id: string, validation: ImportValidation } {
    for (const sye of this.validationList.table.sye) {
      for (const releve of sye.releves) {
        if (releve.id === id) { return releve; }
      }
    }
    return null;
  }

  /**
   * Get sye by its id from this.validationList.table
   */
  getSyeById(id: string): {id: string, validation: ImportValidation} {
    if (this.validationList.table && this.validationList.table.sye) {
      for (const sye of this.validationList.table.sye) {
        if (sye.id === id) { return sye; }
      }
    }
    return null;
  }

  updateReleveConsolidedValidation(releve: {id: string, validation: ImportValidation}, newConsolidedValidation: RepositoryItemModel): void {
    if (newConsolidedValidation.repository !== 'otherunknown') {
      releve.validation.repositoryIsAvailable = true;
      releve.validation.repository = newConsolidedValidation.repository;
      releve.validation.nomen = newConsolidedValidation.idNomen.toString();
      releve.validation.consolidedValidation = _.cloneDeep(newConsolidedValidation);
    } else {
      releve.validation.repositoryIsAvailable = true; // set true because user choose a repo, even if it's 'otherunknonwn'
      releve.validation.repository = 'otherunknown';
      releve.validation.nomen = null;
      releve.validation.consolidedValidation = _.cloneDeep(newConsolidedValidation);
    }
    this.updateStepValidationStatus();
  }

  updateSyeConsolidedValidation(sye: {id: string, validation: ImportValidation}, newConsolidedValidation: RepositoryItemModel): void {
    const newValidation: ImportValidation = {
      nomen: newConsolidedValidation.idNomen ? newConsolidedValidation.idNomen.toString() : null,
      repository: newConsolidedValidation.repository,
      repositoryIsAvailable: true,
      consolidedValidation: _.cloneDeep(newConsolidedValidation)
    };
    sye.validation = newValidation;
    this.updateStepValidationStatus();
  }

  updateTableConsolidedValidation(newConsolidedValidation: RepositoryItemModel): void {
    const newValidation: ImportValidation = {
      nomen: newConsolidedValidation.idNomen ? newConsolidedValidation.idNomen.toString() : null,
      repository: newConsolidedValidation.repository,
      repositoryIsAvailable: true,
      consolidedValidation: _.cloneDeep(newConsolidedValidation)
    };
    this.validationList.table.validation = newValidation;
    this.updateStepValidationStatus();
  }

  doesSyeHasConsolidedValidation(sye: {id: string, validation?: ImportValidation}): boolean {
    if (null == sye.validation) {
      return false;
    } else {
      if (!sye.validation.repositoryIsAvailable) {
        return false;
      } else {
        if (null == sye.validation.consolidedValidation) {
          return false;
        } else {
          return true;
        }
      }
    }
  }

  doesTableHasConsolidedValidation(): boolean {
    if (null == this.validationList.table.validation) {
      return false;
    } else {
      if (!this.validationList.table.validation.repositoryIsAvailable) {
        return false;
      } else {
        if (null == this.validationList.table.validation.consolidedValidation) {
          return false;
        } else {
          return true;
        }
      }
    }
  }

  getSyeIdForReleve(releve: {id: string, validation: ImportValidation}): string {
    let response = '?';
    for (const sye of this.validationList.table.sye) {
      for (const _releve of sye.releves) {
        if (_releve.id === releve.id) { response = sye.id; }
      }
    }
    return response;
  }

  startEditingTableValidation(): void {
    this.stopEditingSyeValidation();
    this.stopEditingRelevesValidation();
    this.isEditingTableValidation = true;
  }

  stopEditingTableValidation(): void {
    this.isEditingTableValidation = false;
  }

  /**
   * When user click on the edit button of a group
   * @Note we use a setTimeout in order to force tb-tsb-lib component destruction (see template '*ngIf="this.isEditingSyeValidation"')change detection (otherwise, we just mutate this.editingSye object)
   */
  startEditingSyeValidation(sye: {id: string, validation: ImportValidation}): void {
    this.stopEditingTableValidation();
    this.stopEditingSyeValidation();
    this.stopEditingRelevesValidation();
    setTimeout(() => {this.isEditingSyeValidation = true; }, 10);
    this.editingSye = sye;
  }

  /**
   * When sye validation edition is finished
   */
  stopEditingSyeValidation(): void {
    this.isEditingSyeValidation = false;
    this.editingSye = null;
  }

  /**
   * When user click on the edit button from a group of releves
   * @Note there is no need to use a setTimeout() because tsb components are included in a template for-of loop
   * so Angular will automatically destroy and recreate those components each time
   */
  startEditingRelevesValidation(releves: Array<{id: string, validation: ImportValidation}>): void {
    this.stopEditingTableValidation();
    this.stopEditingSyeValidation();
    this.stopEditingRelevesValidation();
    this.isEditingRelevesValidation = true;
    this.editingReleves = releves;
  }

  stopEditingRelevesValidation(): void {
    this.isEditingRelevesValidation = false;
    this.editingReleves = [];
  }

  // *****
  // TABLE
  // *****
  setTable(forceReloadDataView = true): Table {
    // user values
    // note: user values are set on the backend regardless of input values (back looks for user trough SSO process)
    // however, I think it's better to have the user values here, at less for debugging
    const user = this.currentUser;
    let userId: string;          // database field nullable
    let userEmail: string;       // database field *not nullable*
    let userPseudo: string;      // database field nullable
    // let userInstitution: string; // database field nullable

    if (null == user) {
      // No user
      // Should refresh the token ?
      this.notificationService.warn('Il semble que vous ne soyez plus connecté. Nous ne pouvons pas poursuivre l\'import du tableau.');
      return;
    } else {
      userId = user.id;
      userEmail = user.email;
      userPseudo = user ? this.userService.getUserFullName() : null;

      if (null == userId || null == userEmail) {
        this.notificationService.warn('Nous ne parvenons pas à vous identifier (votre identifiant unique ou votre email est inconnu)');
        return;
      }
    }

    const newTable: Table = {
      id: null,
      userId,
      userEmail,
      userPseudo,
      user: this.currentVlUser,
      ownedByCurrentUser: user !== null,    // a new table is owned by its creator
      createdBy: userId,
      createdAt: new Date(),
      rowsDefinition: null,
      sye: [],
      syeOrder: '',
      syntheticColumn: null,
      vlWorkspace: this.wsService.currentWS.getValue()
    };

    newTable.rowsDefinition = this.getTableRowsDefinition();

    // prepare and merge data from lists (taxonomicList, validationList, etc.)
    const tablePreview = this.getTablePreview();
    const taxoCoefsArray = this.getTaxoCoefsArray();

    let syeCount = 0;
    let releveCount = 0;
    for (const sye of this.validationList.table.sye) {
      const newSye: Sye = {
        id: null,
        userId,
        userEmail,
        userPseudo,
        user: this.currentVlUser,
        originalReference: sye.id,
        syeId: syeCount,
        occurrencesCount: sye.releves.length,
        occurrences: [],
        syntheticColumn: null, // get synthetic column
        syntheticSye: false,
        onlyShowSyntheticColumn: false,
        vlWorkspace: this.wsService.currentWS.getValue()
      };


      for (const releve of sye.releves) {
        console.log('releveCount: ', releveCount, releve.id);
        // new sye occurrences (synusy, microcenosis, etc.)
        // new occurrence level ?
        const newOccurrence0Level: Level = this.getReleveLevelById(releve.id, tablePreview);
        const isSyntheticColumn: boolean = this.isSyntheticColumn(releve.id, tablePreview);
        newSye.syntheticSye = isSyntheticColumn;

        if (isSyntheticColumn) {
          // Set sye occurrences count
          newSye.occurrencesCount = Number(this.rawRelevesCount[0][releveCount + this.ignoreFirstXCols]);
        }

        const newOccurrence0: OccurrenceModel = {
          userId,
          userEmail,
          userPseudo,
          user: null,
          observer: '',
          dateCreated: new Date(),
          taxoRepo: '',
          isPublic: true,
          isVisibleInCel: false,
          isVisibleInVegLab: true,
          signature: '',
          isIdentiplanteValidated: false,
          userProfile: null,
          delUpdateNotifications: null,
          originalReference: releve.id,
          level: newOccurrence0Level,
          parentLevel: null,
          children: [],
          inputSource: InputSource.VEGLAB,
          vlWorkspace: this.wsService.currentWS.getValue()
        };
        if (newOccurrence0.level === Level.MICROCENOSIS) {
          // create synusies
          const releveLayers = this.getReleveLayersById(releve.id, tablePreview);
          if (releveLayers.length > 0) {
            for (const layer of releveLayers) {
              // create synusy
              const newSynusy: OccurrenceModel = {
                userId,
                userEmail,
                userPseudo,
                user: null,
                observer: '',
                dateCreated: new Date(),
                taxoRepo: '',
                isPublic: true,
                isVisibleInCel: false,
                isVisibleInVegLab: true,
                signature: '',
                isIdentiplanteValidated: false,
                userProfile: null,
                delUpdateNotifications: null,
                originalReference: releve.id,
                level: Level.SYNUSY,
                parentLevel: Level.MICROCENOSIS,
                layer: this.layerService.getLayerEnumByStr(layer),
                children: [],
                inputSource: InputSource.VEGLAB,
                vlWorkspace: this.wsService.currentWS.getValue()
              };
              newOccurrence0.children.push(newSynusy);
              // create idiotaxa
              // get taxonomic + coef list by layer
              const taxoList = _.filter(taxoCoefsArray, tca => tca.taxo.layer === newSynusy.layer);
              const noNullCoefsTaxoList = _.filter(taxoList, tl => tl.coefs[releveCount] !== '');
              for (const taxoItem of noNullCoefsTaxoList) {
                const idio: OccurrenceModel = {
                  userId,
                  userEmail,
                  userPseudo,
                  user: null,
                  observer: '',
                  dateCreated: new Date(),
                  taxoRepo: '',
                  isPublic: true,
                  isVisibleInCel: false,
                  isVisibleInVegLab: true,
                  signature: '',
                  isIdentiplanteValidated: false,
                  userProfile: null,
                  delUpdateNotifications: null,
                  level: Level.IDIOTAXON,
                  parentLevel: Level.SYNUSY,
                  layer: newSynusy.layer,
                  children: [],
                  coef: taxoItem.coefs[releveCount],
                  validations: [taxoItem.taxo.validation],
                  inputSource: InputSource.VEGLAB,
                  vlWorkspace: this.wsService.currentWS.getValue()
                };
                newSynusy.children.push(idio);
              }
            }
          }
        } else if (newOccurrence0.level === Level.SYNUSY) {
          // set newOccurrence0 layer
          const releveLayers = this.getReleveLayersById(releve.id, tablePreview);
          newOccurrence0.layer = this.layerService.getLayerEnumByStr(releveLayers[0]);
          // create idiotaxa
          // get taxonomic + coef list by layer
          const taxoList = _.filter(taxoCoefsArray, tca => tca.taxo.layer === newOccurrence0.layer);
          const noNullCoefsTaxoList = _.filter(taxoList, tl => tl.coefs[releveCount] !== '');
          for (const taxoItem of noNullCoefsTaxoList) {
            const idio: OccurrenceModel = {
              userId,
              userEmail,
              userPseudo,
              user: null,
              observer: '',
              dateCreated: new Date(),
              taxoRepo: '',
              isPublic: true,
              isVisibleInCel: false,
              isVisibleInVegLab: true,
              signature: '',
              isIdentiplanteValidated: false,
              userProfile: null,
              delUpdateNotifications: null,
              level: Level.IDIOTAXON,
              parentLevel: Level.SYNUSY,
              layer: newOccurrence0.layer,
              children: [],
              coef: taxoItem.coefs[releveCount],
              validations: [taxoItem.taxo.validation],
              inputSource: InputSource.VEGLAB,
              vlWorkspace: this.wsService.currentWS.getValue()
            };
            newOccurrence0.children.push(idio);
          }
        }

        newSye.occurrences.push(newOccurrence0);
        releveCount++;
      }
      newTable.sye.push(newSye);
      syeCount++;
    }

    for (const sye of newTable.sye) {
      // For synthetic Sye only, create the synthetic columns
      if (sye.syntheticSye) {
        this.tableService.createSyntheticColumnForSyntheticSye(sye, sye.occurrences[0], this.currentUser);
        sye.onlyShowSyntheticColumn = true;

        // remove sye occurrences
        sye.occurrences = [];
      }
    }


    // Create synthetic columns for classic Sye with occurrences (not synthetic Sye)
    this.tableService.createSyntheticColumnsForSyeOnTable(newTable, this.currentUser);
    this.tableService.createTableSyntheticColumn(newTable, this.currentUser);

    // Bind validations
    // table validation
    const validationDate = new Date();
    if (this.validationList.table.validation && this.validationList.table.validation.consolidedValidation) {
      const tableValidation: OccurrenceValidationModel = this.validationList.table.validation.consolidedValidation ? {
        validatedBy:       userId,
        validatedAt:       validationDate,
        user:              this.currentVlUser,
        repository:        this.validationList.table.validation.consolidedValidation.repository,
        repositoryIdNomen: Number(this.validationList.table.validation.consolidedValidation.idNomen),
        repositoryIdTaxo:  this.validationList.table.validation.consolidedValidation.idTaxo.toString(),
        inputName:         this.validationList.table.validation.consolidedValidation.name,
        validatedName:     this.validationList.table.validation.consolidedValidation.name,
        validName:         this.validationList.table.validation.consolidedValidation.name
      } : null;
      newTable.validations = tableValidation ? [tableValidation] : null;
    }

    // table synthetic column validation
    if (newTable.syntheticColumn && newTable.validations && newTable.validations.length > 0) {
      newTable.syntheticColumn.validations = newTable.validations;
    }

    // sye validation
    if (this.validationList.table.sye) {
      for (const sye of this.validationList.table.sye) {
        if (sye.validation) {
          const syeToBind = this.getSyeInTableById(sye.id, newTable);
          const syeValidation: OccurrenceValidationModel = sye.validation.consolidedValidation ? {
            validatedBy:       userId,
            validatedAt:       validationDate,
            user:              this.currentVlUser,
            repository:        sye.validation.consolidedValidation.repository,
            repositoryIdNomen: Number(sye.validation.consolidedValidation.idNomen),
            repositoryIdTaxo:  sye.validation.consolidedValidation.idTaxo.toString(),
            inputName:         sye.validation.consolidedValidation.name,
            validatedName:     sye.validation.consolidedValidation.name,
            validName:         sye.validation.consolidedValidation.name
          } : null;
          syeToBind.validations = syeValidation ? [syeValidation] : null;
        }
      }
    }

    // sye synthetic column validation
    if (newTable.sye && newTable.sye.length > 0) {
      for (const sye of newTable.sye) {
        if (sye.syntheticColumn && sye.validations && sye.validations.length > 0) {
          sye.syntheticColumn.validations = sye.validations;
        }
      }
    }

    // releves validation
    if (this.validationList.table) {
      if (this.validationList.table.sye) {
        for (const sye of this.validationList.table.sye) {
          if (sye.releves) {
            for (const releve of sye.releves) {
              const relevesToBind = this.getRelevesInTableById(releve.id, newTable, false);
              const releveValidation: OccurrenceValidationModel = releve.validation && releve.validation.consolidedValidation ? {
                validatedBy:       userId,
                validatedAt:       validationDate,
                user:              this.currentVlUser,
                repository:        releve.validation.consolidedValidation.repository,
                repositoryIdNomen: Number(releve.validation.consolidedValidation.idNomen),
                repositoryIdTaxo:  releve.validation.consolidedValidation.idTaxo.toString(),
                inputName:         releve.validation.consolidedValidation.name,
                validatedName:     releve.validation.consolidedValidation.name,
                validName:         releve.validation.consolidedValidation.name
              } : null;
              for (const releveToBind of relevesToBind) {
                if (releveValidation !== null) {
                  releveToBind.validations = [releveValidation];
                }
              }
            }
          }
        }
      }
    }

    // Bind locations
    for (const location of this.locationList) {
      const relevesToBind = this.getRelevesInTableById(location.id, newTable);
      for (const releveToBind of relevesToBind) {
        this.bindLocationToReleve(releveToBind, location);

        // get occurrences
        const occurrences = this.tableService.getChildOccurrences(releveToBind);
        for (const occ of occurrences) {
          // Don't bind location to idiotaxa
          // this.bindLocationToReleve(occ, location);
        }
      }
    }

    // Bind metadata
    for (const meta of this.metadataList) {
      const relevesToBind = this.getRelevesInTableById(meta.id, newTable);
      for (const releveToBind of relevesToBind) {
        for (const metaItem of meta.metadata) {
          // Check if metaItem is complete
          // Check if metadata is restricted to a layer
          // Bind releveToBind with metaItem
          if (metaItem.restrictedToLayer && releveToBind.layer && metaItem.restrictedToLayer === releveToBind.layer) {
            if (metaItem.checkedValue && metaItem.metadataModel && metaItem.checkedValue.isValid && metaItem.checkedValue.consolidedValue) {
              this.bindMetadataToReleve(releveToBind, metaItem.metadataModel, metaItem.checkedValue.consolidedValue);
            }
          } else if (!metaItem.restrictedToLayer) {
            if (metaItem.checkedValue && metaItem.metadataModel && metaItem.checkedValue.isValid && metaItem.checkedValue.consolidedValue) {
              this.bindMetadataToReleve(releveToBind, metaItem.metadataModel, metaItem.checkedValue.consolidedValue);
            }
          }
        }
      }
    }

    // Bind authors
    for (let l = 0; l < this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition].length - this.ignoreFirstXCols; l++) {
      // get csv releve id
      const releveId = this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition][this.ignoreFirstXCols + l];
      const relevesToBind = this.getRelevesInTableById(releveId, newTable);
      for (const releveToBind of relevesToBind) {
        // if (rawHeader[this.AUTHOR_ROW_POS.groupPosition])
        // const a = _.find(this.authorList, al => al.authorUserInput === rawHeader[this.AUTHOR_ROW_POS.groupPosition]);
        const relatedAuthors = _.map(this.authorList, al => {
          return this.rawHeaders[this.AUTHOR_ROW_POS.groupPosition][this.ignoreFirstXCols + l].indexOf(al.authorUserInput) !== -1 ? al : null;
        });
        if (!releveToBind.vlObservers || releveToBind.vlObservers.length === 0) { releveToBind.vlObservers = []; }
        for (const relatedAuthor of relatedAuthors) {
          if (relatedAuthor) {
            releveToBind.vlObservers.push(relatedAuthor.authorSelected);
          }
        }
      }
    }

    // Bind dates
    for (let l = 0; l < this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition].length - this.ignoreFirstXCols; l++) {
      // get csv releve id
      const releveId = this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition][this.ignoreFirstXCols + l];
      const relevesToBind = this.getRelevesInTableById(releveId, newTable);
      for (const releveToBind of relevesToBind) {
        const relatedDate = _.find(this.dateList, dl => dl.dateUserInput === this.rawHeaders[this.DATE_ROW_POS.groupPosition][this.ignoreFirstXCols + l]);
        /*const relatedDates = _.map(this.dateList, al => {
          return this.rawHeaders[this.DATE_ROW_POS.groupPosition][this.ignoreFirstXCols + l].indexOf(al.dateUserInput) !== -1 ? al : null;
        });*/
        // for (const relatedDate of relatedDates) {
        if (relatedDate && relatedDate.dateConsolided && relatedDate.dateConsolidedUtc && relatedDate.precision) {
          releveToBind.dateObserved = relatedDate.dateConsolidedUtc;
          releveToBind.dateObservedPrecision = relatedDate.precision;
        }
        // }
      }
    }

    // Bind biblio
    for (let l = 0; l < this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition].length - this.ignoreFirstXCols; l++) {
      // get csv releve id
      const releveId = this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition][this.ignoreFirstXCols + l];
      const relevesToBind = this.getRelevesInTableById(releveId, newTable);
      for (const releveToBind of relevesToBind) {
        const relatedBiblio = _.find(this.biblioList, bl => bl.biblioUserInput === this.rawBiblio[this.BIBLIO_ROW_POS.groupPosition][this.ignoreFirstXCols + l]);
        if (relatedBiblio && relatedBiblio.biblioSelected) {
          // set biblio
          releveToBind.vlBiblioSource = relatedBiblio.biblioSelected;
        }
      }

      // bind biblio to syes ?
      for (const sye of newTable.sye) {
        const bibliosOcc = _.map(sye.occurrences, syeOcc => syeOcc.vlBiblioSource);
        const uniqBibliosOcc = _.uniq(bibliosOcc);
        // are all sye occurrences have the same biblio
        if (uniqBibliosOcc && uniqBibliosOcc.length > 0 && uniqBibliosOcc.length === 1) {
          // yes
          sye.vlBiblioSource = uniqBibliosOcc[0];
          if (sye.syntheticColumn) { sye.syntheticColumn.vlBiblioSource = uniqBibliosOcc[0]; }
        } else {
          // no
          // do nothing
        }
      }

      // bind biblio to table ?
      const bibliosSye = _.map(newTable.sye, sye => sye.vlBiblioSource);
      const uniqBibliosSye = _.uniq(bibliosSye);
      // are all sye have the same biblio
      if (uniqBibliosSye && uniqBibliosSye.length > 0 && uniqBibliosSye.length === 1) {
        // yes
        newTable.vlBiblioSource = uniqBibliosSye[0];
        if (newTable.syntheticColumn) { newTable.syntheticColumn.vlBiblioSource = uniqBibliosSye[0]; }
      } else { /* do nothing */ }
    }

    console.log(this.tableService.toString(newTable));
    console.log(newTable);

    this.tablePreviewIsSet = true;

    this.tableService.setCurrentTable(newTable, forceReloadDataView);

    return newTable;
  }

  bindLocationToReleve(releveToBind: OccurrenceModel, location: Location): void {
    // Set VL Location Input Source (location data from user input)
    if (location.latitude && location.longitude) {
      releveToBind.vlLocationInputSource = `N${location.latitude} E${location.longitude}`;
    } else if (location.place || location.city || location.departement || location.country) {
      if (!releveToBind.vlLocationInputSource || releveToBind.vlLocationInputSource == null) { releveToBind.vlLocationInputSource = ''; }
      const vlLocationInputSource = [location.place, location.city, location.departement, location.country];
      releveToBind.vlLocationInputSource = releveToBind.vlLocationInputSource + _.compact(vlLocationInputSource).toString();
    }

    if (location.tbLocation) {
      // Avoid malformed Point geoJson
      // ie { type: 'Point', coordinates: [ [lng, lat] ] } instead of { type: 'Point', coordinates: [lng, lat] }
      if (location.tbLocation.geometry.type.toLowerCase === 'point') {
        if (location.tbLocation.geometry.length === 1 && location.tbLocation.geometry[0].length === 2) {
          releveToBind.geometry = { type: 'Point', coordinates: location.tbLocation.geometry[0] };
        } else {
          releveToBind.geometry = location.tbLocation.geometry;
        }
      } else {
        releveToBind.geometry = location.tbLocation.geometry;
      }
      releveToBind.centroid = location.tbLocation.centroid;
      releveToBind.elevation = location.elevation;
      releveToBind.isElevationEstimated = location.isElevationEstimated;
      releveToBind.geodatum = location.tbLocation.geodatum;

      releveToBind.localityInseeCode = location.inseeData ? location.inseeData.code : null;

      releveToBind.locality = location.tbLocation.locality;
      releveToBind.sublocality = location.tbLocation.sublocality;
      releveToBind.localityConsistency = location.tbLocation.localityConsistency;
      // releveToBind.locationAccuracy = getLocationAccuracyEnum(location.tbLocation.locationAccuracy);
      releveToBind.vlLocationAccuracy = location.vlAccuracy;
      releveToBind.station = location.tbLocation.station;
      // releveToBind.publishedLocation = getPublishedLocationEnum(location.tbLocation.publishedLocation);
      releveToBind.osmCounty = location.tbLocation.osmCounty;
      releveToBind.osmState = location.tbLocation.osmState;
      releveToBind.osmPostcode = location.tbLocation.osmPostcode.toString();
      releveToBind.osmCountry = location.tbLocation.osmCountry;
      releveToBind.osmCountryCode = location.tbLocation.osmCountryCode;
      releveToBind.osmId = location.tbLocation.osmId.toString();
      releveToBind.osmPlaceId = +location.tbLocation.osmPlaceId;
    } else if (location.selectedLocation) {
      if (location.isLatLngInitialSetByUser) {
        releveToBind.geometry = { type: 'Point', coordinates: [Number(location.longitude), Number(location.latitude)] };
      } else {
        // Avoid malformed geoJson
        if (location.selectedLocation.nominatimLocation.geojson.type.toLowerCase() === 'point') {
          if (location.selectedLocation.nominatimLocation.geojson.coordinates.length === 1
              && location.selectedLocation.nominatimLocation.geojson.coordinates[0].length === 2) {
                releveToBind.geometry = { type: 'Point', coordinates: location.selectedLocation.nominatimLocation.geojson.coordinates[0] };
              } else {
                releveToBind.geometry = location.selectedLocation.nominatimLocation.geojson;
              }
        } else {
          releveToBind.geometry = location.selectedLocation.nominatimLocation.geojson;
        }
      }
      const centroid = this.locationService.getCentroid(location.selectedLocation.nominatimLocation.geojson);
      releveToBind.centroid = ({ type: 'Point', coordinates: [centroid.geometry.coordinates[0], centroid.geometry.coordinates[1]] });
      releveToBind.elevation = location.elevation;
      releveToBind.isElevationEstimated = location.isElevationEstimated;
      releveToBind.geodatum = null;

      releveToBind.localityInseeCode = location.inseeData ? location.inseeData.code : null;

      releveToBind.locality = this.locationService.getCityFromNominatimObject(location.selectedLocation.nominatimLocation);
      releveToBind.sublocality = null;
      releveToBind.localityConsistency = null;
      releveToBind.vlLocationAccuracy = location.vlAccuracy;
      releveToBind.station = null;
      releveToBind.publishedLocation = null;
      releveToBind.osmCounty = location.selectedLocation.nominatimLocation.address.county;
      releveToBind.osmState = location.selectedLocation.nominatimLocation.address.state;
      releveToBind.osmPostcode = location.selectedLocation.nominatimLocation.address.postcode;
      releveToBind.osmCountry = location.selectedLocation.nominatimLocation.address.country;
      releveToBind.osmCountryCode = location.selectedLocation.nominatimLocation.address.country_code;
      releveToBind.osmId = location.selectedLocation.nominatimLocation.osm_id.toString();
      releveToBind.osmPlaceId = +location.selectedLocation.nominatimLocation.place_id;
    } else {
      // No location
    }
  }

  /**
   * Bind metadata model and its value to an occurrence
   * Be careful : you must provide VALID models and values. This function does not perform any verification.
   */
  bindMetadataToReleve(releveToBind: OccurrenceModel, metadataModel: ExtendedFieldModel, value: any): void {
    const extFieldIri = `/api/extended_fields/${metadataModel.id}` as any;  // IRI workaround
    if (!releveToBind.extendedFieldOccurrences || releveToBind.extendedFieldOccurrences.length === 0) {
      releveToBind.extendedFieldOccurrences = [];
    }
    releveToBind.extendedFieldOccurrences.push({
      occurrence: null, // automaticaly set on backend, no need to play with json recursion
      extendedField: extFieldIri, // IRI workaround
      value: metadataModel.dataType === FieldDataType.DATE ? moment(value).format('DD/MM/YYYY') : value.toString()
    });
  }

  /**
   * Bind author (Observer) to an occurrence
   * Be careful : you must provide VALID author model. This function does not perform any verification.
   */
  private bindAuthorToReleve(releveToBind: OccurrenceModel, author: Observer): void {
    if (author.id && author.name) {
      if (!releveToBind.vlObservers || releveToBind.vlObservers.length === 0) { releveToBind.vlObservers = []; }
      releveToBind.vlObservers.push(author);
    }
  }

  private getRelevesInTableById(id: string, table: Table, returnMicrocenosisChildren = true): Array<OccurrenceModel> {
    const response = [];
    for (const sye of table.sye) {
      for (const releve of sye.occurrences) {
        if (releve.level === Level.MICROCENOSIS) {
          if (releve.originalReference === id) {
            response.push(releve);
            if (returnMicrocenosisChildren) { response.push(...releve.children); }
           }
        } else {
          if (releve.originalReference === id) { response.push(releve); }
        }
      }
    }
    return response;
  }

  private getSyeInTableById(id: string, table: Table): Sye {
    for (const sye of table.sye) {
      if (sye.originalReference && sye.originalReference === id) { return sye; }
    }
    return null;
  }

  private getTaxoCoefsArray(): Array<{taxo: Taxo, coefs: Array<string>}> {
    const mergedArray: Array<{taxo: Taxo, coefs: Array<string>}> = [];
    for (const taxoItem of this.taxonomicList) {
      const coefs = _.drop(_.find(this.rawContent, rw => (rw[this.REPO_COL_POS.position].toString() +
                                                          '~' + rw[this.NOMEN_COL_POS.position].toString() +
                                                          '~' + rw[this.LAYER_COL_POS.position].toString() +
                                                          '~' + rw[this.HEADERS_LABELS_COL_POS.position].toString()) === taxoItem.id), this.ignoreFirstXCols);
      if (coefs) {
        mergedArray.push({ taxo: taxoItem, coefs});
      }
    }
    return mergedArray;
  }

  private getTableRowsDefinition(): Array<TableRowDefinition> {
    const result: Array<TableRowDefinition> = [];

    // get txonomicList by groups
    const taxoListByGroups = _.groupBy(this.taxonomicList, tl => tl.group);
    const sorteredTaxoListByGroups = _.sortBy(taxoListByGroups, tlbg => tlbg[0].groupPosition);

    // @Todo : Each taxonomic var MUST HAVE a valid rim field !
    // Check stepNames is ok (error if some items doesn't have a rim value)

    let rowId = 0;
    for (const groupItems of sorteredTaxoListByGroups) {
      result.push({
        id: null,
        rowId,
        type: 'group',
        groupId: groupItems[0].groupPosition,
        groupTitle: groupItems[0].group,
        layer: null,
        displayName: groupItems[0].group,
        repository: null,
        repositoryIdNomen: null,
        repositoryIdTaxo: null
      });
      rowId++;
      for (const item of groupItems) {
        result.push({
          id: null,
          rowId,
          type: 'data',
          groupId: item.groupPosition,
          groupTitle: item.group,
          layer: item.layer,
          displayName: item.rim.author && item.rim.author !== '' ? item.rim.name + ' ' + item.rim.author : item.rim.name,
          repository: item.rim.repository,
          repositoryIdNomen: item.rim.idNomen ? Number(item.rim.idNomen) : null,
          repositoryIdTaxo: item.rim.idTaxo ? item.rim.idTaxo.toString() : null
        });
        rowId++;
      }
    }
    return result;
  }

  private getTablePreview(): Array<Array<string>> {
    const references = this.rawHeaders[this.REFERENCE_ROW_POS.groupPosition];
    const table: Array<Array<string>> = [];
    table.push(references);
    for (const row of this.rawContent) {
      table.push(row);
    }
    return table;
  }

  private getReleveLayersById(releveId, tablePreview: Array<Array<string>>): Array<string> {
    const releveIndexInTablePreview = tablePreview[0].indexOf(releveId);
    let layers: Array<string> = [];
    if (releveIndexInTablePreview !== -1) {
      let rowCount = 0;
      for (const row of tablePreview) {
        if (rowCount > 0) {
          if (row[releveIndexInTablePreview] !== '') {
            layers.push(row[this.LAYER_COL_POS.position]);
          }
        }
        rowCount++;
      }
      layers = _.uniq(layers);
      return layers;
    }
    return [];
  }

  private getReleveLevelById(releveId: string, tablePreview: Array<Array<string>>): Level | null {
    // const releveIndexInTablePreview = tablePreview[0].indexOf(releveId);
    const layers: Array<string> = this.getReleveLayersById(releveId, tablePreview);
    if (layers.length === 0) {
      return null;
    } else if (layers.length === 1) {
      return Level.SYNUSY;
    } else if (layers.length > 1) {
      return Level.MICROCENOSIS;
    }
  }

  // Is a column represents a synthetic set of occurrences ?
  // Just read the given "Nombre de relevés" (releves count)
  private isSyntheticColumn(releveId: string, tablePreview: Array<Array<string>>): boolean {
    const releveIndexInTablePreview = tablePreview[0].indexOf(releveId);
    const rawCount = Number(this.rawRelevesCount[0][releveIndexInTablePreview]);
    return rawCount > 1 ? true : false;
  }

  // *******
  // STEPPER
  // *******
  stepSelectionChange(stepperSelection: StepperSelectionEvent): void {
    if (stepperSelection.selectedIndex === this.STEPS.places.index) {
      this.contentFullWidth = true;
    } else { this.contentFullWidth = false; }
  }

  allStepsCompleted(): boolean {
    return this.importFileStatus.getValue() === 'complete'
           && this.stepNames.getValue().started
           && this.stepPlaces.getValue().started
           && this.stepAuthorsDates.getValue().started
           && this.stepMetadata.getValue().started
           && this.stepBiblio.getValue().started
           && this.stepValidation.getValue().started;
  }


  /** MOVE THOSE FUNCTIONS TO OTHER SECTIONS */

  // nominatimLocationToTbLocation(nominatimLocation: NominatimObject): TbLocationModel {
    //
  // }

  getNominatimReadbleAddress(osmPlaceResult: OsmPlaceModel): string {
    let locality: string = null;    // city or village or ...
    let subLocality: string = null; // district or
    let road: string = null;
    let neighbourhood: string = null;

    // Get "city" information (I mean city or something similar like village)
    if (!(osmPlaceResult.address.city == null)) { locality = osmPlaceResult.address.city;
    } else if (!(osmPlaceResult.address.town == null)) { locality = osmPlaceResult.address.town;
    } else if (!(osmPlaceResult.address.village == null)) { locality = osmPlaceResult.address.village;
    } else if (!(osmPlaceResult.address.hamlet == null)) { locality = osmPlaceResult.address.hamlet; }

    // Get suburbr & if not defined : postcode
    if (!(osmPlaceResult.address.suburb == null) && !(osmPlaceResult.address.postcode == null) && locality !== null) {
      subLocality = osmPlaceResult.address.suburb + ', ' + osmPlaceResult.address.postcode;
    } else if ((osmPlaceResult.address.suburb == null) && !(osmPlaceResult.address.postcode == null) && locality !== null) {
      subLocality = osmPlaceResult.address.postcode;
    }

    // Get "road"
    if (!(osmPlaceResult.address.road == null)) {
      road = osmPlaceResult.address.road;
    } else if (!(osmPlaceResult.address.pedestrian == null)) {
      road = osmPlaceResult.address.pedestrian;
    }

    // Get neighbourhood
    if (!(osmPlaceResult.address.neighbourhood == null)) {
      neighbourhood = osmPlaceResult.address.neighbourhood;
    }

    // Get country
    const country = osmPlaceResult.address.country;
    const showCountry = country !== 'France' ? ' (' + country + ')' : '';

    // Return
    if (road && neighbourhood && subLocality && locality) {
      return road + ' (' + neighbourhood + ') ' + subLocality + ' ' + locality + showCountry;
    } else if (road && !neighbourhood && subLocality && locality) {
      return road + ' ' + subLocality + ' ' + locality + showCountry;
    } else if (road && !neighbourhood && !subLocality && locality) {
      return road + ', ' + locality + showCountry;
    } else if (!road && neighbourhood && subLocality && locality) {
      return neighbourhood + ' ' + subLocality + ' ' + locality;
    } else if (!road && !neighbourhood && subLocality && locality) {
      return subLocality + ' ' + locality + showCountry;
    } else if (!road && !neighbourhood && !subLocality && locality) {
      return locality + showCountry;
    } else {
      return osmPlaceResult.display_name + showCountry;
    }

  }

}

export interface Taxo {
  // uid: number;
  id: string;
  group: string;
  groupPosition: number;
  repo: string;
  nomen: string;
  layer: string;
  validation: OccurrenceValidationModel;
  rim?: RepositoryItemModel;
}

export interface Location {
  id: string;
  latitude: string;
  longitude: string;
  isLatLngInitialSetByUser: boolean;
  country: string;
  departement: string;
  city: string;
  place: string;
  isLoading: boolean;
  vlAccuracy: VlAccuracyEnum;
  suggeredLocations: Array<{nominatimLocation: NominatimObject, readableAddress: string}>;
  selectedLocation: {nominatimLocation: NominatimObject, readableAddress: string};
  location?: TbLocationModel;
  tbLocation?: TbLocationModel;
  manualLocalization?: boolean;
  elevation?: number;
  isElevationEstimated?: boolean;
  inseeData?: InseeCommune;
}

export interface MetadataItem {
  uid: number;
  metadataName: string;
  metadataValue: string;
  metadataModel: ExtendedFieldModel;
  checkedValue: { isValid: boolean, consolidedValue: any, errorMessage: string };
  isEditing: boolean;
  restrictedToLayer?: string;
}

export interface MetadataItemWithId extends MetadataItem {
  id: string;
}

export interface MetadataList {
  id: string;
  metadata: Array<MetadataItem>;
}

export interface ImportValidation {
  nomen: string;
  repository: string;
  repositoryIsAvailable: boolean;
  consolidedValidation: RepositoryItemModel;
}

export interface StepStatus {
  started: boolean;
  currentStatus: 'complete' | 'warning' | 'error' | 'pending';
  message: string;
  tip: string;
}
