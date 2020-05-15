export const environment = {
  production: true,
  baseUrl: 'http://${HOST}',
  apiBaseUrl: 'http://${HOST}:${API_PORT}/api',
  esBaseUrl: 'http://${HOST}:${ES_PORT}',
  esBaseflorTraitsApi: 'http://${HOST}:${ES_PORT}/baseflor',
  pdfBaseUrl: 'http://${HOST}:${API_PORT}/media/veglab/pdf/',
  app : {
    title:           'VegLab',
    unsetTokenValue: 'unset',
    absoluteBaseUrl: '',
  },
  sso: {
    baseUrl:          'http://${HOST}:${SSO_PORT}/service:annuaire:auth',               // https://beta.tela-botanica.org/service:annuaire:auth
    loginEndpoint:    'http://${HOST}:${SSO_PORT}/service:annuaire:auth/connexion',
    logoutEndpoint:   'http://${HOST}:${SSO_PORT}/service:annuaire:auth/deconnexion',
    identiteEndpoint: 'http://${HOST}:${SSO_PORT}/service:annuaire:auth/identite',
    refreshEndpoint:  'http://${HOST}:${SSO_PORT}/service:annuaire:auth/rafraichir',
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
