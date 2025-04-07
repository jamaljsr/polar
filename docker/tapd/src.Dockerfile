FROM golang:1.24-bookworm as golangbuilder

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

# Pass a tag, branch or a commit using build-arg.  This allows a docker
# image to be built from a specified Git state.  The default image
# will use the Git tip of master by default.
ARG checkout="main"
ARG git_url="https://github.com/lightninglabs/taproot-assets"

# Install dependencies and build the binaries.
RUN apt-get update -y \
  && apt-get install -y make \
  && git clone $git_url /go/src/github.com/lightninglabs/taproot-assets \
  && cd /go/src/github.com/lightninglabs/taproot-assets \
  && git checkout $checkout \
  && make release-install

FROM debian:stable-slim

ARG TAPD_VERSION
ENV PATH=/opt/taproot-assets:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# RUN SYS_ARCH="$(dpkg --print-architecture)" \
#   && curl -SLO https://github.com/lightninglabs/taproot-assets/releases/download/v${TAPD_VERSION}/taproot-assets-linux-${SYS_ARCH}-v${TAPD_VERSION}.tar.gz \
#   && tar -xzf *.tar.gz \
#   && mkdir /opt/taproot-assets \
#   && mv ./taproot-assets-linux-${SYS_ARCH}-v${TAPD_VERSION}/* /opt/taproot-assets \
#   && rm *.tar.gz

COPY --from=golangbuilder /go/bin/tapd /bin/
COPY --from=golangbuilder /go/bin/tapcli /bin/

COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/tap/.tapd"]

EXPOSE 8089 10029

ENTRYPOINT ["/entrypoint.sh"]

CMD ["tapd"]
