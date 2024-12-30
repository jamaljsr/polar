FROM debian:stable-slim

ARG BTCD_VERSION
ENV PATH=/opt/btcd:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN SYS_ARCH="$(dpkg --print-architecture)" \
  && curl -SLO https://github.com/btcsuite/btcd/releases/download/v${BTCD_VERSION}/btcd-linux-${SYS_ARCH}-v${BTCD_VERSION}.tar.gz \
  && tar -xzf *.tar.gz \
  && mkdir /opt/btcd \
  && mv ./btcd-linux-${SYS_ARCH}-v${BTCD_VERSION}/* /opt/btcd \
  && rm *.tar.gz


COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/btcd/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/btcd/.btcd"]

EXPOSE 18334 18444

ENTRYPOINT ["/entrypoint.sh"]

CMD ["btcd"]
