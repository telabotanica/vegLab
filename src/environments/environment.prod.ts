export const environment = {
  production: true,
  baseUrl: 'http://${HOST}',
  apiBaseUrl: 'https://${HOST}:8443/api',
  esBaseUrl: 'http://${HOST}:9200',
  esBaseflorTraitsApi: 'http://${HOST}:9200/baseflor',
  app : {
    title:           'VegLab',
    unsetTokenValue: 'unset',
    absoluteBaseUrl: '',
  },
  sso: {
    baseUrl:          'http://${HOST}:8081/service:annuaire:auth',               // https://beta.tela-botanica.org/service:annuaire:auth
    loginEndpoint:    'http://${HOST}:8081/service:annuaire:auth/connexion',
    logoutEndpoint:   'http://${HOST}:8081/service:annuaire:auth/deconnexion',
    identiteEndpoint: 'http://${HOST}:8081/service:annuaire:auth/identite',
    refreshEndpoint:  'http://${HOST}:8081/service:annuaire:auth/rafraichir',
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
