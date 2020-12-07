import { UserModel } from './user.model';

export interface OccurrenceValidationModel {
  id?:               number;
  validatedBy:       string;    // user id
  validatedAt:       Date;
  updatedBy?:        string;     // user id
  updatedAt?:        Date;
  repository:        string;
  repositoryIdNomen: number;
  repositoryIdTaxo?: string;
  inputName:         string;
  validatedName:     string;
  validName:         string;
  // isDiagnosis?:      boolean;
}
