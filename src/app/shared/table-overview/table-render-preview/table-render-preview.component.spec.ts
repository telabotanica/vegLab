import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableRenderPreviewComponent } from './table-render-preview.component';

describe('TableRenderPreviewComponent', () => {
  let component: TableRenderPreviewComponent;
  let fixture: ComponentFixture<TableRenderPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableRenderPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableRenderPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
