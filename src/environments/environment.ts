// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: 'http://localhost',
  apiBaseUrl: 'http://localhost:80/index.php/api',
  esBaseUrl: 'http://localhost:9200',
  esBaseflorTraitsApi: 'http://localhost:9200/baseflor',
  app : {
    title:           'VegLab',
    unsetTokenValue: 'unset',
    absoluteBaseUrl: '',
  },
  sso: {
    baseUrl:          'https://beta.tela-botanica.org/service:annuaire:auth',
    loginEndpoint:    'https://beta.tela-botanica.org/service:annuaire:auth/connexion',
    identiteEndpoint: 'https://beta.tela-botanica.org/service:annuaire:auth/identite',
    authWidgetUrl:    'http://beta.tela-botanica.org/widget:reseau:auth',
    refreshEndpoint:  'https://beta.tela-botanica.org/service:annuaire:auth/rafraichir',
    refreshInterval:  600000
  },
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
    /*{
      id: 'bdtfx',
      label: 'BDTFX',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/bdtfx/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/bdtfx/noms/',
      description_fr: ''
    }/*, {
      id: 'bdtfxr',
      label: 'Métropole (index réduit)',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/bdtfxr/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/bdtfxr/noms/',
      description_fr: ''
    }, {
      id: 'nva',
      label: 'Antilles françaises',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/nva/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/nva/noms/',
      description_fr: ''
    }, {
      id: 'bdtre',
      label: 'Réunion',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/bdtre/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/bdtre/noms/',
      description_fr: ''
    }, {
      id: 'florical',
      label: 'Nouvelle-Calédonie',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/florical/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/florical/noms/',
      description_fr: ''
    }, {
      id: 'aublet',
      label: 'Guyane',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/aublet/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/aublet/noms/',
      description_fr: ''
    }, {
      id: 'apd',
      label: 'Afrique',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/apd/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/apd/noms/',
      description_fr: ''
    }, {
      id: 'lbf',
      label: 'Liban',
      levels: ['idiotaxon'],
      apiUrl: 'https://api.tela-botanica.org/service:cel/NameSearch/lbf/',
      apiUrl2: '',
      apiUrlValidOccurence: 'https://api.tela-botanica.org/service:eflore:0.1/lbf/noms/',
      description_fr: ''
    }*/
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
