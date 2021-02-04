/**
 * SSO User Model
 */
export interface UserModel {
  // id: string;                 // number as string
  // intitule: string;           // eg 'Stéphane Delplanque'
  // nom: string;
  // prenom: string;
  // pseudo: string;
  // pseudoUtilise: boolean;
  // permissions: Array<string>; // eg ["contributor"]
  // sub: string;                // seems to be the e-mail address

  // avatar: string;             // url
  // dateDerniereModif: number;  // eg 1495206376
  // exp: number;                // eg 1575287733
  // groupes: Array<any>;
  // iat: number;
  // iss: string;                // 'https://www.tela-botnanica.org
  // nomWiki: string;
  // scopes: Array<string>;      // ["tela-botanica.org"]

  // token_id: string;           // eg "tb_auth_beta_test"

  id: string;

  acr: string;
  'allowed-origin': Array<string>;
  azp: string;

  email: string;
  email_verified: boolean;
  given_name: string;           // e.g. Stéphane
  family_name: string;          // e.g. Delplanque
  name: string;                 // e.g. Stéphane Delplanque
  preferred_username: string;   // e.g. stephane

  ressource_access: {           // e.g. ressource_access {
    [key: string]: {            //        "veglab-front-local": {
      roles: Array<string>      //          roles: ["admin", "user"]
    }                           //        }
  };                            //      }

  scope: string;                // e.g. "email_profile"

  session_state: string;
  sub: string;
  typ: string;                 // e.g. "Bearer"
  exp: number;
  iat: number;
  iss: string;
  jti: string;
}
