import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { Subscription, Observable, Subscriber } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

import { UserService } from 'src/app/_services/user.service';
import { NotificationService } from '../../_services/notification.service';
import { MetadataService } from 'src/app/_services/metadata.service';
import { OccurrenceFormBindingService } from './occurrence-form-binding.service';
import { PhotoService } from '../../_services/photo.service';

import { UserModel } from 'src/app/_models/user.model';
import { OccurrenceModel } from '../../_models/occurrence.model';
import { RepositoryItemModel } from 'tb-tsb-lib';
import { LocationModel } from 'tb-geoloc-lib/lib/_models/location.model';
import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';

import { InputSource } from '../../_enums/input-source-enum';

import * as _ from 'lodash';
import * as l from '../../_enums/layer-list';
import { Level } from '../../_enums/level-enum';

import { environment } from 'src/environments/environment';

// import * as moment from 'moment';

@Component({
  selector: 'vl-occurrence-form',
  templateUrl: './occurrence-form.component.html',
  styleUrls: ['./occurrence-form.component.scss']
})
export class OccurrenceFormComponent implements OnInit, OnDestroy {
  @ViewChild('coef') coefEl: ElementRef<HTMLElement>;
  // @ViewChild('tsboccurrence') tsbOccEl: ElementRef<HTMLElement>;

  // --------
  // Var user
  // --------
  user: UserModel;

  // --------------
  // VAR occurrence
  // --------------
  occurrence: OccurrenceModel;
  isSendingOccurrence = false;
  // xOccurrence: OccurrenceModel;                // xOccurrence                    ie: microcenosis || synusy
  // yOccurrences: Array<OccurrenceModel> = [];   //  \_1-n : yOccurences           ie: synusies     || idiotaxa
  // zOccurrences: Array<OccurrenceModel> = [];   //          \_1-n : zOccurrences  ie: idiotaxa     || (none)

  // ------------
  // VAR metadata
  // ------------
  metadataAvailable: Array<ExtendedFieldModel>;
  filteredMetadatas: Observable<Array<ExtendedFieldModel>>;
  metadatas: Array<{metadata: ExtendedFieldModel, control: FormControl}> = [];

  // ----------
  // VAR photos
  // ----------
  uploadedPhotos: any = [];

  // --------
  // VAR form
  // --------
  occurrenceForm: FormGroup;
  maxOccurrenceDate = new Date(Date.now());
  mapLayers = ['opentopomap'];
  allowedPhotoTypes = ['jpeg', 'png'];
  // tslint:disable-next-line:variable-name
  _resetTaxoInput = false;
  occurrences: Array<{ layer: string, taxa: RepositoryItemModel, coef: string }> = [];
  layerList = l.layerList;
  currentLevel = null;
  currentLayer = 'h';
  currentTaxa: RepositoryItemModel = null;
  currentCoef: string = null;
  currentLocation: LocationModel = null;
  currentCitedSyntaxon: RepositoryItemModel = null;

  tbRepositoriesConfig = environment.tbRepositoriesConfig;

  // -----------
  // SUBSCRIBERS
  // -----------
  userEventsSubscription: Subscription;
  metadataSubscriber: Subscription;

