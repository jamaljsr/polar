# Docker Images

> The Dockerfiles used to build the images that the Polar app needs to spin up nodes quickly across multiple operating systems.

_Warning: These images are not hardened and shouldn't be used to store real bitcoin. These images are intended solely to be used in simnet/regtest environments_

## Bitcoin Core

### Tags

- `0.18.1`, `latest` ([bitcoind/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/bitcoind/Dockerfile))

**Building the image**

```sh
$ cd bitcoind
$ docker build --build-arg BITCOIN_VERSION=<version> -t polarlightning/bitcoind:latest -t polarlightning/bitcoind:<version> .
```

Replace `<version>` with the desired bitcoind version (ex: `0.18.1`)

**Push to Docker Hub**

```sh
$ docker push polarlightning/bitcoind:<version>
$ docker push polarlightning/bitcoind:latest
```

## LND

### Tags

- `0.8.0-beta`, `latest` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))
- `0.7.1-beta` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/lnd/Dockerfile))

**Building the image**

```sh
$ cd lnd
$ docker build --build-arg LND_VERSION=<version> -t polarlightning/lnd:latest -t polarlightning/lnd:<version> .
```

Replace `<version>` with the desired LND version (ex: `0.8.0-beta`)

**Push to Docker Hub**

```sh
$ docker push polarlightning/lnd:<version>
$ docker push polarlightning/lnd:latest
```

## c-lightning

### Tags

- `0.7.3`, `latest` ([lnd/Dockerfile](https://github.com/jamaljsr/polar/blob/master/docker/clightning/Dockerfile))

**Building the image**

```sh
$ cd clightning
$ docker build --build-arg CLN_VERSION=<version>  -t polarlightning/clightning:latest -t polarlightning/clightning:<version> .
```

Replace `<version>` with the desired c-lightning version (ex: `0.7.3`).

**Push to Docker Hub**

```sh
$ docker push polarlightning/clightning:<version>
$ docker push polarlightning/clightning:latest
```
