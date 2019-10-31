export interface SyntheticItem {
  id:                          number;

  layer:                       string;

  repository:                  string;
  repositoryIdNomen:           number;
  repositoryIdTaxo:            string;
  displayName:                 string;

  occurrencesCount:            number;
  isOccurrenceCountEstimated: boolean;
  frequency:                   number;
  coef?:                       string;
  minCoef?:                    string;
  maxCoef?:                    string;
}
