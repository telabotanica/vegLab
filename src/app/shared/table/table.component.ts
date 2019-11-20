import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';

import { TableService } from 'src/app/_services/table.service';

import { Subscription } from 'rxjs';
import { TableRow } from 'src/app/_models/table-row-definition.model';

import * as _ from 'lodash';
import { Sye } from 'src/app/_models/sye.model';

@Component({
  selector: 'vl-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit, OnDestroy, AfterViewInit {
  // VAR global
  currentDataView: Array<TableRow> = null;
  manuallyMoveColumnsAt = null;
  currentSyes: Array<Sye> = [];

  // VAR PERF
  t0colMove = 0;
  t1colMove = 0;

  // VAR subscribers
  currentTableSubscription: Subscription;

  // Var Handsontable data
  public dataView: Array<TableRow>;
  public tablePhytoStartRow = 0;
  public tablePhytoStartCol = 0;

  // VAR Handsontable
  private hotRegisterer = new HotTableRegisterer();
  public hotTableId = 'hotInstance';
  private tableInstance: Handsontable = null;
  private firstColWidth = 200;
  private commonColWidth = 30;
  tableSettings: Handsontable.GridSettings = {
    licenseKey: 'non-commercial-and-evaluation',
    data: this.dataView, // Handsontable.helper.createSpreadsheetData(5, 5),
    colHeaders: true,
    rowHeaders: true,
    manualRowMove: true,
    manualColumnMove: true,
    colWidths: (index) => {
        if (index === this.tablePhytoStartCol) { return this.firstColWidth; }
        if (index >= this.tablePhytoStartCol + 1) { return this.commonColWidth; }
    },
    cells: (row, col) => {
      const cp: any = {};
      const groupPositions = this.tableService.groupsPositions;
      if (_.find(groupPositions, g => g.titleRowPosition === row - this.tablePhytoStartRow)) {
        // cell is editable
        cp.readOnly = false;
      } else {
        cp.readOnly = true;
      }
      return cp;
    },
    width: 500,
    height: 500,
    manualColumnResize: true,
    nestedRows: false,
    selectionMode: 'range',
    contextMenu: {
      items: {
        rows: {
          name: 'Lignes',
          submenu: {
            items: [
              {
                key: 'rows:sort_freq_asc',
                name: 'Trier par fréquence (asc)',
                callback: () => { this.sortSelectedRowsByFrequency('asc'); },
                disabled: () => {
                  if (this.isMultipleRowsGroupsSelected()
                  || this.isEntireRowsGroupWithTitleSelected()) { return true; } else { return false; } }
              },
              {
                key: 'rows:sort_freq_desc',
                name: 'Trier par fréquence (desc)',
                callback: () => { this.sortSelectedRowsByFrequency('desc'); },
                disabled: () => {
                  if (this.isMultipleRowsGroupsSelected()
                  || this.isEntireRowsGroupWithTitleSelected()) { return true; } else { return false; } }
              },
              {
                key: 'rows:group',
                name: 'Créer un nouveau groupe',
                callback: () => { this.groupSelectedRows(); },
                disabled: () => {
                  if (this.isMultipleRowsGroupsSelected()
                  || this.isEntireRowsGroupWithoutTitleSelected()
                  || this.isEntireRowsGroupWithTitleSelected()) { return true; } else { return false; }
                }
              },
              {
                key: 'rows:delete_all',
                name: 'Suprimer tous les groupes',
                callback: () => { console.log('Supprimer tous les groupes...'); }
              }
            ]
          }
        },
        columns: {
          name: 'Colonnes',
          // disabled: () => { if (this.isOneOrSeveralColumnsSelected()) { return false; } else { return true; } },
          submenu: {
            items: [
              {
                key: 'columns:sort_freq_asc',
                name: 'Trier par fréquence (asc)',
                callback: () => { this.sortSelectedColumnsByFrequency('asc'); },
                disabled: () => {
                  if (this.isMultipleSyeGroupsSelected()) { return true; } else { return false; }
                }
              },
              {
                key: 'columns:sort_freq_desc',
                name: 'Trier par fréquence (desc)',
                callback: () => { this.sortSelectedColumnsByFrequency('desc'); },
                disabled: () => {
                  if (this.isMultipleSyeGroupsSelected()) { return true; } else { return false; }
                }
              },
              {
                key: 'columns:group',
                name: 'Créer un nouveau groupe',
                callback: () => { this.groupSelectedColumns(); },
                disabled: () => {
                  if (this.isMultipleSyeGroupsSelected()
                  || this.isEntireSyeSelected()) { return true; } else { return false; }
                }
              },
              {
                key: 'columns:toggle_only_show_synthetic_column',
                name: 'Afficher / masquer les relevés [ctrl + t]',
                callback: () => { this.toggleCurrentSyeOnlyShowSyntheticColumn(); },
                disabled: () => {
                  if (this.isCurrentTableContainsNoOneOrOnlyOneSye()) { return true; } else { return false; }
                }
              },
              {
                key: 'columns:delete_all',
                name: 'Supprimer tous les groupes',
                callback: () => { console.log('Supprimer tous les sye...'); },
                disabled: () => {
                  if (this.isCurrentTableContainsNoOneOrOnlyOneSye()) { return true; } else { return false; }
                }
              }
            ]
          }
        },
        table: {
          name: 'Tableau',
          submenu: {
            items: [
              {
                key: 'table:refresh',
                name: 'Rafraichir le tableau',
                callback: () => { console.log('Refresh table...'); }
              }
            ]
          }
        }
      }
    }
  };

  // VAR sub-header
  tableSpacerPx = 49 + this.firstColWidth;

  // ------------------
  // HANDSONTABLE HOOKS
  // ------------------

  /**
   * Make some verifications when selecting one ore several row(s)
   * - If selected rows take over several groups : cancel selection
   * - If selected row is a group title (cell meta _type === 'groupTitle'), select all 'groupName' rows belonging to 'groupTitle' row
   * Note : sometimes we need to remove the actual hook before manually selectionning rows otherwise the hook will do to much recursions
   */
  onAfterSelection = (row: number, column: number, row2: number, column2: number) => {

    let startRowPosition = _.min([row, row2]);
    const endRowPosition = _.max([row, row2]);

    let startColPosition = _.min([column, column2]);
    const endColPosition = _.max([column, column2]);

    let rowSelectionStartToEmit = startRowPosition;
    let rowSelectionEndToEmit = endRowPosition;

    // Selecting rows
    if (column === this.tablePhytoStartCol) {
      const selectionDirection: 'topToBottom' | 'bottomToTop' | 'onlyOneRowSelected' = row === row2 ? 'onlyOneRowSelected' : row < row2 ? 'topToBottom' : 'bottomToTop';

      // Non-consecutive selection disabled
      const settingsSelectionModeOldValue = this.tableSettings.selectionMode;
      this.tableSettings.selectionMode = 'multiple';

      // Selected rows take over several groups ?
      if (startRowPosition !== endRowPosition) {
        // Set selected element ids
        const occurrenceId = null;
        const syeId = null;
        const rowId = this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol + 1)._occurrenceId;
        const groupId = this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol + 1)._occurrenceId;

        const isMultipleGroupsSelected = this.tableService.isMultipleGroupsSelected(this.tableService.getCurrentTable(), startRowPosition, endRowPosition);
        if (isMultipleGroupsSelected) {
          // @Todo notify user that he can't make a selection over several groups
          // Remove aflterSelection hook
          this.tableInstance.removeHook('afterSelection', this.onAfterSelection);

          // Select all rows
          const groupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol)._rowId);
          if (selectionDirection === 'topToBottom') {
            const nextGroup = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), endRowPosition);
            if (nextGroup) {
              this.tableInstance.selectRows(nextGroup.titleRowPosition, endRowPosition);
              startRowPosition = nextGroup.titleRowPosition;
              rowSelectionStartToEmit = nextGroup.titleRowPosition;
              rowSelectionEndToEmit = endRowPosition;
            } else {
              this.tableInstance.selectRows(startRowPosition, groupPositions.endRowPosition);
              rowSelectionStartToEmit = startRowPosition;
              rowSelectionEndToEmit = groupPositions.endRowPosition;
            }
          } else if (selectionDirection === 'bottomToTop') {
            this.tableInstance.selectRows(startRowPosition, groupPositions.endRowPosition);
            rowSelectionStartToEmit = startRowPosition;
            rowSelectionEndToEmit = groupPositions.endRowPosition;
          }

          // Emit selection
          if (startColPosition !== endColPosition) {
            this.tableService.tableSelectionElement.next({
              element: 'row',
              occurrenceIds: [],
              syeId: null,
              rowId: null,
              groupId: null,
              multipleSelection: true,
              startPosition: rowSelectionStartToEmit,
              endPosition: rowSelectionEndToEmit
            });
          }

          // Add removed hook
          this.tableInstance.addHook('afterSelection', this.onAfterSelection);
        } else {
          // No multiple group selected
          // Emit selection
          if (startRowPosition !== endColPosition) {
            this.tableService.tableSelectionElement.next({
              element: 'row',
              occurrenceIds: [],
              syeId: null,
              rowId: null,
              groupId: null,
              multipleSelection: true,
              startPosition: rowSelectionStartToEmit,
              endPosition: rowSelectionEndToEmit
            });
          }
        }
      } else if (startRowPosition === endRowPosition) {
        // Only one row selected
        // Set selected element ids
        const occurrenceId = null;
        const syeId = null;
        const rowId = this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol + 1)._occurrenceId;
        const groupId = this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol + 1)._occurrenceId;

        // Emit selection
        if (startColPosition !== endColPosition) {
          this.tableService.tableSelectionElement.next({
            element: 'row',
            occurrenceIds: [occurrenceId],
            syeId,
            rowId,
            groupId,
            multipleSelection: false,
            startPosition: rowSelectionStartToEmit,
            endPosition: rowSelectionEndToEmit
          });
        }
      }

      // Selected row is a group title
      if (this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol)._type === 'groupTitle') {
        // Remove afterSelection hook
        this.tableInstance.removeHook('afterSelection', this.onAfterSelection);

        // Select all rows
        const t = this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol)._rowId;
        const groupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), this.tableInstance.getCellMeta(startRowPosition, this.tablePhytoStartCol)._rowId);
        this.tableInstance.selectRows(groupPositions.titleRowPosition, groupPositions.endRowPosition);

        // Add removed hook
        this.tableInstance.addHook('afterSelection', this.onAfterSelection);
      }

      // selectionMode set to the initial value
      this.tableSettings.selectionMode = settingsSelectionModeOldValue;
    }

    // Selecting columns
    if (column > this.tablePhytoStartCol) {
      const selectionDirection: 'leftToRight' | 'rightToLeft' | 'onlyOneColSelected' = column === column2 ? 'onlyOneColSelected' : column < column2 ? 'leftToRight' : 'rightToLeft';

      let colSelectionStartToEmit = startColPosition;
      let colSelectionEndToEmit = endColPosition;

      // Non-consecutive selection disabled
      const settingsSelectionModeOldValue = this.tableSettings.selectionMode;
      this.tableSettings.selectionMode = 'multiple';

      // Selected columns take over several sye
      if (startColPosition !== endColPosition) {
        // Set selected element ids
        const occurrenceId = this.tableInstance.getCellMeta(1, startColPosition)._occurrenceId;
        const occurrenceIds: Array<any> = [];
        const syeId = this.tableInstance.getCellMeta(1, startColPosition)._syeId;
        const rowId = null;
        const groupId = null;

        const isMultipleSyeSelected = this.tableService.isMultipleSyeSelected(this.tableService.getCurrentTable(), startColPosition, endColPosition);
        if (isMultipleSyeSelected) {
          // @Todo notify user that he can't make a selection over several sye
          // Remove aflterSelection hook
          this.tableInstance.removeHook('afterSelection', this.onAfterSelection);

          // Select all rows
          const columnPositions = this.tableService.getSyePositionsForColId(this.tableService.getCurrentTable(), startColPosition);
          if (selectionDirection === 'leftToRight') {
            const nextSye = this.tableService.getSyePositionsForColId(this.tableService.getCurrentTable(), endColPosition);
            if (nextSye) {
              this.tableInstance.selectColumns(nextSye.startColumnPosition, endColPosition);
              startColPosition = nextSye.startColumnPosition;
              colSelectionStartToEmit = nextSye.startColumnPosition;
              colSelectionEndToEmit = endColPosition;
            } else {
              this.tableInstance.selectColumns(startColPosition, columnPositions.syntheticColumnPosition);
              colSelectionStartToEmit = startColPosition;
              colSelectionEndToEmit = columnPositions.syntheticColumnPosition;
            }

          } else if (selectionDirection === 'rightToLeft') {
            this.tableInstance.selectColumns(startColPosition, startColPosition);
          }

          // Emit selection
          if (startRowPosition !== endRowPosition) {
            const iterations = endColPosition - startColPosition + 1;
            for (let index = 0; index < iterations; index++) {
              occurrenceIds.push(this.tableInstance.getCellMeta(1, startColPosition + index)._occurrenceId)
            }

            this.tableService.tableSelectionElement.next({
              element: 'column',
              occurrenceIds,
              syeId: null,
              rowId: null,
              groupId: null,
              multipleSelection: true,
              startPosition: colSelectionStartToEmit,
              endPosition: colSelectionEndToEmit
            });
          }

          // Add removed hook
          this.tableInstance.addHook('afterSelection', this.onAfterSelection);
        } else {
          // Selected columns are in the same sye
          if (startRowPosition !== endRowPosition) {
            const iterations = endColPosition - startColPosition + 1;
            for (let index = 0; index < iterations; index++) {
              occurrenceIds.push(this.tableInstance.getCellMeta(1, startColPosition + index)._occurrenceId)
            }

            this.tableService.tableSelectionElement.next({
              element: 'column',
              occurrenceIds,
              syeId: null,
              rowId: null,
              groupId: null,
              multipleSelection: true,
              startPosition: colSelectionStartToEmit,
              endPosition: colSelectionEndToEmit
            });
          }
        }
      } else {
        // Only one column selected
        // Set selected element ids
        const occurrenceId = this.tableInstance.getCellMeta(1, startColPosition)._occurrenceId;
        const syeId = this.tableInstance.getCellMeta(1, startColPosition)._syeId;
        const rowId = null;
        const groupId = null;

        // Emit selection
        if (startRowPosition !== endRowPosition) {
          this.tableService.tableSelectionElement.next({
            element: 'column',
            occurrenceIds: [occurrenceId],
            syeId,
            rowId,
            groupId,
            multipleSelection: false,
            startPosition: colSelectionStartToEmit,
            endPosition: colSelectionEndToEmit
          });
        }
      }

      // selectionMode set to the initial value
      this.tableSettings.selectionMode = settingsSelectionModeOldValue;
    }

    // Selecting cell
    if (startRowPosition === endRowPosition && startColPosition === endColPosition) {
      const cellType = this.tableInstance.getCellMeta(startRowPosition, startColPosition)._type;
      const occurrenceId = this.tableInstance.getCellMeta(startRowPosition, startColPosition)._occurrenceId;
      const syeId = this.tableInstance.getCellMeta(startRowPosition, startColPosition)._syeId;
      const rowId = this.tableInstance.getCellMeta(startRowPosition, startColPosition)._rowId;
      const groupId = this.tableInstance.getCellMeta(startRowPosition, startColPosition)._groupId;
      this.tableService.tableSelectionElement.next({
        element: cellType,
        occurrenceIds: [occurrenceId],
        syeId,
        rowId,
        groupId,
        multipleSelection: false,
        startPosition: null,
        endPosition: null
      });
    }

  }

  onAfterSelectionEnd = (row: number, column: number, row2: number, column2: number) => {
    console.log('_type', this.tableInstance.getCellMeta(row, column)._type);
    console.log('_occurrenceId', this.tableInstance.getCellMeta(row, column)._occurrenceId);
    console.log('_syeId', this.tableInstance.getCellMeta(row, column)._syeId);
    console.log('_rowId', this.tableInstance.getCellMeta(row, column)._rowId);
    console.log('_groupId', this.tableInstance.getCellMeta(row, column)._groupId);
    console.log('className', this.tableInstance.getCellMeta(row, column).className);
  }

  onAfterSelectionByProp = (row: number, prop: string, row2: number, prop2: string) => {
    //
  }

  onBeforeRowMove = (rows: Array<number>, target: number) => {
    // 1. Move rows form model and get response (true | false)
    // 2. If true, update metadata
    // 3. Return true so the row are moved

    // @Todo if we move entire group INSIDE the target group, change target value to under or above target group !

    // move rows in background
    const moved =  this.tableService.beforeRowMove(rows, target);

    // Select moved rows
    if (typeof(moved) === 'object') {
      this.tableInstance.selectRows(moved.movedRowsStart, moved.movedRowsEnd);
      return false;
    } else if (moved === true || moved === false) {
      return moved;
    }
  }

  /**
   * Note : seems to be an error in the callback parameters types.
   *        Doc(lib. v7.0.2, wrapper at 4.0.0) says "(rows: Array<number>, target: number)"
   *        Code says "(startRowPosition: number, endRowPosition: number)"
   *        And we get "(rows: Array<number>, target: number)"
   *        But we must type rows parameter as Array<number> | number so as it works
   * See :
   *  - https://github.com/handsontable/angular-handsontable/issues/123
   *  - https://github.com/handsontable/angular-handsontable/releases/tag/2.0.0 (old release)
   *
   * @Todo survey github issue and fix asap / this bug should be chekcked for all hooks
   */
  onAfterRowMove = (rows: Array<number> | number, target: number) => {
    // Update table cells rowId
    /*let rowIncrement = 0;
    for (const row of this.tableInstance.getData()) {
      let columnIncrement = 0;
      for (const cell of row) {
        this.tableInstance.setCellMeta(this.tablePhytoStartRow + rowIncrement, this.tablePhytoStartCol + columnIncrement, '_rowId', rowIncrement);
        columnIncrement++;
      }
      rowIncrement++;
    }*/
    // this.checkCurrentTableDataSynchronization();
  }

  onBeforeColumnMove = (columns: Array<number>, target: number) => {
    this.t0colMove = performance.now();
    const moved: boolean | {movedColumnsStart: number, movedColumnsEnd: number} = this.tableService.beforeColumnMove(columns, target);
    if (typeof(moved) === 'boolean' && moved === true) {
      return true;
    } else if (typeof(moved) === 'boolean' && moved === false) {
      return false;
    } else if (typeof(moved) === 'object') {
      // select moved columns
      this.manuallyMoveColumnsAt = moved;
      return false;
    }
  }

  onAfterColumnMove = (/*startColumn: number, endColumn: number*/) => {
    this.t1colMove = performance.now();
    this.t0colMove = 0;
    this.t1colMove = 0;

    if (this.manuallyMoveColumnsAt !== null) {
      this.tableInstance.selectColumns(this.manuallyMoveColumnsAt.movedColumnsStart, this.manuallyMoveColumnsAt.movedColumnsEnd);
      this.manuallyMoveColumnsAt = null;
    }
    // this.checkCurrentTableDataSynchronization();
  }

  onAfterGetColHeaders = (column: number, TH: HTMLTableHeaderCellElement) => {
    const TR = TH.parentNode;
    const THEAD = TR.parentNode;

    const columnsPositions = this.tableService.columnsPositions;
    for (const columnPositions of columnsPositions) {
      if (column >= columnPositions.startColumnPosition && column <= columnPositions.syntheticColumnPosition) {
        this.applyClass(TH, `sye-${columnPositions.id}`);
      }
    }
  }

  onBeforeCellChange = (changes: Array<any>, source: string) => {
    const selectedCell: Array<Array<number>> = this.tableInstance.getSelected();
    const selectedRow = selectedCell[0][0];
    const editedGroup = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), selectedRow);
    if (editedGroup.titleRowPosition === selectedRow - this.tablePhytoStartRow) {
      return this.tableService.beforeTitleGroupCellChange(editedGroup.groupId, changes[0][2], changes[0][3]);
    }
  }

  onAfterOnCellMouseDown = (event, coords, TD) => {
    const now = new Date().getTime();
    // Double click ?
    const cellMetaLastClick = this.tableInstance.getCellMeta(coords.row, coords.col)._lastClick;
    if (!cellMetaLastClick || now - cellMetaLastClick > 200) {
      this.tableInstance.setCellMeta(coords.row, coords.col, '_lastClick', now);
      return; // no double-click
    } else if (now - cellMetaLastClick < 200) {
      // double-clik detected
      const syePositions = this.tableService.getSyePositionsForColId(this.tableService.getCurrentTable(), coords.col);
      const groupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), coords.row);
      if (!syePositions || !groupPositions) { return; }
      this.tableInstance.selectCell(groupPositions.startRowPosition, syePositions.startColumnPosition, groupPositions.endRowPosition, syePositions.endColumnPosition);
    }
  }

  onBeforeKeyDown = (event: KeyboardEvent) => {
    // Prevent default behaviour on Ctrl + Shift/Alt keys (onAfterDocumentKeyDown() uses these combinations to select, sort and move blocs)
    if ((event.ctrlKey && event.shiftKey || event.ctrlKey && event.altKey) && event.keyCode >= 37 && event.keyCode <= 40) {
      event.stopImmediatePropagation();
    }
  }

  onAfterDocumentKeyDown = (event: KeyboardEvent) => {
    // @Todo implementation for other browser than Firefox ? (to check)

    // Ctrl + Arrow keydown
    // Select a bloc
    if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode >= 37 && event.keyCode <= 40) {
      // arrow right
      // select next sye bloc
      if (event.keyCode === 39) {
        const nextSyePosition = this.tableService.getNextSyePositionsForColId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][1]);
        const groupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][0]);
        if (nextSyePosition) {
          this.tableInstance.selectCell(groupPositions.startRowPosition, nextSyePosition.startColumnPosition, groupPositions.endRowPosition, nextSyePosition.endColumnPosition);
        }
      }
      // arrow left
      // select previous sye bloc
      if (event.keyCode === 37) {
        const previousSyePosition = this.tableService.getPreviousSyePositionsForColId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][1]);
        const groupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][0]);
        if (previousSyePosition) {
          this.tableInstance.selectCell(groupPositions.startRowPosition, previousSyePosition.startColumnPosition, groupPositions.endRowPosition, previousSyePosition.endColumnPosition);
        }
      }
      // arrow down
      // select next group bloc
      if (event.keyCode === 40) {
        const syePositions = this.tableService.getSyePositionsForColId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][1]);
        const nextGroupPositions = this.tableService.getNextGroupPositionsForRowId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][0]);

        if (nextGroupPositions) {
          this.tableInstance.selectCell(nextGroupPositions.startRowPosition, syePositions.startColumnPosition, nextGroupPositions.endRowPosition, syePositions.endColumnPosition);
        }
      }
      // arrow up
      // select previuos group bloc
      if (event.keyCode === 38) {
        const syePositions = this.tableService.getSyePositionsForColId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][1]);
        const previousGroupPositions = this.tableService.getPreviousGroupPositionsForRowId(this.tableService.getCurrentTable(), this.tableInstance.getSelected()[0][0]);

        if (previousGroupPositions) {
          this.tableInstance.selectCell(previousGroupPositions.startRowPosition, syePositions.startColumnPosition, previousGroupPositions.endRowPosition, syePositions.endColumnPosition);
        }
      }
    }

    // Ctrl + Shift  + arrow
    // Sort by frequency
    if (event.ctrlKey && event.shiftKey && !event.altKey && event.keyCode >= 37 && event.keyCode <= 40) {
      // arrow right
      // sort bloc columns by frequency asc
      if (event.keyCode === 39) { this.sortSelectedColumnsByFrequency('asc', this.tableInstance.getData(this.tableInstance.getSelected()[0][0], this.tableInstance.getSelected()[0][1], this.tableInstance.getSelected()[0][2], this.tableInstance.getSelected()[0][3])); }
      // arrow left
      // sort bloc columns by frequency desc
      if (event.keyCode === 37) { this.sortSelectedColumnsByFrequency('desc', this.tableInstance.getData(this.tableInstance.getSelected()[0][0], this.tableInstance.getSelected()[0][1], this.tableInstance.getSelected()[0][2], this.tableInstance.getSelected()[0][3])); }
      // arrow down
      // sort bloc rows by frequency asc
      if (event.keyCode === 40) { this.sortSelectedRowsByFrequency('asc'); }
      // arrow up
      // sort bloc rows by frequency desc
      if (event.keyCode === 38) { this.sortSelectedRowsByFrequency('desc'); }
    }

    // Ctrl + Alt + arrow
    // Move Groups or sye
    if (event.ctrlKey && !event.shiftKey && event.altKey && event.keyCode >= 37 && event.keyCode <= 40) {
      const currentSelection = this.tableInstance.getSelected()[0];
      const currentFirstCol = currentSelection[1];
      const currentLastCol = currentSelection[3];
      const currentFirstRow = currentSelection[0];
      const currentLastRow = currentSelection[2];

      // arrow right
      // move sye to the right
      if (event.keyCode === 39) {
        const moved = this.tableService.moveSyeToRight(currentFirstCol);
        if (typeof(moved) === 'object') {
          // ajust selection
          this.tableInstance.selectCell(currentFirstRow, moved.positions.startColumnPosition, currentLastRow, moved.positions.endColumnPosition);
        }
      }
      // arrow left
      // move sye to the left
      if (event.keyCode === 37) {
        const moved = this.tableService.moveSyeToLeft(currentFirstCol);
        if (typeof(moved) === 'object') {
          this.tableInstance.selectCell(currentFirstRow, moved.positions.startColumnPosition, currentLastRow, moved.positions.endColumnPosition);
        }
      }
      // arrow down
      // move group to bottom
      if (event.keyCode === 40) {
        const moved = this.tableService.moveGroupToBottom(currentFirstRow);
        if (typeof(moved) === 'object') {
          this.tableInstance.selectCell(moved.movedRowsStart, currentFirstCol, moved.movedRowsEnd, currentLastCol);
        }
      }
      // arrow up
      // move group to top
      if (event.keyCode === 38) {
        const moved = this.tableService.moveGroupToTop(currentFirstRow);
        if (typeof(moved) === 'object') {
          this.tableInstance.selectCell(moved.movedRowsStart, currentFirstCol, moved.movedRowsEnd, currentLastCol);
        }
      }
    }

    // Ctrl + t
    if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode === 84) {
      this.toggleCurrentSyeOnlyShowSyntheticColumn();
    }
  }

  constructor(private tableService: TableService, private cdr: ChangeDetectorRef, public router: Router) { }

  ngOnInit() {
    // TEST DATA
  }

  ngOnDestroy() {
    try { this.currentTableSubscription.unsubscribe(); } catch (e) { }
  }

  ngAfterViewInit() {
    // Get the handsontable instance
    this.tableInstance = this.hotRegisterer.getInstance(this.hotTableId);

    // Hooks
    this.tableInstance.addHook('afterSelection', this.onAfterSelection);
    // this.tableInstance.addHook('afterSelectionEnd', this.onAfterSelectionEnd);
    this.tableInstance.addHook('beforeRowMove', this.onBeforeRowMove);
    this.tableInstance.addHook('afterRowMove', this.onAfterRowMove);
    this.tableInstance.addHook('beforeColumnMove', this.onBeforeColumnMove);
    this.tableInstance.addHook('afterColumnMove', this.onAfterColumnMove);
    this.tableInstance.addHook('afterGetColHeader', this.onAfterGetColHeaders);
    this.tableInstance.addHook('beforeChange', this.onBeforeCellChange);
    this.tableInstance.addHook('afterOnCellMouseDown', this.onAfterOnCellMouseDown);
    this.tableInstance.addHook('beforeKeyDown', this.onBeforeKeyDown);
    this.tableInstance.addHook('afterDocumentKeyDown', this.onAfterDocumentKeyDown);

    // Subscribe to current table changes
    this.currentTableSubscription = this.tableService.tableDataView.subscribe(dataView => {
      this.currentSyes = this.tableService.getCurrentTable().sye;
      this.updateTableValuesAndMetadata(dataView);
      console.log('UPDATE TABLE VALUES AND METADATA');
      this.cdr.detectChanges();
    });

    // Subscribe to table area width and height change
    this.tableService.tableAreaDimensions.subscribe(value => {
      if (value.height && value.width) {
        this.tableSettings.width = value.width;
        this.tableSettings.height = value.height - 40;
        if (this.currentDataView && this.currentDataView.length > 0) {
          this.tableInstance.updateSettings(this.tableSettings);
          this.setTableMetadataAndStyle();
          this.tableInstance.render();
        }
      }
    });
  }

  // private checkCurrentTableDataSynchronization() {
  //   this.tableService.checkCurrentTableDataAndDataViewSynchronization(this.currentDataView);
  // }

  private updateTableValuesAndMetadata(dataView) {
    const t0update = performance.now();
    // Get table view
    // this.tableService.getCurrentTableDataView().subscribe(dataView => {

    // Check view data
    if (!dataView || dataView.length === 0) {
      // @Todo log error
      return;
    }

    // New dataView
    const t0loadTableData = performance.now();
    this.currentDataView = dataView;
    this.tableInstance.loadData(this.currentDataView);
    const t1loadTableData = performance.now();

    // New table settings
    const newTableSettings = this.tableSettings;                     // New table settings

    // Get the number of columns
    const nbColumns = dataView[0].items.length;

    // Define table columns
    const columns = [{data: 'displayName'}];
    for (let index = 0; index < nbColumns; index++) {
      columns.push({data: `items.${index}.value`});
    }
    newTableSettings.columns = columns;                         // New table columns definition

    const t0tableSettings = performance.now();
    this.tableInstance.updateSettings(newTableSettings);        // Update current table settings
    const t1tableSettings = performance.now();

    // Set table metadata
    const t0updateMetadata = performance.now();
    this.setTableMetadataAndStyle();
    const t1updateMetadata = performance.now();

    // We must use render function for classNames to be binded
    const t0rendering = performance.now();
    this.tableInstance.render();
    const t1rendering = performance.now();

    const t1update = performance.now();
    console.log(`Updating table data, metadata and styles took ${t1update - t0update} milliseconds
      - ${t1loadTableData - t0loadTableData} for loading the data into the table
      - ${t1tableSettings - t0tableSettings} for updating table settings
      - ${t1updateMetadata - t0updateMetadata} for rendering metadata and styles
      - ${t1rendering - t0rendering} for rendering table (handsontable final renderer)`);

  }

  /**
   * Each cell of the phyto table has several metadata reflecting the source object : rowId and occurrenceId
   * And additional metadata '_type' provide the source dataType of the cell : 'groupTitle', 'groupName' or 'occurrenceValue' (= coef)
   */
  setTableMetadataAndStyle(setType = true, setOccId = true, setRowId = true, setClassName = true, setSyeId = true, setGroupId = true) {
    const data: Array<TableRow> = this.tableInstance.getSourceData() as Array<TableRow>;

    let rowPosition = this.tablePhytoStartRow + 0;
    for (const row of data) {
      // Set 1st col metadata
      const type = row.type === 'group' ? 'groupTitle' : 'groupName';
      if (setType) { this.tableInstance.setCellMeta(rowPosition, this.tablePhytoStartCol, '_type', type); }
      if (setOccId) { this.tableInstance.setCellMeta(rowPosition, this.tablePhytoStartCol, '_occurrenceId', null); }
      if (setSyeId) { this.tableInstance.setCellMeta(rowPosition, this.tablePhytoStartCol, '_syeId', null); }
      if (setRowId) { this.tableInstance.setCellMeta(rowPosition, this.tablePhytoStartCol, '_rowId', row.rowId); }
      if (setGroupId) { this.tableInstance.setCellMeta(rowPosition, this.tablePhytoStartCol, '_groupId', row.groupId); }

      // Set 1st col classNames
      const className = type === 'groupTitle' ? 'group title' : 'group name';
      if (setClassName) { this.tableInstance.setCellMeta(rowPosition, this.tablePhytoStartCol, 'className', className); }

      // Set other columns metadata
      let colPosition = this.tablePhytoStartCol + 1;
      for (const cell of row.items) {
        if (cell.type === 'cellOccValue') {
          if (setType) {  this.tableInstance.setCellMeta(rowPosition, colPosition, '_type', 'occurrenceValue'); }
          if (setOccId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_occurrenceId', cell.occurrenceId); }
          if (setSyeId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_syeId', cell.syeId); }
          if (setRowId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_rowId', row.rowId); }
          if (setGroupId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_groupId', row.groupId); }
          if (setClassName) { this.tableInstance.setCellMeta(rowPosition, colPosition, 'className', `coef sye-${cell.syeId}`); }
        } else if (cell.type === 'rowValue') {
          if (setType) {  this.tableInstance.setCellMeta(rowPosition, colPosition, '_type', `titleRowValue sye-${cell.syeId}`); }
          if (setOccId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_occurrenceId', cell.occurrenceId); }
          if (setSyeId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_syeId', cell.syeId); }
          if (setRowId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_rowId', row.rowId); }
          if (setGroupId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_groupId', row.groupId); }
          if (setClassName) { this.tableInstance.setCellMeta(rowPosition, colPosition, 'className', `titleRowValue sye-${cell.syeId}`); }
        } else if (cell.type === 'cellSynColValue') {
          if (setType) {  this.tableInstance.setCellMeta(rowPosition, colPosition, '_type', 'syntheticValue'); }
          if (setOccId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_occurrenceId', cell.occurrenceId); }
          if (setSyeId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_syeId', cell.syeId); }
          if (setRowId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_rowId', row.rowId); }
          if (setGroupId) { this.tableInstance.setCellMeta(rowPosition, colPosition, '_groupId', row.groupId); }
          if (setClassName) { this.tableInstance.setCellMeta(rowPosition, colPosition, 'className', `synthetic sye-${cell.syeId}`); }
        }
        colPosition++;
      }
      rowPosition++;
    }
  }

  // ---------------
  // ROWS OPERATIONS
  // ---------------
  groupSelectedRows() {
    if (this.isMultipleRowsGroupsSelected() || this.isEntireRowsGroupWithTitleSelected()) { return; }

    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const rowsVisulaIndexes = [selected[0][0], selected[0][2]];
    const startRow = _.min(rowsVisulaIndexes); // if we select in rtl direction, "startCol" > "endCol"
    const endRow = _.max(rowsVisulaIndexes);

    const createNewRowsGroup = this.tableService.moveRangeRowsToNewGroup(startRow, endRow);

    if (createNewRowsGroup.success) {
      // rows group successfully created
      // Manually select moved range rows
      if (createNewRowsGroup.newGroupId !== null) {
        const newTableRowsGroupPositions = _.find(this.tableService.groupsPositions, rDef => rDef.groupId === createNewRowsGroup.newGroupId);
        this.tableInstance.selectRows(newTableRowsGroupPositions.startRowPosition, newTableRowsGroupPositions.endRowPosition);
      }
    } else {
      // @Todo manage creation fail
    }
  }

  sortSelectedRowsByFrequency(order: 'asc' | 'desc'): void {
    if (this.isMultipleRowsGroupsSelected() || this.isEntireRowsGroupWithTitleSelected()) { return; }
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const rowsVisulaIndexes = [selected[0][0], selected[0][2]];
    const colsVisulaIndexes = [selected[0][1], selected[0][3]];
    const startRow = _.min(rowsVisulaIndexes);
    const endRow = _.max(rowsVisulaIndexes);
    const startCol = _.min(colsVisulaIndexes);
    const endCol = _.max(colsVisulaIndexes);

    let sorteredSye: Sye = null;

    // entire table selection ?
    if (startCol === this.tablePhytoStartCol && endCol === this.tableInstance.countCols() - 1) {
      sorteredSye = null;
    } else {
      for (const columnPositions of this.tableService.columnsPositions) {
        if (startCol >= columnPositions.startColumnPosition && endCol <= columnPositions.endColumnPosition) {
          sorteredSye = this.tableService.getSyeById(this.tableService.getCurrentTable(), columnPositions.id);
        }
      }
    }

    this.tableService.sortRowsByFrequency(sorteredSye, order, startRow - this.tablePhytoStartRow, endRow - this.tablePhytoStartRow);
  }

  // ------------------
  // COLUMNS OPERATIONS
  // ------------------
  groupSelectedColumns() {
    if (this.isMultipleSyeGroupsSelected() || this.isEntireSyeSelected()) { return; }

    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const columnsVisulaIndexes = [selected[0][1], selected[0][3]];
    const startCol = _.min(columnsVisulaIndexes); // if we select in rtl direction, "startCol" > "endCol"
    const endCol = _.max(columnsVisulaIndexes);

    const createNewSye = this.tableService.moveRangeColumnsToNewSye(startCol, endCol);

    if (createNewSye.success) {
      // sye successfully created
      // Manually select moved range columns
      if (createNewSye.newSyeId !== null) {
        const newTableSyePositions = _.find(this.tableService.columnsPositions, columnPositions => columnPositions.id === createNewSye.newSyeId);
        this.tableInstance.selectColumns(newTableSyePositions.startColumnPosition, newTableSyePositions.endColumnPosition);
      }
    } else {
      // @Todo manage creation fail
    }
  }

  sortSelectedColumnsByFrequency(order: 'asc' | 'desc', coefArrayToSort?: Array<Array<any>>): void {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const rowsVisulaIndexes = [selected[0][0], selected[0][2]];
    const colsVisulaIndexes = [selected[0][1], selected[0][3]];
    const startRow = _.min(rowsVisulaIndexes);
    const endRow = _.max(rowsVisulaIndexes);
    const startCol = _.min(colsVisulaIndexes);
    const endCol = _.max(colsVisulaIndexes);

    this.tableService.sortColumnsByFrequency(order, startCol, endCol, coefArrayToSort);
  }

  toggleCurrentSyeOnlyShowSyntheticColumn() {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const rowsVisulaIndexes = [selected[0][0], selected[0][2]];
    const colsVisulaIndexes = [selected[0][1], selected[0][3]];
    const startRow = _.min(rowsVisulaIndexes);
    const endRow = _.max(rowsVisulaIndexes);
    const startCol = _.min(colsVisulaIndexes);
    const endCol = _.max(colsVisulaIndexes);

    const currentSye = this.tableService.getSyeForColId(this.tableService.getCurrentTable(), startCol);

    if (!currentSye) { return; }

    currentSye.onlyShowSyntheticColumn = !currentSye.onlyShowSyntheticColumn;
    this.tableService.updateDataView(this.tableService.getCurrentTable());

    // update selection (select synthetic column)
    const columnPositions = this.tableService.getColumnPositionsForSyeById(currentSye.syeId);
    if (columnPositions) {
      this.tableInstance.selectColumns(columnPositions.syntheticColumnPosition, columnPositions.syntheticColumnPosition);
    }
  }

  // -----
  // UTILS
  // -----
  applyClass(elem, className) {
    if (!Handsontable.dom.hasClass(elem, className)) {
      Handsontable.dom.addClass(elem, className);
    }
  }

  isSeveralRowsSelected(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    if (selected[0][1] !== selected[0][2]) { return true; }
    return false;
  }

  isOnlyOneRowsGroupSelected(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const selectedRows = [selected[0][0], selected[0][2]];
    const startRow = _.min(selectedRows);
    const endRow = _.max(selectedRows);

    const startRowGroupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), startRow);
    const endRowGroupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), endRow);

    if (startRowGroupPositions === endRowGroupPositions) { return true; }
    return false;
  }

  isMultipleRowsGroupsSelected(): boolean {
    return !this.isOnlyOneRowsGroupSelected();
  }

  isOnlyOneColumnSelected(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    if (selected.length === 1 && (selected[0][1] === selected[0][3])) {
      return true;
    } else {
      return false;
    }
  }

  isSeveralColumnsSelected(): boolean {
    return !this.isOnlyOneColumnSelected();
  }

  isOnlyOnSyeGroupselected(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const columnsPositions = this.tableService.columnsPositions;
    const minSelectedCol = _.min([selected[0][1], selected[0][3]]);
    const maxSelectedCol = _.max([selected[0][1], selected[0][3]]);
    for (const columnPositions of columnsPositions) {
      if (minSelectedCol >= columnPositions.startColumnPosition && maxSelectedCol <= columnPositions.endColumnPosition) {
        return true;
      }
    }
    return false;
  }

  isMultipleSyeGroupsSelected(): boolean {
    return !this.isOnlyOnSyeGroupselected();
  }

  isCurrentSyeCollapsed(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const rowsVisulaIndexes = [selected[0][0], selected[0][2]];
    const colsVisulaIndexes = [selected[0][1], selected[0][3]];
    const startRow = _.min(rowsVisulaIndexes);
    const endRow = _.max(rowsVisulaIndexes);
    const startCol = _.min(colsVisulaIndexes);
    const endCol = _.max(colsVisulaIndexes);

    const currentSye = this.tableService.getSyeForColId(this.tableService.getCurrentTable(), startCol);

    if (!currentSye) {
      return true;
    } else {
      return currentSye.onlyShowSyntheticColumn;
    }

  }

  isEntireSyeSelected(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const columnsPositions = this.tableService.columnsPositions;
    const minSelectedCol = _.min([selected[0][1], selected[0][3]]);
    const maxSelectedCol = _.max([selected[0][1], selected[0][3]]);
    for (const columnPositions of columnsPositions) {
      if (minSelectedCol === columnPositions.startColumnPosition && maxSelectedCol === columnPositions.endColumnPosition) {
        return true;
      } else if (minSelectedCol === columnPositions.startColumnPosition && maxSelectedCol === columnPositions.syntheticColumnPosition) {
        return true;
      }
    }
    return false;
  }

  isCurrentTableContainsNoOneOrOnlyOneSye(): boolean {
    return this.tableService.getCurrentTable().sye.length > 1 ? false : true;
  }

  isPartialSyeSelected(): boolean {
    return !this.isEntireSyeSelected();
  }

  isEntireRowsGroupWithTitleSelected(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const selectedRows = [selected[0][0], selected[0][2]];
    const startRow = _.min(selectedRows);
    const endRow = _.max(selectedRows);

    const startRowGroupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), startRow);
    const endRowGroupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), endRow);

    if (startRowGroupPositions === endRowGroupPositions) {
      if (startRow === startRowGroupPositions.titleRowPosition && endRow === startRowGroupPositions.endRowPosition) { return true; }
    }

    return false;
  }

  isEntireRowsGroupWithoutTitleSelected(): boolean {
    const selected = this.tableInstance.getSelected(); // [[startRow, startCol, endRow, endCol], ...]
    const selectedRows = [selected[0][0], selected[0][2]];
    const startRow = _.min(selectedRows);
    const endRow = _.max(selectedRows);

    const startRowGroupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), startRow);
    const endRowGroupPositions = this.tableService.getGroupPositionsForRowId(this.tableService.getCurrentTable(), endRow);

    if (startRowGroupPositions === endRowGroupPositions) {
      if (startRow === startRowGroupPositions.startRowPosition && endRow === startRowGroupPositions.endRowPosition) { return true; }
    }

    return false;
  }

  // ------------
  // UI & STYLING
  // ------------
  getSyeVisibleWidth(syeId: number): string {
    const sye = this.tableService.getSyeById(this.tableService.getCurrentTable(), syeId);
    return ((sye.occurrencesCount + 1) * this.commonColWidth).toString() + 'px'; // +1 for synthetic column
  }

  getSubHeaderClassname(syeId: number): string {
    return `sub-header sye-${syeId}`;
  }

}
