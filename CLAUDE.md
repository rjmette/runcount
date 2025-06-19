# RunCount Project Guidelines

## Live Application

🌐 **Production URL**: https://runcount.rbios.net

## Build/Test Commands

- `npm start` - Run development server
- `npm test` - Run all tests (watch mode)
- `npm test -- --testPathPattern=src/App.test.tsx` - Run single test file
- `npm test -- -t "specific test name"` - Run specific test by name
- `npm run build` - Build for production
- **Deployment**: Automated via GitHub Actions on push to main branch
- **Manual Deploy**: `gh workflow run deploy.yml`

# Workflow

- Prefer running single tests, and not the whole test suite, for performance
- Dont run a dev server, though you can build to validate
- Use todoist and the #todoist project to manage the project todo list
- Save my general development preferences in memory

## Code Style

- **TypeScript**: Strict mode enabled. Use proper typing for all variables, params, returns
- **Components**: React functional components with explicit type annotations (React.FC<PropType>)
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions
- **Imports**: Group imports by external libraries, then local modules, then styles
- **State**: Use useState for local state, context API for shared state
- **Error Handling**: Use try/catch for async operations, provide user-friendly error messages
- **File Structure**: Components in src/components, types in src/types, shared logic in utils
- **CSS**: Use Tailwind classes with semantic class grouping

## Tools & Dependencies

- React 19 with TypeScript
- Tailwind CSS for styling
- Supabase for backend/auth
- Jest and React Testing Library for tests

## Deployment Infrastructure

### AWS Resources

- **S3 Bucket**: `runcountapp` (us-east-1)
- **CloudFront Distribution ID**: `E3FN1GEXG15HYW`
- **Domain**: `runcount.rbios.net` (Route53)
- **SSL Certificate**: ACM cert for runcount.rbios.net
- **Backup S3 URL**: http://runcountapp.s3-website-us-east-1.amazonaws.com

### GitHub Actions Workflow

- **File**: `.github/workflows/deploy.yml`
- **Triggers**: Push to main, manual dispatch
- **Steps**: Test → Build → Deploy to S3 → Invalidate CloudFront
- **Secrets Required**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### Deployment Process

1. **Tests run** with dummy Supabase credentials
2. **Build** creates optimized production bundle
3. **S3 sync** uploads files (excluding index.html)
4. **Cache-busting** deploys index.html with max-age=0
5. **S3 configuration** sets bucket policies and website hosting
6. **CloudFront invalidation** clears CDN cache (`/*` paths)

### Manual Operations

```bash
# Trigger deployment
gh workflow run deploy.yml

# Check CloudFront status
aws cloudfront get-distribution --id E3FN1GEXG15HYW

# List all distributions
aws cloudfront list-distributions --output table

# Create invalidation manually
aws cloudfront create-invalidation --distribution-id E3FN1GEXG15HYW --paths "/*"
```

### URLs

- **Production**: https://runcount.rbios.net
- **CloudFront Direct**: https://d6jbf9ol2zu6i.cloudfront.net
- **S3 Direct**: http://runcountapp.s3-website-us-east-1.amazonaws.com
