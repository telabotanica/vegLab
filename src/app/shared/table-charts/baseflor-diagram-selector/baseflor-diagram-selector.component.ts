import { Component, OnInit, OnDestroy } from '@angular/core';
import { TableService } from 'src/app/_services/table.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'vl-baseflor-diagram-selector',
  templateUrl: './baseflor-diagram-selector.component.html',
  styleUrls: ['./baseflor-diagram-selector.component.scss']
})
export class BaseflorDiagramSelectorComponent implements OnInit, OnDestroy {
  selecedValue: string = null;
  chartType: 'horizontalBar' | 'pie' = 'horizontalBar';

  tableSubscriber: Subscription;
  tableSet = false;

  constructor(private tableService: TableService) { }

  ngOnInit() {
    this.tableSubscriber = this.tableService.currentTableChanged.subscribe(
      value => {
        if (value === true) {
          this.tableSet = true;
        } else {
          this.tableSet = false;
        }
      }, error => { this.tableSet = false; }
    );
  }

  ngOnDestroy() {

  }

  toggleChartType(): void {
    this.chartType = this.chartType === 'horizontalBar' ? 'pie' : 'horizontalBar';
  }

}
