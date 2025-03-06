# RunCount - Straight Pool (14.1) Scoring App

A mobile-responsive scoring application for the billiards game Straight Pool (14.1 continuous). Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- Accurate implementation of standard Straight Pool (14.1) rules
- Track players' scores, fouls, penalties, and innings
- Manage consecutive racks (14 balls per rack after the initial rack)
- Continuous ball count until the target score is reached
- Intuitive scoring interface with easy undo functionality
- Detailed game statistics tracking (innings, high runs, BPI, fouls, safeties, etc.)
- Game history storage and review via Supabase
- Fully responsive design for tablets and smartphones

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account (for database functionality)

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/runcount.git
cd runcount
```

2. Install dependencies
```bash
npm install
```

3. Configure Supabase
   - Create a new Supabase project
   - Create a `games` table with the following schema:
     - id (uuid, primary key)
     - date (timestamp)
     - players (jsonb)
     - actions (jsonb)
     - completed (boolean)
     - target_score (int)
     - winner_id (int, nullable)
   - Update Supabase configuration in `src/App.tsx`:
     - Replace `supabaseUrl` and `supabaseKey` with your actual project details

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

## Available Scripts

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Technology Stack

- React
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL database)

## License

This project is licensed under the MIT License - see the LICENSE file for details.