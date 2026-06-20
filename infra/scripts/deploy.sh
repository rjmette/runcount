#!/usr/bin/env bash
#
# Deploy RunCount infrastructure for a given environment using the committed
# per-env config in infra/config/<env>.json (no secrets — see README).
#
# Usage:
#   scripts/deploy.sh <dev|prod> [stack ...]
#
# Examples:
#   scripts/deploy.sh prod                       # deploy all prod stacks
#   scripts/deploy.sh prod RunCount-prod-Api     # deploy just the API stack
#   scripts/deploy.sh prod --diff                # diff prod instead of deploy
#
# AWS_PROFILE defaults to "zeroadmin" if not already set.

set -euo pipefail

ENV="${1:-}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "usage: $0 <dev|prod> [stack ...|--diff]" >&2
  exit 1
fi
shift

export AWS_PROFILE="${AWS_PROFILE:-zeroadmin}"

cd "$(dirname "$0")/.."

# Allow `--diff` as the first extra arg to preview changes without deploying.
ACTION="deploy"
if [[ "${1:-}" == "--diff" ]]; then
  ACTION="diff"
  shift
fi

# Default to every stack for the env if none were named explicitly.
if [[ "$#" -eq 0 ]]; then
  set -- "RunCount-${ENV}-*"
fi

echo "==> cdk ${ACTION} (env=${ENV}, profile=${AWS_PROFILE}): $*"

if [[ "$ACTION" == "diff" ]]; then
  npx cdk diff -c envName="${ENV}" "$@"
else
  npx cdk deploy -c envName="${ENV}" "$@" --require-approval never
fi
