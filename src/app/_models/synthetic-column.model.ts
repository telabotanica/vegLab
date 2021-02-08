import { OccurrenceValidationModel } from './occurrence-validation.model';
import { SyntheticItem } from './synthetic-item.model';
import { Sye } from './sye.model';
import { Biblio } from './biblio.model';
import { VlUser } from './vl-user.model';
import { ExtendedFieldOccurrence } from './extended-field-occurrence';

export interface SyntheticColumn {
  '@id'?:          string;
  id:              number;

  userId:          string;  // not mandatory in backend but we force mandatory in front
  userEmail:       string;  // mandatory in backend
  userPseudo:      string;  // not mandatory in backend but we force mandatory in front
  user:            VlUser;

  sye:             Sye;
  validations:     Array<OccurrenceValidationModel>;
  items:           Array<SyntheticItem>;
  vlBiblioSource?: Biblio;
  vlWorkspace:     string;
  extendedFieldOccurrences?: Array<ExtendedFieldOccurrence>;
}
