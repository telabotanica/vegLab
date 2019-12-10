import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesTableViewComponent } from './tables-table-view.component';

describe('TablesTableViewComponent', () => {
  let component: TablesTableViewComponent;
  let fixture: ComponentFixture<TablesTableViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TablesTableViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TablesTableViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
