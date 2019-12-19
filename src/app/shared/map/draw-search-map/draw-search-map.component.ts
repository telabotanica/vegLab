import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import * as L from 'leaflet';
import * as _ from 'lodash';
import { Polygon, Point } from 'geojson';
// import 'leaflet-draw';

@Component({
  selector: 'vl-draw-search-map',
  templateUrl: './draw-search-map.component.html',
  styleUrls: ['./draw-search-map.component.scss']
})
export class DrawSearchMapComponent implements OnInit {
  /*@Input() set geoJsonResults(values: Array<GeoJsonObject>) {
    this.geoResultsLayer.clearLayers();
    _.forEach(values, v => this.geoResultsLayer.addData(v));
  }*/
  @Input() set centroidResults(values: Array<[number, number]>) {
    console.log('VALUES', values);
    this.geoResultsLayer.clearLayers();
    if (values !== null && values.length > 0) {
      // count results without centroid data === without location
      const valuesWithoutEmptyData = _.compact(values);
      this.relevesWithoutLocation = values.length - valuesWithoutEmptyData.length;
      _.forEach(valuesWithoutEmptyData, v => { console.log(v); const p = { type: 'Point', coordinates: [v[0], v[1]] } as Point; this.geoResultsLayer.addData(p);  });
    }
  }
  @Input() set invalidateSize(value: boolean) {
    if (value) {this.invalidateMapSize(); }
  }
  @Output() boundingBox = new EventEmitter<{topLeft: {lat: number, lng: number}, bottomRight: {lat: number, lng: number}}>();
  @Output() polygon = new EventEmitter<Polygon>();

  // ----------------------------------------
  // LEAFLET VARIABLES, LAYERS AND MAP CONFIG
  // ----------------------------------------
  private map: L.Map;
  public mapOptions: any;
  private mapLayers: L.Control.LayersObject = {};
  private drawnItems: L.FeatureGroup = new L.FeatureGroup();  // all drawn items
  private osmLayer = L.tileLayer(`https://a.tile.openstreetmap.org/{z}/{x}/{y}.png`, { maxZoom: 18, attribution: 'Open Street map' });
  private openTopoMapLayer = L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: 'OpenTopoMap'});
  private googleHybridLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google maps' });
  private drawControlFull: L.Control.Draw;  // draw panel
  private drawControlEdit: L.Control.Draw;  // edit panel
  private geoResultsLayer = L.geoJSON(null, { pointToLayer: (feature, latLng) => (L.circleMarker(latLng, {radius: 6, fillColor: '#ff7800', color: '#000', weight: 1, opacity: 1, fillOpacity: 0.7})) });
  relevesWithoutLocation: number;

  constructor() { }

  ngOnInit() {
    // Map options & configuration
    this.mapOptions = {
      layers: [this.openTopoMapLayer],
      zoom: 4,
      center: L.latLng({ lat: 46.55886030, lng: 2.98828125 })
    };
    this.drawControlEdit = drawControlEditPanel(this.drawnItems);
    this.drawControlFull = drawControlPanel();

    // Add map layer
    this.mapLayers['OpenTopoMap'] = this.openTopoMapLayer;
    this.mapLayers['OSM'] = this.osmLayer;
    this.mapLayers['Google hybride'] = this.googleHybridLayer;
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.map.addControl(this.drawControlFull);
    this.map.addControl(L.control.layers(null, this.mapLayers, { position: 'topright'}));
    this.map.addLayer(this.drawnItems);
    this.map.addLayer(this.geoResultsLayer);
    this.map.on('draw:created', (e) => {
      this.drawnItems.clearLayers();
      this.drawnItems.addLayer(e['layer']);
      this.setMapEditMode();
      this.flyToDrawnItems();

      const layerType = e['layerType'];

      if (layerType === 'rectangle') {
        const bounds = this.drawnItems.getBounds();
        const northWest = {lat: bounds.getNorth(), lng: bounds.getWest()};
        const southEast = {lat: bounds.getSouth(), lng: bounds.getEast()};
        this.boundingBox.emit({topLeft: northWest, bottomRight: southEast});
      } else if (layerType === 'polygon') {
        const geoJson: any = this.drawnItems.toGeoJSON();
        const geometry: any = geoJson.features[0].geometry as Polygon;
        this.polygon.emit(geometry as Polygon);
      }
    });
    this.map.on('draw:edited', (e) => {
      this.flyToDrawnItems();
      const bounds = this.drawnItems.getBounds();
      const northWest = {lat: bounds.getNorth(), lng: bounds.getWest()};
      const southEast = {lat: bounds.getSouth(), lng: bounds.getEast()};
      this.boundingBox.emit({topLeft: northWest, bottomRight: southEast});
    });
    this.map.on('draw:deleted', (e) => {
      this.setMapDrawMode();
      this.boundingBox.emit(null);
    });

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
    const b = this.drawnItems.getBounds();
    this.map.flyToBounds(b, { maxZoom: maxzoom, animate: false });
  }

  /**
   * Show the "edit" toolbar inside map
   */
  setMapEditMode() {
    this.map.removeControl(this.drawControlFull);
    this.map.addControl(this.drawControlEdit);
  }

  /**
   * Show the "draw" toolbar inside map
   */
  setMapDrawMode() {
    this.map.removeControl(this.drawControlEdit);
    this.map.addControl(this.drawControlFull);
  }

}


/**
 * Main control panel
 */
// tslint:disable-next-line:variable-name
export function drawControlPanel() {
  return new L.Control.Draw({
    position: 'topleft',
    draw: {
      marker: false,
      polyline: false,
      polygon: false,
      rectangle: {},
      circle: false,
      circlemarker: false
    }
  });
}

/**
 * Main edit panel
 */
export function drawControlEditPanel(editedLayer: L.FeatureGroup) {
  const editOpt = {};
  const dcep = new L.Control.Draw({
    position: 'topleft',
    draw: {
      marker: false,
      polyline: false,
      polygon: false,
      rectangle: false,
      circle: false,
      circlemarker: false
    },
    edit: {
      featureGroup: editedLayer, // this panel id editing editedLayer
      edit: editOpt,
      remove: {}
    }
  });
  return dcep;
}
