import { OccurrenceModel } from './occurrence.model';
import { ExtendedFieldModel } from './extended-field.model';

export interface ExtendedFieldOccurrence {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id?:           number;
  occurrence:    OccurrenceModel;
  extendedField: ExtendedFieldModel;
  value:         string;
}
