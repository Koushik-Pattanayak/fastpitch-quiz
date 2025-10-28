FROM node:18-bullseye

WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libvips-dev && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000
ENV NODE_ENV=production PORT=5000
CMD ["node", "server_v4.js"]
