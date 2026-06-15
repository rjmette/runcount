import * as path from 'node:path';

import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { type UserPool, type UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { type Table } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

export interface ApiStackProps extends StackProps {
  envName: 'dev' | 'prod';
  userPool: UserPool;
  userPoolClient: UserPoolClient;
  gamesTable: Table;
  webOrigins: string[];
}

export class ApiStack extends Stack {
  readonly apiHandlerFn: NodejsFunction;
  readonly httpApi: HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, 'ApiHandlerFnLogs', {
      retention: RetentionDays.ONE_MONTH,
      removalPolicy:
        props.envName === 'dev' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
    });

    this.apiHandlerFn = new NodejsFunction(this, 'ApiHandlerFn', {
      description: 'Authenticated RunCount API routes for games and profile stats.',
      entry: path.join(__dirname, '..', 'lambda', 'api', 'handler.mjs'),
      depsLockFilePath: path.join(__dirname, '..', 'package-lock.json'),
      projectRoot: path.join(__dirname, '..'),
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(10),
      bundling: {
        format: OutputFormat.ESM,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: true,
      },
      environment: {
        GAMES_TABLE: props.gamesTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
      logGroup,
    });

    props.gamesTable.grantReadWriteData(this.apiHandlerFn);

    this.httpApi = new HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowOrigins: props.webOrigins,
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Authorization', 'Content-Type'],
        maxAge: Duration.days(10),
      },
    });

    const authorizer = new HttpUserPoolAuthorizer('UserPoolAuthorizer', props.userPool, {
      userPoolClients: [props.userPoolClient],
    });

    const integration = new HttpLambdaIntegration(
      'ApiHandlerIntegration',
      this.apiHandlerFn,
    );

    const routes: Array<{ path: string; methods: HttpMethod[] }> = [
      { path: '/games', methods: [HttpMethod.GET, HttpMethod.POST] },
      {
        path: '/games/{id}',
        methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      },
      { path: '/users/me', methods: [HttpMethod.GET] },
    ];

    for (const route of routes) {
      this.httpApi.addRoutes({
        path: route.path,
        methods: route.methods,
        integration,
        authorizer,
      });
    }

    new CfnOutput(this, 'ApiUrl', { value: this.httpApi.apiEndpoint });
  }
}
