#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';

import { App } from 'aws-cdk-lib';

import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new App();

const envName = app.node.tryGetContext('envName') ?? 'dev';
if (envName !== 'dev' && envName !== 'prod') {
  throw new Error('envName must be dev or prod');
}

// Per-env config is committed under infra/config/<env>.json (no secrets).
// CLI `-c key=value` still overrides any committed value.
const configPath = path.join(__dirname, '..', 'config', `${envName}.json`);
let fileConfig: Record<string, unknown> = {};
if (fs.existsSync(configPath)) {
  fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
const ctx = <T>(key: string): T | undefined =>
  (app.node.tryGetContext(key) as T | undefined) ?? (fileConfig[key] as T | undefined);

// Account is intentionally NOT committed (public repo); it comes from the
// active AWS credentials / profile at deploy time.
const account = ctx<string>('account') ?? process.env.CDK_DEFAULT_ACCOUNT;
const region = ctx<string>('region') ?? process.env.CDK_DEFAULT_REGION ?? 'us-east-1';
const env = { account, region };

const googleClientId = ctx<string>('googleClientId');
const googleSecretName =
  ctx<string>('googleSecretName') ?? `runcount/${envName}/google-oauth`;
const callbackUrls = ctx<string[]>('callbackUrls') ?? [
  'http://localhost:5173/auth/callback',
];
const logoutUrls = ctx<string[]>('logoutUrls') ?? ['http://localhost:5173/'];
const webOrigins = ctx<string[]>('webOrigins') ?? ['http://localhost:5173'];

if (!googleClientId) {
  throw new Error(`Missing googleClientId for env "${envName}" (config/${envName}.json)`);
}

const data = new DataStack(app, `RunCount-${envName}-Data`, {
  env,
  envName,
});

const auth = new AuthStack(app, `RunCount-${envName}-Auth`, {
  env,
  envName,
  googleClientId,
  googleSecretName,
  callbackUrls,
  logoutUrls,
});

new ApiStack(app, `RunCount-${envName}-Api`, {
  env,
  envName,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
  gamesTable: data.gamesTable,
  webOrigins,
});

new FrontendStack(app, `RunCount-${envName}-Frontend`, {
  env,
  envName,
});
