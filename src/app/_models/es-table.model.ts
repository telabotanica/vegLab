export interface EsTableModel {
  id:                     number;
  title:                  string;
  description:            string;
  isDiagnosis:            boolean;
  hasPdf:                 boolean;
  pdfContentUrl:          string;
  userId:                 number;
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
