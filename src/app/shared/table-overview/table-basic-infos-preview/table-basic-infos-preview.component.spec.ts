import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableBasicInfosPreviewComponent } from './table-basic-infos-preview.component';

describe('TableBasicInfosPreviewComponent', () => {
  let component: TableBasicInfosPreviewComponent;
  let fixture: ComponentFixture<TableBasicInfosPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableBasicInfosPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableBasicInfosPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
