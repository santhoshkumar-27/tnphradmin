FROM node:16.14.2-alpine3.15
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install -g @angular/cli
RUN npm install
COPY . ./
RUN npm run buildinfo
RUN npm run build
EXPOSE 8080
CMD [ "./startup.sh" ]
