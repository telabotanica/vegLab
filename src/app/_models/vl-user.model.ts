/**
 * API User Model
 * Differs from SSO user model : only few properties exists in API User Model
 */
export interface VlUser {
  '@context'?:   string;
  '@id'?:        string;
  '@type'?:      string;
  id:            number;
  ssoId:         string;
  enabled:       boolean;
  emailVerified: boolean;
  firstName:     string;
  lastName:      string;
  username:      string;
  email:         string;
  password?:      string; // not persisted in API database !
}
