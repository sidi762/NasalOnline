# Use the official Ubuntu image to build the C++ interpreter
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get install -y --no-install-recommends libstdc++6 seccomp && \
    apt-get install -y --no-install-recommends python3 make g++ cmake&& \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app/nasal-web-app

# Copy the Nasal interpreter source code
COPY ./lib/nasal-interpreter /app/nasal-interpreter

# Build the Nasal interpreter using CMake
WORKDIR /app/nasal-interpreter
RUN mkdir build && cd build && cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON . && cmake --build . && make all

RUN addgroup --system --gid 1001 sandbox && \
adduser --system --uid 1001 --ingroup sandbox sandbox

# Set the working directory for the backend
WORKDIR /app/nasal-web-app/

# Copy backend files
COPY --chown=sandbox:sandbox /app/nasal-web-app /app/nasal-web-app
RUN npm install

# Expose the port the app runs on
EXPOSE 3000

USER sandbox

# Start the backend server
CMD ["node", "/app/nasal-web-app/server.js"]
