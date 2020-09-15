/**
 * @todo Utiliser le service de geocoding gouvernemental pour la France (https://adresse.data.gouv.fr/api)
 *       lors de la création d'une donnée (=conserver en bdd)
 *       Et utiliser ce même serice pour des recherches en France
 *       -> OSM ne fournit pas les codes INSEE des communes et ne trouve pas toujours les codes postaux des villes...
 */
import { Component, OnInit, OnDestroy, NgZone, Inject, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormControl } from '@angular/forms';

import { Observable, Subscription, of, Observer } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, map, switchMap, takeLast } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

import { FieldDataType } from 'src/app/_enums/field-data-type-enum';

import { AppConfigService } from 'src/app/_config/app-config.service';
import { LayerService } from 'src/app/_services/layer.service';
import { MetadataService } from 'src/app/_services/metadata.service';
import { OccurrenceService } from 'src/app/_services/occurrence.service';
import { TableService } from 'src/app/_services/table.service';
import { UserService } from 'src/app/_services/user.service';
import { NotificationService } from 'src/app/_services/notification.service';

import { RepositoryItemModel } from 'tb-tsb-lib';
import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { EsOccurrencesResultModel } from 'src/app/_models/es-occurrences-result.model';
import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';
import { Polygon } from 'geojson';
import { Observer as ObserverModel } from '../../_models/observer.model';
import { Biblio } from 'src/app/_models/biblio.model';
import { LayerEnum } from 'src/app/_enums/layer-list';
import { UserModel } from 'src/app/_models/user.model';
import { EsOccurrenceModel } from 'src/app/_models/es-occurrence-model';

import * as _ from 'lodash';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSelectChange, MatSidenav, PageEvent } from '@angular/material';

