import { TelaBotanicaProjectModel } from './tela-botanica-project.model';
import { ExtendeFieldTranslationModel } from './extended-field-translation.model';

import { FieldDataType } from '../_enums/field-data-type-enum';

export interface ExtendedFieldModel {
  id:                         number;
  fieldId:                    string;
  projectName:                string;
  dataType:                   FieldDataType;
  isVisible:                  boolean;
  isEditable?:                boolean;
  isMandatory:                boolean;
  minValue?:                  number;
  maxValue?:                  number;
  defaultValue?:              string;
  unit?:                      string;
  filterStep?:                number;
  filterLogarithmic?:         boolean;
  regexp?:                    string;
  project?:                   Array<TelaBotanicaProjectModel>;
  // extendedFieldOccurrences: any;
  extendedFieldTranslations?: Array<ExtendeFieldTranslationModel>;
}
