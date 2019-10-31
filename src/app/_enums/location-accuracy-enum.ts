export enum LocationAccuracy {
  LESS_THAN_TEN = '0 à 10 m',
  TENS = '10 à 100 m',
  HUNDREDS = '100 à 500 m',
  SUBLOCALITY = 'Lieu-dit',
  LOCALITY = 'Localité'
}

export default function getLocationAccuracyEnum(value: string): LocationAccuracy {
  switch (value) {
    case '0 à 10 m':
      return LocationAccuracy.LESS_THAN_TEN;
    case '10 à 100 m':
      return LocationAccuracy.TENS;
    case '1000 à 500 m':
      return LocationAccuracy.HUNDREDS;
    case 'Lieu-dit':
      return LocationAccuracy.SUBLOCALITY;
    case 'Localité':
      return LocationAccuracy.LOCALITY;
    default:
      break;
  }
}
