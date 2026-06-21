# RunCount - Straight Pool (14.1) Scoring App

A modern, mobile-responsive scoring application for the billiards game Straight Pool (14.1 continuous). Built with React 19, TypeScript, Tailwind CSS, AWS API Gateway/Lambda/DynamoDB persistence, and Cognito authentication.

## Features

- **Complete Rules Implementation**: Accurate implementation of standard Straight Pool (14.1) rules
- **Comprehensive Scoring**: Track players' scores, fouls, penalties, innings, and high runs
- **Rack Management**: Manage consecutive racks (14 balls per rack after the initial rack)
- **Target Score System**: Continuous ball count until the target score is reached
- **User-Friendly Interface**: Intuitive scoring interface with easy undo functionality
- **Detailed Analytics**: Game statistics tracking (innings, high runs, BPI, fouls, safeties, etc.)
- **Game History**: Storage and review of past games via the AWS backend
- **User Accounts**: Secure authentication for saving and accessing personal game history
- **Responsive Design**: Fully optimized for tablets and smartphones with touch-friendly controls

## Live Application

🌐 **RunCount is live at: https://runcount.rbios.net**

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS API and Cognito configuration for cloud history/authentication

### Installation

1. Clone this repository

```bash
git clone https://github.com/rjmette/runcount.git
cd runcount
```

2. Install dependencies

```bash
npm install
```

3. Configure AWS API + Cognito
   - Deploy the backend CDK app in `infra/`, or use an existing deployed environment.
   - Configure Cognito email/password and Google sign-in for the target environment.
   - Create a `.env.local` file in the project root with your AWS frontend config:
     ```
     VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
     VITE_COGNITO_REGION=us-east-1
     VITE_COGNITO_USER_POOL_ID=your_pool_id
     VITE_COGNITO_CLIENT_ID=your_client_id
     VITE_COGNITO_DOMAIN=https://your-domain.auth.us-east-1.amazoncognito.com
     VITE_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
     VITE_COGNITO_LOGOUT_URI=http://localhost:3000/
     ```

4. Start the development server

```bash
npm start
```

## Usage

1. **Game Setup**
   - Enter player names
   - Set target score
   - Click "Start Game"

2. **Game Scoring**
   - Add points for successful shots (1-5 points)
   - Record fouls (-1 point)
   - Track safeties and misses
   - Use undo button for correcting errors

3. **Game Statistics**
   - View detailed game statistics after completion
   - Track high runs, innings, BPI, accuracy, etc.
   - Start new game or view history

4. **Game History**
   - Browse past games
   - View detailed statistics for each game
   - Analyze performance over time

## Development

### Available Scripts

#### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm test`

Launches the test runner in interactive watch mode.\
Run a single test file with `npm test -- --testPathPattern=path/to/test.tsx`

#### `npm run build`

Builds the app for production to the `build` folder.\
Optimizes the build for best performance with minified bundles.

#### `npm run deploy`

Runs the deployment script to publish the app to AWS S3.\
Requires proper AWS credentials and configuration.

#### `npm run lint`

Runs ESLint with the repository rules (naming conventions, import order, React hooks).
CI and the `pre-push` hook block merges if this command fails.

#### `npm run lint:fix`

Applies ESLint auto-fixes where possible. Use this when resolving lint feedback locally.

#### `npm run format`

Formats all supported files (TS/TSX/JS, Markdown, JSON, CSS, HTML) with Prettier.

#### `npm run format:check`

Verifies formatting without writing changes. This is useful inside CI or before committing.

### Code Quality Automation

- **Pre-commit**: Husky runs `lint-staged`, which executes ESLint + Prettier on staged files so only clean code enters the repo.
- **Pre-push**: Husky runs `npm run lint` followed by `npm run test` to catch issues before they reach GitHub.
- **CI**: `.github/workflows/deploy.yml` now runs `npm run lint` before the test suite so pull requests fail fast when style rules break.

## Technology Stack

- **Frontend**:
  - React 19
  - TypeScript 4.9+
  - Tailwind CSS for responsive styling
  - React Context API for state management

- **Backend** (AWS, provisioned via CDK — see [`infra/`](infra/README.md)):
  - Amazon Cognito for authentication (Hosted UI + PKCE, Google IdP)
  - API Gateway (HTTP API) + Lambda for game persistence and stats
  - DynamoDB for storage; ownership derived from the Cognito JWT

- **Deployment**:
  - AWS S3 static website hosting
  - CloudFront CDN for global distribution
  - SSL certificate via AWS Certificate Manager
  - Custom domain: runcount.rbios.net
  - Automated GitHub Actions CI/CD pipeline

## Deployment Architecture

### Infrastructure Overview

- **S3 Bucket**: `runcountapp` (us-east-1)
- **CloudFront Distribution**: `E3FN1GEXG15HYW`
- **Custom Domain**: `runcount.rbios.net`
- **SSL Certificate**: AWS Certificate Manager (ACM)
- **DNS**: Route53 hosted zone for rbios.net

### GitHub Actions CI/CD Pipeline

The application uses automated deployment via GitHub Actions with the following workflow:

1. **Test Phase**:
   - Install dependencies
   - Run test suite with coverage
   - Build production bundle

2. **Deploy Phase** (main branch only):
   - Deploy build files to S3
   - Configure S3 bucket for static website hosting
   - Invalidate CloudFront cache for immediate updates

3. **Notification Phase**:
   - Display deployment summary with URLs and status

### Manual Deployment

You can trigger a **frontend** deployment manually:

```bash
# Via GitHub CLI
gh workflow run deploy.yml

# Or via legacy script (if AWS CLI configured locally)
./scripts/deploy.sh
```

> **Two `deploy.sh` scripts, different jobs:**
>
> - `./scripts/deploy.sh` — **frontend only.** Builds and syncs the static site
>   to S3 + invalidates CloudFront. This is also what `deploy.yml` runs on push.
> - `infra/scripts/deploy.sh` — **backend only.** Runs `cdk deploy` for the
>   Cognito / API Gateway / Lambda / DynamoDB stacks. See below.

### Backend Infrastructure (CDK)

The AWS backend (Cognito, API Gateway, Lambda, DynamoDB) lives in
[`infra/`](infra/README.md) as a CDK app. It is **not** deployed by the GitHub
Actions pipeline — backend changes (e.g. Lambda handler or table updates) go
live only via a manual CDK deploy:

```bash
cd infra
scripts/deploy.sh prod --diff   # preview changes
scripts/deploy.sh prod          # deploy all prod stacks
```

Per-environment, non-secret config is committed under `infra/config/<env>.json`
(no AWS account id, no client secret). Full details — config keys, the deploy
wrapper, and npm scripts — are in [`infra/README.md`](infra/README.md).

### Infrastructure Setup

For setting up your own deployment:

1. **S3 Bucket**:

   ```bash
   aws s3 mb s3://your-bucket-name
   aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
   ```

2. **CloudFront Distribution**:
   - Use provided `scripts/cloudfront-distribution-config.json` as template
   - Update domain names and certificate ARN
   - Create distribution: `aws cloudfront create-distribution --distribution-config file://config.json`

3. **SSL Certificate**:

   ```bash
   aws acm request-certificate --domain-name your-domain.com --validation-method DNS --region us-east-1
   ```

4. **GitHub Secrets**:
   - Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to repository secrets
   - Update `CLOUDFRONT_DISTRIBUTION_ID` in `.github/workflows/deploy.yml`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [AWS](https://aws.amazon.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
