/**
 * Model form Tela Botanica
 */
export interface UserModel {
  id: string;                 // number as string
  intitule: string;           // eg 'Stéphane Delplanque'
  nom: string;
  prenom: string;
  pseudo: string;
  pseudoUtilise: boolean;
  permissions: Array<string>; // eg ["contributor"]
  sub: string;                // seems to be the e-mail address

  avatar: string;             // url
  dateDerniereModif: number;  // eg 1495206376
  exp: number;                // eg 1575287733
  groupes: Array<any>;
  iat: number;
  iss: string;                // 'https://www.tela-botnanica.org
  nomWiki: string;
  scopes: Array<string>;      // ["tela-botanica.org"]

  token_id: string;           // eg "tb_auth_beta_test"
}
