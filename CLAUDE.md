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
- Array of lesson paths (just the file path, no metadata)

**Two Views Architecture**:

1. **File System View** (for developers):
   - Each unit is a self-contained folder in `src/assets/data/`
   - Each lesson is a complete manifest with all metadata (GUID, title, description, sections)
   - `units.ts` is just a lightweight index containing only lesson paths

2. **Runtime View** (for the application):
   - Complete Unit objects with full lesson metadata
   - GUID ↔ Path mappings for navigation
   - Cached lessons for performance

**Data Loader**: `src/lib/dataLoader.ts` transforms the file system view into the runtime view:
- Processes units data at module load time (paths only)
- Lazily loads lesson manifests as they're accessed
- Builds GUID↔Path mappings dynamically when lessons load
- Validates data integrity (duplicate GUIDs, section IDs)
- Caches loaded lessons to prevent redundant fetching

**Lesson Structure**: Each lesson file (e.g., `src/assets/data/00_intro/lessons/00_intro_strings.ts`) exports a complete `Lesson` object containing:
- `guid`: Unique LessonId (must be globally unique across all lessons)
- `title`, `description`: Basic metadata
- `sections`: Array of different section types (see `src/types/data.ts`)

**Section Types**: Defined in `src/types/data.ts`, includes:
- **Information**: Static content display
- **Observation**: View and run code examples
- **Testing**: Write code to pass test cases
- **Prediction**: Predict function outputs before running
- **Coverage**: Write inputs to test code paths
  - Supports **fixed inputs**: Pre-filled, read-only parameter values that guide students to explore specific code paths
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
- `src/hooks/useTurtleTesting.ts`: Handles visual comparison testing for turtle drawings
- `src/lib/turtleComparison.ts`: Pixel-by-pixel image comparison using pixelmatch library

**Visual Turtle Testing**: Testing sections can validate turtle drawings by comparing student output against reference images

**How it works**:
1. **Test Case Setup**: Each test case in a TestingSection can include a `referenceImage` path (e.g., `"images/turtle_square.png"`) pointing to a target drawing
2. **Sequential Execution with Stop-on-Failure**: When "Run Tests" is clicked, tests execute sequentially. The first failing test stops execution (remaining tests don't run)
3. **Progressive UI Updates**: As tests run, the UI updates in real-time:
   - Side-by-side layout shows current test's reference image (left) and live turtle canvas (right)
   - Test label shows "Test X of Y: [description]" to indicate progress
   - Completed tests stack up below as collapsible cards (passing tests collapsed by default)
4. **Smart Display Logic** (see `TurtleTestResults.tsx`):
   - **Before tests**: Shows first test's reference image
   - **During tests**: Updates to show each test's reference as it runs
   - **After tests complete**:
     - If failure: Shows failed test in side-by-side, passed tests in collapsed accordion below
     - If all pass: Shows last test in side-by-side (proof of success), all tests in collapsed accordion below
5. **Visual Comparison**: Uses `pixelmatch` library to compare student's canvas against reference image with configurable threshold (default 95%, can be set via `visualThreshold` property)
6. **Key Implementation Details**:
   - `useTurtleTesting.ts` executes tests sequentially, updating state after each test completion
   - The displayed test is **never** shown in the accordion (no duplication)
   - Final success/failure message only appears when `isRunningTests = false` to prevent premature "Great job!" messages
   - Reference images are resolved relative to unit folder: `/thoughtful-python/data/{unitDir}/{imagePath}`

**Creating Visual Turtle Tests**:
```typescript
{
  kind: "Testing",
  id: "draw-square" as SectionId,
  title: "Draw a Square",
  example: {
    visualization: "turtle",
    initialCode: "import turtle\n\n# Your code here",
  },
  testMode: "procedure",
  functionToTest: "__main__",
  visualThreshold: 0.999, // 99.9% similarity required
  testCases: [
    {
      description: "Square with side length 50",
      input: [],
      expected: null,
      referenceImage: "images/turtle_square_50.png",
    },
    {
      description: "Square with side length 100",
      input: [],
      expected: null,
      referenceImage: "images/turtle_square_100.png",
    },
  ],
}
```

**Important Notes**:
- Reference images should be stored in the unit's `images/` folder
- Use ObservationSection with `allowImageDownload: true` to generate reference images
- Tests stop on first failure - if Test 2 fails, Test 3 never runs
- The accordion only shows completed tests, never the currently displayed test
- Visual threshold of 0.999 is very strict; 0.95-0.98 may be more forgiving for minor rendering differences

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

To add a new lesson to the curriculum:

1. **Create the lesson file** in the appropriate unit directory:
   ```
   src/assets/data/[unit_folder]/lessons/[lesson_name].ts
   ```

2. **Write the lesson manifest** with all metadata:
   ```typescript
   import type { Lesson, LessonId } from "../../../../types/data";

   const lessonData: Lesson = {
     guid: "YOUR-UNIQUE-GUID-HERE" as LessonId, // Generate with uuidgen
     title: "Your Lesson Title",
     description: "Brief description of the lesson",
     sections: [
       // Your sections here
     ],
   };

   export default lessonData;
   ```

3. **Add the lesson path to `units.ts`**:
   ```typescript
   {
     id: "your_unit_id" as UnitId,
     title: "Your Unit",
     // ... other unit metadata
     lessons: [
       { path: "unit_folder/lessons/lesson_name" }, // Just the path!
     ],
   }
   ```

4. **That's it!** The lesson is now part of the curriculum. No need to duplicate metadata in multiple places.

**Important**:
- Each lesson GUID must be globally unique
- Use `uuidgen` (Mac/Linux) or an online UUID generator to create GUIDs
- The lesson path in `units.ts` must match the actual file location (without .ts extension)
- Ensure all section IDs within the lesson are unique

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
