import { Component, OnDestroy, OnInit } from '@angular/core';

import { UserModel } from 'src/app/_models/user.model';
import { VlUser } from 'src/app/_models/vl-user.model';
import { Table } from 'src/app/_models/table.model';
import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { Sye } from 'src/app/_models/sye.model';
import { OccurrenceValidationModel } from 'src/app/_models/occurrence-validation.model';
import { RepositoryItemModel } from 'tb-tsb-lib';
import { SyntheticColumn } from 'src/app/_models/synthetic-column.model';
import { TableActionEnum } from 'src/app/_enums/table-action-enum';

import { TableService } from 'src/app/_services/table.service';
import { UserService } from 'src/app/_services/user.service';
import { RepositoryService } from '../../_services/repository.service';

import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'vl-identification',
  templateUrl: './identification.component.html',
  styleUrls: ['./identification.component.scss']
})
export class IdentificationComponent implements OnInit, OnDestroy {

  // Var repositories
  defaultIdiotaxonRepository: string;
  defaultSyntaxonRepository: string;

  // VARS
  currentUser: UserModel;
  currentVlUser: VlUser;
  currentTable: Table;
  currentTableIsEmpty = false;
  currentTableSubscriber: Subscription;
  tableSelectionSubscriber: Subscription;
  // tableCellSelectionSubscriber: Subscription;

  // VARS selected elements
  columnElements: Array<OccurrenceModel> = [];  // Selected Columns
  syeElement: Sye = null;                       // Selected Sye

  selectedRelevesIds: Array<number> = [];       // Ids of selected relevés (event from Table component : user selected a column)
  selectedSyeIds: Array<number> = [];           // Ids of selected Sye (event from Table component : user selected a column)

  isEditingElement = false;                     // Are we editing some element ?
  editingTable: Table;                          // The Table Object that is being edited (currentTable)
  editingSye: Sye;                              // The Sye...
  editingReleve: OccurrenceModel;               // The Relevé...

  applyChangesToAllSye = false;                 // Pending changes should be applied to all Sye of current table
  applyChangesToEntireTable = false;            // ... to all Sye and relevés (except synusies nested in a microcenosis)
  applyChangesToAllRelevesOfEditedSye = false;  // ... to all relevés of the edited Sye (exceptes synusies nested in a microcenosis)

  elementsToApplyNewIdentifications: Array<any> = [];                     // The elements (Table, Sye, Relevé, Synthetic column) that sould receive the identifications (pendingIdentifications & pendingIdentificationsToRemove)
  pendingIdentifications: Array<OccurrenceValidationModel> = [];          // Identifications that user would apply to the desired elements
  pendingIdentificationsToRemove: Array<OccurrenceValidationModel> = [];  // Identifications belonging to the edites element that have to be removed

  editAs: Array<{value: string, label: string, disabled: boolean}> = [    // The edition is made regarding a context
    { value: 'user', label: 'utilisateur', disabled: false },             // Edition could be made as an User edition or through other contexts
    { value: 'organization', label: 'structure', disabled: true },        // For now, only user context (editAs user) is supported
    { value: 'group', label: 'groupe de travail', disabled: true }        // @Todo add other contexts (default, admin, working group, organization, ...)
  ];                                                                      // The context is used to select one or several "Preferred identifications" depending on the user
  selectedEditAs = this.editAs[0];

  showSynusies = false;

  constructor(private tableService: TableService,
              private userService: UserService,
              private repoService: RepositoryService) { }

  ngOnInit() {
    // Get default repositories
    this.defaultIdiotaxonRepository = this.repoService.defaultIdiotaxonRepository.getValue();
    this.defaultSyntaxonRepository = this.repoService.defaultSyntaxonRepository.getValue();

    // Get current user
    this.currentUser = this.userService.currentUser.getValue();
    this.currentVlUser = this.userService.currentVlUser.getValue();

    // Get currentTable
    this.currentTable = _.cloneDeep(this.tableService.getCurrentTable());
    this.currentTableIsEmpty = this.isCurrentTableEmpty();

    // Subscribe to table change
    this.currentTableSubscriber = this.tableService.currentTableChanged.subscribe(
      change => {
        this.currentTable = _.cloneDeep(this.tableService.getCurrentTable());
        this.currentTableIsEmpty = this.isCurrentTableEmpty();
      }, error => {
        console.log(error);
      }
    );

    // Subscribe to selection change (row, col, etc.)
    this.tableSelectionSubscriber = this.tableService.tableSelectionElement.subscribe(selectedElement => {
      this.selectedRelevesIds = [];
      this.selectedSyeIds = [];

      if (selectedElement === null) { return; } // null element may be send
      this.columnElements = [];
      this.syeElement = null;

      // one or several occurrences selected
      if (selectedElement.occurrenceIds.length > 0 && selectedElement.occurrenceIds[0] !== null) {
        for (const occurrenceId of selectedElement.occurrenceIds) {
          const occurrence = this.tableService.getReleveById(occurrenceId);
          if (occurrence) { this.columnElements.push(occurrence); }
        }
      } else if (selectedElement.occurrenceIds.length === 0 || selectedElement.occurrenceIds[0] == null) {
        // Sye selected
        this.syeElement = this.tableService.getSyeById(this.tableService.getCurrentTable(), selectedElement.syeId);
      }

      if (this.columnElements && this.columnElements.length > 0) {
        _.map(this.columnElements, ce => this.selectedRelevesIds.push(ce.id));
      }
      if (this.syeElement !== null && this.syeElement !== undefined) {
        this.selectedSyeIds = [this.syeElement.id];
      }
    }, error => {
      // @Todo manage error
    });
  }

