import { OccurrenceValidationModel } from './occurrence-validation.model';
import { SyntheticItem } from './synthetic-item.model';
import { Sye } from './sye.model';
import { Biblio } from './biblio.model';

export interface SyntheticColumn {
  '@id'?:          string;
  id:              number;

  userId:          number;  // not mandatory in backend but we force mandatory in front
  userEmail:       string;  // mandatory in backend
  userPseudo:      string;  // not mandatory in backend but we force mandatory in front

  sye:             Sye;
  validations:     Array<OccurrenceValidationModel>;
  items:           Array<SyntheticItem>;
  vlBiblioSource?: Biblio;
  vlWorkspace:     string;
}
