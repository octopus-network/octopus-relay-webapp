# Octopus Relay Webapp

Octopus Relay is part of the Octopus Network.

This is the Webapp, you can also follow the [Smart Contract](https://github.com/octopus-network/octopus-relay-contract.git).

## Environment Variables

```bash

# GOOGLE_APPLICATION_CREDENTIALS is used to upload files to google cloud storage
export GOOGLE_APPLICATION_CREDENTIALS="YOUR_CREDENTIALS_PATH"

# Google cloud storage bucket name
export STORAGE_BUCKETNAME="dl-testnet"

# App server listen port
export PORT="80"

# Network id, testnet|mainent|betanet
export NETWORK="testnet"

# Octopus relay contract id
export RELAY_CONTRACT_NAME="dev-1617522041326-1812977"

# Oct token contract id
export TOKEN_CONTRACT_NAME="dev-1616962983544-1322706"

```

## Development

Fast front-end debugging

```bash

yarn dev:web

```

## Run app

```bash

yarn start

```