# syntax=docker/dockerfile:1

FROM rust:1.85-bookworm AS builder

ARG LDK_SERVER_GIT_REF=main
WORKDIR /src

# Clone from GitHub (default build: docker build -f docker/ldk-server/Dockerfile .)
RUN apt-get update \
  && apt-get install -y git ca-certificates \
  && git clone --depth 1 --branch "${LDK_SERVER_GIT_REF}" https://github.com/lightningdevkit/ldk-server.git /src \
  && rm -rf /var/lib/apt/lists/*

RUN cargo build --release -p ldk-server

FROM debian:stable-slim

ENV PATH=/opt/ldk-server:$PATH

RUN apt-get update -y \
  && apt-get install -y gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p /opt/ldk-server /home/ldk/.ldk-server

COPY --from=builder /src/target/release/ldk-server /opt/ldk-server/ldk-server

COPY docker/ldk-server/docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/ldk/.ldk-server"]

EXPOSE 3536 9735

ENTRYPOINT ["/entrypoint.sh"]

CMD ["ldk-server"]
