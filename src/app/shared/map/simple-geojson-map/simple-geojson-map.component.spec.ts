import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleGeojsonMapComponent } from './simple-geojson-map.component';

describe('SimpleGeojsonMapComponent', () => {
  let component: SimpleGeojsonMapComponent;
  let fixture: ComponentFixture<SimpleGeojsonMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleGeojsonMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleGeojsonMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
