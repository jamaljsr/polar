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
