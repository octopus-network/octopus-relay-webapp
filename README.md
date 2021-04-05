# Octopus Relay Webapp

[![Netlify Status](https://api.netlify.com/api/v1/badges/a62ea403-951b-43c4-a8c0-73fe8745565c/deploy-status)](https://app.netlify.com/sites/vigilant-mcclintock-590240/deploys)

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

# Chain network id, testnet|mainnet|betanet
export OCT_NETWORK="testnet"

# Octopus relay contract id
export OCT_RELAY_CONTRACT_NAME="dev-1617522041326-1812977"

# Oct token contract id
export OCT_TOKEN_CONTRACT_NAME="dev-1616962983544-1322706"

```