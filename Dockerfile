# Use the official Node.js image as a base
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Copy the application files into the container
COPY . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true 

RUN pnpm add tsx

# Install the application dependencies
RUN pnpm install  --frozen-lockfile

EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]