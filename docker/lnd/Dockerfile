FROM debian:stable-slim

ARG LND_VERSION
ENV PATH=/opt/lnd-linux-amd64-v${LND_VERSION}:$PATH

RUN useradd -r lnd \
  && apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN curl -SLO https://github.com/lightningnetwork/lnd/releases/download/v${LND_VERSION}/lnd-linux-amd64-v${LND_VERSION}.tar.gz \
  && tar -xzf *.tar.gz -C /opt \
  && rm *.tar.gz

COPY --chown=lnd docker-entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

VOLUME ["/home/lnd/.lnd"]

EXPOSE 8332 8333 18332 18333 18443 18444

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lnd"]
