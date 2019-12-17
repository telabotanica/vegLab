import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrenceMetadataPreviewComponent } from './occurrence-metadata-preview.component';

describe('OccurrenceMetadataPreviewComponent', () => {
  let component: OccurrenceMetadataPreviewComponent;
  let fixture: ComponentFixture<OccurrenceMetadataPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrenceMetadataPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrenceMetadataPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