  ngOnDestroy() {
    if (this.tableSelectionSubscriber) { this.tableSelectionSubscriber.unsubscribe(); }
    if (this.currentTableSubscriber) { this.currentTableSubscriber.unsubscribe(); }
  }

  isCurrentTableEmpty(): boolean {
    return this.tableService.isTableEmpty(this.currentTable);
  }

  getTableValidation(table: Table): Array<OccurrenceValidationModel> {
    if (this.currentTable == null || (this.currentTable && this.currentTable.validations && this.currentTable.validations.length === 0)) {
      return [];
    } else {
      return this.currentTable.validations;
    }
  }

  isSelectedSye(sye: Sye): boolean {
    if (this.selectedSyeIds && this.selectedSyeIds.length > 0) {
      return this.selectedSyeIds.findIndex(s => s === sye.id) !== -1;
    }
  }

  isSelectedReleve(releve: OccurrenceModel): boolean {
    if (this.selectedRelevesIds && this.selectedRelevesIds.length > 0) {
      return this.selectedRelevesIds.findIndex(r => r === releve.id) !== -1;
    }
  }

  editTableIdentifications(): void {
    this.resetEditingElement();
    this.isEditingElement = true;
    this.editingTable = this.currentTable ? this.currentTable : null;
  }

  editSyeIdentifications(sye: Sye): void {
    this.resetEditingElement();
    this.isEditingElement = true;
    this.editingSye = sye;
  }

  editReleveIdentifications(occ: OccurrenceModel): void {
    this.resetEditingElement();
    this.isEditingElement = true;
    this.editingReleve = occ;
  }

  stopEditing(): void {
    this.isEditingElement = false;
    this.resetEditingElement();
  }

  private resetEditingElement(): void {
    this.editingTable = null;
    this.editingSye = null;
    this.editingReleve = null;
    this.applyChangesToAllSye = false;
    this.applyChangesToEntireTable = false;
    this.pendingIdentifications = [];
    this.pendingIdentificationsToRemove = [];
    this.elementsToApplyNewIdentifications = [];
  }

  /**
   * User select a new identification for the Table
   */
  newIdentifcationData(data: RepositoryItemModel) {
    // Push the given identification (data) to the pending identifications
    this.pushIdentificationToPendingIdentifications(data);
  }

  /**
   * From a given RepositoryItemModel, create a new OccurrenceValidationModel
   * and push it to the pending identifications array
   * Also check (and overwrite) duplicates
   */
  pushIdentificationToPendingIdentifications(data: RepositoryItemModel): void {
    const newIdentification: OccurrenceValidationModel = {
      // id?:               number;
      validatedBy:       this.currentUser.id,
      validatedAt:       new Date(),
      user:              this.currentVlUser,
      // updatedBy?:        string;     // user id
      // updatedAt?:        Date;
      repository:        data.repository,
      repositoryIdNomen: Number(data.idNomen),
      repositoryIdTaxo:  data.idTaxo ? data.idTaxo.toString() : null,
      inputName:         data.name + (data.author ? (' ' + data.author) : ''),
      validatedName:     data.name + (data.author ? (' ' + data.author) : ''),
      validName:         data.name + (data.author ? (' ' + data.author) : ''),
      userIdValidation:  this.currentUser.id,
      userValidation:    this.currentVlUser
    };

    // Push changes to pendingIdentifications
    if (this.pendingIdentifications.length === 0) {
      this.pendingIdentifications.push(newIdentification);
    } else {
      // Is there duplicates ?
      let duplicatePendingIdentification: Array<OccurrenceValidationModel> = [];
      if (this.selectedEditAs.value === 'user') {
        duplicatePendingIdentification = _.filter(this.pendingIdentifications, pi => pi.repository === newIdentification.repository && pi.userIdValidation && pi.userIdValidation === this.currentUser.id);
      } else {
        // @Todo implements other cases (group identification, organization identification, etc.)
      }

      if (duplicatePendingIdentification.length > 0) {
        if (duplicatePendingIdentification.length === 1) {
          // Replace to avoid duplicates
          // duplicatePendingIdentification[0] = newIdentification;
          const duplicateIndex = _.findIndex(this.pendingIdentifications, pi => pi.repository === newIdentification.repository && pi.userIdValidation && pi.userIdValidation === this.currentUser.id);
          this.pendingIdentifications[duplicateIndex] = newIdentification;
        } else {
          // No way
        }
      } else {
        this.pendingIdentifications.push(newIdentification);
      }

    }
  }

