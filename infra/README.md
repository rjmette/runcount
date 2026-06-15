# RunCount Infrastructure

AWS CDK stack for the Supabase replacement work in issue #123.

## Stacks

| Stack                     | Resources                                                |
| ------------------------- | -------------------------------------------------------- |
| `RunCount-<env>-Auth`     | Cognito User Pool, Google IdP, hosted domain, web client |
| `RunCount-<env>-Data`     | DynamoDB games table                                     |
| `RunCount-<env>-Api`      | API Gateway HTTP API + Lambda handler                    |
| `RunCount-<env>-Frontend` | S3 + CloudFront static site hosting                      |

## Local Setup

```sh
cd infra
npm install
npm run synth
```

Required CDK context:

```json
{
  "envName": "dev",
  "googleClientId": "your-client-id.apps.googleusercontent.com",
  "googleSecretName": "runcount/dev/google-oauth",
  "callbackUrls": ["http://localhost:5173/auth/callback"],
  "logoutUrls": ["http://localhost:5173/"],
  "webOrigins": ["http://localhost:5173"]
}
```

Create the Google secret out of band:

```sh
aws secretsmanager create-secret \
  --name runcount/dev/google-oauth \
  --secret-string '{"clientSecret":"..."}'
```

Phase 1 intentionally excludes public signup/account recovery and realtime sync.
