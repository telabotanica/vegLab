export enum PublishedLocation {
  PRECISE = 'précise',
  LOCALITY = 'localité',
  TEN_BY_TEN = '10x10km'
}

export default function getPublishedLocationEnum(value: string): PublishedLocation {
  switch (value) {
    case 'précise':
      return PublishedLocation.PRECISE;
    case 'localité':
      return PublishedLocation.LOCALITY;
    case '10x10km':
      return PublishedLocation.TEN_BY_TEN;
    default:
      break;
  }
}

