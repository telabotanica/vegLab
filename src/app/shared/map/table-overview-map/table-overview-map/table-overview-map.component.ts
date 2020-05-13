import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { TableService } from 'src/app/_services/table.service';
import { Table } from 'src/app/_models/table.model';
import { OccurrenceModel } from 'src/app/_models/occurrence.model';
import { Subscription } from 'rxjs';

import * as L from 'leaflet';
// import { Point, GeoJsonObject } from 'geojson/index';
import * as G from 'geojson';

import * as _ from 'lodash';


@Component({
  selector: 'vl-table-overview-map',
  templateUrl: './table-overview-map.component.html',
  styleUrls: ['./table-overview-map.component.scss']
})
export class TableOverviewMapComponent implements OnInit, OnDestroy {
  @Input() set invalidateSize(value: boolean) {
    if (value) { this.invalidateMapSize(); }
  }

  tableSubscriber: Subscription;
  table: Table;

  uniqCentroids: Array<{occurrencesIds: Array<number>, point: G.Point}> = [];

  private map: L.Map;
  public mapOptions: any;
  private mapLayers: L.Control.LayersObject = {};
  private osmLayer = L.tileLayer(`https://a.tile.openstreetmap.org/{z}/{x}/{y}.png`, { maxZoom: 18, attribution: 'Open Street map' });
  private openTopoMapLayer = L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: 'OpenTopoMap'});
  private googleHybridLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google maps' });
  private occurrencesCentroidsLayer = L.geoJSON(null, { pointToLayer: (feature, latLng) => (L.circleMarker(latLng, {radius: 6, fillColor: '#ff7800', color: '#000', weight: 1, opacity: 1, fillOpacity: 0.7 })) });

  constructor(private tableService: TableService) { }

  ngOnInit() {
    // Subscribe to table change
    this.tableSubscriber = this.tableService.currentTableChanged.subscribe(value => {
      if (value === true) {
        this.table = this.tableService.getCurrentTable();
        this.setCentroidsToMap();
      }
    });

    // Map options & configuration
    this.mapOptions = {
      layers: [this.openTopoMapLayer],
      zoom: 4,
      center: L.latLng({ lat: 46.55886030, lng: 2.98828125 })
    };

    // Add map layer
    this.mapLayers['OpenTopoMap'] = this.openTopoMapLayer;
    this.mapLayers['OSM'] = this.osmLayer;
    this.mapLayers['Google hybride'] = this.googleHybridLayer;
  }

  ngOnDestroy() {
    if (this.tableSubscriber) { this.tableSubscriber.unsubscribe(); }
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.map.addControl(L.control.layers(null, this.mapLayers, { position: 'topright'}));
    this.map.addLayer(this.occurrencesCentroidsLayer);

    // Check current table at startup
    const currentTable = this.tableService.getCurrentTable();
    if (currentTable) {
      this.table = currentTable;
      this.setCentroidsToMap();
    }
  }

  setCentroidsToMap(): void {
    // clear centroids
    const centroids: Array<{occurrenceId: number, point: G.Point}> = [];
    this.uniqCentroids = [];
    this.occurrencesCentroidsLayer.clearLayers();

    // add centroids
    if (this.table && this.table.sye) {
      const releves: Array<OccurrenceModel> = this.tableService.getReleves();
      for (const releve of releves) {
        if (releve.centroid) {
          const point = { type: 'Point', coordinates: [releve.centroid.coordinates[0], releve.centroid.coordinates[1]] } as G.Point;
          centroids.push({occurrenceId: releve.id, point});
        }
      }

      // get uniq centroids (several releves can have the same centroid)
      if (centroids.length > 0) {
        const groupedCentroids = _.groupBy(centroids, c => c.point.coordinates);
        for (const key in groupedCentroids) {
          if (groupedCentroids.hasOwnProperty(key)) {
            const group = groupedCentroids[key];
            const ids = _.map(group, g => g.occurrenceId);
            this.uniqCentroids.push({occurrencesIds: ids, point: group[0].point});
          }
        }
      }
      if (this.uniqCentroids.length > 0) {
        for (const uc of this.uniqCentroids) {
          const tooltip = new L.Tooltip({permanent: true, direction: 'center', className: 'text'}).setContent(uc.occurrencesIds.length.toString());
          const l = new L.CircleMarker(new L.LatLng(uc.point.coordinates[1], uc.point.coordinates[0]), {
            // circle marker options
            radius: (uc.occurrencesIds.length * 5), fillColor: '#ff7800', color: '#000', weight: 1, opacity: 1, fillOpacity: 1
          }).bindTooltip(tooltip).addTo(this.occurrencesCentroidsLayer);
        }

        this.flyToDrawnItems();
      }
    }
  }

  // https://github.com/Asymmetrik/ngx-leaflet/issues/104
  invalidateMapSize() {
    setTimeout(() => {
      this.map.invalidateSize();
    }, 10);
  }

  /**
   * Set map bounds to drawn items
   */
  flyToDrawnItems(maxzoom = 14) {
    const bounds = this.occurrencesCentroidsLayer.getBounds();
    this.map.flyToBounds(bounds, { maxZoom: maxzoom, animate: false });
  }

}
