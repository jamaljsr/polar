# DEVCONTAINERS

You can build the images yourself or can pull the images in this directory:

```bash
docker pull polarlightning/dev:headless
docker pull polarlightning/dev:ui
```

To build the images manually, run the following commands from the project root dir:

```bash
cd .devcontainers/
docker image build --tag polardev:headless --file Dockerfile-headless .
docker image build --tag polardev:ui --file Dockerfile-ui .
```

Make sure to use the same image names for the `--tag` flag because the file
`Dockerfile-ui` is based on a image called `polardev:headless`. You can retag
them after building the images:

```
docker image polardev:headless polardev
```

In the last example, we add the tag name `polardev` to reference the same image
as the one tagged by `polardev:headless`.
