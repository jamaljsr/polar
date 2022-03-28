FROM debian:stable-slim

ARG LND_VERSION
ENV PATH=/opt/lnd-linux-amd64-v${LND_VERSION}:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN curl -SLO https://github.com/lightningnetwork/lnd/releases/download/v${LND_VERSION}/lnd-linux-amd64-v${LND_VERSION}.tar.gz \
  && tar -xzf *.tar.gz -C /opt \
  && rm *.tar.gz

RUN curl -SLO https://raw.githubusercontent.com/lightningnetwork/lnd/master/contrib/lncli.bash-completion \
  && mkdir /etc/bash_completion.d \
  && mv lncli.bash-completion /etc/bash_completion.d/ \
  && curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/lnd/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/lnd/.lnd"]

EXPOSE 9735 8080 10000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lnd"]
