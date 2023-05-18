FROM debian:stable-slim

ARG TAPD_VERSION
ENV PATH=/opt/taproot-assets:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN SYS_ARCH="$(dpkg --print-architecture)" \
  && curl -SLO https://github.com/lightninglabs/taproot-assets/releases/download/v${TAPD_VERSION}/taproot-assets-linux-${SYS_ARCH}-v${TAPD_VERSION}.tar.gz \
  && tar -xzf *.tar.gz \
  && mkdir /opt/taproot-assets \
  && mv ./taproot-assets-linux-${SYS_ARCH}-v${TAPD_VERSION}/* /opt/taproot-assets \
  && rm *.tar.gz

COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/tap/.tapd"]

EXPOSE 8089 10029

ENTRYPOINT ["/entrypoint.sh"]

CMD ["tapd"]
