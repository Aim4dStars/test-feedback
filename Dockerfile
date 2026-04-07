FROM node:20-slim AS build

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install server dependencies
COPY package.json package-lock.json ./
RUN npm install

# Install client dependencies (including devDeps for vite build)
COPY client/ ./client/
RUN cd client && npm install

# Copy server code
COPY server ./server

# Build the React frontend
RUN cd client && npx vite build

# --- Production stage ---
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY server ./server
COPY --from=build /app/client/dist ./client/dist

ENV PORT=8080
ENV DATA_DIR=/data
ENV UPLOADS_DIR=/data/uploads

EXPOSE 8080

CMD ["node", "server/index.js"]
