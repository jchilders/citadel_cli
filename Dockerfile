# Use an official lightweight Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install Vite globally
RUN npm install -g create-vite

# Create a new Vite-based React+TS app first
RUN create-vite my-app --template react-ts

# Copy library source
COPY package.json package-lock.json ./
COPY src ./src
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY tailwind.config.js postcss.config.cjs ./
COPY plugins ./plugins

# Install library deps using the same React version as test app
RUN cd my-app && REACT_VERSION=$(npm list react --depth=0 | grep react@ | sed 's/.*react@//' | sed 's/ .*//')  && cd .. && npm install && npm install --save-dev react@$REACT_VERSION react-dom@$REACT_VERSION
RUN npm run build

# Change working directory to the test app
WORKDIR /app/my-app

# Install dependencies and add local citadel_cli
RUN npm install && npm install file:../

# Copy the custom App.tsx file and create styles directory
COPY src/App.tsx src/App.tsx
RUN mkdir -p src/styles && echo "/* Demo styles */" > src/styles/app.css

# Expose Vite's default port
EXPOSE 5173

# Start the Vite development server and make it accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
