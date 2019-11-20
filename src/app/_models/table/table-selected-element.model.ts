export interface TableSelectedElement {
  element: 'row' | 'column' | 'groupTitle' | 'groupName' | 'occurrenceValue' | 'syntheticValue';
  occurrenceId: number;
  syeId: number;
  rowId: number;
  groupId: number;
  multipleSelection: boolean;
  startPosition: number;
  endPosition: number;
}
