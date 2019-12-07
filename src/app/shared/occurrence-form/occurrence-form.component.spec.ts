import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentTester, speculoosMatchers } from 'ngx-speculoos';

import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MaterialModule } from '../../material-module';

import { OccurrenceFormComponent } from './occurrence-form.component';
import { MetadataInputComponent } from '../../shared/metadata-input/metadata-input.component';

import { UserService } from 'src/app/_services/user.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { MetadataService } from 'src/app/_services/metadata.service';
import { HttpClient } from '@angular/common/http';
import { OccurrenceFormBindingService } from './occurrence-form-binding.service';
import { PhotoService } from 'src/app/_services/photo.service';

import { TbGeolocLibModule } from 'tb-geoloc-lib';
import { TbTsbLibModule } from 'tb-tsb-lib';
import { TbDropfileLibModule } from 'tb-dropfile-lib';
import { Observable, of } from 'rxjs';

/*
private userService: UserService,
    private notificationService: NotificationService,
    private metadataService: MetadataService,
    private fb: FormBuilder,
    private http: HttpClient,
    private occurenceFormBinding: OccurrenceFormBindingService,
    private photoService: PhotoService
*/

class OccurrenceFormComponentTester extends ComponentTester<OccurrenceFormComponent> {
  constructor() {
    super(OccurrenceFormComponent);
  }

  get levelSelect() {
    return this.select('#levelSelect'); // returns a TestSelect object, not any. Similar methods exist for inputs, buttons, etc.
  }

}

describe('OccurrenceFormComponent', () => {
  let tester: OccurrenceFormComponentTester;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        OccurrenceFormComponent,
        MetadataInputComponent
      ],
      imports: [
        ReactiveFormsModule,
        MaterialModule,
        TbGeolocLibModule,
        TbTsbLibModule,
        TbDropfileLibModule
      ],
      providers: [
        OccurrenceFormComponent,
        { provide: UserService, useClass: FakeUserService },
        { provide: NotificationService, useClass: NotificationService },
        { provide: MetadataService, useClass: MetadataService },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: HttpClient, useClass: HttpClient },
        { provide: OccurrenceFormBindingService, useClass: OccurrenceFormBindingService },
        { provide: PhotoService, useClass: PhotoService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    tester = new OccurrenceFormComponentTester();

    // a first call to detectChanges() is necessary. If the component had inputs, you would initialize them
    // before calling detectChanges. For example:
    // tester.someInput = 'someValue';
    tester.detectChanges();

    jasmine.addMatchers(speculoosMatchers);
  });

  it('should have several levels to select', () => {
    expect(1).toEqual(1);
  });
});
/*describe('OccurrenceFormComponent', () => {
  let component: OccurrenceFormComponent;
  let fixture: ComponentFixture<OccurrenceFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrenceFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrenceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});*/

class FakeUserService {
  fakeUser = { id: 1, name: 'Stephane', email: 'stephane@ptt.fr', roles: ['user']};
  fakeAdmin = {id: 2, name: 'Admin', email: 'admin@ptt.fr', roles: ['user', 'admin']};
}
