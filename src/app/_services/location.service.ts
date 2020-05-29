import { Injectable } from '@angular/core';
import { NominatimObject, VlAccuracyEnum } from 'tb-geoloc-lib';

import * as turf from '@turf/turf';
import { AllGeoJSON, Geometry, Feature, Point } from '@turf/turf';
import * as simplify from '@turf/simplify';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs/internal/observable/of';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor(private http: HttpClient) { }

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

  /**
   * Takes a GeoJSON object and returns a simplified version using turf.js. Internally uses simplify-js to perform simplification using the Ramer-Douglas-Peucker algorithm.
   * @param geoJson : the GeoJson object
   * @param tolerance : simplification tolerance
   * @param highQuality : whether or not to spend more time to create a higher-quality simplification with a different algorithm
   */
  simplifyPolygon(geoJson: any, tolerance = 0.0015, highQuality = false, mutate = true): any {
    const geoType: string = geoJson.type;
    if (geoType == null) {
      return geoJson;
    } else if (geoType.toLowerCase() === 'polygon' || geoType.toLowerCase() === 'multipolygon') {
      try {
        const simplifiedGeometry = turf.simplify(geoJson, { tolerance, highQuality, mutate });
        return simplifiedGeometry;
      } catch (error) {
        return geoJson;
      }
    } else {
      return geoJson;
    }
  }

  /**
   * Return a valid geoJson Polygon from bounding box coordinates
   */
  bboxToPolygon(bbox: Array<number>): {type: string, coordinates: Array<any>} {
   return {
     type: 'Polygon',
     coordinates: [[
       [ Number(bbox[2]), Number(bbox[0]) ],
       [ Number(bbox[3]), Number(bbox[0]) ],
       [ Number(bbox[3]), Number(bbox[1]) ],
       [ Number(bbox[2]), Number(bbox[1]) ],
       [ Number(bbox[2]), Number(bbox[0]) ]
     ]]
   };
  }

  /*
  [
    [
      [-1.9301331043,48.5854795599],[0.4429137707,48.5854795599],[0.4429137707,49.742023816],[-1.9301331043,49.742023816],[-1.9301331043,48.5854795599]
    ]
  ]
  */
  getCentroid(geoJson: {type: string, coordinates: Array<Array<number>>}): Feature<Point> {
    return turf.centroid(geoJson);
  }

  getAccuracyByNominatimObject(nominatimObj: NominatimObject): VlAccuracyEnum {
    const _class = nominatimObj.class;
    const _type = nominatimObj.type;
    let accuracy: VlAccuracyEnum;

    switch (_class) {
      case 'boundary':
        // could be commune departement, region or country
        if (nominatimObj.address['city']
            || nominatimObj.address['town']
            || nominatimObj.address['village']
            || nominatimObj.address['hamlet']) {
          accuracy = VlAccuracyEnum.CITY;
        } else if (nominatimObj.address['county']) {
          accuracy = VlAccuracyEnum.DEPARTEMENT;
        } else if (nominatimObj.address['state']) {
          accuracy = VlAccuracyEnum.REGION;
        } else if (nominatimObj.address['country']) {
          accuracy = VlAccuracyEnum.COUNTRY;
        } else { accuracy = VlAccuracyEnum.OTHER; }
        break;
      case 'landuse':
        accuracy = VlAccuracyEnum.PLACE;
        break;
      case 'place':
        if (_type && _type === 'city' || _type === 'town' || _type === 'village' || _type === 'hamlet') {
          accuracy = VlAccuracyEnum.CITY;
        } else {
          accuracy = VlAccuracyEnum.PLACE;
        }
        break;
      default:
        accuracy = VlAccuracyEnum.OTHER;
        break;
    }

    // Special case for 'way', 'highway', '...way';
    if (!accuracy || accuracy === null) {
      const somethingWay = _class.match(/way/);
      accuracy = somethingWay && somethingWay !== null ? VlAccuracyEnum.PLACE : accuracy;
    }

    return accuracy;
  }

  getVlAccuracyKey(vlAccuracyValue: string): VlAccuracyEnum {
    const vlAcc = Object.keys(VlAccuracyEnum);
    for (const c of vlAcc) {
      console.log(vlAcc);
    }
    const acuracyEnum = VlAccuracyEnum[vlAccuracyValue];
    return acuracyEnum ? acuracyEnum : null;
  }

  geocodeUsingOSM(address: string): Observable<Array<NominatimObject>> {
    const apiUrl = `https://nominatim.openstreetmap.org?format=json&addressdetails=1&q=${address}&format=json&limit=10&polygon_geojson=1`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  geocodeUsingMapQuest(apiKey: string, address: string): Observable<Array<NominatimObject>> {
    const apiUrl = `https://open.mapquestapi.com/nominatim/v1/search.php?key=${apiKey}&addressdetails=1&q=${address}&format=json&limit=10&polygon_geojson=1`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  public geocodeSpecificUsingOSM(country: string | undefined, county: string | undefined, city: string | undefined, place: string | undefined, limit: number | undefined): Observable<Array<NominatimObject>> {
    const parameters = `?format=json&addressdetails=1&format=json&polygon_geojson=1${limit ? '&limit=' + limit : ''}`;

    if (!city && !county && !country && !place) { return of([]); }

    let query =  parameters;
    if (city) { query += `&city=${city}`; }
    if (county) { query += `&county=${county}`; }
    if (country) { query += `&country=${country}`; }
    if (place) { query += `&place=${place}`; }
    const apiUrl = `https://nominatim.openstreetmap.org/${query}`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  public geocodeSpecificUsingMapQuest(mapquestKey: string, country: string | undefined, county: string | undefined, city: string | undefined, place: string | undefined, limit: number | undefined): Observable<Array<NominatimObject>> {
    const parameters = `?key=${mapquestKey}&format=json&addressdetails=1&format=json&polygon_geojson=1${limit ? '&limit=' + limit : ''}`;
    if (!city && !county && !country && !place) { return of([]); }

    let query =  parameters;
    if (city) { query += `&city=${city}`; }
    if (county) { query += `&county=${county}`; }
    if (country) { query += `&country=${country}`; }
    if (place) { query += `&place=${place}`; }
    const apiUrl = `https://open.mapquestapi.com/nominatim/v1/search.php${query}`;
    return this.http.get<Array<NominatimObject>>(apiUrl);
  }

  reverseUsingOSM(lat: number, lng: number): Observable<NominatimObject> {
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&polygon_geojson=1`;
    return this.http.get<NominatimObject>(apiUrl);
  }

  reverseUsingMapQuest(apiKey: string, lat: number, lng: number): Observable<NominatimObject> {
    const apiUrl = `https://open.mapquestapi.com/nominatim/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lng}`;
    return this.http.get<NominatimObject>(apiUrl);
  }
}
