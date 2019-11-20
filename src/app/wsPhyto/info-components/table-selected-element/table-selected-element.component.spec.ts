import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSelectedElementComponent } from './table-selected-element.component';

describe('TableSelectedElementComponent', () => {
  let component: TableSelectedElementComponent;
  let fixture: ComponentFixture<TableSelectedElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableSelectedElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableSelectedElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
