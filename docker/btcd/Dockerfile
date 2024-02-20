# Stage 1: Build the btcd binary
FROM golang:1.17 AS builder

# Set build arguments and environment variables if needed
ARG BTCD_VERSION=master  # Default version if not specified

# Clone the btcd repository and checkout the specific version
RUN git clone https://github.com/btcsuite/btcd.git /btcd \
    && cd /btcd \
    && git checkout ${BTCD_VERSION}

# Build btcd
RUN cd /btcd \
    && GO111MODULE=on go install -v . ./cmd/...

# Stage 2: Setup the final image
FROM alpine:3.14

# Install dependencies
RUN apk add --no-cache ca-certificates

# Create btcd user and home directory
RUN addgroup -S btcd && adduser -S btcd -G btcd \
    && mkdir -p /home/btcd/.btcd \
    && chown -R btcd:btcd /home/btcd

# Copy the btcd binary from the builder stage
COPY --from=builder /go/bin/btcd /usr/local/bin/btcd

# Copy the entrypoint script
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set up data volume
VOLUME ["/home/btcd/.btcd"]

# Expose p2p and rpc ports
EXPOSE 18444 18443

# Switch to btcd user
USER btcd

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Start btcd in regtest mode
CMD ["btcd", "--regtest", "--rpcuser=user", "--rpcpass=pass", "--rpclisten=0.0.0.0:18443"]
