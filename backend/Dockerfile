FROM node:18-bullseye

WORKDIR /app

# Install dependencies needed for node-canvas and other libs
RUN apt-get update && apt-get install -y python3 make g++ libcairo2-dev libpango1.0-dev \
    libjpeg-dev libgif-dev librsvg2-dev libvips-dev && rm -rf /var/lib/apt/lists/*

# Copy and install npm packages
COPY package*.json ./
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose the Render port (Render sets $PORT automatically)
EXPOSE 10000

# Environment variables
ENV NODE_ENV=production PORT=10000

# Start the app
CMD ["node", "server_v4.js"]
