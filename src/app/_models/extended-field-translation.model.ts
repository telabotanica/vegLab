import { ExtendedFieldModel } from './extended-field.model';

export interface ExtendeFieldTranslationModel {
  id:               number;
  projectName:      string;
  label:            string;
  description?:     string;
  defaultValue?:    string;
  errorMessage?:    string;
  languageIsoCode?: string;
  extendedField?:   ExtendedFieldModel;
}
