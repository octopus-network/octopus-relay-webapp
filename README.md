# Octopus Relay Webapp

Octopus Relay is part of the Octopus Network.

This is the Webapp, you can also follow the [Smart Contract](https://github.com/octopus-network/octopus-relay-contract.git).


## Development

```bash

yarn dev

```

## Build 

```bash

yarn build

```

## Deploy

We use netlify to deploy, please follow [this article](https://www.netlify.com/blog/2016/09/29/a-step-by-step-guide-deploying-on-netlify/)

### Environment Variables

```bash

# GOOGLE_APPLICATION_CREDENTIALS
export GCS_CLIENT_EMAIL="xxx@xxx.com"
export GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----\n"

# Google cloud storage bucket name
export GCS_BUCKET_NAME="dl-testnet"

# Chain network id, testnet|mainnet|betanet
export NETWORK="testnet"

# Octopus relay contract id
export RELAY_CONTRACT_NAME="dev-1617522041326-1812977"

# Oct token contract id
export TOKEN_CONTRACT_NAME="dev-1616962983544-1322706"

```