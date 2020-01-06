import { OccurrenceModel } from './occurrence.model';
import { EsOccurrenceModel } from './es-occurrence-model';

export interface EsOccurrencesResultModel {
  _shards: {
    failed:      number,
    skipped:     number,
    successful:  number,
    total:       number
  };
  hits: {
    hits: Array<{
      _id:       string,
      _index:    string,                     // 'cel2_occurrence'
      _score:    number,
      _source:   EsOccurrenceModel,
      _type:     string                       // 'occurrence'
    }>,
    max_score:   number,
    total:       number
  };
  timed_out:     boolean;
  took:          number;
}
