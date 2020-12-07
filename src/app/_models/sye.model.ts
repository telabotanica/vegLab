import { OccurrenceModel } from './occurrence.model';
import { SyntheticColumn } from './synthetic-column.model';
import { OccurrenceValidationModel } from './occurrence-validation.model';
import { Biblio } from './biblio.model';

export interface Sye {
  id:                 number;

  userId:             string;  // not mandatory in backend but we force mandatory in front
  userEmail:          string;  // mandatory in backend
  userPseudo:         string;  // not mandatory in backend but we force mandatory in front

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
