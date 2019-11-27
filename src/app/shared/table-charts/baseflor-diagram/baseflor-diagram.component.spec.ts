import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseflorDiagramComponent } from './baseflor-diagram.component';

describe('BaseflorDiagramComponent', () => {
  let component: BaseflorDiagramComponent;
  let fixture: ComponentFixture<BaseflorDiagramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BaseflorDiagramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseflorDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
