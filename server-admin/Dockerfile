FROM node:18-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm@10.28.1

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3001

CMD ["pnpm", "start"]