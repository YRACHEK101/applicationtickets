# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files (they're in the server directory)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all server files
COPY . ./

# Expose port
EXPOSE 5000

# Start the application  
CMD ["npm", "start"]
