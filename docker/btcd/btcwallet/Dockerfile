FROM golang:1.24.3 AS builder

ARG BTCWALLET_VERSION
WORKDIR /go/src/github.com/btcsuite/btcwallet

RUN git clone https://github.com/btcsuite/btcwallet.git . \
  && git checkout v${BTCWALLET_VERSION} \
  && go install -v . ./cmd/...

# --- Final runtime image ---
FROM debian:stable-slim

ENV PATH="/opt/btcwallet/bin:$PATH"

RUN apt-get update -y \
  && apt-get install -y gosu expect openssl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /go/bin/btcwallet /opt/btcwallet/bin/

COPY docker-entrypoint.sh /entrypoint.sh
COPY create-wallet.sh /create-wallet.sh
RUN chmod a+x /entrypoint.sh /create-wallet.sh

VOLUME ["/root/.btcwallet"]

EXPOSE 18332 18334

ENTRYPOINT ["/entrypoint.sh"]
CMD ["btcwallet"]
