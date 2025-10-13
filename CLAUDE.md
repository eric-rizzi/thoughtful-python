# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive Python learning platform that runs entirely in the browser using Pyodide. Students work through structured lessons with multiple section types (Information, Observation, Testing, Prediction, Coverage, PRIMM, Reflection, MultipleChoice, etc.) to learn Python programming. The platform supports both anonymous users (local storage) and authenticated users (with server sync).

## Development Commands

### Running the App
```bash
npm run dev          # Start Vite dev server on http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm test             # Run Vitest unit tests in watch mode
npm run coverage     # Generate test coverage report
npm run e2e-test     # Run Playwright e2e tests (requires dev server)
npm run e2e-test:ci  # Run e2e tests excluding @flaky tests
```

### Linting
```bash
npm run lint         # Run ESLint on the codebase
```

## Architecture Overview

### Lesson Data System

**Units and Lessons**: The curriculum is organized into units, each containing multiple lessons. Units are defined in `src/assets/data/units.ts` with metadata including:
- Unit ID, title, description, and image
- Array of lesson references with both GUID (LessonId) and file path (LessonPath)

**Data Loader**: `src/lib/dataLoader.ts` handles all lesson loading:
- Processes units data at module load time
- Maintains maps between lesson GUIDs and file paths
- Uses Vite's `import.meta.glob()` for dynamic lesson imports
- Validates data integrity (duplicate GUIDs, section IDs)
- Caches loaded lessons to prevent redundant fetching

**Lesson Structure**: Each lesson file (e.g., `src/assets/data/00_intro/lessons/00_intro_strings.ts`) exports a `Lesson` object containing:
- `guid`: Unique LessonId that matches units.ts
- `title`, `description`: Basic metadata
- `sections`: Array of different section types (see `src/types/data.ts`)

**Section Types**: Defined in `src/types/data.ts`, includes:
- **Information**: Static content display
- **Observation**: View and run code examples
- **Testing**: Write code to pass test cases
- **Prediction**: Predict function outputs before running
- **Coverage**: Write inputs to test code paths
- **PRIMM**: Predict, Run, Investigate, Modify, Make (AI-evaluated)
- **Reflection**: Free-form coding with AI feedback
- **Debugger**: Step through code execution
- **MultipleChoice/MultipleSelection/Matching**: Quiz questions

### State Management (Zustand)

**progressStore** (`src/stores/progressStore.ts`):
- Tracks section completion per user (nested structure: unitId → lessonId → sectionId → timestamp)
- User-specific localStorage keys (anonymous users vs authenticated)
- Offline queue for sync when back online
- Optimistic updates with server sync for authenticated users

**authStore** (`src/stores/authStore.tsx`):
- Manages Google OAuth authentication
- Handles token refresh and session expiration
- Controls sync state and modal displays

**themeStore** (`src/stores/themeStore.ts`):
- Manages light/dark/system theme preferences

### Pyodide Integration

**PyodideContext** (`src/contexts/PyodideContext.tsx`):
- Loads Pyodide runtime from CDN once at app startup
- Provides `runPythonCode()` and `loadPackages()` to components
- Captures stdout/stderr for display
- Manages loading/initialization states

**Turtle Graphics**: Custom turtle implementation using real-turtle library
- `src/lib/turtleRenderer.ts`: Converts Python turtle commands to JavaScript
- `src/hooks/useTurtleExecution.ts`: Handles turtle code execution with Pyodide

### Component Architecture

**Content Blocks**: Render different content types within sections
- `ContentRenderer.tsx`: Routes to specific block renderers
- `TextBlock.tsx`: Markdown rendering
- `CodeBlock.tsx`: Syntax-highlighted code display
- `ImageBlock.tsx`, `VideoBlock.tsx`: Media display

**Section Components**: Each section type has a dedicated component in `src/components/sections/`
- Use hooks for logic separation (e.g., `useQuizLogic`, `usePredictionLogic`)
- Handle user interactions and progress tracking
- Integrate with Pyodide for code execution

**Layouts**:
- `Layout.tsx`: Base layout with header/footer
- `StudentLayout.tsx`: Wraps student-facing pages, includes welcome modal
- Separate instructor dashboard layout

### Routing

Routes defined in `src/App.tsx`:
- `/`: Homepage with unit list
- `/unit/:unitId`: Individual unit page with lessons
- `/lesson/*`: Lesson page (uses wildcard for lesson path)
- `/learning-entries`: View saved reflections and PRIMM activities
- `/progress`: View completion progress (authenticated only)
- `/configure`: Theme and settings
- `/instructor-dashboard/*`: Instructor review interface

### API Integration

**apiService** (`src/lib/apiService.ts`):
- Handles communication with backend API
- Progress sync (batch updates)
- AI evaluation for PRIMM and Reflection sections
- Uses JWT tokens from authStore

**API Gateway**: Configured via `API_GATEWAY_BASE_URL` in `src/config.ts`

## Testing Strategy

### Unit Tests (Vitest)
- Located in `__tests__` directories alongside source files
- Test utilities in `src/test-utils.tsx` with custom render function
- Setup in `test-setup.ts`
- Coverage excludes: assets, main.tsx, type definitions, mocks, PyodideContext

### E2E Tests (Playwright)
- Organized into `e2e/authenticated/` and `e2e/public/` directories
- Auth setup in `e2e/authenticated/setup/auth.setup.ts`
- Tests for each section type in `e2e/public/student/sections/`
- Navigation flow tests for student and instructor views
- Run against local dev server (auto-started by Playwright config)

## Key Development Notes

### Adding New Lessons
1. Create lesson file in `src/assets/data/[unit]/lessons/[lesson].ts`
2. Add lesson reference to `src/assets/data/units.ts` with unique GUID
3. Ensure GUID in lesson file matches GUID in units.ts
4. Ensure all section IDs within the lesson are unique

### Working with Section Types
- Section kind determines which component renders it
- Required sections (those that must be completed) are defined in `getRequiredSectionsForLesson()` in dataLoader.ts
- Each section has a unique SectionId used for progress tracking

### Progress Tracking
- Section completion triggers `completeSection()` in progressStore
- For authenticated users, syncs to server immediately or queues if offline
- Offline queue processed on reconnection or login
- Local storage keys are user-specific (anonymous users get placeholder ID)

### Pyodide Considerations
- Pyodide loads asynchronously; components must check `isLoading` state
- Code execution is async; use `runPythonCode()` from context
- Some packages may need explicit loading via `loadPackages()`
- Turtle graphics requires special handling with command serialization

### Vite Configuration
- Base path: `/thoughtful-python/` (for GitHub Pages deployment)
- Static copy plugin: Copies lesson data and images to build output
- CORS headers configured for Pyodide
- Vitest config merged into vite.config.ts

### Authentication Flow
1. User signs in with Google OAuth
2. Tokens stored in authStore and localStorage
3. On mount, app attempts to restore session
4. Token refresh handled automatically
5. Session expiration shows modal and logs user out
6. On login, server progress syncs and merges with local progress
