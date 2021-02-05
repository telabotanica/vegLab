import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { OccurrenceValidationModel } from 'src/app/_models/occurrence-validation.model';

import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { Sye } from 'src/app/_models/sye.model';
import { SyntheticColumn } from 'src/app/_models/synthetic-column.model';
import { Table } from 'src/app/_models/table.model';
import { UserModel } from 'src/app/_models/user.model';

import { UserService } from 'src/app/_services/user.service';

import * as _ from 'lodash';

@Component({
  selector: 'vl-identification-inline',
  templateUrl: './identification-inline.component.html',
  styleUrls: ['./identification-inline.component.scss']
})
export class IdentificationInlineComponent implements OnInit {
  @Input() set element(value: OccurrenceModel | Sye | Table | SyntheticColumn) {
    this._element = _.clone(value);
    if (value && value.validations) {
      this.validations = value.validations;
    }
  }
  @Input() allowDelete = false;

  @Output() elementToDelete = new EventEmitter<OccurrenceValidationModel>();

  currentUser: UserModel; // SSO user
  _element: OccurrenceModel | Sye | Table | SyntheticColumn = null;
  validations: Array<OccurrenceValidationModel> = [];
  myValidations: Array<OccurrenceValidationModel> = undefined;
  otherValidations: Array<OccurrenceValidationModel> = [];
  showAllValidations = false;

  constructor(private userService: UserService) { }

  ngOnInit() {
    // Get current user
    this.currentUser = this.userService.currentUser.getValue();

    // Set validations lists
    this.myValidations = this.currentUser && this.currentUser.id ? _.filter(this.validations, v => v.user.ssoId === this.currentUser.id) : [];
    this.otherValidations = _.difference(this.validations, this.myValidations);
  }

  toggleShowAllValidations() {
    if (this.showAllValidations === false &&
        ((this.myValidations.length > 0 && this.otherValidations.length > 1) ||
        (this.myValidations.length === 0 && this.otherValidations.length > 2))) {
      this.showAllValidations = true  ;
    } else if (this.showAllValidations === true) {
      this.showAllValidations = false;
    }
  }

  deleteElement(validation: OccurrenceValidationModel): void {
    this.elementToDelete.emit(validation);
  }

}
