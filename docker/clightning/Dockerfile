ARG CLN_VERSION
ARG CLN_IMAGE="elementsproject/lightningd:v${CLN_VERSION}"

FROM ${CLN_IMAGE}

ARG CLN_VERSION

# install gosu
RUN apt-get update -y \
  && apt-get install -y curl gosu git tor\
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# download CLN bash completion file
RUN curl -SLO https://raw.githubusercontent.com/ElementsProject/lightning/v${CLN_VERSION}/contrib/lightning-cli.bash-completion \
  && mv lightning-cli.bash-completion /etc/bash_completion.d/lightning-cli

# install lightning-cli bash completion
RUN curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/clightning/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/clightning"]

EXPOSE 9735 9835 8080 10000 9050 9051

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lightningd"]