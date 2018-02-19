FROM ubuntu:16.04

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        tor iptables vim curl ruby-full gcc g++ make autoconf automake \
        gettext libtool libltdl-dev bzip2 git expect apt-utils

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt install nodejs -y

RUN gem install travis -v 1.8.8 --no-rdoc --no-ri
RUN npm install -g bash-obfuscate
