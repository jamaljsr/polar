# Connecting to Your Nodes

Every node in a Polar network runs in its own Docker container. Each node has two kinds of ports, and the address you use depends on where your code or command runs.

- **Host port**: the port published on your machine. This is the port shown on the node's **Connect** tab, e.g. `http://127.0.0.1:18443`. It can be different for every node and every machine.
- **Container port**: the port the node listens on inside its container. It is fixed, e.g. bitcoind always listens for RPC on `18443` inside its container, whatever the Connect tab shows.

If you are new to Docker, the [Docker networking overview](https://docs.docker.com/engine/network/) explains how published ports work.

- [Which Address to Use](#which-address-to-use)
- [Container Names](#container-names)
- [Container Ports](#container-ports)
- [Why the Host Port Changes](#why-the-host-port-changes)
- [Default Credentials](#default-credentials)
- [Running CLI Commands with docker exec](#running-cli-commands-with-docker-exec)

## Which Address to Use

| Where the command or code runs                            | Address to use                              |
| --------------------------------------------------------- | ------------------------------------------- |
| On your machine (your app, a script, a local CLI, `curl`) | `127.0.0.1:<port shown on the Connect tab>` |
| Inside the node's own container (`docker exec`)           | `127.0.0.1:<container port>`                |
| In another container on the same Polar network            | `<container name>:<container port>`         |

For example, for a bitcoind node named `backend1` in network `1`:

| Where                  | RPC address                                           |
| ---------------------- | ----------------------------------------------------- |
| On your machine        | `127.0.0.1:18443` (or whatever the Connect tab shows) |
| Inside its container   | `127.0.0.1:18443`                                     |
| From another container | `polar-n1-backend1:18443`                             |

The same applies to the gRPC, REST, P2P and ZMQ ports of every node.

## Container Names

Polar names each container `polar-n<networkId>-<nodeName>`. For example, the node `alice` in network `1` runs in the container `polar-n1-alice`.

To list the containers of your running networks:

```sh
docker ps --filter "name=polar-" --format "{{.Names}}"
```

## Container Ports

These ports are fixed inside each container. They only change if you use a [custom node](custom-nodes.md) whose command listens on different ports.

| Node            | Ports inside the container                                        |
| --------------- | ----------------------------------------------------------------- |
| Bitcoin Core    | RPC `18443`, P2P `18444`, ZMQ blocks `28334`, ZMQ txns `28335`    |
| LND             | gRPC `10009`, REST `8080`, P2P `9735`                             |
| Core Lightning  | gRPC `11001`, REST `8080`, P2P `9735`                             |
| Eclair          | REST `8080`, P2P `9735`                                           |
| Taproot Assets  | gRPC `10029`, REST `8089`                                         |
| Terminal (litd) | Web UI and gRPC `8443`, REST `8080`, LND gRPC `10009`, P2P `9735` |

## Why the Host Port Changes

The port on the Connect tab is not always the default, for several reasons:

- **One port per node.** Each node of the same kind gets the next port number. The first bitcoind node gets RPC port `18443`, the second `18444`, and so on.
- **Custom base ports.** The starting port numbers can be changed in **Network Setting** in the menu.
- **Port conflicts.** When a network starts, Polar checks that each port is free on your machine. If a port is in use (by another Polar network, another app, or a port reserved by your OS, which is common on Windows), Polar picks the next free port and saves it.

Because of this, don't hardcode host ports in configs that are shared between machines. Check the Connect tab on each machine instead. Container ports don't change, so configs used inside containers can rely on them.

## Default Credentials

| Node                   | Credentials                                                  |
| ---------------------- | ------------------------------------------------------------ |
| Bitcoin Core RPC       | user `polaruser`, password `polarpass`                       |
| LND, Taproot Assets    | macaroons and TLS cert (file paths shown on the Connect tab) |
| Core Lightning         | rune and TLS certs (shown on the Connect tab)                |
| Eclair REST            | password `eclairpw` (HTTP basic auth, empty username)        |
| Terminal (litd) Web UI | password `polarpass`                                         |

## Running CLI Commands with docker exec

The **Terminal** button in Polar opens a shell in the node's container as the node's user, with aliases that add the required flags. When you run the same CLI from your own terminal or scripts, you need to add the container user (`-u`) and those flags yourself.

The examples below use network `1`. Replace the container names with your own (see [Container Names](#container-names)).

### Bitcoin Core

```sh
docker exec -u bitcoin polar-n1-backend1 bitcoin-cli -regtest getblockchaininfo
```

- `-regtest` is required. Without it, `bitcoin-cli` looks for a mainnet node.
- `-u bitcoin` is required. `bitcoin-cli` authenticates with the cookie file in the `bitcoin` user's data directory, so running as another user fails with a cookie/auth error. Alternatively, pass the credentials: `bitcoin-cli -regtest -rpcuser=polaruser -rpcpassword=polarpass getblockchaininfo`.

### LND

```sh
docker exec -u lnd polar-n1-alice lncli --network regtest getinfo
```

### Core Lightning

```sh
docker exec -u clightning polar-n1-bob lightning-cli --network regtest getinfo
```

### Eclair

```sh
docker exec -u eclair polar-n1-carol eclair-cli -p eclairpw getinfo
```

### Taproot Assets

```sh
docker exec -u tap polar-n1-alice-tap tapcli --network regtest assets list
```

### Terminal (litd)

In litd, LND and Taproot Assets run inside the litd process, so `lncli` and `tapcli` connect through port `8443` with litd's TLS cert:

```sh
docker exec -u litd polar-n1-dave litcli --network regtest status
docker exec -u litd polar-n1-dave lncli --network regtest --rpcserver localhost:8443 --tlscertpath /home/litd/.lit/tls.cert getinfo
docker exec -u litd polar-n1-dave tapcli --network regtest --rpcserver localhost:8443 --tlscertpath /home/litd/.lit/tls.cert assets list
```

### From Your Machine Without docker exec

Code on your machine connects through the host port shown on the Connect tab. For example, calling bitcoind's RPC with `curl`:

```sh
curl --user polaruser:polarpass \
  --data-binary '{"jsonrpc":"1.0","id":"polar","method":"getblockchaininfo","params":[]}' \
  -H 'content-type: text/plain;' \
  http://127.0.0.1:18443/
```

Replace `18443` with the RPC port shown on the node's Connect tab.
