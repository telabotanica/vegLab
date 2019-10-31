import { Injectable } from '@angular/core';
import { NominatimObject } from 'tb-geoloc-lib';

import * as turf from '@turf/turf';
import { AllGeoJSON, Geometry, Feature, Point } from '@turf/turf';
import * as simplify from '@turf/simplify';


@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor() { }

  /**
   * The data returned by Nominatim concerning the city are present under different fields according to the size of the city: city, town, village or hamlet.
   * This method checks the presence of data for one of these fields and returns it
   */
  getCityFromNominatimObject(obj: NominatimObject): string {
    if (obj.address.city) {
      return obj.address.city;
    } else if (obj.address.town) {
      return obj.address.town;
    } else if (obj.address.village) {
      return obj.address.village;
    } else if (obj.address.hamlet) {
      return obj.address.hamlet;
    } else { return ''; }
  }

  simplifyPolygon(geoJson: any, tolerance = 0.0015, highQuality = true): any {
    if (geoJson.type === 'Polygon') {
      const simplePolygon = turf.simplify(geoJson, { tolerance, highQuality });
      return simplePolygon;
    } else {
      return geoJson;
    }
  }

  getCentroid(geoJson: {type: string, coordinates: Array<Array<number>>}): Feature<Point> {
    return turf.centroid(geoJson);
  }
}
