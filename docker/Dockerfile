# Official Playwright image: Node.js + all browsers + system dependencies.
# The tag MUST match the @playwright/test version in package-lock.json.
FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /app

# Install dependencies first — this layer is cached until package*.json changes
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the project (filtered by .dockerignore)
COPY . .

# Default command; can be overridden in docker compose / docker run
CMD ["npx", "playwright", "test"]