import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrenceRenderPreviewComponent } from './occurrence-render-preview.component';

describe('OccurrenceRenderPreviewComponent', () => {
  let component: OccurrenceRenderPreviewComponent;
  let fixture: ComponentFixture<OccurrenceRenderPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrenceRenderPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrenceRenderPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
