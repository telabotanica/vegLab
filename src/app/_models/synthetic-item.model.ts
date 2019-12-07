export interface SyntheticItem {
  id:                          number;

  userId:                      number;  // not mandatory in backend but we force mandatory in front
  userEmail:                   string;  // mandatory in backend
  userPseudo:                  string;  // not mandatory in backend but we force mandatory in front

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
