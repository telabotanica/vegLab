import { Component, OnInit, OnDestroy, AfterContentInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators, ValidatorFn } from '@angular/forms';

import { Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';

import { FieldDataType } from '../../_enums/field-data-type-enum';
import { DateAdapter } from '@angular/material';


@Component({
  selector: 'vl-metadata-filter',
  templateUrl: './metadata-filter.component.html',
  styleUrls: ['./metadata-filter.component.scss']
})
export class MetadataFilterComponent implements OnInit, OnDestroy, AfterContentInit {
  @Input() metadata: ExtendedFieldModel;
  @Input() metadataValueID: number;
  @Input() set disabled(value: boolean) {
    this.initialState = value;
    this.changeFilterState(value);
  }
  @Input() deleteOption: boolean;

  @Output() filterValues: EventEmitter<{
    type: 'range' | 'integer' | 'float' | 'date' | 'text' | 'boolean',
    exactValue: any,
    minValue: any,
    maxValue: any,
    minDate: string,
    maxDate: string,
    regexp: string
  }> = new EventEmitter();
  @Output() deletedMetadata: EventEmitter<{id: number, metadata: ExtendedFieldModel}> = new EventEmitter();

  metadataType: 'integer' | 'float' | 'integerRange' | 'floatRange' | 'date' | 'text' | 'boolean' = null;

  // VAR global
  initialState: boolean;

  // VAR integer
  integerFilterValue = null;
  integerFilterValueControl: FormControl = new FormControl({value: null, disabled: false}, [Validators.required, MetadataFilterComponent.isANumberValidator, Validators.pattern('[0-9]+')]);
  integerFilterValueSubscriber: Subscription;

  // VAR integer Range
  integerRangeFilterLowValue = 0;
  integerRangeFilterHighValue = 10;
  integerRangeUnit = '';
  integerRangeFilterOptions = {
    floor: 0,
    ceil: 10,
    disabled: false,
    step: null,
    showTicks: false,
    showTicksValues: false,
    logScale: false,
    translate: (value: number): string => {
      return value + this.integerRangeUnit;
    },
    combineLabels: (minValue: string, maxValue: string): string => {
      return 'entre ' + minValue + ' et ' + maxValue;
    }
  };

  // VAR float
  floatFilterValue = null;
  floatFilterValueControl: FormControl = new FormControl({value: null, disabled: false}, [Validators.required, MetadataFilterComponent.isANumberValidator, Validators.pattern('[0-9]+(.[0-9]+)?')]);
  floatFilterValueSubscriber: Subscription;

  // VAR float Range
  floatRangeFilterLowValue = 0;
  floatRangeFilterHighValue = 10;
  floatRangeUnit = '';
  floatRangeFilterOptions = {
    floor: 0,
    ceil: 10,
    disabled: false,
    step: null,
    showTicks: false,
    showTicksValues: false,
    logScale: false,
    translate: (value: number): string => {
      return value + this.integerRangeUnit;
    },
    combineLabels: (minValue: string, maxValue: string): string => {
      return 'entre ' + minValue + ' et ' + maxValue;
    }
  };

  // VAR date
  dateFilterMinValueControl: FormControl = new FormControl({value: null, disabled: false}, [Validators.required]);
  dateFilterMaxValueControl: FormControl = new FormControl({value: null, disabled: false}, [Validators.required]);
  dateFilterMinValueSubscriber: Subscription;
  dateFilterMaxValueSubscriber: Subscription;

  // VAR text
  textFilterValue = null;
  textFilterValidators: Array<ValidatorFn> = [];
  textFilterValueControl: FormControl = new FormControl({value: null, disabled: false}, [Validators.required]);
  textFilterValueSubscriber: Subscription;

  // VAR boolean
  booleanFilterValue = null;
  booleanFilterOn = true;

  constructor(private dateAdapter: DateAdapter<any>) { }

  /**
   * Set up filter
   */
  ngOnInit() {
    // INTEGER FILTER SETUP
    if (this.metadata.dataType === FieldDataType.INTEGER && !this.metadata.minValue && !this.metadata.maxValue) {
      this.metadataType = 'integer';
      // Default value
      if (this.metadata.defaultValue && typeof(+this.metadata.defaultValue) === 'number') {
        this.integerFilterValueControl.setValue(+this.metadata.defaultValue, {emitEvent: false});
      }
      // Value change
      this.integerFilterValueSubscriber = this.integerFilterValueControl.valueChanges
        .pipe(
          distinctUntilChanged(),
          debounceTime(400)
        )
        .subscribe(value => {
          this.filterValues.next({
            type: 'integer',
            exactValue: value,
            minValue: null,
            maxValue: null,
            minDate: null,
            maxDate: null,
            regexp: null
          });
        });
      // Emit values at startup
      if (this.integerFilterValueControl.value) {
        this.filterValues.next({
          type: 'float',
          exactValue: this.integerFilterValueControl.value,
          minValue: null,
          maxValue: null,
          minDate: null,
          maxDate: null,
          regexp: null
        });
      }
    }

    // INTEGER RANGE FILTER SETUP
    if (this.metadata.dataType === FieldDataType.INTEGER && (this.metadata.minValue !== this.metadata.maxValue)) {
      this.metadataType = 'integerRange';
      this.integerRangeFilterLowValue = this.metadata.minValue;
      this.integerRangeFilterHighValue = this.metadata.maxValue;
      this.integerRangeFilterOptions.floor = this.metadata.minValue;
      this.integerRangeFilterOptions.ceil = this.metadata.maxValue;
      // Unit
      if (this.metadata.unit) { this.integerRangeUnit = this.metadata.unit; }
      // Step value
      if (this.metadata.filterStep) {this.integerRangeFilterOptions.step = this.metadata.filterStep; }
      if (this.integerRangeFilterOptions.step) {
        this.integerRangeFilterOptions.showTicks = true;
      }
      // Logarithmic scale
      if (this.metadata.filterLogarithmic) {
        if (this.integerRangeFilterOptions.floor === 0) { this.integerRangeFilterOptions.floor = 1; }
        this.integerRangeFilterOptions.logScale = true;
      }
      // Emit values at startup
      this.integerRangeValueChange({value: this.integerRangeFilterLowValue, highValue: this.integerRangeFilterHighValue}, true);
    }

    // FLOAT FILTER SETUP
    if (this.metadata.dataType === FieldDataType.DECIMAL && !this.metadata.minValue && !this.metadata.maxValue) {
      this.metadataType = 'float';
      // Default value
      if (this.metadata.defaultValue && typeof(+this.metadata.defaultValue) === 'number') {
        this.floatFilterValueControl.setValue(+this.metadata.defaultValue, {emitEvent: false});
      }
      // Value change
      this.floatFilterValueSubscriber = this.floatFilterValueControl.valueChanges
        .pipe(
          distinctUntilChanged(),
          debounceTime(400)
        )
        .subscribe(value => {
          this.filterValues.next({
            type: 'float',
            exactValue: value,
            minValue: null,
            maxValue: null,
            minDate: null,
          maxDate: null,
            regexp: null
          });
        });
      // Emit values at startup
      if (this.floatFilterValueControl.value) {
        this.filterValues.next({
          type: 'float',
          exactValue: this.floatFilterValueControl.value,
          minValue: null,
          maxValue: null,
          minDate: null,
          maxDate: null,
          regexp: null
        });
      }
    }

    // FLOAT RANGE FILTER SETUP
    if (this.metadata.dataType === FieldDataType.DECIMAL && (this.metadata.minValue !== this.metadata.maxValue)) {
      this.metadataType = 'floatRange';
      this.floatRangeFilterLowValue = this.metadata.minValue;
      this.floatRangeFilterHighValue = this.metadata.maxValue;
      this.floatRangeFilterOptions.floor = this.metadata.minValue;
      this.floatRangeFilterOptions.ceil = this.metadata.maxValue;
      // is there some unit ?
      if (this.metadata.unit) { this.floatRangeUnit = this.metadata.unit; }
      // is there a step value ?
      if (this.metadata.filterStep) {this.floatRangeFilterOptions.step = this.metadata.filterStep; }
      if (this.floatRangeFilterOptions.step) {
        this.floatRangeFilterOptions.showTicks = true;
      }
      // logarithmic scale ?
      if (this.metadata.filterLogarithmic) {
        if (this.floatRangeFilterOptions.floor === 0) { this.floatRangeFilterOptions.floor = 1; }
        this.floatRangeFilterOptions.logScale = true;
      }
      // Emit values at startup
      this.floatRangeValueChange({value: this.floatRangeFilterLowValue, highValue: this.floatRangeFilterHighValue}, true);
    }

    // DATE FILTER SETUP
    if (this.metadata.dataType === FieldDataType.DATE) {
      this.metadataType = 'date';
      this.dateFilterMinValueSubscriber = this.dateFilterMinValueControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(400)
      )
      .subscribe(value => {
        if (this.dateFilterMinValueControl.value !== null && this.dateFilterMaxValueControl.value !== null) {
          this.filterValues.next({
            type: 'date',
            exactValue: null,
            minValue: null,
            maxValue: null,
            minDate: this.dateAdapter.format(this.dateFilterMinValueControl.value, 'DD/MM/YYYY'),
            maxDate: this.dateAdapter.format(this.dateFilterMaxValueControl.value, 'DD/MM/YYYY'),
            regexp: null
          });
        }
      });
      this.dateFilterMaxValueSubscriber = this.dateFilterMaxValueControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(400)
      )
      .subscribe(value => {
        if (this.dateFilterMinValueControl.value !== null && this.dateFilterMaxValueControl.value !== null) {
          this.filterValues.next({
            type: 'date',
            exactValue: null,
            minValue: null,
            maxValue: null,
            minDate: this.dateAdapter.format(this.dateFilterMinValueControl.value, 'DD/MM/YYYY'),
            maxDate: this.dateAdapter.format(this.dateFilterMaxValueControl.value, 'DD/MM/YYYY'),
            regexp: null
          });
        }
      });
    }

    // TEXT FILTER SETUP
    if (this.metadata.dataType === FieldDataType.TEXT) {
      this.metadataType = 'text';
      // Validators
      if (this.metadata.regexp && this.metadata.regexp !== null) {
        this.textFilterValueControl.setValidators(Validators.compose([Validators.required, Validators.pattern(this.metadata.regexp)]));
      }
      // Default value
      if (this.metadata.defaultValue) {
        this.textFilterValueControl.setValue(this.metadata.defaultValue, {emitEvent: true});
      }
      this.textFilterValueSubscriber = this.textFilterValueControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(400)
      )
      .subscribe(value => {
        if (this.textFilterValueControl.value !== null) {
          this.filterValues.next({
            type: 'text',
            exactValue: this.textFilterValueControl.value,
            minValue: null,
            maxValue: null,
            minDate: null,
            maxDate: null,
            regexp: null
          });
        }
      });
    }

    // BOOLEAN FILTER SETUP
    if (this.metadata.dataType === FieldDataType.BOOL) {
      this.metadataType = 'boolean';

      // Emit true as startup
      this.filterValues.next({
        type: 'boolean',
        exactValue: true,
        minValue: null,
        maxValue: null,
        minDate: null,
        maxDate: null,
        regexp: null
      });
    }
  }

  /**
   * Unsubscribe
   */
  ngOnDestroy() {
    try { this.integerFilterValueSubscriber.unsubscribe(); } catch (e) { }
    try { this.floatFilterValueSubscriber.unsubscribe(); } catch (e) { }
    try { this.dateFilterMinValueSubscriber.unsubscribe(); } catch (e) { }
    try { this.dateFilterMaxValueSubscriber.unsubscribe(); } catch (e) { }
    try { this.textFilterValueSubscriber.unsubscribe(); } catch (e) { }
  }

  /**
   * When a metadata filter is initialized with a disabled value, AfterContentInit hook allows
   * to set the good value (AfterViewInit would throw the 'Expression has changes after it was checked')
   */
  ngAfterContentInit(): void {
    this.changeFilterState(this.initialState);
  }

  toggleBooleanFilterChange(event: any) {
    this.filterValues.next({
      type: 'boolean',
      exactValue: event.checked,
      minValue: null,
      maxValue: null,
      minDate: null,
      maxDate: null,
      regexp: null
    });
  }

  /**
   * Set filter enabled or diabled
   * Refresh the filter options because change detection would not apply when changing object property
   * Note : this.metadataType is initialized inside onInit method and so, isn't available at startup (Input set disabled method)
   */
  changeFilterState(disabled: boolean): void {
    switch (this.metadataType) {
      case 'integer':
        disabled ? this.integerFilterValueControl.disable() : this.integerFilterValueControl.enable();
        break;
      case 'integerRange':
        const newIntegerRangeFilterOptions = Object.assign({}, this.integerRangeFilterOptions);
        newIntegerRangeFilterOptions.disabled = disabled;
        this.integerRangeFilterOptions = newIntegerRangeFilterOptions;
        break;
      case 'float':
        disabled ? this.floatFilterValueControl.disable() : this.floatFilterValueControl.enable();
        break;
      case 'floatRange':
        const newFloatRangeOptions = Object.assign({}, this.floatRangeFilterOptions);
        newFloatRangeOptions.disabled = disabled;
        this.floatRangeFilterOptions = newFloatRangeOptions;
        break;
      case 'date':
        if (disabled) {
          this.dateFilterMinValueControl.disable();
          this.dateFilterMaxValueControl.disable();
        } else {
          this.dateFilterMinValueControl.enable();
          this.dateFilterMaxValueControl.enable();
        }
        break;
      case 'text':
        if (disabled) {
          this.textFilterValueControl.disable();
        } else {
          this.textFilterValueControl.enable();
        }
        break;
      case 'boolean': {
        this.booleanFilterOn = disabled ? false : true;
        break;
      }
      default:
        break;
    }
  }

  /**
   * If integer range has changed,
   * set new values and emit them
   * @param values incomming form ng5-slider component
   */
  integerRangeValueChange(values: {pointer?: any, value: number, highValue: number}, forceEmit = false) {
    const oldLowValue = this.integerRangeFilterLowValue;
    const oldHighValue = this.integerRangeFilterHighValue;
    const newLowValue = values.value;
    const newHighValue = values.highValue;
    if (oldLowValue !== newLowValue || oldHighValue !== newHighValue || forceEmit) {
      this.integerRangeFilterLowValue = newLowValue;
      this.integerRangeFilterHighValue = newHighValue;
      this.filterValues.emit({
        type: 'range',
        exactValue: null,
        minValue: this.integerRangeFilterLowValue,
        maxValue: this.integerRangeFilterHighValue,
        minDate: null,
        maxDate: null,
        regexp: null
      });
    }
  }

  /**
   * If float range has changed,
   * set new values and emit them
   * @param values incomming form ng5-slider component
   */
  floatRangeValueChange(values: {pointer?: any, value: number, highValue: number}, forceEmit = false) {
    const oldLowValue = this.floatRangeFilterLowValue;
    const oldHighValue = this.floatRangeFilterHighValue;
    const newLowValue = values.value;
    const newHighValue = values.highValue;
    if (oldLowValue !== newLowValue || oldHighValue !== newHighValue || forceEmit) {
      this.floatRangeFilterLowValue = newLowValue;
      this.floatRangeFilterHighValue = newHighValue;
      this.filterValues.emit({
        type: 'range',
        exactValue: null,
        minValue: this.floatRangeFilterLowValue,
        maxValue: this.floatRangeFilterHighValue,
        minDate: null,
        maxDate: null,
        regexp: null
      });
    }
  }

  // tslint:disable-next-line:member-ordering
  static isANumberValidator(control: FormControl) {
    if (!isNaN(control.value)) { return null; }
    return { NaN: true };
  }

  deleteMetadata() {
    this.deletedMetadata.emit({id: this.metadataValueID, metadata: this.metadata});
  }

}
