import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrencesInlineComponent } from './occurrences-inline.component';

describe('OccurrencesInlineComponent', () => {
  let component: OccurrencesInlineComponent;
  let fixture: ComponentFixture<OccurrencesInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrencesInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrencesInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
