#!/usr/bin/env node
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

const account = app.node.tryGetContext('account') ?? process.env.CDK_DEFAULT_ACCOUNT;
const region =
  app.node.tryGetContext('region') ?? process.env.CDK_DEFAULT_REGION ?? 'us-east-1';
const env = { account, region };

const googleClientId = app.node.tryGetContext('googleClientId');
const googleSecretName =
  app.node.tryGetContext('googleSecretName') ?? `runcount/${envName}/google-oauth`;
const callbackUrls = app.node.tryGetContext('callbackUrls') ?? [
  'http://localhost:5173/auth/callback',
];
const logoutUrls = app.node.tryGetContext('logoutUrls') ?? ['http://localhost:5173/'];
const webOrigins = app.node.tryGetContext('webOrigins') ?? ['http://localhost:5173'];

if (!googleClientId) {
  throw new Error('Missing CDK context: googleClientId');
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
