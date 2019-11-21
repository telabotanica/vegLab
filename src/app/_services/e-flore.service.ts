import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EFloreService {

  constructor(private http: HttpClient) { }

  /**
   * Get images from bdtfx ids taxo
   * API doc : https://www.tela-botanica.org/wikini/eflore/wakka.php?wiki=EfloreApi01Images
   */
  getBdtfxImages(idsTaxo: Array<number>, limit = 5): Observable<EfloreImages> {
    return this.http.get<EfloreImages>(`http://api.tela-botanica.org/service:eflore:0.1/cel/images?masque.nn=${idsTaxo.toString()}&navigation.depart=0&navigation.limite=${limit}`);
  }
}

export interface EfloreImages {
  entete: {
    masque: string,
    depart: string,
    limite: string,
    total: string,
    'href.precedent': string,
    'href.suivant': string
  };
  resultats: [EfloreImageData];
}

export interface EfloreImageData {
  date: string;
  mime: string;
  'binaire.href': string;                 // image href
  'observation.id': string;
  determination: string;
  'determination.nom_sci': string;
  'determination.nom_sci.code': string;
  station: string;
  auteur: string;
  href: string;                            // Lien vers toutes les informations de l'image
}

