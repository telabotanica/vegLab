import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { BiblioService } from 'src/app/_services/biblio.service';
import { Biblio } from 'src/app/_models/biblio.model';

@Component({
  selector: 'vl-biblio-search',
  templateUrl: './biblio-search.component.html',
  styleUrls: ['./biblio-search.component.scss']
})
export class BiblioSearchComponent implements OnInit, OnDestroy {
  @Input() fuzzySearch = false;
  @Input() placeholder = 'Ref. biblio.';
  @Input() biblioStr: string;                 // start with this value
  @Input() autoselectIfOneResult: boolean;
  @Input() inputFullWidth = true;
  @Input() clearAfterEmit = false;
  @Input() set disabled(value: boolean) {
    try {
      if (value === true) { this.biblioControl.disable(); }
      if (value === false) { this.biblioControl.enable(); }
    } catch (error) { /* this.biblioControl is not yet set */}
  }
  @Output() isLoading = new EventEmitter<boolean>();
  @Output() inputChange = new EventEmitter<boolean>();
  @Output() selectedBiblio = new EventEmitter<Biblio>();
  @Output() noResultForStr = new EventEmitter<string>();

  isSearching = false;
  _disabled = false;
  form: FormGroup;
  biblioControl: FormControl;
  materialSetInputValue = false;

  subscription1: Subscription;
  subscription2: Subscription;

  results: Array<Biblio> = [];

  constructor(private biblioService: BiblioService, private fb: FormBuilder) { }

  ngOnInit() {
    this.form = this.fb.group({
      biblio: this.fb.control({value: ''})
    });
    this.biblioControl = new FormControl('');

    // First watcher
    this.subscription1 = this.biblioControl.valueChanges.subscribe(
      r => { this.isSearching = true; this.isLoading.next(true); }
    );

    // Second watcher
    this.subscription2 = this.biblioControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(
        value => {
          this.inputChange.next(true);
          this.materialSetInputValue = false;
          this.results = [];
          if (typeof(value) === 'string') {  // user string query
            return this.biblioService.search(value, this.fuzzySearch);
          } else if (typeof(value) === 'object') {  // material autocomplete set an object (Biblio) as input value
            this.materialSetInputValue = true;
            this.selectedBiblio.next(value);
            if (this.clearAfterEmit) { this.biblioControl.setValue('', {emitEvent: false}); }
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
          this.biblioControl.setValue(results[0], {emitEvent: true});
        } else if (this.results.length === 0) {
          // no result
          if (!this.materialSetInputValue) { this.noResultForStr.next(typeof(this.biblioControl.value) === 'object' ? this.biblioControl.value.title : this.biblioControl.value); }
        }
      }, error => {
        this.isSearching = false;
        this.isLoading.next(false);
        console.log(error);
      }
    );

    if (this.biblioStr)  { this.biblioControl.setValue(this.biblioStr, {emitEvent: true}); }
  }

  ngOnDestroy(): void {
    if (this.subscription1) { this.subscription1.unsubscribe(); }
    if (this.subscription2) { this.subscription2.unsubscribe(); }
  }

  displayFn(observer?: any): string | undefined {
    if (observer && typeof(observer) === 'object') {
      return observer.title;
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
