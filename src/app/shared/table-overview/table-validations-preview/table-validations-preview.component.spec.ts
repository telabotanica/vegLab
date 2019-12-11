import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableValidationsPreviewComponent } from './table-validations-preview.component';

describe('TableValidationsPreviewComponent', () => {
  let component: TableValidationsPreviewComponent;
  let fixture: ComponentFixture<TableValidationsPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableValidationsPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableValidationsPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
