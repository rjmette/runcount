# RunCount Project Guidelines

## Build/Test Commands
- `npm start` - Run development server
- `npm test` - Run all tests (watch mode)
- `npm test -- --testPathPattern=src/App.test.tsx` - Run single test file
- `npm test -- -t "specific test name"` - Run specific test by name
- `npm run build` - Build for production
- `npm run deploy` - Run deployment script (requires AWS credentials)

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