  /**
   * Remove an element from the pending list
   */
  removePendingIdentification(identification: OccurrenceValidationModel): void {
    _.remove(this.pendingIdentifications, pi => pi === identification);
  }

  /**
   * Add an element to the pendingIdentificationsToRemove list (from existing identifications)
   */
  removeIdentification(identification: OccurrenceValidationModel): void {
    this.pendingIdentificationsToRemove.push(identification);
  }

  /**
   * Remove the given identification from the pendingIdentificationsToRemove list
   */
  removePendingIdentificationToRemove(identification: OccurrenceValidationModel): void {
    _.remove(this.pendingIdentificationsToRemove, pitr => pitr === identification);
  }

  /**
   * Apply any identification change to the current edited element
   */
  applyChanges() {
    // Wich objects should be updated (sye, occurrences) ?
    this.elementsToApplyNewIdentifications = this.getElementsToUpdate();

    // Add action to current table
    this.tableService.createAction(TableActionEnum.setIdentifications);

    // Apply changes
    for (const element of this.elementsToApplyNewIdentifications) {
      // Deletions
      for (const identificationToRemove of this.pendingIdentificationsToRemove) {
        _.remove(element.validations, ev => ev === identificationToRemove);
      }

      // Additions
      for (const newIdentification of this.pendingIdentifications) {
        // Is there an identification that should be overwritten ?
        let overwriteAtIndex: number;
        if (this.selectedEditAs.value === 'user') {
          overwriteAtIndex = _.findIndex(element.validations as Array<OccurrenceValidationModel>, e => e.repository === newIdentification.repository && e.userIdValidation && e.userIdValidation === this.currentUser.id);
        } else {
          // @Todo implements other cases (group identification, organization identification, etc.)
        }

        // Update existing identification
        if (overwriteAtIndex && overwriteAtIndex !== -1) {
          newIdentification.updatedBy = this.currentUser.id;
          newIdentification.updatedAt = new Date();
          element.validations[overwriteAtIndex] = newIdentification;
        } else {
          // Push the new identification
          element.validations !== null && element.validations.length > 0 ? element.validations.push(newIdentification) : element.validations = [newIdentification];
        }
      }
    }

    // Update current Table through table service (propagation)
    this.tableService.setCurrentTable(this.currentTable, true);

    // Close the edition panel
    this.stopEditing();
  }

  changesShouldBeAppliedToEntireTable(event: MouseEvent) {
    event.preventDefault();
    if (this.applyChangesToEntireTable === true) {
      this.applyChangesToEntireTable = false;
    } else {
      if (this.applyChangesToAllSye === false) {
        this.applyChangesToAllSye = true;
      }
      this.applyChangesToEntireTable = true;
    }
  }

  changesShouldBeAppliedToAllSye(event: MouseEvent) {
    event.preventDefault();
    if (this.applyChangesToAllSye === false) {
      this.applyChangesToAllSye = true;
    } else {
      if (this.applyChangesToEntireTable === true) {
        this.applyChangesToEntireTable = false;
      }
      this.applyChangesToAllSye = false;
    }
  }

  /**
   * Regarding the selected options (apply identifications changes to All Sye, All releves, etc.)
   * Returns the elemnts (Table, Sye, OccurrenceModel, SyntheticColumn) that should be updated
   */
  getElementsToUpdate(): Array<Table | Sye | OccurrenceModel | SyntheticColumn> {
    const response: Array<Table | Sye | OccurrenceModel | SyntheticColumn> = [];

    //
    // EDITING THE TABLE ELEMENT
    if (this.editingTable !== null) {
      if (this.applyChangesToEntireTable === true) {
        // Apply change to all elements (table, sye, releves, syntheticColumns)

        // Push table + table synthetic column
        response.push(this.currentTable, this.currentTable.syntheticColumn);
        // Push Sye + synthetic columns
        for (const sye of this.currentTable.sye) {
          response.push(sye, sye.syntheticColumn);
          // Push Releves
          for (const occurrence of sye.occurrences) {
            response.push(occurrence);
            // @Note if occurrence is a microcenosis, we should not update nested synusies !
          }
        }
      } else if (this.applyChangesToAllSye === true) {
        // Apply changes to the table + all sye + synthetic columns

        // Push table + table synthetic column
        response.push(this.currentTable, this.currentTable.syntheticColumn);
        // Push Sye + synthetic columns
        for (const sye of this.currentTable.sye) {
          response.push(sye, sye.syntheticColumn);
        }
      } else {
        // Apply changes to table only + synthetic column
        response.push(this.currentTable, this.currentTable.syntheticColumn);
      }
    //
    // EDITING AN SYE ELEMENT
    } else if (this.editingSye !== null) {
      // Push sye + sye synthetic column
      response.push(this.editingSye, this.editingSye.syntheticColumn);
      if (this.applyChangesToAllRelevesOfEditedSye) {
        response.push(...this.editingSye.occurrences);
      }
    //
    // EDITING A RELEVE ELEMENT
    } else if (this.editingReleve !== null) {
      response.push(this.editingReleve);
    }

    return response;
  }

}
