export const environment = {
  production: true,
  baseUrl: 'https://www.tela-botanica.org/appli:veglab',
  apiBaseUrl: 'https://api-veglab.tela-botanica.org/api',
  esAuthorizationPassword: '${ELASTIC_PASSWORD}',
  esBaseUrl: 'https://api-veglab.tela-botanica.org/es-proxy',
  esRepoAuthorizationPassword: '${ES_REPO_PASSWORD}',
  esBaseflorTraitsApi: 'http://51.38.37.216:9200/baseflor',
  pdfBaseUrl: 'http://${HOST}:${API_PORT}/media/veglab/pdf/',
  app : {
    title:           'VegLab',
    unsetTokenValue: 'unset',
    absoluteBaseUrl: '',
  },
  sso: {
    baseUrl:          'https://www.tela-botanica.org/service:annuaire:auth',
    loginEndpoint:    'https://www.tela-botanica.org/service:annuaire:auth/connexion',
    logoutEndpoint:   'https://www.tela-botanica.org/service:annuaire:auth/deconnexion',
    identiteEndpoint: 'https://www.tela-botanica.org/service:annuaire:auth/identite',
    refreshEndpoint:  'https://www.tela-botanica.org/service:annuaire:auth/rafraichir',
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
