import { OccurrenceModel } from './occurrence.model';
import { ExtendedFieldModel } from './extended-field.model';

export interface ExtendedFieldOccurrence {
  id?:           number;
  occurrence:    OccurrenceModel;
  extendedField: ExtendedFieldModel;
  value:         string;
}
