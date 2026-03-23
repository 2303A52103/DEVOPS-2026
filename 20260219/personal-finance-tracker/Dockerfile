# Step 1: Use the official Node.js image as a base
FROM node:16

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json into the container
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Expose the port that the app will run on
EXPOSE ${PORT}

# Step 7: Set environment variable for production mode (default is development)
ENV ENV_MODE=development

# Step 8: Start the application
CMD ["node", "server.js"]