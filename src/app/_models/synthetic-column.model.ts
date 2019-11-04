import { OccurrenceValidationModel } from './occurrence-validation.model';
import { SyntheticItem } from './synthetic-item.model';
import { Sye } from './sye.model';
import { Biblio } from './biblio.model';

export interface SyntheticColumn {
  '@id'?:          string;
  id:              number;
  sye:             Sye;
  validations:     Array<OccurrenceValidationModel>;
  items:           Array<SyntheticItem>;
  vlBiblioSource?: Biblio;
  vlWorkspace:     string;
}
