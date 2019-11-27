import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseflorDiagramSelectorComponent } from './baseflor-diagram-selector.component';

describe('BaseflorDiagramSelectorComponent', () => {
  let component: BaseflorDiagramSelectorComponent;
  let fixture: ComponentFixture<BaseflorDiagramSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BaseflorDiagramSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseflorDiagramSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
