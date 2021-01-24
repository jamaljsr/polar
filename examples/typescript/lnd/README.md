# TypeScript LND app

This is an example app that shows how Polar can be used in your development workflow while working on Lightning Network applications.

This example is a simple app, designed for LND nodes, that allows the user to:

1. Open a channel
1. List peers
1. List pending channels
1. List open channels

# Getting Started

1. Start the Polar app using `yarn dev` or opening the app itself
1. In Polar, run an environment with at least one `lnd` node and has at least two nodes (the default environment, which has one of each node type, is good)
1. Run `cp .env.example .env` in this directory
1. Under the `Connect` tab for the `lnd` node in your Polar environment, copy the following values to `.env`:
   - Copy the `Admin Macaroon` path to `ALICE_LND_MACAROON_PATH`
   - Copy the `GRPC Host` path to `ALICE_LND_HOST`
   - Copy the `TLS Cert` path to `ALICE_TLS_CERT_PATH`
1. Install this app's dependencies by running `yarn`
1. Run the app by running `yarn start`
