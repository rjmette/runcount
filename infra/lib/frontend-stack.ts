import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import {
  Distribution,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3StaticWebsiteOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BlockPublicAccess, Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';

export interface FrontendStackProps extends StackProps {
  envName: 'dev' | 'prod';
}

export class FrontendStack extends Stack {
  readonly siteBucket: Bucket;
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const isDev = props.envName === 'dev';

    this.siteBucket = new Bucket(this, 'SiteBucket', {
      bucketName: `runcount-${props.envName}-site-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      accessControl: BucketAccessControl.PUBLIC_READ,
      removalPolicy: isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      autoDeleteObjects: isDev,
    });

    this.distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3StaticWebsiteOrigin(this.siteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_100,
    });

    new CfnOutput(this, 'SiteBucketName', { value: this.siteBucket.bucketName });
    new CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
    });
  }
}
