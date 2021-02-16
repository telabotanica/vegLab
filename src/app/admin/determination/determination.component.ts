import { Component, OnInit } from '@angular/core';
import { RepositoryItemModel } from 'tb-tsb-lib';
import * as _ from 'lodash';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/internal/operators/tap';
import { map } from 'rxjs/internal/operators/map';
import { SyntheticItem } from 'src/app/_models/synthetic-item.model';

@Component({
  selector: 'vl-determination',
  templateUrl: './determination.component.html',
  styleUrls: ['./determination.component.scss']
})
export class DeterminationComponent implements OnInit {
  occurrencesFilter: Array<RepositoryItemModel> = [];
  results: {count: number, source: Array<{
    score: number,
    source: {
      validations: Array<RepositoryItemModel>,      // Synthetic column validations
      items: Array<SyntheticItem>                   // Synthetic column items
    }
  }>};
  useFrequency = true;

  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

  addOccurrenceToFilter(item: RepositoryItemModel): void {
    if (_.find(this.occurrencesFilter, i => i === item )) { return; }
    this.occurrencesFilter.push(item);
    console.log(this.occurrencesFilter);
    this.search();
  }

  removeOccurrenceFilter(item: RepositoryItemModel): void {
    _.remove(this.occurrencesFilter, item);
    this.search();
  }

  clearFilter(): void {
    this.occurrencesFilter = [];
    this.results.count = 0;
    this.results.source = [];
  }

  search() {
    if (this.occurrencesFilter.length === 0) {
      this.clearFilter();
      return;
    }

    console.log('Search...', this.useFrequency);

    const headers = new HttpHeaders({
      'Content-type': 'application/json',
      Authorization: `Basic ${btoa('elastic:' + 'rGC2VaPEiPLCAzaVLkxv')}`
    });

    const query = this.useFrequency === true ? this.esQueryAssemblerWithFrequency(this.occurrencesFilter) : this.esQueryAssembler(this.occurrencesFilter);
    console.log('query', query);

    let count = 0;
    this.http.post<any>(`http://localhost:9200/vl_synth_cols/_search`, query, {headers}).pipe( // <EsTableResultModel>
      tap(result => count = result.hits.total),
      map(result => _.map(result.hits.hits, (hit) => {
        return {score: hit._score, source: hit._source};
      })),
      // tap(result => _.map(result, r => r.source.validations = r.source.validations)),
      map(result => {
        return {source: result, count};
      })// ,
      // map(result => _.map(result.tables, table => table.source.validations = JSON.parse(table.source.validations)))
    ).subscribe(results => {
      console.log(results);
      this.results = results;
    }, error => {
      console.log(error);
    });
  }




  // ---------------------------
  // ES QUERY PARTS & ASSEMBLERS
  // ---------------------------
  public esQueryAssembler(repositoryItems: Array<RepositoryItemModel>, from?: number): string {
    const mustPart = this.esMustClauseAssembler(repositoryItems);
    // let mustNotPart = this.esMustNotClauseAssembler();

    // mustNotPart = (mustNotPart !== '' && mustPart !== '' ) ? ', ' + mustNotPart : mustNotPart;

    const _from = from ? from : 0;
    const _size = 10;

    const query = `
    {
      "query": {
          "nested": {
              "path": "items",
              "query": {
                  "bool": {
                    ${mustPart}
                  }
              }
          }
      }
  }
    `;

    return query;
  }

  public esQueryAssemblerWithFrequency(repositoryItems: Array<RepositoryItemModel>, from?: number): string {
    const mustPart = this.esMustClauseAssembler(repositoryItems);
    // let mustNotPart = this.esMustNotClauseAssembler();

    // mustNotPart = (mustNotPart !== '' && mustPart !== '' ) ? ', ' + mustNotPart : mustNotPart;

    const _from = from ? from : 0;
    const _size = 10;

    const query = `
    {
      "from": ${_from}, "size": ${_size},
      "query": {
          "bool": {
              "should": [
                  {
                      "nested": {
                          "path": "items",
                          "query": {
                              "function_score": {
                                  "functions": [
                                      {
                                          "field_value_factor": {
                                              "field": "items.frequency",
                                              "missing": 0
                                          }
                                      }
                                  ],
                                  "query": {
                                      "bool": {
                                          ${mustPart}
                                      }
                                  }
                              }
                          }
                      }
                  }
              ]
          }
      }
  }
    `;

    return query;
  }

  private esMustClauseAssembler(repositoryItems): string {
    const rowOcc: Array<string> = this.esRowOccurrencesMustQueryPart(repositoryItems);

    const parts = [].concat(...rowOcc);

    let stringParts = ''; // '{ "match_phrase": { "isDiagnosis": "true" } },';
    let i = 0;
    parts.forEach(p => {
      stringParts = stringParts + p + (i < parts.length - 1 ? ', ' : '');
      i++;
    });
    const mustString = parts.length > 0 ? `"should": [${stringParts}]` : '';
    return mustString;
  }

  /**
   * Constructs the EalsticSearch query part "MUST contains thoses row occurrences".
   * Output example :
   * `
   *   { "match": { "items.repository": "bdtfx" } },
   *   { "match": { "items.repositoryIdNomen": "50912" } }
   * `
   */
  private esRowOccurrencesMustQueryPart(rowOccurrenceValidations: Array<RepositoryItemModel>): Array<string> {
    const parts: Array<string> = [];
    rowOccurrenceValidations.forEach(rowOccurrenceValidation => {
      let idTaxo: any = null;
      if (rowOccurrenceValidation.idTaxo !== null) {
        idTaxo = rowOccurrenceValidation.idTaxo;
       } else if (rowOccurrenceValidation.validOccurence.idNomen !== null) {
         idTaxo = rowOccurrenceValidation.validOccurence.idNomen;
        } else {
          throw new Error(`We can't retrieve a (syn)taxonomic ID for the [${rowOccurrenceValidation.idTaxo}]${rowOccurrenceValidation.idNomen} (syn)taxonomic nomenclatural ID.`);
        }
      const matchPhrase = `{ "match": { "items.repository": "${rowOccurrenceValidation.repository}" } },
                           { "match": { "items.repositoryIdNomen": "${rowOccurrenceValidation.idNomen}" } }`;
      parts.push(matchPhrase);
    });
    return parts;
  }

}
