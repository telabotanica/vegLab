import { ExtendedFieldModel } from 'src/app/_models/extended-field.model';
import { FieldDataType } from '../../../_enums/field-data-type-enum';
/**
 * Those metadata should always be persisted in DB
 *
 * Default object :
 * {
 *   id: null,
 *   fieldId:           '',
 *   projectName:       'veglab:*',
 *   dataType:          FieldDataType.BOOL,
 *   isVisible:         true,
 *   isEditable:        true,             // nullable
 *   isMandatory:       true,
 *   minValue:          0,                // nullable
 *   maxValue:          1,                // nullable
 *   defaultValue:      '',               // nullable
 *   unit:              '',               // nullable
 *   filterStep:        0.5,              // nullable
 *   filterLogarithmic: false,            // nullable
 *   regexp:            '',               // nullable
 *   extendedFieldTranslations: [{        // nullable
 *     id: null,
 *     projectName: '',
 *     label: '',
 *     description: '',    // nullable
 *     defaultValue: '',   // nullable
 *     errorMessage: '',   // nulable
 *     languageIsoCode: '' // nullable
 *   }]
 * }
 */
export const MetadataInitialSet: Array<ExtendedFieldModel> = [
  {
    id: null,
    fieldId:           'sophy_data',
    projectName:       'veglab:*',
    dataType:          FieldDataType.BOOL,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'Donnée issue de SOPHY',
      description: 'Base de données SOPHY, Henry BRISSE et Patrice de RUFFRAY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_data_complete',
    projectName:       'veglab:*',
    dataType:          FieldDataType.BOOL,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, donnée complète',
      description: 'La donnée SOPHY est elle complète ?',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_code_identifiant_releve',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, code identifiant relevé',
      description: 'Code d\'identification d\'un relevé dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_numero_publication',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, code identifiant numéro de publication',
      description: 'Numéro d\'une publication dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_publication',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, publication',
      description: 'Titre d\'une publication dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_auteur',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, auteur(s)',
      description: 'Auteur(s) mentionné(s) dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_annee',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, année',
      description: 'Année mentionnée dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_numero_tableau',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, numéro de tableau',
      description: 'Numéro d\'un tableau dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_numero_releve',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, numéro de relevé',
      description: 'Numéro d\'un relevé dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_nom_station',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, nom de station',
      description: 'Nom d\'une station dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_code_insee',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, code INSEE',
      description: 'Code INSEE mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_code_insee_calcule',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, code INSEE (calculé)',
      description: 'Code INSEE calculé mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_altitude',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, altitude',
      description: 'Altitude mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_ss_latitude_wgs',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, latitude',
      description: 'Latitude mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_ss_longitude_wgs',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, longitude',
      description: 'Longitude mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_ss_utm_easting',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, maille UTM [Est]',
      description: 'Coordonnées Est de maille mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_ss_utm_northing',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, maille UTM [Nord]',
      description: 'Coordonnées Nord de maille mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_ss_utm_zone',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, zone UTM',
      description: 'Zone UTM mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  },
  {
    id: null,
    fieldId:           'sophy_import_ss_ce_precision_geographique',
    projectName:       'veglab:*',
    dataType:          FieldDataType.TEXT,
    isVisible:         true,
    isEditable:        false,          // nullable
    isMandatory:       true,
    extendedFieldTranslations: [{
      id: null,
      projectName: 'veglab:*',
      label: 'SOPHY, précision géographique',
      description: 'Code précision géographique mentionné dans SOPHY',    // nullable
      defaultValue: null,              // nullable
      errorMessage: null,              // nulable
      languageIsoCode: 'fr'            // nullable
    }]
  }
];
