#!/bin/bash
set -euo pipefail

# The shared runner's distribution identity is stored outside the login keychain.
# Use its existing local credential; never echo it or enable shell tracing.
SIGNING_KEYCHAIN="${IOS_SIGNING_KEYCHAIN_PATH:-$HOME/Library/Keychains/beenbot-signing.keychain-db}"
SIGNING_PASSWORD_FILE="${IOS_SIGNING_PASSWORD_FILE:-$HOME/.config/beenbot/credentials/ios-signing-keychain-password}"

if [ "${1:-unlock}" = 'lock' ]; then
  security lock-keychain "$SIGNING_KEYCHAIN"
  exit 0
fi

if [ ! -r "$SIGNING_KEYCHAIN" ] || [ ! -r "$SIGNING_PASSWORD_FILE" ]; then
  echo '::error::The runner signing keychain or its local password file is unavailable.'
  exit 1
fi

SIGNING_PASSWORD="$(tr -d '\n' < "$SIGNING_PASSWORD_FILE")"
security unlock-keychain -p "$SIGNING_PASSWORD" "$SIGNING_KEYCHAIN"
unset SIGNING_PASSWORD

echo 'Unlocked the existing runner distribution keychain for unattended signing.'
