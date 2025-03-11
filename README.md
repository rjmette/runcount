# RunCount - Straight Pool (14.1) Scoring App

A modern, mobile-responsive scoring application for the billiards game Straight Pool (14.1 continuous). Built with React 19, TypeScript, Tailwind CSS, and Supabase for real-time data synchronization and user authentication.

## Features

- **Complete Rules Implementation**: Accurate implementation of standard Straight Pool (14.1) rules
- **Comprehensive Scoring**: Track players' scores, fouls, penalties, innings, and high runs
- **Rack Management**: Manage consecutive racks (14 balls per rack after the initial rack)
- **Target Score System**: Continuous ball count until the target score is reached
- **User-Friendly Interface**: Intuitive scoring interface with easy undo functionality
- **Detailed Analytics**: Game statistics tracking (innings, high runs, BPI, fouls, safeties, etc.)
- **Game History**: Storage and review of past games via Supabase backend
- **User Accounts**: Secure authentication for saving and accessing personal game history
- **Responsive Design**: Fully optimized for tablets and smartphones with touch-friendly controls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database and authentication)

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

3. Configure Supabase
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Create a `games` table with the following schema:
     - id (uuid, primary key)
     - date (timestamp with timezone)
     - players (jsonb)
     - actions (jsonb)
     - completed (boolean)
     - target_score (int)
     - winner_id (int, nullable)
     - owner_id (uuid, references auth.users.id)
   - Enable Row Level Security (RLS) with appropriate policies
   - Set up authentication providers (email, social logins)
   - Create a `.env.local` file in the project root with your Supabase credentials:
     ```
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_KEY=your_supabase_anon_key
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

## Technology Stack

- **Frontend**: 
  - React 19
  - TypeScript 4.9+
  - Tailwind CSS for responsive styling
  - React Context API for state management

- **Backend**: 
  - Supabase for authentication, database, and storage
  - PostgreSQL database with JSON support
  - Row Level Security (RLS) for data protection

- **Deployment**:
  - AWS S3 static website hosting
  - Automated deployment via scripts

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
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)