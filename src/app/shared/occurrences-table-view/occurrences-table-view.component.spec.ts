import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrencesTableViewComponent } from './occurrences-table-view.component';

describe('OccurrencesTableViewComponent', () => {
  let component: OccurrencesTableViewComponent;
  let fixture: ComponentFixture<OccurrencesTableViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrencesTableViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrencesTableViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
