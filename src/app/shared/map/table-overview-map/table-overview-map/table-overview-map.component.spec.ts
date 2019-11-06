import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableOverviewMapComponent } from './table-overview-map.component';

describe('TableOverviewMapComponent', () => {
  let component: TableOverviewMapComponent;
  let fixture: ComponentFixture<TableOverviewMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableOverviewMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableOverviewMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
