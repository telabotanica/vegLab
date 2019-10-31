import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription, Observable, empty } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';

import { NominatimObject } from '../../_models/nominatim-object.model';

@Component({
  selector: 'vl-city-search',
  templateUrl: './city-search.component.html',
  styleUrls: ['./city-search.component.scss']
})
export class CitySearchComponent implements OnInit, OnDestroy {
  @Output() location = new EventEmitter<{type: 'city' | 'departement', location: NominatimObject}>();

  form: FormGroup;
  placeInputPlaceholder = 'Trouver un lieu';
  isLoadingAddress = false;
  geoSearchResults: Array<NominatimObject> = [];
  geoSearchSubscription = new Subscription();
  addressSelectedChangedFlag = false; // see https://github.com/angular/angular/issues/14668

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.form = new FormGroup({
      country: new FormControl('fr'),
      locationType: new FormControl('city'),
      placeInput: new FormControl('')
    });

    this.geoSearchSubscription = this.form.controls.placeInput.valueChanges
    .pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(value => {
        this.isLoadingAddress = true;
        this.clearResults();

        // Prevent double API call because placeInput.setValue('...', {emitEvent: false}) is not respected
        // see https://github.com/angular/angular/issues/14668
        //     https://stackoverflow.com/questions/39857486/how-to-not-emit-event-while-editing-a-form-control-value-in-angular-2
        if (this.addressSelectedChangedFlag) {
          this.addressSelectedChangedFlag = false;
          this.isLoadingAddress = false; return empty();
        } else {
          return this.geocode(value);
        }
      })
    ).subscribe(results => {
      this.isLoadingAddress = false;
      this.geoSearchResults = results;
      console.log(this.geoSearchResults);
    }, (error) => {
      // @toto manage error
      this.isLoadingAddress = false;
    });
  }

  ngOnDestroy(): void {
    this.geoSearchSubscription.unsubscribe();
  }

  countryChange(value: string) {
    this.clearFormAndResults();
  }

  locationTypeChange(value: string) {
    this.clearFormAndResults();
  }

  addressSelectedChanged(value: any) {
    this.addressSelectedChangedFlag = true;
    this.form.controls.placeInput.setValue(this.displayPlace(value.option.value), {emitEvent: false});
    const locationType = this.form.controls.locationType.value;
    this.location.next({type: locationType, location: value.option.value as NominatimObject});
  }

  /**
   * How to display a city / a departement
   */
  displayPlace(place?: NominatimObject): string {
    let location: string = null;
    let postCode: string = null;

    if (!place) { return undefined; }

    postCode = place.address.postcode;

    // is a city ?
    if (place && (place.address.city || place.address.village)) {
      if (place.address.city && place.address.city !== '' && postCode) { location = postCode + ' '  + place.address.city; }
      if (place.address.city && place.address.city !== '' && !postCode) { location = place.address.city; }
      if (location === null && place.address.village && place.address.village !== '' && postCode) { location = postCode + ' ' + place.address.village; }
      if (location === null && place.address.village && place.address.village !== '' && !postCode) { location = place.address.village; }
      if (location === null) { location = '?'; }
    }

    // is a departement ?
    if (place && !place.address.city && !place.address.village) {
      if (place.address.county && place.address.county !== '') {
        location = place.address.county;
      } else { location = '?'; }
    }

    return location !== null ? location : '?';
  }

  geocode(value: string): Observable<any> {
    if (value === null) { return empty(); } // Avoid sending request on form reset
    let query: string = null;
    if (this.form.controls.locationType.value === 'city') {
      const city = this.form.controls.placeInput.value;
      query = `https://nominatim.openstreetmap.org/?format=json&type=administrative&city=${city}&country=france&addressdetails=1&format=json&limit=10&polygon_geojson=1`;
    } else if (this.form.controls.locationType.value === 'departement') {
      const departement = this.form.controls.placeInput.value;
      query = `https://nominatim.openstreetmap.org/?format=json&type=administrative&county=${departement}&country=france&addressdetails=1&format=json&limit=10&polygon_geojson=1`;
    }

    if (query === null) {
      return empty();
    }

    const apiUrl = query;
    return this.http.get(apiUrl).pipe(
      map((obj: NominatimObject) => obj)
    );

  }

  clearFormAndResults(): void {
    this.clearResults();
    this.form.controls.placeInput.setValue('', {emitEvent: false});
  }

  clearResults(): void {
    this.geoSearchResults = [];
  }

}
