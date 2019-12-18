export const environment = {
  production: true,
  baseUrl: 'http://localhost',
  apiBaseUrl: 'http://localhost/index.php/api',
  esBaseUrl: 'http://localhost:9200',
  esBaseflorTraitsApi: 'http://localhost:9200/baseflor',
  app : {
    title:           'VegLab',
    unsetTokenValue: 'unset',
    absoluteBaseUrl: '',
  },
  sso: {
    baseUrl:          'http://localhost:8080/service:annuaire:auth',               // https://beta.tela-botanica.org/service:annuaire:auth
    loginEndpoint:    'http://localhost:8080/service:annuaire:auth/connexion',
    logoutEndpoint:   'http://localhost:8080/service:annuaire:auth/deconnexion',
    identiteEndpoint: 'http://localhost:8080/service:annuaire:auth/identite',
    refreshEndpoint:  'http://localhost:8080/service:annuaire:auth/rafraichir',
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
  ],
};