@Component({
  selector: 'vl-occurrence-search',
  templateUrl: './occurrence-search.component.html',
  styleUrls: ['./occurrence-search.component.scss']
})
export class OccurrenceSearchComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenav;  // @Todo check : doc add {static: false}

  occurrenceInfo: EsOccurrenceModel = null;     // occurrence to preview

  // VAR user
  currentUser: UserModel;
  userSubscription: Subscription;

  // VAR Occurrence Filters
  tbRepositoriesConfig = environment.tbRepositoriesConfig;
  mustContainOccurrences: Array<RepositoryItemModel> = [];
  mustNotContainOccurrences: Array<RepositoryItemModel> = [];
  // mustOrShouldContain: 'must' | 'should' = 'must';

  // VAR Relevé Filters
  mustContainReleves: Array<RepositoryItemModel> = [];
  mustNotContainReleves: Array<RepositoryItemModel> = [];
  levelFilter: 'synusy' | 'microcenosis' = null;
  layerFilter: string = null;

  // For the 2-levels nested occurrences (ie 'microcenosis' levels),
  //   the 1st level occurrence (microcenosis) has got a 'childrenValidations' ES field composed from validations of children (synusy) + grandChildren (idiotaxon)
  //   the 2nd level occurrence (synusy) has got a 'childrenValidations' ES field composed from validations childrend (idiotaxon)
  // So the 1st level and the 2nd levels have got the same 'childrenValidations' idiotaxons parts !
  // This is totaly assumed but when we search for an occurrence, it's redundant and disappointing for the user to retrieve & show a parent occurrence and its children at the same time
  returnsChildrenLevelOccurrences = false;
  returnsChildrenLevelOccurrencesEnabled = true;

  searchedOccurrences: Array<{occurrence: EsOccurrenceModel, score?: number}> = [];
  orderedSearchedOccurrences: Array<{occurrence: {occurrence: EsOccurrenceModel, score?: number}, childOccurrences?: Array<{occurrence: EsOccurrenceModel, score?: number}>}> = [];
  geoSearchedOccurrences: Array<[number, number]> = []; // Array of centroids ; centroid is an ES Geo point data type : [lng, lat] simple array

  layerList: Array<{name: string, enum: LayerEnum, description: string}> = [];

  // VAR Geo filters
  boundingBox: {topLeft: {lat: number, lng: number}, bottomRight: {lat: number, lng: number}} = null;
  polygon: Polygon = null;
  invalidateSearchMap = false;

  // VAR Elevation filter
  elevationFilterOn = false;
  elevationFilterLowValue = 0;
  elevationFilterHighValue = 3000;
  elevationFilterOptions = {
    floor: 0,
    ceil: 3000,
    disabled: true,
    step: 100,
    showTicks: true,
    showTicksValues: false
  };

  // VAR Metadata filters
  metadataSubscriber: Subscription;
  metadataAvailable: Array<ExtendedFieldModel>;
  addMetadataInput: FormControl = new FormControl('');
  filteredMetadatas: Observable<Array<ExtendedFieldModel>>;
  metadataToFilter: Array<{id: number, label: string, disabled: boolean, metadata: ExtendedFieldModel}> = [];
  metadataFilterValues: Array<{
    id: number,
    item: {label: string, disabled: boolean, metadata: ExtendedFieldModel},
    data: {
      type: 'range' | 'integer' | 'float' | 'text' | 'date',
      exactValue: any,
      minValue: any,
      maxValue: any,
      minDate: string,
      maxDate: string,
      regexp: string
    }
  }> = [];
  showMetadataFilterOptions = false;
  metadataFilterIncludeMissingMetadata = false;

  // VAR Author filter
  filteredAuthors: Array<ObserverModel> = [];

  // VAR Biblio filter
  filteredBiblios: Array<Biblio> = [];

  // VAR Date filter
  dateObservedFilterLowValue: string = null;
  dateObservedFilterHighValue: string = null;
  // We use a fake 'date' metadata so we can use the MetadataFilter component
  fakeDateMetadata: ExtendedFieldModel = {
    id: 0,
    fieldId: 'date',
    projectName: 'veglab:*',
    dataType: FieldDataType.DATE,
    isVisible: true,
    isEditable: true,
    isMandatory: true,
    extendedFieldTranslations: [{
      id: 0,
      projectName: 'veglab:*',
      label: 'Date d\'observation',
      languageIsoCode: 'fr',
      extendedField: this.fakeDateMetadata
    }]
  };
  dateFilterOn = false;

  // VAR results
  resultCount: number;
  occurrencesPageIndex = 0;        // updated by _occurrencePageChanged()
  occurrencesPaginatorFrom = 0;    // updated by _occurrencePageChanged()
  occurrencesPaginatorSize = 5;
  selectedOccurrencesIds: Array<number> = [];

  // VAR other
  isSearching = false;
  showResultsDiv = true;
  displayResults: 'cards' | 'inline' = 'inline';

  constructor(
    private appConfig: AppConfigService,
    private http: HttpClient,
    private zone: NgZone,
    private layerService: LayerService,
    private metadataService: MetadataService,
    private occurrenceService: OccurrenceService,
    private tableService: TableService,
    public dialog: MatDialog,
    private userService: UserService,
    private notificationService: NotificationService) { }

  ngOnInit() {
    // App config
    setTimeout(() => {                    // Avoid 'ExpressionChangedAfterItHasBeenCheckedError'
      this.appConfig.setTableEditable();
      this.appConfig.enableInfoPanel();
    });

    // Get current user
    this.currentUser = this.userService.currentUser.getValue();
    if (this.currentUser == null) {
      // No user
      // Should refresh the token ?
      // this.notificationService.warn('Il semble que vous ne soyez plus connecté. Nous ne pouvons pas poursuivre la recherche de relevés.');
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

    // Get layers list
    this.layerList = this.layerService.getLayers();
    // Get metadata list
    this.metadataSubscriber = this.metadataService.metadataList.pipe(
      map(values => _.sortBy(values, (value) => value.fieldId)))
      .subscribe(data => { this.metadataAvailable = data; });
    // Watch metadata list changes
    this.filteredMetadatas = this.addMetadataInput.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filterMetadata(value))
      );
  }

  ngOnDestroy(): void {
    if (this.metadataSubscriber) { this.metadataSubscriber.unsubscribe(); }
    if (this.userSubscription) { this.userSubscription.unsubscribe(); }
  }

  selectedTabIndexChange(index: number) {
    this.invalidateSearchMap = true;
    setTimeout(() => { this.invalidateSearchMap = false; }, 10);
  }

  // -----------------
  // OCURRENCE FILTERS
  // -----------------

  addOccurrenceToFilter(item: RepositoryItemModel): void {
    if (_.find(this.mustContainOccurrences, i => i === item )) { return; }
    if (_.find(this.mustNotContainOccurrences, i => i === item )) { return; }
    this.mustContainOccurrences.push(item);
    this.search();
  }

  dropOccurrenceBetweenLists(event: CdkDragDrop<RepositoryItemModel[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
    this.search();
  }

  removeOccurrenceFromMustContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustContainOccurrences.forEach(item => {
      if (item === itemToRemove) { this.mustContainOccurrences.splice(i, 1); }
      i++;
    });
    this.search();
  }

  removeOccurrenceFromMustNotContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustNotContainOccurrences.forEach(item => {
      if (item === itemToRemove) { this.mustNotContainOccurrences.splice(i, 1); }
      i++;
    });
    this.search();
  }

  // --------------
  // RELEVE FILTERS
  // --------------
  addReleveToFilter(item: RepositoryItemModel): void {
    console.log(item);
    if (_.find(this.mustContainReleves, i => i === item )) { return; }
    if (_.find(this.mustNotContainReleves, i => i === item )) { return; }
    this.mustContainReleves.push(item);
    this.search();
  }

  dropReleveBetweenLists(event: CdkDragDrop<RepositoryItemModel[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
    this.search();
  }

  removeReleveFromMustContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustContainReleves.forEach(item => {
      if (item === itemToRemove) { this.mustContainReleves.splice(i, 1); }
      i++;
    });
    this.search();
  }

  removeReleveFromMustNotContainList(itemToRemove: RepositoryItemModel): void {
    let i = 0;
    this.mustNotContainReleves.forEach(item => {
      if (item === itemToRemove) { this.mustNotContainReleves.splice(i, 1); }
      i++;
    });
    this.search();
  }

  /**
   * When user changes hte level filter
   * Note that when a level filter is set, this.returnsChildrenLevelOccurrences is disabled
   */
  levelFilterChange(newValue: string): void {
    switch (newValue) {
      case 'all':
        this.levelFilter = null;
        this.returnsChildrenLevelOccurrencesEnabled = true;
        this.search();
        break;
      case 'synusy':
        this.levelFilter = 'synusy';
        this.returnsChildrenLevelOccurrencesEnabled = false;
        this.search();
        break;
      case 'microcenosis':
        this.levelFilter = 'microcenosis';
        this.returnsChildrenLevelOccurrencesEnabled = false;
        this.search();
        break;
      default:
        this.levelFilter = null;
        this.returnsChildrenLevelOccurrencesEnabled = true;
        this.search();
        // @Todo log error
        break;
    }
  }

  layerFilterChange(newValue: string): void {
    if (newValue === 'all') {
      this.layerFilter = null;
      this.returnsChildrenLevelOccurrencesEnabled = true;
      this.search();
    } else {
      this.layerFilter = newValue;
      this.returnsChildrenLevelOccurrencesEnabled = false;
      this.search();
    }
  }

  // -----------
  // GEO FILTERS
  // -----------

  /**
   * When user draws a bounding box on the search map
   */
  boundingBoxChange(data: {topLeft: {lat: number, lng: number}, bottomRight: {lat: number, lng: number}}): void {
    this.boundingBox = data === null ? null : data;
    this.polygon = null;
    // boundingBoxChange() is called from template and I think this is why change detection doesn't apply immediatly
    // We should use an immutable object instead of calling zone.run()
    // @TODO use immutable for this.serachedOccurrences
    this.zone.run(() => this.search());
  }

  /**
   * When user draws a polygon on the search map
   */
  polygonChange(data: Polygon) {
    this.polygon = data === null ? null : data;
    this.boundingBox = null;
    this.zone.run(() => this.search());
  }

  // -------
  // OPTIONS
  // -------
  returnsChildrenLevelOccurrencesChange(): void {
    this.search();
  }

  // -------
  // RESULTS
  // -------
  selectedOccurrencesChange(selectedOccurrencesIds: Array<number>): void {
    this.selectedOccurrencesIds = selectedOccurrencesIds;
  }

  resetSelectedOccurrencesIds(): void {
    this.selectedOccurrencesIds = [];
  }

  // ----------------
  // SEARCH FUNCTIONS
  // ----------------

  /**
   * Main search function
   */
  search(from?: number) {
    // At less one of the filters (occurrence, geolocation, ...) must be applied
    if (this.noFilterApplied()) {
      this.resultCount = 0;
      return;
    }

    // Get the query
    const esQuery = this.esQueryAssembler(from);
    console.log(esQuery);

    // Query should not be null
    if (esQuery === '') { return; }

    // Request
    const headers = new HttpHeaders({ 'Content-type': 'application/json' });
    this.isSearching = true;
    this.http.post(`${environment.esBaseUrl}/cel2_occurrences/_search`, esQuery, { headers })
    .pipe(
      debounceTime(1500),
      distinctUntilChanged()
    )
    .subscribe((esResults: EsOccurrencesResultModel) => {
      this.isSearching = false;
      const occurrences: Array<{occurrence: EsOccurrenceModel, score?: number}> = [];
      const maxScore: number = esResults.hits.max_score;
      this.resultCount = esResults.hits.total;
      esResults.hits.hits.forEach(hit => {
        const score = hit._score;
        const percentScore: number = maxScore && score ? ((score * 100) / maxScore) : null;
        const _occ: EsOccurrenceModel = hit._source;
        _occ.selected = false;
        _occ.score = percentScore;
        occurrences.push({occurrence: _occ, score: percentScore});
      });
      this.searchedOccurrences = occurrences;
      this.orderedSearchedOccurrences = _.clone(this.getOrderedOccurrences(occurrences));
      this.geoSearchedOccurrences = _.map(this.searchedOccurrences, so => so.occurrence.centroid); // so.occurrence.centroid is object (geoJson) ? is array (ES Geo point) ? // occurrences[0].occurrence.geometry;
      this.geoSearchedOccurrences = _.clone(this.geoSearchedOccurrences);
    }, error => {
      // @TODO LOG ES ERROR AND EMIT A NOTIFICATION
      this.isSearching = false;
    });
  }

  /**
   * Searching an occurrence can be confusing because of the microcenosis / synusies level integration
   * A microcenosis contains several synusies and all this occurrences share the same geometry data (and may share other data such as validation)
   * So we order the occurrences by parent as   { occurrence: ~microcenosis level~, childOccurrences: ~synusy level~ }
   * Or, if the parent occurrence is a synusy : { occurrence: ~synusy level~ }
   * Note: from ES, parent is a number (occurrence id)
   */
  private getOrderedOccurrences(occurrencesWithScores: Array<{occurrence: EsOccurrenceModel, score?: number}>): Array<{occurrence: {occurrence: EsOccurrenceModel, score?: number}, childOccurrences?: Array<{occurrence: EsOccurrenceModel, score?: number}>}> {
    if (!occurrencesWithScores || occurrencesWithScores.length === 0) { return []; }
    const clonedOcc = _.clone(occurrencesWithScores);
    const orderedOccurrences: Array<{occurrence: {occurrence: EsOccurrenceModel, score?: number}, childOccurrences?: Array<{occurrence: EsOccurrenceModel, score?: number}>}> = [];

    // If user set up a level filter or a layer filter, we can't order results by level
    if (this.levelFilter !== null || this.layerFilter !== null) {
      _.map(clonedOcc, co => orderedOccurrences.push({occurrence: {occurrence: co.occurrence, score: co.score}}) );
      return orderedOccurrences;
    }

    // Get parent occurrences
    for (const occ of clonedOcc) {
      if (!occ.occurrence.parentId) { orderedOccurrences.push({occurrence: occ}); }
    }

    // Set child occurrences
    for (const occ of clonedOcc) {
      if (occ.occurrence.parentId) {    // parentId is only provided by ES, it's not persisted in SQL DB
        // get parent occurrence
        let orderedOccurrence: {occurrence: {occurrence: EsOccurrenceModel, score?: number}, childOccurrences?: Array<{occurrence: EsOccurrenceModel, score?: number}>};
        orderedOccurrence = _.find(orderedOccurrences, r => r.occurrence.occurrence.id === occ.occurrence.parentId);
        if (orderedOccurrence) {
          if (!orderedOccurrence.childOccurrences || orderedOccurrence.childOccurrences.length === 0) { orderedOccurrence.childOccurrences = []; }
          orderedOccurrence.childOccurrences.push(occ);
        } else {
          // no parent ?
          // @Todo : improve Request : the parent occurrence could not be included in the request results !!!
          orderedOccurrences.push({occurrence: occ});
        }
      }
    }
    return orderedOccurrences;
  }

  noFilterApplied(): boolean {
    if (this.mustContainOccurrences.length === 0 &&
        this.mustNotContainOccurrences.length === 0 &&
        this.mustContainReleves.length === 0 &&
        this.mustNotContainReleves.length === 0 &&
        this.levelFilter == null &&
        this.layerFilter == null &&
        this.boundingBox == null &&
        this.polygon == null &&
        this.elevationFilterOn === false &&
        this.filteredAuthors.length === 0 &&
        this.filteredBiblios.length === 0 &&
        this.dateFilterOn === false &&
        !this.isMetadataFilterApplied()) {
          this.searchedOccurrences = [];
          this.orderedSearchedOccurrences = [];
          this.geoSearchedOccurrences = [];
          return true;
        }
    return false;
  }

  /**
   * Is there at less one Metadata filter applied and enabled ?
   */
  isMetadataFilterApplied(): boolean {
    const countMetaFilters = this.metadataFilterValues.length;
    if (countMetaFilters === 0) {
      return false;
    } else {
      const metaFilterStatus = _.map(this.metadataFilterValues, mfv => mfv.item.disabled);
      return metaFilterStatus.indexOf(false) !== -1 ? true : false;
    }
  }

  // --------------
  // AUTHORS FILTER
  // --------------
  /**
   * When user add an author
   * @param observer provided by vl-observer-search component
   */
  authorChange(observer: ObserverModel): void {
    if (!_.find(this.filteredAuthors, fa => fa.id === observer.id && fa.name === observer.name)) {
      this.filteredAuthors.push(observer);
      this.search();
    }
  }

  /**
   * When user remove an author by clicking close icon on a mat-chip
   */
  removeFilteredAuthor(observer: ObserverModel): void {
    _.remove(this.filteredAuthors, fa => fa === observer);
    this.search();
  }

  // --------------
  // BIBLIOS FILTER
  // --------------
  /**
   * When user add a biblio
   * @param biblio provided by vl-biblio-search component
   */
  biblioChange(biblio: Biblio): void {
    if (!_.find(this.filteredBiblios, fb => fb.id === biblio.id && fb.title === biblio.title)) {
      this.filteredBiblios.push(biblio);
      this.search();
    }
  }

  /**
   * When user remove a biblio by clicking close icon on a mat-chip
   */
  removeFilteredBiblio(biblio: Biblio): void {
    _.remove(this.filteredBiblios, fb => fb === biblio);
    this.search();
  }

  // ----------------
  // METADATA FILTERS
  //
  // Note : metadataFilter is different than metadataFilterValues
  //        The first one represent an item to be filled by the user
  //        As the second one represent the values (that can change) of the first
  //        ie : an user can add one (or more) metadataFilter and then can change several times its values
  // ----------------

  /**
   * Add a new filter
   * Note : to be able to link a metadataFilter and its value,
   *        we generate an id that is exactly the same which is used when adding a metadataFilterValue
   * @param value contains an ExtendedFieldModel provided by a Select-options input
   */
  addMetadataToFilter(value: any): void {
    const metadataItem = value.option.value as ExtendedFieldModel;

    this.metadataToFilter.push({
      id: Math.random() * 1000,
      label: (metadataItem.extendedFieldTranslations && metadataItem.extendedFieldTranslations.length > 0 ? metadataItem.extendedFieldTranslations[0].label : metadataItem.fieldId),
      disabled: false,
      metadata: metadataItem
    });
    this.addMetadataInput.setValue(null, {emitEvent: false});

    this.search();
  }

  /**
   * When a metadata input recieve a value, it trigger this function
   * If the value is already filled (it's already in the metadataFilterValues array), update it
   * Else, create it (push it to metadataFilterValues array)
   * Note : the id value os the metadataFilterValue pushed to metadataFilterValue array
   *        is exactly the same as the the metadataFilter id (see code comment below)
   */
  metadataFilterValuesChange(item: {id: number, label: string, disabled: boolean, metadata: ExtendedFieldModel}, data: { type: 'range' | 'integer' | 'float' | 'text' | 'date', exactValue: any, minValue: any, maxValue: any, minDate: string, maxDate: string, regexp: string }): void {
    // Already exists ?
    let alreadyExists = false;
    let i = 0;
    let index: number;
    this.metadataFilterValues.forEach(metadataValueItem => {
      if (metadataValueItem.id === item.id && item.metadata === metadataValueItem.item.metadata) {
        alreadyExists = true;
        index = i;
      }
      i++;
    });

    if (alreadyExists) {
      this.metadataFilterValues[index].data = data;
    } else if (this.metadataFilterValues.length === 0) {
      this.metadataFilterValues.push({id: item.id, item, data});
    } else {
      this.metadataFilterValues.push({id: item.id, item, data});
    }

    this.search();
  }

  /**
   * Remove a filter and its values
   */
  deleteMetadataToFilter(item: {id: number, metadata: ExtendedFieldModel}): void {
    // remove metadata filter
    let i = 0;
    this.metadataToFilter.forEach(meta => {
      if (meta.metadata === item.metadata) {
        this.metadataToFilter.splice(i, 1);
      }
      i++;
    });

    // remove metadata filter values
    let j = 0;
    this.metadataFilterValues.forEach(filterItem => {
      if (item.id === filterItem.id) {
        this.metadataFilterValues.splice(j, 1);
      }
      j++;
    });

    this.search();
  }

  /**
   * Each filter can be disabled
   */
  toggleDisabledMetadata(metadata: {label: string, disabled: boolean, metadata: ExtendedFieldModel}): void {
    metadata.disabled = !metadata.disabled;

    this.search();
  }

  /**
   * Filter the metadata by its fieldId, label or description
   * Used by the autocomplete input
   */
  private _filterMetadata(value: string): Array<ExtendedFieldModel> {
    // value could be an object because of mat-option value is an object (see template)
    if (typeof(value) === 'object') { return []; }

    const filterValue = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filteredValues: Array<ExtendedFieldModel> = [];
    this.metadataAvailable.forEach(ma => {
      const description = ma.extendedFieldTranslations && ma.extendedFieldTranslations[0].description ? ma.extendedFieldTranslations[0].description : '';
      if (ma.fieldId.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(filterValue) !== -1 ||
      description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(filterValue) !== -1) {
        filteredValues.push(ma);
      }
    });
    return filteredValues;
  }

  /**
   * How to display metadata whitin the autocomplete input
   */
  displayMetadataAutocomplete(metadata?: ExtendedFieldModel): string {
    if (!metadata) { return ''; }
    return  metadata.extendedFieldTranslations && metadata.extendedFieldTranslations.length > 0 ? metadata.extendedFieldTranslations[0].label : metadata.fieldId;
  }

  /**
   * Options are
   *  1. 'Include occurrences that have empty filtered metadatas'
   */
  toggleMetadataOptionsVisible(): void {
    this.showMetadataFilterOptions = !this.showMetadataFilterOptions;
  }

  /**
   * Toggle option 1. (see code comment below)
   */
  toggleMetadataFilterIncludeMissingMetadata() {
    this.metadataFilterIncludeMissingMetadata = !this.metadataFilterIncludeMissingMetadata;

    this.search();
  }


  /**
   * Open the modal that explain option 1.
   */
  openMetadataModal1(): void {
    this.dialog.open(OccurrenceSearchMetadataModal1Component, { width: '70%' });
  }

  // ----------------
  // ELEVATION FILTER
  // ----------------
  elevationFilterActivationChange(event: any) {
    const oldValue = this.elevationFilterOn;
    this.elevationFilterOn = event.checked ? true : false;
    this.elevationFilterOptions.disabled = !this.elevationFilterOn;
    const newOptions = Object.assign({}, this.elevationFilterOptions);
    newOptions.disabled = this.elevationFilterOn ? false : true;
    this.elevationFilterOptions = newOptions;
    if (oldValue !== this.elevationFilterOn) { this.search(); }
  }

  onUserChangeStartElevationValue(event) {
    if (this.elevationFilterOn) { this.search(); }
  }
  onUserChangeEndElevationValue(event) {
    if (this.elevationFilterOn) { this.search(); }
  }

  // -----------
  // DATE FILTER
  // -----------
  dateFilterValuesChange(data: { type: 'range' | 'integer' | 'float' | 'text' | 'date', exactValue: any, minValue: any, maxValue: any, minDate: string, maxDate: string, regexp: string }): void {
    if (data.type === 'date' && data.minDate && data.maxDate) {
      this.dateObservedFilterLowValue = data.minDate;
      this.dateObservedFilterHighValue = data.maxDate;
    }
    if (this.dateFilterOn) { this.search(); }
  }

  dateFilterActivationChange(event: any): void {
    const oldValue = this.dateFilterOn;
    this.dateFilterOn = event.checked ? true : false;
    if (oldValue !== this.dateFilterOn && this.dateObservedFilterLowValue && this.dateObservedFilterHighValue) { this.search(); }
  }

  // -----
  // OTHER
  // -----

  addSelectedOccurrencesToTable(): void {
    const _table = _.clone(this.tableService.getCurrentTable());
    const occurrences = [];

    // Avoid duplicates
    const occurrencesIdsToAdd: Array<number> = [];

    this.selectedOccurrencesIds.forEach(occIdShouldBeAdded => {
      if (_.find(this.tableService.currentTableOccurrencesIds.getValue(), currentTableOccId => currentTableOccId === occIdShouldBeAdded)) {
        // already in current table, no need to get & add this occurrence
      } else {
        occurrencesIdsToAdd.push(occIdShouldBeAdded);
      }
    });

    let i = 0;
    occurrencesIdsToAdd.forEach(sOccId => {
      this.tableService.isLoadingData.next(true);
      this.occurrenceService.getOccurrenceById(sOccId).subscribe(
        rOcc => {
          occurrences.push(rOcc);
          if (i === occurrencesIdsToAdd.length - 1) {
            const mergedTable = this.tableService.mergeRelevesToTable(occurrences, _table, this.currentUser);

            // @Action
            console.log('MERGE RELEVES TO TABLE');

            this.tableService.setCurrentTable(mergedTable, true);
          }
          i++;
          this.tableService.isLoadingData.next(false);
        },
        error => {
          // @Todo manage error
          this.tableService.isLoadingData.next(false);
        }
      );
    });
  }

  toggleShowResultsDiv(): void {
    if (this.searchedOccurrences.length === 0) { return; }
    this.showResultsDiv = !this.showResultsDiv;
  }

  showResultDiv(): void {
    this.showResultsDiv = true;
  }

  hideResultDiv(): void {
    this.showResultsDiv = false;
  }

  toggleDisplayResults(): void {
    if (this.displayResults === 'inline') { this.displayResults = 'cards'; return; }
    if (this.displayResults === 'cards') { this.displayResults = 'inline'; return; }
  }

  // ----------------------------
  // ES QUERY PARTS &  ASSEMBLERS
  // ----------------------------

  esQueryAssembler(from?: number): string {
    const mustPart = this.esMustClauseAssembler();
    let shouldPart = this.esShouldClauseAssembler();
    let mustNotPart = this.esMustNotClauseAssembler();
    let boundingBoxPart = this.esBoundingBoxQueryPart();
    let polygonPart = this.esGeoPolygonQueryPart();

    shouldPart      = (shouldPart      !== '' && mustPart !== '') ? ', ' + shouldPart : shouldPart;
    mustNotPart     = (mustNotPart     !== '' && (shouldPart !== '' || mustPart !== '')) ? ', ' + mustNotPart : mustNotPart;
    boundingBoxPart = (boundingBoxPart !== '' && (shouldPart !== '' || mustPart !== '' || mustNotPart !== '')) ? ', ' + boundingBoxPart : boundingBoxPart;
    polygonPart     = (polygonPart     !== '' && (shouldPart !== '' || mustPart !== '' || mustNotPart !== '')) ? ', ' + polygonPart : polygonPart;

    const _from = from ? from : 0;
    const _size = this.occurrencesPaginatorSize;

    const query = `
    {
      "from": ${_from}, "size": ${_size},
      "query": {
        "bool": {
          ${mustPart}
          ${shouldPart}
          ${mustNotPart}
          ${boundingBoxPart}
          ${polygonPart}
        }
      }
    }`;
    return query;
  }

  /**
   * Constructs the ElasticSearch MUST query part
   * Output example :
   * `
   *   "must": [
   *     { "match_phrase": { "flatChildrenValidations": "bdtfx~50284" } },
   *     { "match_phrase": { "flatChildrenValidations": "bdtfx~50912" } }
   *   ]
   * `
   */
  esMustClauseAssembler(): string {
    const occ: Array<string> = this.esOccurrencesMustQueryPart(this.mustContainOccurrences);
    const rel: Array<string> = this.esRelevesMustQueryPart(this.mustContainReleves);
    const level: Array<string> = this.esLevelMustQueryPart(this.levelFilter);
    const layers: Array<string> = this.elLayersMustQueryPart(this.layerFilter);
    const elevation: Array<string> = this.elevationFilterOn ? this.esElevationRangeQueryPart() : [];
    const authors: Array<string> = this.filteredAuthors.length > 0 ? this.esAuthorsQueryPart() : [];
    const biblios: Array<string> = this.filteredBiblios.length > 0 ? this.esBibliosQueryPart() : [];
    const date: Array<string> = this.dateFilterOn ? this.esDateObservedRangeQueryPart() : [];
    let metadata: Array<string> = [];

    if (!this.metadataFilterIncludeMissingMetadata) { metadata = this.esMetadataRangeQueryPart(); }


    const parts = [].concat(...occ, ...rel, ...level, ...layers, ...elevation, ...authors, ...biblios, ...date, ...metadata);

    let stringParts = '';
    let i = 0;
    parts.forEach(p => {
      stringParts = stringParts + p + (i < parts.length - 1 ? ', ' : '');
      i++;
    });
    const mustString = parts.length > 0 ? `"must": [${stringParts}]` : '';
    return mustString;
  }

  /**
   * Constructs the ElasticSearch MUST query part
   * Output example :
   * `
   *   "should": [
   *     { "match_phrase": { "flatChildrenValidations": "bdtfx~50284" } },
   *     { "match_phrase": { "flatChildrenValidations": "bdtfx~50912" } }
   *   ]
   * `
   */
  esShouldClauseAssembler(): string {
    const occ = [];
    const elevation = [];
    const date = [];
    let metadata: Array<string> = [];

    if (this.metadataFilterIncludeMissingMetadata) {
      metadata = this.esMetadataRangeQueryPartOrNoValues();
    } else {
      metadata = this.esMetadataRangeQueryPart();
    }

    const parts = [].concat(...occ, ...elevation, ...date, ...metadata);

    let stringParts = '';
    let i = 0;
    parts.forEach(p => {
      stringParts = stringParts + p + (i < parts.length - 1 ? ', ' : '');
      i++;
    });
    const mustString = parts.length > 0 ? `"should": [${stringParts}]` : '';
    return mustString;
  }

  /**
   * Constructs the ElasticSearch MUST NOT query part
   * Output example :
   * `
   *   "must_not": [
   *     { "match_phrase": { "level": "idiotaxon" } },
   *     { "match_phrase": { "flatChildrenValidations": "bdtfx~50284" } },
   *     { "match_phrase": { "flatChildrenValidations": "bdtfx~50912" } }
   *   ]
   * `
   */
  esMustNotClauseAssembler(): string {
    const occ: Array<string> = this.esOccurrencesMustNotQueryPart(this.mustNotContainOccurrences);
    const rel: Array<string> = this.esRelevesMustNotQueryPart(this.mustNotContainReleves);
    const idiotaxon: Array<string> = this.esOccurrenceMustNotBeIdiotaxonPart();

    const parts = [].concat(...idiotaxon, ...occ, ...rel);

    let stringParts = '';
    let i = 0;
    parts.forEach(p => {
      stringParts = stringParts + p + (i < parts.length - 1 ? ', ' : '');
      i++;
    });
    const mustNotString = parts.length > 0 ? `"must_not": [${stringParts}]` : '';
    return mustNotString;
  }

  /**
   * Constructs the ElasticSearch query part "MUST contains thoses occurrences".
   * Output example :
   * `"must": [
   *   { "match_phrase": { "flatChildrenValidations": "bdtfx~50284" } },
   *   { "match_phrase": { "flatChildrenValidations": "bdtfx~50912" } }
   * ]`
   */
  esOccurrencesMustQueryPart(occurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    occurrenceValidations.forEach(occurrenceValidation => {
      let idTaxo: any = null;
      if (occurrenceValidation.idTaxo !== null) { idTaxo = occurrenceValidation.idTaxo; } else if (occurrenceValidation.validOccurence.idNomen !== null) { idTaxo = occurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${occurrenceValidation.idTaxo}]${occurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "flatChildrenValidations": "${occurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

  /**
   * Constructs the ElasticSearch query part "MUST NOT contains thoses occurrences".
   * Output example :
   * `
   *   { "match_phrase": { "flatChildrenValidations": "bdtfx~50284" } },
   *   { "match_phrase": { "flatChildrenValidations": "bdtfx~50912" } }
   * `
   */
  esOccurrencesMustNotQueryPart(occurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    occurrenceValidations.forEach(occurrenceValidation => {
      let idTaxo: any = null;
      if (occurrenceValidation.idTaxo !== null) { idTaxo = occurrenceValidation.idTaxo; } else if (occurrenceValidation.validOccurence.idNomen !== null) { idTaxo = occurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${occurrenceValidation.idTaxo}]${occurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "flatChildrenValidations": "${occurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    if (!this.returnsChildrenLevelOccurrences && this.returnsChildrenLevelOccurrencesEnabled) {
      parts.push(`{ "exists" : { "field" : "parentLevel" } }`);
    }
    return parts;
  }

  esOccurrenceMustNotBeIdiotaxonPart(): Array<string> {
    return ['{ "match_phrase": { "level": "idiotaxon" } }'];
  }

  /**
   * Constructs the ElasticSearch query part "MUST contains thoses releves (syntaxons)".
   * Output example :
   * `"must": [
   *   { "match_phrase": { "flatValidations": "baseveg~50284" } },
   *   { "match_phrase": { "flatValidations": "baseveg~50912" } }
   * ]`
   */
  esRelevesMustQueryPart(occurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    occurrenceValidations.forEach(occurrenceValidation => {
      let idTaxo: any = null;
      if (occurrenceValidation.idTaxo !== null) { idTaxo = occurrenceValidation.idTaxo; } else if (occurrenceValidation.validOccurence.idNomen !== null) { idTaxo = occurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${occurrenceValidation.idTaxo}]${occurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "flatValidations": "${occurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

  /**
   * Constructs the ElasticSearch query part "MUST NOT contains thoses releves (syntaxons)".
   * Output example :
   * `
   *   { "match_phrase": { "flatValidations": "baseveg~50284" } },
   *   { "match_phrase": { "flatValidations": "baseveg~50912" } }
   * `
   */
  esRelevesMustNotQueryPart(occurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    occurrenceValidations.forEach(occurrenceValidation => {
      let idTaxo: any = null;
      if (occurrenceValidation.idTaxo !== null) { idTaxo = occurrenceValidation.idTaxo; } else if (occurrenceValidation.validOccurence.idNomen !== null) { idTaxo = occurrenceValidation.validOccurence.idNomen; } else { throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${occurrenceValidation.idTaxo}]${occurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`); }
      const matchPhrase = `{ "match_phrase": { "flatValidations": "${occurrenceValidation.repository}~${idTaxo}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

  /**
   * Constructs the ElasticSearch query part "MUST be a 'level' relevés".
   * Output example :
   * `
   *   { "term": { "level": "microcenosis" } }
   * `
   */
  esLevelMustQueryPart(level: 'synusy' | 'microcenosis'): Array<string> {
    return level ? [`{ "term": { "level": "${level}" } }`] : [];
  }

  /**
   * Constructs the ElasticSearch query part "MUST contains thoses layers".
   * Output example :
   * `
   *   { "match_phrase": { "layer": "th" } },
   *   { "match_phrase": { "layer": "h" } }
   * `
   */
  elLayersMustQueryPart(layer: string): Array<string> {
    return layer ? [`{ "term": { "layer": "${layer}" } }`] : [];
  }

  /**
   * Constructs the ElasticSearch geo "envelope" query part.
   * Output example :
   * `"filter": {
   *    "geo_shape": {
   *      "geometry": {
   *        "shape": {
   *          "type": "envelope",
   *          "coordinates": [
   *            [0.6286756497282032, 45.213003555993964], [5.992745974589147, 42.35854391749705]
   *          ]
   *        }, "relation": "within"
   *      }
   *    }
   *  }`
   */
  esBoundingBoxQueryPart(): string {
    if (this.boundingBox === null) { return ''; }
    const part = `
      "filter": {
        "geo_shape": {
          "geometry": {
            "shape": {
              "type": "envelope",
              "coordinates": [
                [${this.boundingBox.topLeft.lng}, ${this.boundingBox.topLeft.lat}], [${this.boundingBox.bottomRight.lng}, ${this.boundingBox.bottomRight.lat}]
              ]
            }, "relation": "within"
          }
        }
      }
    `;
    return part;
  }

  /**
   * Constructs the ElasticSearch geo "geo_polygon" query part.
   * Output example :
   * `"filter": {
   *    "geo_polygon": {
   *      "centroid": {
   *        "points": [
   *          {"lat": 40, "lon": 1},
   *          {"lat": 40.1, "lon": 1.1}
   *        ]
   *      }
   *    }
   *  }`
   */
  esGeoPolygonQueryPart(): string {
    if (this.polygon === null) { return ''; }
    let points = '';
    let i = 0;
    this.polygon.coordinates[0].forEach(point => {
      points += `{"lat": ${point[1]}, "lon": ${point[0]}}` + ( i < this.polygon.coordinates[0].length - 1 ? ', ' : '');
      i++;
    });
    const part = `
      "filter": {
        "geo_polygon": {
          "centroid": {
            "points": [
              ${points}
            ]
          }
        }
      }
    `;
    return part;
  }

  esElevationRangeQueryPart(): Array<string> {
    const part = `{ "range": { "elevation": { "gte": ${this.elevationFilterLowValue}, "lte": ${this.elevationFilterHighValue} } } }`;
    return [part];
  }

  esAuthorsQueryPart(): Array<string> {
    const parts = [];
    for (const filteredAuthor of this.filteredAuthors) {
      parts.push(`
      {
        "match": {
          "flatVlObservers": "${filteredAuthor.id}~${filteredAuthor.name}"
        }
      }
      `);
    }
    return parts;
  }

  esBibliosQueryPart(): Array<string> {
    const parts = [];
    for (const filteredBiblio of this.filteredBiblios) {
      parts.push(`
      {
        "match": {
          "vlBiblioSource": "${filteredBiblio.id}~${filteredBiblio.title}"
        }
      }
      `);
    }
    return parts;
  }

  /**
   * Constructs the ElasticSearch date (date observed) query part.
   * Output example :
   * {
   *   "range": {
   *     "dateObserved": {
   *       "gte": "09/04/2019",
   *       "lte": "10/04/2019",
   *       "format": "dd/MM/yyyy"
   *     }
   *   }
   * }
   */
  esDateObservedRangeQueryPart(): Array<string> {
    const part = `
      {
        "range": {
          "dateObserved": {
            "gte": "${this.dateObservedFilterLowValue}",
            "lte": "${this.dateObservedFilterHighValue}",
            "format": "dd/MM/yyyy"
          }
        }
      }
    `;
    return [part];
  }

  esMetadataQueryPart(): Array<string> {
    // metadataToFilter
    const part = ``;
    return [part];
  }

  /**
   * Constructs the ElasticSearch metadata range query part.
   * Output example :
   *
   *   {
   *     "bool": {
   *       "must": [
   *         { "term": { "extendedFieldValues.fieldId": "ph" } },
   *         { "range": { "extendedFieldValues.numericValue": {"gte": "6", "lte": "8"} } }
   *       ]
   *     }
   *   }, {
   *     "bool": {
   *       "must": [
   *         { "term": { "extendedFieldValues.fieldId": "hmv" } },
   *         { "range": { "extendedFieldValues.numericValue": {"gte": "0", "lte": "50"} } }
   *       ]
   *     }
   *   }, {
   *     "bool": {
   *       "must": [
   *         { "term": { "extendedFieldValues.fieldId": "booleanExample" } },
   *         { "term": { "extendedFieldValues.booleanValue": true } }
   *       ]
   *     }
   *   }
   */
  esMetadataRangeQueryPart(boost?: number): Array<string> {
    let parts = '';
    let i = 0;
    this.metadataFilterValues.forEach(filter => {
      if (filter.item.disabled) { return; }
      let minValue: any;
      let maxValue: any;
      if (!filter.item.disabled && filter.data.minDate !== null && filter.data.maxDate !== null) { minValue = filter.data.minDate; maxValue = filter.data.maxDate; }
      if (!filter.item.disabled && filter.data.minValue !== null && filter.data.maxValue !== null) { minValue = +filter.data.minValue; maxValue = +filter.data.maxValue; }
      if (!filter.item.disabled && filter.data.exactValue !== null) { minValue = filter.data.exactValue; maxValue = filter.data.exactValue; }

      let mustTermField: string;
      if (boost && boost > 0) {
        mustTermField = `{ "match": { "extendedFieldValues.fieldId": { "query": ${filter.item.metadata.fieldId}", "boost": "${boost}" } } }`;
      } else {
        mustTermField = `{ "term": { "extendedFieldValues.fieldId": "${filter.item.metadata.fieldId}" } }`;
      }

      // Float value
      if (filter.item.metadata.dataType === FieldDataType.DECIMAL) {
        parts += `
          {
            "bool": {
              "must": [
                ${mustTermField},
                { "range": { "extendedFieldValues.floatValue": {"gte": ${minValue}, "lte": ${maxValue}} } }
              ]
            }
          }
        `;
      } else if (filter.item.metadata.dataType === FieldDataType.INTEGER) {
        // Integer value
        parts += `
          {
            "bool": {
              "must": [
                ${mustTermField},
                { "range": { "extendedFieldValues.integerValue": {"gte": ${minValue}, "lte": ${maxValue}} } }
              ]
            }
          }
        `;
      } else if (filter.item.metadata.dataType === FieldDataType.DATE) {
        // Date value
        parts += `
          {
            "bool": {
              "must": [
                ${mustTermField},
                { "range": { "extendedFieldValues.dateValue": {"gte": "${minValue}", "lte": "${maxValue}", "format": "dd/MM/yyyy"} } }
              ]
            }
          }
        `;
      } else if (filter.item.metadata.dataType === FieldDataType.BOOL) {
        parts += `
          {
            "bool": {
              "must": [
                ${mustTermField},
                { "term": { "extendedFieldValues.booleanValue": ${filter.data.exactValue} } }
              ]
            }
          }
        `;
      }

      if (i < this.metadataFilterValues.length - 1) { parts += ', '; }

      i++;
    });


    return parts !== '' ? [parts] : [];
  }

  /**
   * Constructs the ElasticSearch metadata range query part
   * with "should" not have requested metadata(s) field(s)
   *
   *   {                                          \
   *     "bool": {                                |
   *       ... esMetadataRangeQueryPart ...       |- esMetadataRangeQueryPart() part
   *     }                                        |
   *   }, {                                       /
   *     "bool": {
   *       "must_not": [
   *         {
   *           "bool": {
   *             "should": [
   *               { "term": { "extendedFieldValues.fieldId": "ph" } },
   *               { "term": { "extendedFieldValues.fieldId": "hmv" } }
   *             ]
   *           }
   *         }
   *       ]
   *     }
   *   }
   */
  esMetadataRangeQueryPartOrNoValues(): Array<string> {
    const esMetadataRangeQueryPart = this.esMetadataRangeQueryPart();
    let noMetadataFilterValues = '';

    if (this.metadataFilterValues.length === 0) { return []; }
    let i = 0;
    this.metadataFilterValues.forEach(metadataFilterValue => {
      if (metadataFilterValue.item.disabled) { return; }
      noMetadataFilterValues += `{ "term": { "extendedFieldValues.fieldId": "${metadataFilterValue.item.metadata.fieldId}" } }`;
      noMetadataFilterValues += (i < this.metadataFilterValues.length - 1) ? ', ' : '';
      i++;
    });

    if (esMetadataRangeQueryPart === []) {
      return [];
    }

    const part = `
    {
      "bool": {
        "must": [
          ${esMetadataRangeQueryPart}
        ]
      }
    }, {
      "bool": {
        "must_not": [
          {
            "bool": {
              "should": [
                ${noMetadataFilterValues}
              ]
            }
          }
        ]
      }
    }`;

    return [part];
  }

  // SIDENAV
  previewOccurrenceAction(occurrence: EsOccurrenceModel): void {
    this.resetInfoAndDeleteValues();
    this.occurrenceInfo = occurrence;
    this.appConfig.showActionPanelCloseButton.next(false);
    this.sidenav.open();
  }

  resetInfoAndDeleteValues(): void {
    // this.tableInfo = null;
    this.occurrenceInfo = null;
    // this.tableToDelete = null;
    // this.occurrenceToDelete = null;
  }

  /**
   * Sidenav panel has been closed
   */
  closeSidenav() {
    this.resetInfoAndDeleteValues();
  }

  closePreview(close: boolean): void {
    if (close && close === true) {
      this.sidenav.close();
      this.closeSidenav();
      this.appConfig.showActionPanelCloseButton.next(true);
    }
  }

  // PAGINATOR
  _occurrencePageChanged(pageEvent: PageEvent): void {
    if (pageEvent == null) { return; }

    // page index update
    this.occurrencesPageIndex = pageEvent.pageIndex;

    // number of items per page update
    if (pageEvent.pageSize !== this.occurrencesPaginatorSize) {
      this.occurrencesPaginatorSize = pageEvent.pageSize;
    }

    this.search(this.occurrencesPageIndex * this.occurrencesPaginatorSize);
  }

}



@Component({
  selector: 'vl-metadata-explain-1',
  templateUrl: './modals/explain-metadata-filter-must-contain-empty-metadata.html',
})
export class OccurrenceSearchMetadataModal1Component {

  constructor(public dialogRef: MatDialogRef<OccurrenceSearchMetadataModal1Component>) {}

}
