import { OccurrenceModel } from './occurrence.model';
import { SyntheticColumn } from './synthetic-column.model';
import { OccurrenceValidationModel } from './occurrence-validation.model';
import { Biblio } from './biblio.model';

export interface Sye {
  id:                 number;
  originalReference?: string; // needed for table import
  syeId:              number;
  occurrencesCount:   number;
  occurrences:        Array<OccurrenceModel>;
  occurrencesOrder?:  string;
  syntheticColumn:    SyntheticColumn;
  onlyShowSyntheticColumn: boolean;
  validations?:       Array<OccurrenceValidationModel>;
  vlBiblioSource?:    Biblio;
  vlWorkspace:        string;
}
