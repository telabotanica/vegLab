import { Biblio } from './biblio.model';

export interface PdfFile {
  id?:             number;
  originalName:    string;
  file:            File;
  contentUrl:      string;
  mimeType:        string;
  url:             string;
  vlBiblioSource?: Biblio;
}

export interface PdfFileJsonLd extends PdfFile {
  '@context': string;
  '@id':      string;
  '@type':    string;
}
