#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
CERT_DIR=${SCRIPT_DIR}/../cert

sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_DIR/dev.crt"
