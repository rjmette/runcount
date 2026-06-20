# RunCount Infrastructure

AWS CDK stack for the Supabase replacement work in issue #123.

## Stacks

| Stack                     | Resources                                                |
| ------------------------- | -------------------------------------------------------- |
| `RunCount-<env>-Auth`     | Cognito User Pool, Google IdP, hosted domain, web client |
| `RunCount-<env>-Data`     | DynamoDB games table                                     |
| `RunCount-<env>-Api`      | API Gateway HTTP API + Lambda handler                    |
| `RunCount-<env>-Frontend` | S3 + CloudFront static site hosting                      |

## Configuration

Per-environment, non-secret config is committed under `config/<env>.json` and
loaded automatically by `bin/infra.ts` based on `-c envName=<env>`:

| Key                  | Committed | Notes                                               |
| -------------------- | --------- | --------------------------------------------------- |
| `googleClientId`     | yes       | OAuth web client id — public (ships in the bundle)  |
| `googleSecretName`   | yes       | Secrets Manager **name** only, not the secret       |
| `callbackUrls`       | yes       | Cognito Hosted UI callback URLs                     |
| `logoutUrls`         | yes       | Cognito Hosted UI logout URLs                       |
| `webOrigins`         | yes       | API CORS allowed origins                            |
| `account`            | **no**    | From the active AWS profile (`CDK_DEFAULT_ACCOUNT`) |
| Google client secret | **no**    | Stored in Secrets Manager (`googleSecretName`)      |

Any value can still be overridden ad hoc with `-c key=value`. The local
`cdk.context.json` is only for CDK's auto-cached lookups — do not put manual
config there (it would shadow `config/<env>.json`).

Create the Google secret out of band (once per env):

```sh
aws secretsmanager create-secret \
  --name runcount/<env>/google-oauth \
  --secret-string '{"clientSecret":"..."}'
```

## Local Setup

```sh
cd infra
npm install
npm run synth:dev
```

## Deploying

Use the wrapper script (defaults `AWS_PROFILE=zeroadmin`):

```sh
scripts/deploy.sh prod                    # all prod stacks
scripts/deploy.sh prod RunCount-prod-Api  # a single stack
scripts/deploy.sh prod --diff             # preview changes, no deploy
```

Or the npm scripts (set `AWS_PROFILE` yourself):

```sh
npm run diff:prod
npm run deploy:prod
```

> The frontend GitHub Actions pipeline (`deploy.yml`) only ships the static
> site to S3/CloudFront. Lambda/API/DynamoDB changes go live **only** via a
> `cdk deploy` as above.

Phase 1 intentionally excludes public signup/account recovery and realtime sync.
