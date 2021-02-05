import { UserModel } from './user.model';
import { VlUser } from './vl-user.model';

export interface OccurrenceValidationModel {
  id?:               number;
  validatedBy:       string;    // user id
  validatedAt:       Date;
  user:              VlUser;
  updatedBy?:        string;     // user id
  updatedAt?:        Date;
  repository:        string;
  repositoryIdNomen: number;
  repositoryIdTaxo?: string;
  inputName:         string;
  validatedName:     string;
  validName:         string;
  userIdValidation?: string;
  userValidation?:    VlUser;
  // isDiagnosis?:      boolean;
}
