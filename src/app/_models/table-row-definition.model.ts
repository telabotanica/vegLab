export interface TableRowDefinition {
  id:                number;
  rowId:             number;
  type:              'group' | 'data';
  groupId:           number;
  groupTitle:        string;
  layer:             string;
  displayName:       string;
  repository:        string;
  repositoryIdNomen: number;
  repositoryIdTaxo:  string;
}

export interface TableRow extends TableRowDefinition {
  count:          number;
  items: Array<{
    type:         'cellOccValue' | 'cellSynColValue' | 'rowTitle' | 'rowValue';
    syeId:        number;
    syntheticSye: boolean;
    occurrenceId: number;
    value:        string
  }>;
}
