import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentificationInlineComponent } from './identification-inline.component';

describe('IdentificationInlineComponent', () => {
  let component: IdentificationInlineComponent;
  let fixture: ComponentFixture<IdentificationInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IdentificationInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IdentificationInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
