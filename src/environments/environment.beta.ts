// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  baseUrl: 'https://beta.tela-botanica.org/appli:veglab',
  apiBaseUrl: 'https://api-veglab-test.tela-botanica.org/api',
  esBaseUrl: 'https://api-veglab-test.tela-botanica.org/es-proxy',
  pdfBaseUrl: 'http://${HOST}:${API_PORT}/media/veglab/pdf/',
  app: {
    title:           'VegLab dev',
    unsetTokenValue: 'unset',
    absoluteBaseUrl: '',
  },
  sso: {
    baseUrl:          'https://beta.tela-botanica.org/service:annuaire:auth',
    loginEndpoint:    'https://beta.tela-botanica.org/service:annuaire:auth/connexion',
    logoutEndpoint:   'https://beta.tela-botanica.org/service:annuaire:auth/deconnexion',
    identiteEndpoint: 'https://beta.tela-botanica.org/service:annuaire:auth/identite',
    refreshEndpoint:  'https://beta.tela-botanica.org/service:annuaire:auth/rafraichir',
    refreshInterval:  600000
  },
  mapQuestApiKey: 'ApIFfQWsb8jW6bkYDD2i0Sq5BD9moJ3l',
  tbRepositoriesConfigVegetation: [
    {
      id: 'baseveg',
      label: 'Baseveg',
      levels: ['synusy', 'microcenosis'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/baseveg/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/baseveg/noms/',
      description_fr: ''
    }
  ],
  tbRepositoriesConfig: [
  ],

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
