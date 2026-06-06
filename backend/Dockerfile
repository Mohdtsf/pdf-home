FROM node:20-slim

# Install necessary binaries for PDF processing
RUN apt-get update && apt-get install -y \
    ghostscript \
    libreoffice \
    tesseract-ocr \
    tesseract-ocr-eng \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build TypeScript
RUN npx tsc

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/server.js"]
