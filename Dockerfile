FROM node:18

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .


# Build Nasal
RUN apt-get update
RUN apt-get install -y git cmake gcc g++

RUN git clone https://github.com/ValKmjolnir/Nasal-Interpreter.git

RUN cd Nasal-Interpreter && mkdir build && cd build && cmake .. && make -j
RUN echo "export PATH=/Nasal-Interpreter:$PATH" >> ./root/.bashrc


# CMD ./Nasal-Interpreter/nasal


EXPOSE 8080
CMD [ "node", "index.js" ]
