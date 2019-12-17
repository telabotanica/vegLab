import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrenceBasicInfosPreviewComponent } from './occurrence-basic-infos-preview.component';

describe('OccurrenceBasicInfosPreviewComponent', () => {
  let component: OccurrenceBasicInfosPreviewComponent;
  let fixture: ComponentFixture<OccurrenceBasicInfosPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrenceBasicInfosPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrenceBasicInfosPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
