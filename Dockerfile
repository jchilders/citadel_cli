# Use an official lightweight Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install Vite globally
RUN npm install -g create-vite

# Create a new Vite-based React+TS app
RUN create-vite my-app --template react-ts

# Change working directory to the new app
WORKDIR /app/my-app

# Copy the updated package.json
COPY package.json .

# Install dependencies
RUN npm install

# Copy the custom App.tsx file
COPY src/App.tsx src/App.tsx

# Expose Vite's default port
EXPOSE 5173

# Start the Vite development server and make it accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
