#!/bin/sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
REPOSITORY_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)}"
REQUIRED_NODE_MAJOR=22

cd "$REPOSITORY_ROOT"

install_node() {
  if command -v brew >/dev/null 2>&1; then
    brew install node@22
    eval "$(brew shellenv)"
    export PATH="$(brew --prefix)/opt/node@22/bin:$PATH"
  else
    echo "Node.js is required to build the Capacitor app in Xcode Cloud."
    exit 1
  fi
}

if ! command -v node >/dev/null 2>&1; then
  install_node
else
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    install_node
  fi
fi

echo "Using Node $(node --version)"
echo "Using npm $(npm --version)"

npm ci
VITE_BASE=./ npm run build
npx cap sync ios
