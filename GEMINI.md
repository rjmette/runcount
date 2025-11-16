# Project Overview: runcount

`runcount` is a web application built with React and TypeScript, designed to help users track and manage game scores and statistics. It provides features for game setup, real-time scoring, game history, and performance metrics.

## Key Technologies

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS, PostCSS
*   **Build Tool:** Vite
*   **Package Manager:** npm
*   **Testing:** React Testing Library, Jest (implied by `App.test.tsx`, `setupTests.ts`)

## Project Structure

*   `/src`: Contains the main application source code.
    *   `/src/components`: Reusable UI components, organized by feature (e.g., `auth`, `GameHistory`, `GameScoring`, `GameStatistics`).
    *   `/src/context`: React Context API for global state management (e.g., `AuthContext`, `GamePersistContext`).
    *   `/src/types`: TypeScript type definitions (e.g., `game.ts`).
    *   `/src/utils`: Utility functions (e.g., `copyToClipboard.ts`).
*   `/public`: Static assets (e.g., `favicon.ico`, `manifest.json`).
*   `/scripts`: Deployment and utility scripts.
*   `/assets`: Application assets (e.g., `logo.ico`).
*   `/build`: Output directory for production builds.

## Common Commands

*   **Install Dependencies:** `npm install`
*   **Start Development Server:** `npm run dev`
*   **Build for Production:** `npm run build`
*   **Run Tests:** `npm test` (or `npm run test` if configured)
*   **Linting/Type Checking:** (Check `package.json` for specific scripts, e.g., `npm run lint`, `npm run typecheck`)

## Important Notes for Gemini

*   **Styling Convention:** The project uses Tailwind CSS. When adding new components or modifying existing ones, prefer Tailwind utility classes for styling.
*   **TypeScript First:** All new code should be written in TypeScript, adhering to existing type definitions and adding new ones as necessary.
*   **Testing:**
    *   Existing tests are located in `.test.tsx` files alongside their respective components or in the root `src` directory.
    *   There are known `TODO`s in `src/App.test.tsx` and `src/components/PlayerScoreCard.test.tsx` that need attention.
    *   Prioritize adding unit tests for new features and bug fixes.
*   **Code Quality:** Maintain consistency with existing code style, naming conventions, and architectural patterns.
*   **Improvements & Features:** A comprehensive list of potential improvements and feature enhancements has been identified. Refer to the chat history for details on:
    *   Test-Related Improvements (fixing existing tests, expanding coverage).
    *   Feature Enhancements (Authentication, Game History, Game Scoring, Game Statistics, General UX/UI).
    *   Code Quality & Best Practices (Styling, Asset Management, State Management, Type Safety, Accessibility, Error Handling, Performance).
    *   DevOps & Deployment (CI/CD integration).
