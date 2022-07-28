#########################
# Polar needs c-lightning compiled with the DEVELOPER=1 flag in order to decrease the
# normal 30 second bitcoind poll interval using the argument --dev-bitcoind-poll=<seconds>.
# When running in regtest, we want to be able to mine blocks and confirm transactions instantly.
# Original Source: https://github.com/ElementsProject/lightning/blob/v0.7.3/Dockerfile
#########################

#########################
# BEGIN ElementsProject/lightning/Dockerfile
#########################

# This dockerfile is meant to compile a core-lightning x64 image
# It is using multi stage build:
# * downloader: Download litecoin/bitcoin and qemu binaries needed for core-lightning
# * builder: Compile core-lightning dependencies, then core-lightning itself with static linking
# * final: Copy the binaries required at runtime
# The resulting image uploaded to dockerhub will only contain what is needed for runtime.
# From the root of the repository, run "docker build -t yourimage:yourtag ."
FROM debian:bullseye-slim as downloader

RUN set -ex \
  && apt-get update \
  && apt-get install -qq --no-install-recommends ca-certificates dirmngr wget

WORKDIR /opt

RUN wget -qO /opt/tini "https://github.com/krallin/tini/releases/download/v0.18.0/tini" \
  && echo "12d20136605531b09a2c2dac02ccee85e1b874eb322ef6baf7561cd93f93c855 /opt/tini" | sha256sum -c - \
  && chmod +x /opt/tini

ARG BITCOIN_VERSION=22.0
ENV BITCOIN_TARBALL bitcoin-${BITCOIN_VERSION}-x86_64-linux-gnu.tar.gz
ENV BITCOIN_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/$BITCOIN_TARBALL
ENV BITCOIN_ASC_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/SHA256SUMS

RUN mkdir /opt/bitcoin && cd /opt/bitcoin \
  && wget -qO $BITCOIN_TARBALL "$BITCOIN_URL" \
  && wget -qO bitcoin "$BITCOIN_ASC_URL" \
  && grep $BITCOIN_TARBALL bitcoin | tee SHA256SUMS \
  && sha256sum -c SHA256SUMS \
  && BD=bitcoin-$BITCOIN_VERSION/bin \
  && tar -xzvf $BITCOIN_TARBALL $BD/bitcoin-cli --strip-components=1 \
  && rm $BITCOIN_TARBALL

ENV LITECOIN_VERSION 0.16.3
ENV LITECOIN_PGP_KEY FE3348877809386C
ENV LITECOIN_URL https://download.litecoin.org/litecoin-${LITECOIN_VERSION}/linux/litecoin-${LITECOIN_VERSION}-x86_64-linux-gnu.tar.gz
ENV LITECOIN_ASC_URL https://download.litecoin.org/litecoin-${LITECOIN_VERSION}/linux/litecoin-${LITECOIN_VERSION}-linux-signatures.asc
ENV LITECOIN_SHA256 686d99d1746528648c2c54a1363d046436fd172beadaceea80bdc93043805994

# install litecoin binaries
RUN mkdir /opt/litecoin && cd /opt/litecoin \
  && wget -qO litecoin.tar.gz "$LITECOIN_URL" \
  && echo "$LITECOIN_SHA256  litecoin.tar.gz" | sha256sum -c - \
  && BD=litecoin-$LITECOIN_VERSION/bin \
  && tar -xzvf litecoin.tar.gz $BD/litecoin-cli --strip-components=1 --exclude=*-qt \
  && rm litecoin.tar.gz

FROM debian:bullseye-slim as builder

ENV LIGHTNINGD_VERSION=master
RUN apt-get update -qq && \
  apt-get install -qq -y --no-install-recommends \
  autoconf \
  automake \
  build-essential \
  ca-certificates \
  curl \
  dirmngr \
  gettext \
  git \
  gnupg \
  libpq-dev \
  libtool \
  libffi-dev \
  python3 \
  python3-dev \
  python3-mako \
  python3-pip \
  python3-venv \
  python3-setuptools \
  wget

