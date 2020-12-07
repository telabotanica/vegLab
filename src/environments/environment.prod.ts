export const environment = {
  production: true,
  baseUrl: 'http://${HOST}',
  apiBaseUrl: 'http://${HOST}:${API_PORT}/api',
  esAuthorizationPassword: '${ELASTIC_PASSWORD}',
  esBaseUrl: 'http://${HOST}:${ES_PORT}',
  esRepoAuthorizationPassword: '${ES_REPO_PASSWORD}',
  esBaseflorTraitsApi: 'http://51.38.37.216:9200/baseflor',
  pdfBaseUrl: 'http://${HOST}:${API_PORT}/media/veglab/pdf/',
  app : {
    title:           'VegLab',
    unsetTokenValue: 'unset',
    absoluteBaseUrl: '',
  },
  sso: {
    clientId:         '${SSO_CLIENT_ID}',
    baseUrl:          'http://${SSO_HOST}:${SSO_PORT}${SSO_URI}',
    loginEndpoint:    'http://${SSO_HOST}:${SSO_PORT}${SSO_URI}${SSO_LOGIN_ENDPOINT}',
    logoutEndpoint:   'http://${SSO_HOST}:${SSO_PORT}${SSO_URI}${SSO_LOGOUT_ENDPOINT}',
    identiteEndpoint: 'http://${SSO_HOST}:${SSO_PORT}${SSO_URI}${SSO_REFRESH_ENDPOINT}',
    refreshEndpoint:  'http://${SSO_HOST}:${SSO_PORT}${SSO_URI}${SSO_REFRESH_ENDPOINT}',
    refreshInterval:  '${SSO_REFRESH_INTERVAL}',
    roles: {
      admin: 'admin'
    }
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
