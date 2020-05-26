#!/bin/sh

curl \
    -H "Content-Type: application/json" \
    --request POST \
    --data @test-items.json \
    http://localhost:3333/keywing/test/items

