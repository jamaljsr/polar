# RGB LDK node (experimental)

Polar includes an experimental Lightning node implementation: `rgbldk` (runs `rgbldkd` from the `rgb-ldk-node` repo).

## Prerequisite: build the Docker image locally

From the `rgb-ldk-node` workspace:

```bash
cd rgb-ldk-node
docker build -t polarlightning/rgbldk:0.7.0-dev -f docker/rgbldk/Dockerfile .
```

## Use in Polar

- Create a regtest network, add an `RGB LDK` node, then start the network.

## Limitations

- `simln` (simulation) is not supported for `rgbldk` nodes.
- RGB asset UX is not implemented yet; this is currently Lightning control-plane only.
