ARG CLN_VERSION

FROM elementsproject/lightningd:v${CLN_VERSION}

# install nodejs
RUN apt-get update -y \
  && apt-get install -y curl gosu git \
  && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# install c-lightning-REST API plugin
RUN git clone https://github.com/saubyk/c-lightning-rest /opt/c-lightning-rest/ \
  && cd /opt/c-lightning-rest \
  && npm install \
  && chmod -R a+rw /opt/c-lightning-rest

COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

# TODO change to /home/clightning
VOLUME ["/root/.lightning"]
VOLUME ["/opt/c-lightning-rest/certs"]

EXPOSE 9735 8080 10000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lightningd"]
