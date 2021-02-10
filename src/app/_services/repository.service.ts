import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {

  public defaultIdiotaxonRepository = new BehaviorSubject<string>(null);
  public defaultSyntaxonRepository = new BehaviorSubject<string>(null);

  constructor(private http: HttpClient) { }

  public getByIdNomen(repository: string, idNomen: number): Observable<EFloreResponse> {
    return this.http.get<EFloreResponse>(`https://api.tela-botanica.org/service:eflore:0.1/${repository}/taxons/${idNomen}`);
  }

  public initRepositories(): void {
    this.initDefaultIdiotaxonRepository();
    this.inirDefaultSyntaxonRepository();
  }

  private initDefaultIdiotaxonRepository(): void {
    this.defaultIdiotaxonRepository.next(environment.repo.defaultIdiotaxonRepository);
  }

  private inirDefaultSyntaxonRepository(): void {
    this.defaultSyntaxonRepository.next(environment.repo.defaultSyntaxonRepository);
  }

  public setDefaultIdiotaxonRepository(repo: string): void {
    this.defaultIdiotaxonRepository.next(repo);
  }

  public setDefaultSyntaxonRepository(repo: string): void {
    this.defaultSyntaxonRepository.next(repo);
  }
}

interface EFloreResponse {
  id: string;                     // ID NOMEN
  nom_sci: string;
  nom_sci_complet: string;
  'nom_retenu.id': string;        // ID NOMEN retenu
  'nom_retenu.libelle': string;
  nom_retenu_html: string;
  nom_retenu_complet: string;
  nom_retenu_html_complet: string;
  'nom_retenu.href': string;
  'tax_sup.id': string;
  'tax_sup.libelle': string;
  tax_sup_html: string;
  tax_sup_complet: string;
  tax_sup_html_complet: string;
  'tax_sup.href': string;
  'rang.code': string;
  'rang.libelle': string;
  'rang.href': string;
  genre: string;
  epithete_sp: string;
  type_epithete: string;
  epithete_infra_sp: string;
  auteur: string;
  annee: string;
  biblio_origine: string;
  nom_addendum: string;
  num_type: string;
  basionymeid: string;
  basionymelibelle: string;
  basionyme_html: string;
  basionyme_complet: string;
  basionyme_html_complet: string;
  basionymehref: string;
  nom_fr: string;
  presencecode: string;
  presencelibelle: string;
  presencehref: string;
  statut_originecode: string;
  statut_originelibelle: string;
  statut_originehref: string;
  statut_introductioncode: string;
  statut_introductionlibelle: string;
  statut_introductionhref: string;
  presence_Gacode: string;
  presence_Galibelle: string;
  presence_Gahref: string;
  presence_Cocode: string;
  presence_Colibelle: string;
  presence_Cohref: string;
  exclure_taxref: string;
  num_taxonomique: string;        // ID TAXO
  statut: string;
  nom_complet: string;
  maj_modif: string;
  classification: string;
  '2n': string;
  num_meme_type: string;
  flore_belge_ed5_page: string;
  auteur_principal: string;
  cd_nom: string;
  flore_fg_num: string;
  famille: string;
  nom_sci_html: string;
  nom_sci_html_complet: string;
  hierarchie: string;
}

