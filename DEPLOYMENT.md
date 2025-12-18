# RunCount Deployment Guide

## Overview

RunCount is deployed using a modern AWS-based infrastructure with automated CI/CD via GitHub Actions.

## Architecture

```
GitHub → GitHub Actions → AWS S3 → CloudFront → runcount.rbios.net
                     ↓
                Route53 DNS
```

## Infrastructure Details

### AWS Resources

- **S3 Bucket**: `runcountapp` (us-east-1)
- **CloudFront Distribution**: `E3FN1GEXG15HYW`
- **Custom Domain**: `runcount.rbios.net`
- **SSL Certificate**: `arn:aws:acm:us-east-1:416792107027:certificate/cf5d5bd2-9146-4ce9-a445-729e37082f06`
- **Route53 Hosted Zone**: `Z041460211TNUBYCOAMFZ` (rbios.net)

### URLs

- **Production**: https://runcount.rbios.net
- **CloudFront Direct**: https://d6jbf9ol2zu6i.cloudfront.net
- **S3 Website**: http://runcountapp.s3-website-us-east-1.amazonaws.com

## Deployment Process

### Automatic Deployment

Every push to `main` branch triggers:

1. **Test Phase** (38s average)
   - Install Node.js dependencies
   - Run test suite with coverage
   - Build production bundle

2. **Deploy Phase** (45s average)
   - Sync build files to S3 (excluding index.html)
   - Deploy index.html with cache-busting headers
   - Configure S3 bucket policies and website hosting
   - Invalidate CloudFront distribution

3. **Notification Phase** (3s average)
   - Display deployment summary with status

### Manual Deployment

```bash
# Trigger deployment manually
gh workflow run deploy.yml

# Check deployment status
gh run list --limit 5

# View specific run details
gh run view [RUN_ID]
```

## Configuration Files

### GitHub Actions Workflow

- **Location**: `.github/workflows/deploy.yml`
- **Environment Variables**:
  - `AWS_REGION`: us-east-1
  - `S3_BUCKET`: runcountapp
  - `CLOUDFRONT_DISTRIBUTION_ID`: E3FN1GEXG15HYW

### Required GitHub Secrets

- `AWS_ACCESS_KEY_ID`: AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for deployment
- `REACT_APP_SUPABASE_KEY`: Supabase anon key for production build
- `REACT_APP_SUPABASE_URL`: Supabase project URL for production build

### CloudFront Configuration

- **Config File**: `scripts/cloudfront-distribution-config.json`
- **Origin**: S3 website endpoint (not S3 bucket directly)
- **Cache Behavior**: Redirect HTTP to HTTPS
- **Error Pages**: 404 → index.html (for SPA routing)
- **Price Class**: PriceClass_100 (US, Canada, Europe)

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with AWS Credentials Error

```
Error: Credentials could not be loaded
```

**Solution**: Verify GitHub repository secrets are set:

- Go to repository Settings → Secrets and variables → Actions
- Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are configured

#### 2. CloudFront Not Updating

**Issue**: Changes deployed but not visible on runcount.rbios.net

**Solutions**:

```bash
# Manual invalidation
aws cloudfront create-invalidation \
  --distribution-id E3FN1GEXG15HYW \
  --paths "/*"

# Check invalidation status
aws cloudfront list-invalidations \
  --distribution-id E3FN1GEXG15HYW \
  --max-items 5
```

#### 3. SSL Certificate Issues

**Issue**: Browser shows certificate warnings

**Check**:

```bash
# Verify certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:416792107027:certificate/cf5d5bd2-9146-4ce9-a445-729e37082f06 \
  --region us-east-1
```

#### 4. DNS Resolution Problems

**Issue**: runcount.rbios.net not resolving

**Check**:

```bash
# Verify Route53 record
aws route53 list-resource-record-sets \
  --hosted-zone-id Z041460211TNUBYCOAMFZ \
  --query "ResourceRecordSets[?Name=='runcount.rbios.net.']"

# Test DNS resolution
nslookup runcount.rbios.net
dig runcount.rbios.net
```

#### 5. Build Failures

**Issue**: Tests or build fail in GitHub Actions

**Common Causes**:

- ESLint errors (warnings treated as errors in CI)
- Missing dependencies
- TypeScript compilation errors
- Test failures

**Solutions**:

```bash
# Run locally to reproduce
npm test -- --watchAll=false
npm run build

# Fix ESLint issues
npm run lint --fix

# Check for unused imports/variables
```

### Monitoring

#### Check CloudFront Status

```bash
aws cloudfront get-distribution \
  --id E3FN1GEXG15HYW \
  --query "Distribution.Status"
```

#### View Recent Deployments

```bash
gh run list --workflow="deploy.yml" --limit 10
```

#### S3 Bucket Status

```bash
aws s3 ls s3://runcountapp
aws s3api get-bucket-website --bucket runcountapp
```

## Security

### S3 Bucket Policy

- Public read access for static files
- Bucket policy allows `s3:GetObject` for all users
- No direct S3 write access from public

### CloudFront Security

- HTTPS redirect enforced
- TLS 1.2+ minimum protocol
- Origin access via S3 website endpoint (not bucket)

### Route53 Configuration

- A record alias pointing to CloudFront
- DNS validation for SSL certificate

## Performance

### CloudFront Caching

- **Default TTL**: 86400 seconds (24 hours)
- **Maximum TTL**: 31536000 seconds (1 year)
- **index.html**: Cache-busting with max-age=0

### Build Optimization

- React production build with minification
- Code splitting enabled
- Asset optimization via Create React App

## Maintenance

### Regular Tasks

1. **Monitor SSL certificate expiration** (auto-renewed by ACM)
2. **Review CloudFront costs** via AWS Cost Explorer
3. **Update dependencies** regularly for security
4. **Monitor deployment success rate** via GitHub Actions

### Backup Strategy

- **Source Code**: Git repository with complete history
- **S3 Versioning**: Consider enabling for additional protection
- **Infrastructure as Code**: All AWS resources documented in scripts

## Contact

For deployment issues, check:

1. GitHub Actions logs
2. AWS CloudWatch logs
3. CloudFront distribution status
4. Route53 health checks

**Infrastructure Owner**: Ryan Mette (rjmette)
