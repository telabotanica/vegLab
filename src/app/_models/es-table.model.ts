export interface EsTableModel {
  id:                     number;
  title:                  string;
  description:            string;
  isDiagnosis:            boolean;
  hasPdf:                 boolean;
  pdfContentUrl:          string;
  userId:                 number;
  ownedByCurrentUser:     boolean;  // not included in the database ; this field is populated at GET Table (table service)
  createdAt:              string;
  updatedAt:              string;
  occurrencesCount:       number;
  rowsCount:              number;
  tableValidation:        string;
  syeValidations:         string;
  occurrencesValidations: string;
  rowsValidations:        string;
  tableName:              string;
  occurrencesNames:       string;
  preview:                Array<string>;
}
