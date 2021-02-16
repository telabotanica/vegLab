import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeterminationComponent } from './determination.component';

describe('DeterminationComponent', () => {
  let component: DeterminationComponent;
  let fixture: ComponentFixture<DeterminationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeterminationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeterminationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
