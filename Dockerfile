FROM torex_pre

RUN mkdir /root/bash_scripts
COPY bash_scripts /root/bash_scripts
RUN chmod +x /root/bash_scripts/*

RUN mkdir /root/npm_project
COPY npm_project /root/npm_project
RUN rm -rf /root/npm_project/node_modules

RUN cd /root/npm_project && npm install
ENTRYPOINT ["/root/bash_scripts/attack.sh"]