  // ----
  // CODE
  // ----
  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private metadataService: MetadataService,
    private fb: FormBuilder,
    private http: HttpClient,
    private occurenceFormBinding: OccurrenceFormBindingService,
    private photoService: PhotoService) { }

  ngOnInit() {
    // subscribe to user events
    this.userEventsSubscription = this.userService.userEvents.subscribe(user => this.user = user);

    // user undefined ?
    // @Todo manage undefined user

    // Create forms
    this.initOccurrenceForm();

    // Var init
    this.currentLevel = this.occurrenceForm.controls.level.value;

    // Get all available metadata
    this.metadataSubscriber = this.metadataService.metadataList.subscribe(data => { this.metadataAvailable = data; });

    // Watch metadata list changes
    this.filteredMetadatas = this.occurrenceForm.controls.addMetadataInput.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filterMetadata(value))
      );
  }

  ngOnDestroy() {
    if (this.userEventsSubscription) { this.userEventsSubscription.unsubscribe(); }
    if (this.metadataSubscriber) { this.metadataSubscriber.unsubscribe(); }
  }

  private initOccurrenceForm() {
    this.occurrenceForm = new FormGroup({
      observer: new FormControl('', [Validators.required]),
      observerInstitution: new FormControl(''),
      dateObserved: new FormControl({value: '', disabled: false}, [Validators.required]),
      level: new FormControl(Level.SYNUSY),
      repo: new FormControl('bdtfx'),
      layer: new FormControl({value: 'h', disabled: false}),
      coef: new FormControl(''),
      addMetadataInput: new FormControl('')
    });

    if (this.user && this.user !== null) {
      this.occurrenceForm.controls.observer.setValue(this.user.name, {emitEvent: false});
    }
  }

  // ------------------
  // User inputs change
  // ------------------

  addLocation(data) {
    this.currentLocation = data;
  }

  addTaxa(taxa: RepositoryItemModel) {
    this.currentTaxa = taxa;
    if (this.occurrenceIsComplete()) {
      this.addOccurrence();
    } else {
      setTimeout(() => { this.coefEl.nativeElement.focus(); }, 0);
    }
  }

  addCoef(value: string) {
    this.currentCoef = value;
    if (this.occurrenceIsComplete()) { this.addOccurrence(); }
  }

  /**
   * User has selected another level
   * @param value : 'synusy', 'microcenosis', ...
   */
  levelChange(value): void {
    // Change from microcenosis to synusy
    if (this.currentLevel === Level.MICROCENOSIS && value === Level.SYNUSY) {
      // We can accept only one layer for a synusy level occurence
      if (this.getUniqLayersList().length > 1) {
        // We have more than one layer -> we can't allow the level change, user has to remove some layers...
        this.notificationService.warn('Vous ne pouvez pas basculer un relevé sigmatiste en relevé synusial car plusieurs strates de végétations contiennent déjà des données');
        this.occurrenceForm.controls.level.setValue(this.currentLevel, {emitEvent: false});
        return;
      }
    }
    this.currentLevel = value;
  }

  citedSyntaxonChange(value: RepositoryItemModel) {
    this.currentCitedSyntaxon = value;
  }

  layerChange(value: string) {
    const actualAndSelectedUniqLayers = _.uniq(_.concat(this.getUniqLayersList(), value));
    this.currentLayer = value;
  }

  // ---------------------
  // Occurrences managment
  // ---------------------

  occurrenceIsComplete(): boolean {
    return (this.currentLayer !== null && this.currentTaxa !== null && this.currentCoef !== null) ? true : false;
  }

  addOccurrence(): void {
    if (!_.find(this.occurrences, {layer: this.currentLayer, taxa: this.currentTaxa})) {
      const occ = {
        layer: this.currentLayer,
        taxa: this.currentTaxa,
        coef: this.currentCoef
      };
      this.occurrences.push(occ);
      this.resetTaxaCoefCurrentValues();
      this.resetCoefInput();
      this.resetTaxoInput();
    } else {
      // Notify user that this occurrence already exits
      this.notificationService.notify('Vous ne pouvez pas entrer plusieurs fois le même taxon dans la même strate');
    }
  }

  deleteOccurrence(occ) {
    let i = 0;
    for (const occurrence of this.occurrences) {
      if (occurrence === occ) {this.occurrences.splice(i, 1); }
      i++;
    }
  }

  getOccurrences(): Array<{ layer: string, taxa: RepositoryItemModel, coef: string }> {
    const response = _.sortBy(this.occurrences, ['layer']);
    return response;
  }

  // ----------------------------------
  // Form state & validation managment
  // ----------------------------------

  /**
   * Are levels consistent regarding the data ?
   * ie: if level==='synusy', all occurrences.layer must be identical
   */
  isMultipleLayersDataset(): boolean {
    if (this.occurrenceForm.controls.level.value === Level.SYNUSY && this.getUniqLayersList().length > 1) { return false; }
    return true;
  }

  getLayersList(): Array<string> {
    const list = [];
    for (const occ of this.occurrences) {
      list.push(occ.layer);
    }
    return list;
  }

  getUniqLayersList(): Array<string> {
    return _.uniq(this.getLayersList());
  }

  userCanChangeLayers(): boolean {
    if (this.occurrenceForm.controls.level.value === Level.SYNUSY) {
      if (this.occurrences.length > 0) {
        return false;
      }
    }
    return true;
  }

  isFormValid(): boolean {
    let metadataAreValid = false;
    let nbValidMetadata = 0;
    this.metadatas.forEach(metadataContext => {
      if (metadataContext.control.valid) { nbValidMetadata++; }
    });
    if (nbValidMetadata === this.metadatas.length) { metadataAreValid = true; }
    if (
      this.occurrenceForm.valid
      && metadataAreValid
      && this.currentLocation !== null
      && this.occurrences.length > 0) { return true; }
    return false;
  }

  // ------
  // Photos
  // ------
  uploadedPhotosEvent(photos: any) {
    this.uploadedPhotos.push(photos);
    console.log(photos);
  }

  // --------
  // Metadata
  // --------
  addMetadata(event: any): void {
    const metadataToAdd = event.option.value as ExtendedFieldModel;
    const m = this.metadataService.createExtendedInput(metadataToAdd);
    this.metadatas.push(m);
    this.occurrenceForm.controls.addMetadataInput.setValue('', {emitEvent: false});
  }

  removeMetadata(metadataContext: {metadata: ExtendedFieldModel, control: FormControl}): void {
    let i = 0;
    this.metadatas.forEach(m => {
      if (m.metadata === metadataContext.metadata && m.control === metadataContext.control) {
        this.metadatas.splice(i, 1);
      }
      i++;
    });
  }

  private _filterMetadata(value: string): Array<ExtendedFieldModel> {
    // value could be an object because of mat-option value is an object (see template)
    if (typeof(value) === 'object') { return []; }

    const filterValue = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filteredValues: Array<ExtendedFieldModel> = [];
    this.metadataAvailable.forEach(ma => {
      if (
        ma.fieldId.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(filterValue) !== -1 ||
        ma.extendedFieldTranslations[0].label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(filterValue) !== -1 ||
        (ma.extendedFieldTranslations[0].description && ma.extendedFieldTranslations[0].description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(filterValue) !== -1)
      ) {
        filteredValues.push(ma);
      }
    });
    return filteredValues;
  }

  displayMetadataAutocomplete(metadata?: ExtendedFieldModel): string {
    return  metadata ? metadata.fieldId : '';
  }

  // ------------------
  // Bind and send data
  // ------------------

  bindOccurrenceToSend(): void {
    if (this.isFormValid()) {
      this.isSendingOccurrence = true;

      // Bind data & metadata
      this.occurrence = this.occurenceFormBinding.bindOccurrenceData(
        this.currentCitedSyntaxon,
        this.currentLevel,
        this.currentLocation,
        this.occurrences,
        this.occurrenceForm,
        this.user,
        this.metadatas);

      // Bind uploaded photos
      if (this.uploadedPhotos.length > 0) {
        // this.occurrence.photos = this.uploadedPhotos;
      }

      console.log(this.occurrence);

      // POST occurrence via API
      this.http.post(`${environment.apiBaseUrl}/occurrences`, this.occurrence)
      .subscribe(
        occ => {
          // @TODO Link photos to occurrence (photoService)
          this.isSendingOccurrence = false;
          console.log(occ);
        },
        error => {
          this.isSendingOccurrence = false;
          this.notificationService.error('Nous ne sommes par parvenus à enregistrer votre relevé');
          // throw Error(error);
          console.log(error);
        }
      );
    }
  }

  // -----
  // Reset
  // -----

  resetTaxaCoefCurrentValues(): void {
    this.currentTaxa = null;
    this.currentCoef = null;
  }

  resetTaxoInput(): void {
    this._resetTaxoInput = true;
    setTimeout(() => {
      this._resetTaxoInput = false;
    }, 50);
  }

  resetCoefInput(): void {
    this.occurrenceForm.controls.coef.setValue('', {emitEvent: false});
  }

  // -----
  // Other
  // -----

  /**
   * Prevent submitting the form by tapping Enter,
   * Also prevent tb-tsb-search-box to emit a value (bug ?)
   * @param event The keyboard event
   */
  formKeydownEnter(event: Event) {
    event.preventDefault();
  }

}
