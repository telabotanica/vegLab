export interface TableViewRow {
  type: 'data' | 'group';
  count: number;
  displayName: string; // And change 'name' field name !!!
  syeId: number;
  values: Array<string>;
  items: Array<{
    tableRowId: number,         // Related to TableModel:rowsDefinitions:id
    tableOccurrenceId: number,
    value: string
  }>;
}
