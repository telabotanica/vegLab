import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ObserverService } from 'src/app/_services/observer.service';
import { Observer } from 'src/app/_models/observer.model';

@Component({
  selector: 'vl-observer-search',
  templateUrl: './observer-search.component.html',
  styleUrls: ['./observer-search.component.scss']/*,
  changeDetection: ChangeDetectionStrategy.OnPush*/
})
export class ObserverSearchComponent implements OnInit, OnDestroy {
  @Input() fuzzySearch = false;
  @Input() placeholder = 'Observateur';
  @Input() observerStr: string;
  @Input() autoselectIfOneResult: boolean;
  @Input() inputFullWidth = true;
  @Input() clearAfterEmit = false;
  @Input() set disabled(value: boolean) {
    try {
      if (value === true) { this.observerControl.disable(); }
      if (value === false) { this.observerControl.enable(); }
    } catch (error) { /* this.observerControl is not yet set */}
  }
  @Output() isLoading = new EventEmitter<boolean>();
  @Output() inputChange = new EventEmitter<boolean>();
  @Output() selectedObserver = new EventEmitter<Observer>();
  @Output() noResultForStr = new EventEmitter<string>();

  isSearching = false;
  _disabled = false;
  form: FormGroup;
  observerControl: FormControl;
  materialSetInputValue = false;

  subscription1: Subscription;
  subscription2: Subscription;

  results: Array<Observer> = [];

  constructor(private observerService: ObserverService, private fb: FormBuilder) { }

  ngOnInit() {
    this.form = this.fb.group({
      observer: this.fb.control({value: ''})
    });
    this.observerControl = new FormControl('');

    // First watcher
    this.subscription1 = this.observerControl.valueChanges.subscribe(
      r => { this.isSearching = true; this.isLoading.next(true); }
    );

    // Second watcher
    this.subscription2 = this.observerControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(
        value => {
          this.inputChange.next(true);
          this.materialSetInputValue = false;
          this.results = [];
          if (typeof(value) === 'string') {  // user string query
            return this.observerService.search(value, this.fuzzySearch);
          } else if (typeof(value) === 'object') {  // material autocomplete set an object (Observer) as input value
            this.materialSetInputValue = true;
            this.selectedObserver.next(value);
            if (this.clearAfterEmit) { this.observerControl.setValue('', {emitEvent: false}); }
            return of([]);
          }
        }
      )
    ).subscribe(
      results => {
        this.isSearching = false;
        this.isLoading.next(false);
        this.results = results;
        if (this.results.length === 1 && this.autoselectIfOneResult) {
          this.observerControl.setValue(results[0], {emitEvent: true});
        } else if (this.results.length === 0) {
          // no result
          if (!this.materialSetInputValue) { this.noResultForStr.next(typeof(this.observerControl.value) === 'object' ? this.observerControl.value.name : this.observerControl.value); }
        }
      }, error => {
        this.isSearching = false;
        this.isLoading.next(false);
        console.log(error);
      }
    );

    if (this.observerStr)  { this.observerControl.setValue(this.observerStr, {emitEvent: true}); }
  }

  ngOnDestroy(): void {
    if (this.subscription1) { this.subscription1.unsubscribe(); }
    if (this.subscription2) { this.subscription2.unsubscribe(); }
  }

  displayFn(observer?: any): string | undefined {
    if (observer && typeof(observer) === 'object') {
      return observer.name;
    } else if (observer && typeof(observer) === 'string') {
      return observer;
    } else {
      return undefined;
    }
  }

  keyDownEnter(): void {
    //
  }

}
