import { Component, OnInit, Input } from '@angular/core';

import * as L from 'leaflet';
import { Point, GeoJsonObject } from 'geojson';

@Component({
  selector: 'vl-simple-geojson-map',
  templateUrl: './simple-geojson-map.component.html',
  styleUrls: ['./simple-geojson-map.component.scss']
})
export class SimpleGeojsonMapComponent implements OnInit {
  @Input() set geoJson(value: Array<MyGeoJson>) {
    if (value && value.length > 0) {
      this._geojson = value;
    } else {
      // No valid geoJson
      this.noValidGeoJson = true;
    }
  }
  @Input() set invalidateSize(value: boolean) {
    if (value) { this.invalidateMapSize(); }
  }

  public noValidGeoJson = false;
  private map: L.Map;
  public mapOptions: any;
  private mapLayers: L.Control.LayersObject = {};
  private osmLayer = L.tileLayer(`https://a.tile.openstreetmap.org/{z}/{x}/{y}.png`, { maxZoom: 18, attribution: 'Open Street map' });
  private openTopoMapLayer = L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: 'OpenTopoMap'});
  private googleHybridLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google maps' });
  private drawnLayer = L.geoJSON(null);

  _geojson: Array<MyGeoJson>;

  constructor() { }

  ngOnInit() {
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

  onMapReady(map: L.Map) {
    this.map = map;
    this.map.addControl(L.control.layers(null, this.mapLayers, { position: 'topright'}));
    this.setGeometry(this._geojson);
    this.map.addLayer(this.drawnLayer);
  }

  private setGeometry(geom: Array<any>): void {
    this.clearDrawnItemsLayer();

    if (geom == null) {
      // No valid geom provided
      return;
    }

    for (const item of geom) {
      // point
      // @Note Leaflet is not supporting multi points (not by this way at less)
      //       but adding multipoint here avoid function crash
      if (item.type.toLowerCase() === 'point' || item.type.toLowerCase() === 'multipoint') {
        const latLng = L.latLng(item.coordinates[1], item.coordinates[0]);
        let m: any;
        m = new L.Marker(latLng);
        m.addTo(this.drawnLayer);
      }

      // lineString
      if (item.type.toLowerCase() === 'linestring' || item.type.toLowerCase() === 'multilinestring') {
        const coords: any = [];
        for (const c of item.coordinates[0]) {
          coords.push(new L.LatLng(c[1], c[0]));
        }
        const m = new L.Polyline(coords);
        m.addTo(this.drawnLayer);
      }

      // polygon
      // @Note Leaflet is not supporting multi polygond (not by this way at less)
      //       but adding multipoint here avoid function crach
      if (item.type.toLowerCase() === 'polygon' || item.type.toLowerCase() === 'multipolygon') {
        if (item.type.toLowerCase() === 'multipolygon') {
          console.log('MULTI POLYGON');
          console.log(item);

          let coords: any = [];

          const coordinates = item.coordinates as any;
          const c: Array<Array<Array<Array<number[]>>>> = Array<Array<Array<Array<number[]>>>>(coordinates);
          for (const polygonsWrapper of c) {
            for (const polygons of polygonsWrapper) {
              for (const p of polygons) {
                coords = [];
                for (const _coordinates of p) {
                  coords.push(new L.LatLng(_coordinates[1], _coordinates[0]));
                }
                const m = new L.Polygon(coords);
                m.addTo(this.drawnLayer);
              }
            }
          }

        } else {
          const coords: any = [];
          for (const c of item.coordinates[0]) {
            coords.push(new L.LatLng(c[1], c[0]));
          }
          const m = new L.Polygon(coords);
          m.addTo(this.drawnLayer);
        }
      }
    }
    this.flyToDrawnItems();

  }

  clearDrawnItemsLayer(): void {
    this.drawnLayer.clearLayers();
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
    const bounds = this.drawnLayer.getBounds();
    this.map.flyToBounds(bounds, { maxZoom: maxzoom, animate: false });
  }

}

export interface MyGeoJson {
  coordinates: Array<number>;
  type: string;
}
