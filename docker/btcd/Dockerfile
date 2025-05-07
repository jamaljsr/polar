FROM debian:stable-slim

ARG BITCOIN_VERSION
ENV PATH=/opt/btcd:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN SYS_ARCH="$(dpkg --print-architecture)" \
  && curl -SLO  https://github.com/btcsuite/btcd/releases/download/v${BITCOIN_VERSION}/btcd-linux-${SYS_ARCH}-v${BITCOIN_VERSION}.tar.gz \
  && tar -xzf *.tar.gz \
  && mkdir /opt/btcd \
  && mv ./btcd-linux-${SYS_ARCH}-v${BITCOIN_VERSION}/* /opt/btcd \
  && rm *.tar.gz


COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

VOLUME ["/root/.btcd"]

EXPOSE 18334 18444

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "btcd" ]