# Use the official Node.js image as a base
FROM --platform=linux/amd64 node:18-slim AS base

# Set the working directory in the container
WORKDIR /usr/src/app
FROM base
RUN apt-get update
RUN apt-get install -y ca-certificates \
fonts-liberation \
libasound2 \
libatk-bridge2.0-0 \
libatk1.0-0 \
libc6 \
libcairo2 \
libcups2 \
libdbus-1-3 \
libexpat1 \
libfontconfig1 \
libgbm1 \
libgcc1 \
libglib2.0-0 \
libgtk-3-0 \
libnspr4 \
libnss3 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libstdc++6 \
libx11-6 \
libx11-xcb1 \
libxcb1 \
libxcomposite1 \
libxcursor1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxi6 \
libxrandr2 \
libxrender1 \
libxss1 \
libxtst6 \
lsb-release \
wget \
xdg-utils

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Copy the application files into the container
COPY . .

RUN pnpm add tsx

# Install the application dependencies
RUN pnpm install  --frozen-lockfile

EXPOSE 3000

CMD ["npx", "tsx", "src/server/index.ts"]
