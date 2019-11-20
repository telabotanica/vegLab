export interface TableSelectedElement {
  element: 'row' | 'column' | 'groupTitle' | 'groupName' | 'occurrenceValue' | 'syntheticValue';
  occurrenceIds: Array<number>;
  syeId: number;
  rowId: number;
  groupId: number;
  multipleSelection: boolean;
  startPosition: number;
  endPosition: number;
}
