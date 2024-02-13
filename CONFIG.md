# Sample Configuration

The following environment variables are used by the sample.

## Web application settings

### `NODE_ENV`

The node environment.

For local development, use `development`. In this mode, the server will use HTTPS and look for a local [self-signed TLS certificate](./README.md#self-signed-tls-certificate).

The [Dockerfile](./Dockerfile) sets this variable to `production` and uses HTTP instead of HTTPS. Therefore, when running in Docker, TLS must be provided by the infrastructure.

### `PORT`

The HTTP listening port.

For local development, use `443` since TLS will be active. Use another port if 443 is in use.

For production, the [Dockerfile](./Dockerfile) sets this to `8000`.
