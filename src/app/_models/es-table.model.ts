export interface EsTableModel {
  id:                     number;
  title:                  string;
  description:            string;
  isDiagnosis:            boolean;
  hasPdf:                 boolean;
  pdfContentUrl:          string;
  vlBiblioSource:         string;
  userId:                 number;
  ownedByCurrentUser:     boolean;  // not included in the database ; this field is populated at GET Table (table service)
  createdBy:              number;
  createdAt:              string;
  updatedBy:              number;
  updatedAt:              string;
  occurrencesCount:       number;
  rowsCount:              number;
  syeCount:               number;
  tableValidation:        string;
  syeValidations:         string;
  validations:            string;
  occurrencesValidations: string;
  rowsValidations:        string;
  tableName:              string;
  occurrencesNames:       string;
  preview:                Array<string>;
  selected?:              boolean;  // not in database
  isCurrentTable?:        boolean;  // not in database
}
