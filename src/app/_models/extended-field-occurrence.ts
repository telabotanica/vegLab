import { OccurrenceModel } from './occurrence.model';
import { ExtendedFieldModel } from './extended-field.model';

export interface ExtendedFieldOccurrence {
  id?:           number;
  occurrence:    OccurrenceModel | {'@id': string};
  extendedField: ExtendedFieldModel | {'@id': string};
  value:         string;
}
