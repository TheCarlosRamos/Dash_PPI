FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .
COPY tabela_perguntas_ppi.csv .

EXPOSE 3000

CMD ["node", "src/index.js"]
