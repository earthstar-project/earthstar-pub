#!/bin/sh

curl \
    -H "Content-Type: application/json" \
    http://localhost:3333/keywing/test/keys | jq

