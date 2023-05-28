FROM ubuntu

RUN apt-get update
RUN apt-get install -y git cmake gcc g++

RUN git clone https://github.com/ValKmjolnir/Nasal-Interpreter.git

RUN cd Nasal-Interpreter && mkdir build && cd build && cmake .. && make -j
RUN echo "export PATH=/Nasal-Interpreter:$PATH" >> ./root/.bashrc

CMD ./Nasal-Interpreter/nasal