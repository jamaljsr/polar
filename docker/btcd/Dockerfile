# Use multi-stage build to support multiple architectures
FROM golang:1.17 AS builder

# Set build arguments
ARG TARGETARCH

ARG BTCD_VERSION

# Install dependencies
RUN apt-get update && apt-get install -y git

# Set the working directory
WORKDIR /go/src/github.com/btcsuite/btcd

# Clone the btcd repository
RUN git clone https://github.com/btcsuite/btcd.git .

# Checkout the desired version (replace with the desired version)
RUN git checkout ${BTCD_VERSION}
RUN GOARCH=${TARGETARCH} go build -o btcd

# Use alpine as the base image for the final image
FROM alpine:3.14

# Install dependencies
RUN apk add --no-cache ca-certificates

# Copy btcd binary from the builder stage
COPY --from=builder /go/src/github.com/btcsuite/btcd/btcd /usr/local/bin/

# Set up configuration
RUN mkdir -p /root/.btcd
COPY btcd.conf /root/.btcd/btcd.conf

# Expose p2p and rpc ports
EXPOSE 18444 18443

# Start btcd in regtest mode
CMD ["btcd", "--regtest", "--rpcuser=user", "--rpcpass=pass", "--rpclisten=0.0.0.0:18443"]
