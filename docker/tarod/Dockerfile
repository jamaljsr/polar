# IMAGE FOR BUILDING
FROM golang:1.19.2 as builder 

ARG TAROD_VERSION

WORKDIR /app

RUN git clone https://github.com/lightninglabs/taro.git .

ENV CGO_ENABLED=0

RUN make install

# FINAL IMAGE
FROM debian:buster-slim as final

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=builder /go/bin/tarod /bin/
COPY --from=builder /go/bin/tarocli /bin/

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod a+x /entrypoint.sh

VOLUME ["/home/taro/.taro"]

EXPOSE 10029
EXPOSE 8089

ENTRYPOINT ["/entrypoint.sh"]

CMD ["tarod"]
