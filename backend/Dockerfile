FROM node:20-alpine
WORKDIR /app
EXPOSE 8000
COPY package.json ./
COPY . .
RUN npm i
CMD [ "tail", "-f","/dev/null" ]