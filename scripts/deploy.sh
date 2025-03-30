#!/bin/bash

# Determine the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../runcount" && pwd)"  # Adjust if needed

# Set variables
BUCKET_NAME="runcountapp"

# Ensure the script stops on the first error
set -e

echo "🚀 Building React App..."
cd "$PROJECT_ROOT" || { echo "❌ Failed to navigate to project root"; exit 1; }
npm run build || { echo "❌ Build failed"; exit 1; }

echo "📤 Syncing build files to S3 (excluding index.html)..."
aws s3 sync build/ "s3://$BUCKET_NAME" --size-only --exclude "index.html" --profile personal

echo "🔄 Forcing cache refresh for index.html..."
aws s3 cp build/index.html "s3://$BUCKET_NAME/index.html" --metadata-directive REPLACE --cache-control max-age=0 --profile personal

echo "🔓 Setting public access permissions..."
aws s3api put-public-access-block --bucket "$BUCKET_NAME" --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false --profile personal

echo "📜 Applying bucket policy..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "file://$SCRIPT_DIR/bucket-policy.json" --profile personal

echo "🌐 Configuring static website hosting..."
aws s3api put-bucket-website --bucket "$BUCKET_NAME" --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
}' --profile personal

echo "✅ Deployment complete!"
echo "Your app should be available at: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"