RUN wget -q https://zlib.net/zlib-1.2.12.tar.gz \
  && tar xvf zlib-1.2.12.tar.gz \
  && cd zlib-1.2.12 \
  && ./configure \
  && make \
  && make install && cd .. && rm zlib-1.2.12.tar.gz && rm -rf zlib-1.2.12

RUN apt-get install -y --no-install-recommends unzip tclsh \
  && wget -q https://www.sqlite.org/2019/sqlite-src-3290000.zip \
  && unzip sqlite-src-3290000.zip \
  && cd sqlite-src-3290000 \
  && ./configure --enable-static --disable-readline --disable-threadsafe --disable-load-extension \
  && make \
  && make install && cd .. && rm sqlite-src-3290000.zip && rm -rf sqlite-src-3290000

RUN wget -q https://gmplib.org/download/gmp/gmp-6.1.2.tar.xz \
  && tar xvf gmp-6.1.2.tar.xz \
  && cd gmp-6.1.2 \
  && ./configure --disable-assembly \
  && make \
  && make install && cd .. && rm gmp-6.1.2.tar.xz && rm -rf gmp-6.1.2

ENV RUST_PROFILE=release
ENV PATH=$PATH:/root/.cargo/bin/
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN rustup toolchain install stable --component rustfmt --allow-downgrade

WORKDIR /opt/lightningd
#################### Polar Modification
# Pull source code from github instead of a local repo
# Original lines:
# COPY . /tmp/lightning
# RUN git clone --recursive /tmp/lightning . && \
#     git checkout $(git --work-tree=/tmp/lightning --git-dir=/tmp/lightning/.git rev-parse HEAD)
ARG CLN_VERSION
RUN git clone --recursive --branch=v${CLN_VERSION} https://github.com/ElementsProject/lightning .
####################

#################### Polar Modification
# This line is modified to enable developer command line flags
# Original line: ARG DEVELOPER=0
ARG DEVELOPER=1
####################

ENV PYTHON_VERSION=3
RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/install-poetry.py | python3 - \
  && pip3 install -U pip \
  && pip3 install -U wheel \
  && /root/.local/bin/poetry config virtualenvs.create false \
  && /root/.local/bin/poetry install

RUN ./configure --prefix=/tmp/lightning_install --enable-static && make -j3 DEVELOPER=${DEVELOPER} && make install

FROM debian:bullseye-slim as final

COPY --from=downloader /opt/tini /usr/bin/tini
RUN apt-get update && apt-get install -y --no-install-recommends socat inotify-tools python3 python3-pip libpq5\
  && rm -rf /var/lib/apt/lists/*

ENV LIGHTNINGD_DATA=/root/.lightning
ENV LIGHTNINGD_RPC_PORT=9835
ENV LIGHTNINGD_PORT=9735
ENV LIGHTNINGD_NETWORK=bitcoin

RUN mkdir $LIGHTNINGD_DATA && \
  touch $LIGHTNINGD_DATA/config
VOLUME [ "/root/.lightning" ]
COPY --from=builder /tmp/lightning_install/ /usr/local/
COPY --from=downloader /opt/bitcoin/bin /usr/bin
COPY --from=downloader /opt/litecoin/bin /usr/bin

#################### Polar Modification
COPY --from=builder /opt/lightningd/contrib/lightning-cli.bash-completion /etc/bash_completion.d/
####################

#################### Polar Modification
# This line is removed as we have our own entrypoint file
# Original line: COPY tools/docker-entrypoint.sh entrypoint.sh
####################

#########################
# END ElementsProject/lightning/Dockerfile
#########################

# install nodejs
RUN apt-get update -y \
  && apt-get install -y curl gosu git \
  && curl -sL https://deb.nodesource.com/setup_14.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# install c-lightning-REST API plugin
RUN git clone https://github.com/Ride-The-Lightning/c-lightning-REST.git /opt/c-lightning-rest/ \
  && cd /opt/c-lightning-rest \
  && npm install \
  && chmod -R a+rw /opt/c-lightning-rest

# install lightning-cli bash completion
RUN curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/clightning/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/clightning"]
VOLUME ["/opt/c-lightning-rest/certs"]

EXPOSE 9735 9835 8080 10000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lightningd"]
