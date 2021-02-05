import { OccurrenceValidationModel } from './occurrence-validation.model';
import { ExtendedFieldOccurrence } from './extended-field-occurrence';

import { Certainly } from '../_enums/certainly-enum';
import { OccurrenceType } from '../_enums/occurrence-type-enum';
import { Phenology } from '../_enums/phenology-enum';
import { InputSource } from '../_enums/input-source-enum';
import { PublishedLocation } from '../_enums/published-location-enum';
import { LocationAccuracy } from '../_enums/location-accuracy-enum';
import { Level } from '../_enums/level-enum';
import { LayerEnum } from '../_enums/layer-list';
import { VlAccuracyEnum } from 'tb-geoloc-lib';
import { Observer } from './observer.model';
import { Biblio } from './biblio.model';
import { VlUser } from './vl-user.model';


export interface OccurrenceModel {
  id?: number;
  userId: string;

  originalReference?: string;  // needed for table import

  userEmail: string;
  userPseudo?: string;
  user: VlUser;

  observer: string;
  observerInstitution?: string;
  vlObservers?: Array<Observer>;

  dateObserved?: Date;
  dateObservedPrecision?: 'day' | 'month' | 'year';
  dateCreated: Date;
  dateUpdated?: Date;
  datePublished?: Date;

  userSciName?: string;     // @todo force nullable=false for VegLab ?
  userSciNameId?: number;   // @todo force nullable=false for VegLab ?
  acceptedSciName?: string;
  acceptedSciNameId?: number;
  plantnetId?: number;

  family?: string;

  taxoRepo: string;

  certainty?: Certainly;

  annotation?: string;

  occurenceType?: OccurrenceType;
  isWild?: boolean;

  coef?: string;      // @todo change to string

  phenology?: Phenology;
  sampleHerbarium?: boolean;

  bibliographySource?: string;
  vlBiblioSource?: Biblio;
  inputSource: InputSource;

  isPublic: boolean;
  isVisibleInCel: boolean;
  isVisibleInVegLab: boolean;
  signature: string;  // @todo fullfiled in the backend ?

  geometry?: any;  // geoJson object
  centroid?: any;  // geoJson object
  elevation?: number;
  isElevationEstimated?: boolean;

  geodatum?: string;   // WGS84

  locality?: string;
  localityInseeCode?: string;
  sublocality?: string;
  environment?: string;
  localityConsistency?: boolean;
  station?: string;
  publishedLocation?: PublishedLocation;
  locationAccuracy?: LocationAccuracy;
  vlLocationAccuracy?: VlAccuracyEnum;
  osmCounty?: string;
  osmState?: string;
  osmPostcode?: string;
  osmCountry?: string;
  osmCountryCode?: string;
  osmId?: string;
  osmPlaceId?: number;
  vlLocationInputSource?: string;

  identiplanteScore?: number;
  isIdentiplanteValidated: boolean;
  identificationAuthor?: string;

  project?: string;      // IRI
  userProfile: Array<number>;  // ???
  photos?: Array<any>;
  validations?: Array<OccurrenceValidationModel>;

  delUpdateNotifications: any; // I don't care

  extendedFieldOccurrences?: Array<ExtendedFieldOccurrence>;

  parent?: OccurrenceModel;
  parentId?: number;        // Provided by ES
  level: Level;
  parentLevel: Level;
  layer?: LayerEnum;
  children?: Array<OccurrenceModel>;
  childrenIds?: Array<number>;

  childrenPreview?: any;    // ES only

  vlWorkspace: string;
}
