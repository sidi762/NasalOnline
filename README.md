# Nasal Online

Run your Nasal code online!

This project is based on:

* [__Nasal-Interpreter__: Modern Interpreter by ValKmjolnir](https://github.com/ValKmjolnir/Nasal-Interpreter)
* [__Docker__](https://www.docker.com/)

## Clone
> git clone --recurse-submodules https://github.com/sidi762/NasalOnline.git

### Update
> git submodule update --init --recursive

## Docker Build

Use this command to build from `Dockerfile`.

> docker build -t nasal-online/ubuntu:v1 .

Then if want to debug by using `/bin/bash`, try this:

> docker run -it nasal-online/ubuntu:v1 /bin/bash
