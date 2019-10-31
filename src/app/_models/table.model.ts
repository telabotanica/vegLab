import { OccurrenceValidationModel } from './occurrence-validation.model';
import { Sye } from './sye.model';
import { TableRowDefinition } from './table-row-definition.model';
import { SyntheticColumn } from './synthetic-column.model';
import { PdfFile } from './pdf-file.model';
import { Biblio } from './biblio.model';

export interface Table {
  id:              number;

  isDiagnosis?:    boolean;
  validations?:    Array<OccurrenceValidationModel>;

  createdBy:       number;
  createdAt:       Date;
  updatedBy?:      number;
  updatedAt?:      Date;

  title?:          string;
  description?:    string;

  rowsDefinition:  Array<TableRowDefinition>;

  sye:             Array<Sye>;
  syntheticColumn: SyntheticColumn;

  pdf?:            PdfFile;

  vlBiblioSource?: Biblio;

  vlWorkspace:   string;
}
