# Use a light version of Node
FROM node:20-alpine

# Create the app directory
WORKDIR /app

# Copy package files first (better for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Open the port your Express app uses
EXPOSE 5000

# Start the server
CMD ["npm", "start"]