FROM debian:stable-slim

ARG BITCOIN_VERSION
ENV PATH=/opt/bitcoin-${BITCOIN_VERSION}/bin:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN SYS_ARCH="$(uname -m)" \
  && curl -SLO https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/bitcoin-${BITCOIN_VERSION}-${SYS_ARCH}-linux-gnu.tar.gz \
  && tar -xzf *.tar.gz -C /opt \
  && rm *.tar.gz

RUN curl -SLO https://raw.githubusercontent.com/bitcoin/bitcoin/master/contrib/bitcoin-cli.bash-completion \
  && mkdir /etc/bash_completion.d \
  && mv bitcoin-cli.bash-completion /etc/bash_completion.d/ \
  && curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/bitcoin/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/bitcoin/.bitcoin"]

EXPOSE 18443 18444 28334 28335

ENTRYPOINT ["/entrypoint.sh"]

CMD ["bitcoind"]
