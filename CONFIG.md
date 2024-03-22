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

### `COOKIE_SECRET`

An arbitrary key used to encrypt and decrypt HTTP session cookies.

### `CSRF_SECRET`

An arbitrary key used to encrypt and decrypt CSRF tokens.

> This server's CSRF feature only works when HTTPS is enabled. This is true when the server is running locally with the self-signed certificate or when hosted remotely. If you're not running the server with HTTPS (eg. running locally with Docker, accessing at <http://localhost:8000>), then simply exclude this variable to disable CSRF.

## Data

Some features require access to Google APIs. Perform these steps to obtain a Google Service Account which provides the necessary credentials.

1. Create a Service Account credential in the Google Cloud Console
1. Add a new JSON key to the Service Account, which downloads a `.json` key file

### `GOOGLE_AUTH_CLIENT_EMAIL`

The `client_email` field from the JSON key file.

### `GOOGLE_AUTH_PRIVATE_KEY_BASE64`

A base-64 encoded representation of the `private_key` field from the JSON key file.  
Obtain using the following steps:

1. Make sure you have the [json](https://www.npmjs.com/package/json) CLI tool installed
1. Use the following command to extract the private key from the key file into a base-64 string:

   ```shell
   cat /path/to/google-key-file.json | ./node_modules/json/lib/json.js  private_key | base64
   ```
1. Copy the resulting value into the environment variable

### `GOOGLE_SPREADSHEET_ID`

The [spreadsheet ID](https://developers.google.com/sheets/api/guides/concepts) or Google Drive file ID of a Google Spreadsheet to use as the database. See the [database](./README.md#database) section for more information.
