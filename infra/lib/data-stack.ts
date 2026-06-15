import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
  TableEncryption,
} from 'aws-cdk-lib/aws-dynamodb';
import { type Construct } from 'constructs';

export interface DataStackProps extends StackProps {
  envName: 'dev' | 'prod';
}

export class DataStack extends Stack {
  readonly gamesTable: Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const isDev = props.envName === 'dev';

    this.gamesTable = new Table(this, 'Games', {
      tableName: `runcount-${props.envName}-games`,
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'gameId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: !isDev,
      },
      removalPolicy: isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
    });

    this.gamesTable.addGlobalSecondaryIndex({
      indexName: 'GamesByDate',
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'dateEpoch', type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });
  }
}
