import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrenceValidationsPreviewComponent } from './occurrence-validations-preview.component';

describe('OccurrenceValidationsPreviewComponent', () => {
  let component: OccurrenceValidationsPreviewComponent;
  let fixture: ComponentFixture<OccurrenceValidationsPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrenceValidationsPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrenceValidationsPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
