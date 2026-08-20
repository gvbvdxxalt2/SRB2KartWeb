#!/bin/bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ASSET_DIR="$ROOT_DIR/game-assets"
ASSET_ZIP="$ROOT_DIR/AssetsLinuxOnly.zip"
ASSET_URL="https://github.com/STJr/Kart-Public/releases/download/v1.6/AssetsLinuxOnly.zip"

trap 'rm -f "$ASSET_ZIP"' EXIT

mkdir -p "$ASSET_DIR"
curl --fail --location --show-error --output "$ASSET_ZIP" "$ASSET_URL"
unzip -q -o "$ASSET_ZIP" -d "$ASSET_DIR"
