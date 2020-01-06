import { Certainly } from '../_enums/certainly-enum';
import { OccurrenceType } from '../_enums/occurrence-type-enum';
import { Phenology } from '../_enums/phenology-enum';
import { InputSource } from '../_enums/input-source-enum';
import { PublishedLocation } from '../_enums/published-location-enum';
import { LocationAccuracy } from '../_enums/location-accuracy-enum';
import { VlAccuracyEnum } from 'tb-geoloc-lib';
import { OccurrenceValidationModel } from './occurrence-validation.model';
import { Level } from '../_enums/level-enum';
import { LayerEnum } from '../_enums/layer-list';
import { EsExtendedFieldModel } from './es-extended-field-model';

export interface EsOccurrenceModel {
  id?: number;
  userId: number;

  // originalReference?: string;  // needed for table import

  userEmail: string;
  userPseudo?: string;

  observer: string;
  observerInstitution?: string;
  vlObservers?: Array<{id: number, name: string}>;

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
  vlBiblioSource?: any;           // I should have named it differently because not the same type as OccurrenceModel ! So typed as any !
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

  identiplanteScore?: number;
  isIdentiplanteValidated: boolean;
  identificationAuthor?: string;

  project?: string;      // IRI
  userProfile: Array<number>;  // ???
  photos?: Array<any>;
  validations?: Array<OccurrenceValidationModel>;

  delUpdateNotifications: any; // I don't care

  extendedFieldValues?: Array<EsExtendedFieldModel>;

  // parent?: OccurrenceModel;
  parentId?: number;        // Provided by ES
  level: Level;
  parentLevel: Level;
  layer?: LayerEnum;

  childrenIds?: Array<number>;
  childrenPrewiew?: Array<{
    coef?: string,
    layer?: string,
    name?: string,
    repo?: string
  }>;

  childrenPreview?: any;    // ES only

  vlWorkspace: string;

  children?: Array<any>;

  selected?: boolean;       // Automatically populated at GET
  score?: number;           // Automatically populated at GET
  isChildrenOf?: number;    // Automatically populated if needed ; children of Occurrence Id
  isInCurrentTable?: boolean;
  hasChildInCurrentTable?: boolean;
}
