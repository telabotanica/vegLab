# base image
FROM node:12.2.0 AS veglab_client_dev

# install chrome for protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable gettext

# set working directory
WORKDIR /client

# add `/app/node_modules/.bin` to $PATH
ENV PATH /client/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /client/package.json
# RUN npm install --no-cache if there is problem about dependencies versions (sticked versions to docker npm cache)
RUN npm install
RUN npm install -g @angular/cli@7.3.4

# get HOST env var
ARG HOST

# add app
COPY . /client

# add environments vars and bind HOST
RUN envsubst < ./src/environments/environment.ts > /client/src/environments/environment.ts.tmp && mv /client/src/environments/environment.ts.tmp /client/src/environments/environment.ts

# start app
#CMD ng serve
CMD ng serve --host 0.0.0.0 --port 4200

## "build" stage
## depends on the "development" stage above
#FROM veglab_client_dev AS veglab_client_prod
#
## ARG REACT_APP_API_ENTRYPOINT
#
#RUN set -eux; \
#	yarn build
#
#
## "nginx" stage
## depends on the "build" stage above
#FROM nginx:${NGINX_VERSION}-alpine AS client_nginx
#
#COPY docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
#
#WORKDIR /usr/src/client/build
#
#COPY --from=veglab_client_prod /usr/src/client/build ./