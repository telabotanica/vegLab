import { OccurrenceModel } from './occurrence.model';
import { EsOccurrenceModel } from './es-occurrence-model';

export interface EsOccurrencesDocsResultModel {
  docs: Array<{
    found: boolean,
    _id: string,
    _index: string,
    _primary_term: number,
    _seq_no: number,
    _source: EsOccurrenceModel,
    _type: string,
    _version: number
  }>;
}
