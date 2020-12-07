import { OccurrenceValidationModel } from './occurrence-validation.model';
import { Sye } from './sye.model';
import { TableRowDefinition } from './table-row-definition.model';
import { SyntheticColumn } from './synthetic-column.model';
import { PdfFile } from './pdf-file.model';
import { Biblio } from './biblio.model';

export interface Table {
  id:              number;

  userId:          string;  // not mandatory in backend but we force mandatory in front
  userEmail:       string;  // mandatory in backend
  userPseudo:      string;  // not mandatory in backend but we force mandatory in front
  ownedByCurrentUser: boolean;  // not included in the database ; this field is populated at GET Table (table service)

  isDiagnosis?:    boolean;
  validations?:    Array<OccurrenceValidationModel>;

  createdBy:       string;
  createdAt:       Date;
  updatedBy?:      string;
  updatedAt?:      Date;

  title?:          string;
  description?:    string;

  rowsDefinition:  Array<TableRowDefinition>;

  sye:             Array<Sye>;
  syeOrder:        string;
  syntheticColumn: SyntheticColumn;

  pdf?:            PdfFile;

  vlBiblioSource?: Biblio;

  vlWorkspace:   string;
}
