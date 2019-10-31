import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObserverSearchComponent } from './observer-search.component';

describe('ObserverSearchComponent', () => {
  let component: ObserverSearchComponent;
  let fixture: ComponentFixture<ObserverSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObserverSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObserverSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
