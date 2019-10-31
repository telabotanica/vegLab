export interface NominatimObject {
  place_id:         number;
  licence:          string;
  osm_type:         string;
  osm_id:           number;
  lat:              number;
  lon:              number;
  display_name:     string;
  address: {
      road:         string;
      city:         string;
      village:      string;
      county:       string;
      state:        string;
      country:      string;
      postcode:     string;
      country_code: string;
  };
  boundingbox: Array<number>;
  geojson: {
      type:         string;
      coordinates:  Array<Array<number>>;
  };
  class?:           string;
  type?:            string;
}
