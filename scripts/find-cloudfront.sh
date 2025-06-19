#!/bin/bash

echo "🔍 Searching for CloudFront distributions for RunCount..."
echo "=========================================================="

# Search for distributions with runcountapp as origin
echo "Searching for distributions with runcountapp S3 bucket as origin..."
aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, 'runcountapp')].{Id:Id,DomainName:DomainName,Status:Status,Aliases:Aliases.Items,Origin:Origins.Items[0].DomainName}" \
  --output table

echo ""
echo "📋 If you see any distributions above, note the Id value."
echo "💡 You can also check your existing domain for RunCount:"
echo "   - If you access it via a custom domain (like runcount.yourdomain.com)"
echo "   - Or via a CloudFront URL (like d1234567890123.cloudfront.net)"
echo ""
echo "🔧 To update the deployment workflow:"
echo "   1. Uncomment the CloudFront invalidation step in .github/workflows/deploy.yml"
echo "   2. Replace YOUR_DISTRIBUTION_ID with the actual distribution ID"
echo "   3. Update the notify section to show the CloudFront URL instead of S3 URL"

