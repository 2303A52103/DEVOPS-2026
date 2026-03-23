# Use official Node.js image
FROM node:18

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5000
CMD ["node", "server.js"]