import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'vl-baseflor-diagram-selector',
  templateUrl: './baseflor-diagram-selector.component.html',
  styleUrls: ['./baseflor-diagram-selector.component.scss']
})
export class BaseflorDiagramSelectorComponent implements OnInit {
  selecedValue: string = null;
  chartType: 'horizontalBar' | 'pie' = 'horizontalBar';

  constructor() { }

  ngOnInit() {
  }

  toggleChartType(): void {
    this.chartType = this.chartType === 'horizontalBar' ? 'pie' : 'horizontalBar';
  }

}
