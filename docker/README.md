# Docker Images

> The Dockerfiles used to build the images that the Polar app needs to spin up nodes quickly across multiple operating systems.

_Warning: These images are not hardened and shouldn't be used to store real bitcoin. These images are intended solely to be used in simnet/regtest environments_

## Bitcoin Core

### Tags

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
$ docker build --build-arg BITCOIN_VERSION=<version> -t polarlightning/bitcoind:<version> .
```

Replace `<version>` with the desired bitcoind version (ex: `0.18.1`)

**Push to Docker Hub**

```sh
$ docker push polarlightning/bitcoind:<version>
```

## LND

### Tags

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
$ docker build --build-arg LND_VERSION=<version> -t polarlightning/lnd:<version> .
```

Replace `<version>` with the desired LND version (ex: `0.7.1-beta`)

**Push to Docker Hub**

```sh
$ docker push polarlightning/lnd:<version>
```

## c-lightning

### Tags

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
$ docker build --build-arg CLN_VERSION=<version> -t polarlightning/clightning:<version> .
```

Replace `<version>` with the desired c-lightning version (ex: `0.8.0`).

**Push to Docker Hub**

```sh
$ docker push polarlightning/clightning:<version>
```

## Eclair

### Tags

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
$ docker build --build-arg ECLAIR_VERSION=<version> -t polarlightning/eclair:<version> .
```

Replace `<version>` with the desired Eclair version (ex: `0.3.3`).

**Push to Docker Hub**

```sh
$ docker push polarlightning/eclair:<version>
```

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
