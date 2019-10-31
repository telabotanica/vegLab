import { EsTableModel } from './es-table.model';

export interface EsTableResultModel {
  _shards: {
    failed:      number,
    skipped:     number,
    successful:  number,
    total:       number
  };
  hits: {
    hits: Array<{
      _id:       string,
      _index:    string,                     // 'vl_table'
      _score:    number,
      _source:   EsTableModel,
      _type:     string                       // 'occurrence'
    }>,
    max_score:   number,
    total:       number
  };
  timed_out:     boolean;
  took:          number;
}
