import { UserModel } from './user.model';

export interface OccurrenceValidationModel {
  id?:               number;
  validatedBy:       number;    // user id
  validatedAt:       Date;
  updatedBy?:        number;     // user id
  updatedAt?:        Date;
  repository:        string;
  repositoryIdNomen: number;
  repositoryIdTaxo?: string;
  inputName:         string;
  validatedName:     string;
  validName:         string;
  // isDiagnosis?:      boolean;
}
