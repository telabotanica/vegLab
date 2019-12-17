import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TbUserLabelComponent } from './tb-user-label.component';

describe('TbUserLabelComponent', () => {
  let component: TbUserLabelComponent;
  let fixture: ComponentFixture<TbUserLabelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TbUserLabelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TbUserLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
