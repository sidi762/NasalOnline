# Build stage
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    make \
    g++ \
    cmake && \
    rm -rf /var/lib/apt/lists/*

# Copy and build the Nasal interpreter
WORKDIR /app/nasal-interpreter
COPY ./lib/nasal-interpreter .
RUN mkdir build && \
    cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON . && \
    cmake --build . && \
    make all

# Runtime stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    python3 \
    libstdc++6 \
    seccomp && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 sandbox && \
    adduser --system --uid 1001 --ingroup sandbox sandbox

# Set up application
WORKDIR /app/nasal-web-app
COPY --from=builder /app/nasal-interpreter/build /app/nasal-interpreter/build
COPY --chown=sandbox:sandbox /app/nasal-web-app .
RUN npm ci --only=production

EXPOSE 3000
USER sandbox
CMD ["node", "server.js"]
