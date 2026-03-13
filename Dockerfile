# Dockerfile
FROM node:22.10.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "test"]