FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# We'll install dependencies using npm since package-lock.json was from npm
# In a real environment with clean installs we'd copy lock file too
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Expose port
EXPOSE 3000

# Default to dev mode for the docker-compose setup, but could be built for prod
CMD ["npm", "run", "dev"]
