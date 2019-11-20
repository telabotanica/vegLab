import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IdiotaxonImagesComponent } from './idiotaxon-images.component';

describe('IdiotaxonImagesComponent', () => {
  let component: IdiotaxonImagesComponent;
  let fixture: ComponentFixture<IdiotaxonImagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IdiotaxonImagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IdiotaxonImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
