import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SophyImportAndSplitCsvComponent } from './sophy-import-and-split-csv.component';

describe('SophyImportAndSplitCsvComponent', () => {
  let component: SophyImportAndSplitCsvComponent;
  let fixture: ComponentFixture<SophyImportAndSplitCsvComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SophyImportAndSplitCsvComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SophyImportAndSplitCsvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
