# Install dependencies only when needed
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Install AWS CLI and required dependencies
RUN apk add --no-cache \
    aws-cli \
    openssh-client \
    bash \
    curl \
    jq \
    git \
    && aws --version

# Use existing node user (UID 1000) instead of creating new one
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# Set home directory explicitly
ENV HOME=/home/node

# Configure AWS Credentials
RUN mkdir -p /home/node/.aws && \
    chown -R node:node /home/node/.aws

# Create script first
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy full .next folder and node_modules with correct ownership
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Ensure permissions for node user (non-recursive to save time, COPY handles contents)
RUN chown node:node /app

# Copy existing state file and set permissions
COPY backupec2_state.json /app/backupec2_state.json
RUN chmod 666 /app/backupec2_state.json

# Switch to user node
USER node

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
