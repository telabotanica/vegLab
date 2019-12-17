import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrencePreviewComponent } from './occurrence-preview.component';

describe('OccurrencePreviewComponent', () => {
  let component: OccurrencePreviewComponent;
  let fixture: ComponentFixture<OccurrencePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrencePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrencePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
