# Use the official Node.js image as a base
FROM node:18-slim AS base

# Set the working directory in the container
WORKDIR /usr/src/app
FROM base
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Copy the application files into the container
COPY . .

RUN pnpm add tsx

# Install the application dependencies
RUN pnpm install  --frozen-lockfile

EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]