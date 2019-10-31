import { OccurrenceModel } from './occurrence.model';

export interface EsOccurrencesDocsResultModel {
  docs: Array<{
    found: boolean,
    _id: string,
    _index: string,
    _primary_term: number,
    _seq_no: number,
    _source: OccurrenceModel,
    _type: string,
    _version: number
  }>;
}
