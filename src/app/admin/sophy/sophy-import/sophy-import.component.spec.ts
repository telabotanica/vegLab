import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SophyImportComponent } from './sophy-import.component';

describe('SophyImportComponent', () => {
  let component: SophyImportComponent;
  let fixture: ComponentFixture<SophyImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SophyImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SophyImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
