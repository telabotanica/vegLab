import { OccurrenceValidationModel } from './occurrence-validation.model';
import { VlUser } from './vl-user.model';

export interface EsTableModel {
  id:                     number;
  title:                  string;
  description:            string;
  isDiagnosis:            boolean;
  hasPdf:                 boolean;
  pdfContentUrl:          string;
  vlBiblioSource:         string;
  userId:                 string;
  user:                   VlUser;
  ownedByCurrentUser:     boolean;  // not included in the database ; this field is populated at GET Table (table service)
  createdBy:              string;
  createdAt:              string;
  updatedBy:              string;
  updatedAt:              string;
  occurrencesCount:       number;
  rowsCount:              number;
  syeCount:               number;
  tableValidation:        string;
  syeValidations:         string;
  validations?:           Array<OccurrenceValidationModel>;
  occurrencesValidations: string;
  rowsValidations:        string;
  tableName:              string;
  occurrencesNames:       string;
  preview:                Array<string>;
  selected?:              boolean;  // not in database
  isCurrentTable?:        boolean;  // not in database
}
