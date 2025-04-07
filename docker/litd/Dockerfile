FROM debian:stable-slim

ARG LITD_VERSION
ENV PATH=/opt/litd:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN SYS_ARCH="$(dpkg --print-architecture)" \
  && curl -SLO https://github.com/lightninglabs/lightning-terminal/releases/download/v${LITD_VERSION}/lightning-terminal-linux-${SYS_ARCH}-v${LITD_VERSION}.tar.gz \
  && tar -xzf *.tar.gz \
  && mkdir /opt/litd \
  && mv ./lightning-terminal-linux-${SYS_ARCH}-v${LITD_VERSION}/* /opt/litd \
  && rm *.tar.gz

COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/litd/.litd"]

EXPOSE 9735 8080 10000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["litd"]