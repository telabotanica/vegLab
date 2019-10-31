import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BiblioSearchComponent } from './biblio-search.component';

describe('BiblioSearchComponent', () => {
  let component: BiblioSearchComponent;
  let fixture: ComponentFixture<BiblioSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BiblioSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BiblioSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
