#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ENV_FILE="$SCRIPT_DIR/../src/env.ts"

cat > "$ENV_FILE" << EOF
import process from "node:process";

export const PYLEE_OIDC_AUTHORITY = "$PYLEE_OIDC_AUTHORITY";
export const PYLEE_OIDC_CLIENT_ID = "$PYLEE_OIDC_CLIENT_ID";
export const PYLEE_OIDC_REDIRECT_URI = "$PYLEE_OIDC_REDIRECT_URI";
export const PYLEE_OIDC_PORT = "$PYLEE_OIDC_PORT";
export const PYLEE_CONFIGURATION_URL = "$PYLEE_CONFIGURATION_URL";
EOF
