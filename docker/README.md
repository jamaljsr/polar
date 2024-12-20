# Docker Images

> The Dockerfiles used to build the images that the Polar app needs to spin up nodes quickly across multiple operating systems.

_Warning: These images are not hardened and shouldn't be used to store real bitcoin. These images are intended solely to be used in regtest environments_

Creating multi-arch images for Polar makes use of the `docker buildx` command. It is a good idea to create a separate builder using the commands below.

```
// create the builder
$ docker buildx create --use --name polar-builder

// use the builder
$ docker buildx use polar-builder

// bootstrap the builder
$ docker buildx inspect --bootstrap
```

## Bitcoin Core

### Tags

- `28.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `27.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `26.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `25.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `24.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `23.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `22.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `0.21.1` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `0.21.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `0.20.1` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `0.20.0` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `0.19.1` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `0.19.0.1` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))
- `0.18.1` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))

**Building the image**

```sh
$ cd bitcoind
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg BITCOIN_VERSION=<version> -t polarlightning/bitcoind:<version> --push .
```

Replace `<version>` with the desired bitcoind version (ex: `0.18.1`)

## LND

### Tags

- `0.18.4-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.18.3-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.18.2-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.18.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.18.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.17.5-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.17.4-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.17.3-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.17.2-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.17.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.17.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.16.4-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.16.2-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.16.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.16.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.15.5-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.15.4-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.15.3-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.15.2-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.15.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.15.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.14.3-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.14.2-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.14.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.13.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.13.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.12.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.12.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.11.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.11.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.10.3-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.10.2-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.10.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.10.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.9.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.9.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.8.2-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.8.0-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.7.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))

**Building the image**

```sh
$ cd lnd
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg LND_VERSION=<version> -t polarlightning/lnd:<version> --push .
```

Replace `<version>` with the desired LND version (ex: `0.7.1-beta`)

## Core Lightning

### Tags

- `24.11.1` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `24.11` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `24.08.1` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `24.08` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `24.05` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `24.02.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `23.11.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `23.05.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `23.02.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `22.11` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.12.0` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.11.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.11.1` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.10.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.10.0` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.9.3` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.9.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.9.1` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.9.0` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.8.2` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.8.1` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))
- `0.8.0` ([clightning/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))

**Building the image**

```sh
$ cd clightning
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg CLN_VERSION=<version> -t polarlightning/clightning:<version> --push .
```

Replace `<version>` with the desired c-lightning version (ex: `0.8.0`).

## Eclair

### Tags

- `0.11.0` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.10.0` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.9.0` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.8.0` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.7.0` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.6.2` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.6.1` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.6.0` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.5.0` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.4.2` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))
- `0.3.3` ([eclair/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/eclair/Dockerfile))

**Building the image**

```sh
$ cd eclair
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg ECLAIR_VERSION=<version> -t polarlightning/eclair:<version> --push .
```

Replace `<version>` with the desired Eclair version (ex: `0.3.3`).

## Taproot Assets Protocol

### Tags

- `0.5.0-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.4.1-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.4.0-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.3.3-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.3.2-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.3.1-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.3.0-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.2.3-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.2.2-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))
- `0.2.0-alpha` ([tap/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/tapd/Dockerfile))

**Building the image**

```sh
$ cd tapd
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg TAPD_VERSION=<version> -t polarlightning/tapd:<version> --push .
```

Replace `<version>` with the desired Tap version (ex: `0.2.0-alpha`).

## Lightning Terminal

### Tags

- `0.14.0-alpha` ([litd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/litd/Dockerfile))

**Building the image**

```sh
$ cd litd
$ docker buildx build --platform linux/amd64,linux/arm64 --build-arg LITD_VERSION=<version> -t polarlightning/litd:<version> --push .
```

Replace `<version>` with the desired Tap version (ex: `0.13.3-alpha`).

# Out-of-Band Image Updates

> Note: These steps can only be performed by developers with commit access to this GitHub repo and push access to the Docker Hub repo

These docker images can be updated in-between Polar releases. This allows developers to use the latest Bitcoin & Lightning versions shortly after they are released, without needing to download and install a new version of Polar.

To make new docker image versions available:

1. Build the new docker image using the commands above
1. Push the image to Docker Hub
1. Update the [`docker/nodes.json`](https://github.com/jamaljsr/polar/blob/master/docker/nodes.json) file
   - add the new version to the `versions` array of the associated implementation
   - update the `latest` property of the implementation if necessary
   - increment the root-level `version` number by `1`
1. Update the [`src/utils/constants.ts`](https://github.com/jamaljsr/polar/blob/master/src/utils/constants.ts) file

Once the updated `nodes.json` file is committed to master, the new images can be used in Polar by following these steps:

1. Create a Network or view an existing Network
1. In the Network Designer sidebar, click on the **Show All Versions** toggle
1. At the bottom of the node list, click on the **Check for new Node Versions** link
1. A dialog will open displaying the new versions available
1. Click the **Add New Versions** button to begin using them
