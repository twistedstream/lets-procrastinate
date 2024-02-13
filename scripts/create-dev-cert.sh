#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
CERT_DIR=${SCRIPT_DIR}/../cert

openssl req \
    -newkey rsa:2048 \
    -x509 \
    -nodes \
    -keyout "${CERT_DIR}/dev.key" \
    -new \
    -out "${CERT_DIR}/dev.crt" \
    -reqexts SAN \
    -extensions SAN \
    -config <(cat /System/Library/OpenSSL/openssl.cnf \
        <(printf '
[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = v3_req
distinguished_name = dn
[dn]
C = US
ST = Minnesota
L = St. Paul
O = Example Org
OU = Security Team
emailAddress = info@example.com
CN = letsprocrastinate.dev
[v3_req]
subjectAltName = @alt_names
[SAN]
subjectAltName = @alt_names
[alt_names]
DNS.1 = letsprocrastinate.dev
')) \
    -sha256 \
    -days 3650
