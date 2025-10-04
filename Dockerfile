# Imagen node 22, a definir version
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

#Puerto para server de Angular a definir, puse 4200 por defecto
EXPOSE 4200

#Comandos por defecto
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
