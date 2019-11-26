import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EcologicalDiagramComponent } from './ecological-diagram.component';

describe('EcologicalDiagramComponent', () => {
  let component: EcologicalDiagramComponent;
  let fixture: ComponentFixture<EcologicalDiagramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EcologicalDiagramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EcologicalDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
