FROM ubuntu:18.04

ARG CLN_VERSION
# bitcoin-cli is required for c-lightning
ARG BITCOIN_VERSION
ENV PATH=/opt/bitcoin-${BITCOIN_VERSION}/bin:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it xz-utils libsodium-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN curl -SLO https://bitcoin.org/bin/bitcoin-core-${BITCOIN_VERSION}/bitcoin-${BITCOIN_VERSION}-x86_64-linux-gnu.tar.gz \
  && tar -xzf *.tar.gz -C /opt \
  && rm *.tar.gz

RUN curl -SLO https://github.com/ElementsProject/lightning/releases/download/v${CLN_VERSION}/clightning-v${CLN_VERSION}-Ubuntu-18.04.tar.xz  \
  && tar -xf *.tar.xz -C / \
  && rm *.tar.xz

COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/clightning/.lightning"]

EXPOSE 9735 8080 10000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lightningd"]
