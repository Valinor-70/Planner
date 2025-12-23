# Planner - Calm Homework & Life Management

A calm, offline-first homework and life planner built for students who value simplicity, accessibility, and a non-anxious user experience.

## Philosophy

Planner is designed with these core values:

- **Calmness**: No popups, no notifications spam, no anxiety-inducing features
- **Simplicity**: Single page, clear purpose, minimal feature bloat
- **Offline-first**: All data stored locally, works completely offline after first load
- **Accessibility**: Keyboard-first navigation, respects motion preferences
- **Privacy**: No backend, no analytics, no cloud sync, no tracking

## Features

- ✅ Create homework and life tasks
- 📅 Set due dates/times and scheduled dates/times
- 🎯 Automatic urgency grouping (Urgent, Today, Upcoming, Someday)
- ⏰ Built-in Pomodoro timer
- ⌨️ Keyboard shortcuts (N for new task, Ctrl/Cmd+Z for undo)
- 💾 Export/Import data as JSON
- 🔄 Undo stack for mistake recovery
- 📱 Responsive design (max-width 840px for focus)
- 🌙 Works completely offline

## Tech Stack

- **Framework**: Astro
- **UI Islands**: SolidJS
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Storage**: IndexedDB (with localStorage fallback)
- **Date Handling**: date-fns + date-fns-tz
- **Testing**: Vitest (unit) + Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Running Tests

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (requires build first)
npm run build
npm run test:e2e
```

## Data Model

Each task follows this structure:

```typescript
{
  id: string;                    // uuid v4
  title: string;
  type: "homework" | "life";
  subject: string | null;
  notes: string | null;
  createdAt: string;             // ISO-8601
  updatedAt: string;             // ISO-8601
  dueDate: string | null;        // YYYY-MM-DD (local)
  dueTime: string | null;        // HH:mm
  scheduledDate: string | null;  // YYYY-MM-DD (local)
  scheduledTime: string | null;  // HH:mm
  timeZone: string;              // IANA timezone
  estimatedMinutes: number | null;
  priority: "low" | "medium" | "high" | null;
  pomodoroCount: number;
  completed: boolean;
  completedAt: string | null;
  order: number;
}
```

Data is stored in IndexedDB (or localStorage as fallback) with:
- Schema version tracking
- Last modified timestamp
- Migration support

## Keyboard Shortcuts

- `N` or `Ctrl/Cmd+K`: Create new task
- `Ctrl/Cmd+Z`: Undo last action
- `Enter`: Confirm (in forms)
- `Escape`: Close modals

## Task Grouping

Tasks are automatically organized into sections:

1. **🔥 Urgent / Due Soon**: Overdue or due today (homework prioritized)
2. **📅 Today**: Scheduled for today
3. **📆 Upcoming**: Due within the next 7 days
4. **💭 Someday**: Everything else

Within each group, tasks are sorted by urgency considering:
- Time until deadline
- Priority level (high/medium/low)
- Task type (homework vs life)

## Export/Import

- **Export**: Downloads all tasks and metadata as JSON
- **Import**: Restores data from a JSON file (replaces current data)
- Use this for backups or migrating between devices

## Accessibility

- Semantic HTML throughout
- Keyboard navigation support
- Focus indicators on interactive elements
- Respects `prefers-reduced-motion` for animations
- ARIA labels where appropriate

## Project Structure

```
/
├── src/
│   ├── components/       # SolidJS components
│   │   ├── Planner.tsx   # Main app component
│   │   ├── TaskItem.tsx  # Individual task display
│   │   ├── QuickAdd.tsx  # Task creation form
│   │   └── PomodoroTimer.tsx
│   ├── lib/              # Business logic
│   │   ├── storage.ts    # IndexedDB + localStorage
│   │   ├── dateUtils.ts  # Date/timezone utilities
│   │   └── taskStore.ts  # Task state management
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── pages/            # Astro pages
│       └── index.astro
├── tests/
│   ├── unit/             # Vitest unit tests
│   └── e2e/              # Playwright E2E tests
├── public/               # Static assets
└── README.md
```

## Development Guidelines

### Code Quality

- No TypeScript `any` types
- No unused dependencies
- All functions properly typed
- Readable, student-friendly code

### Design Principles

1. **Prefer less over more**: Only add features that solve real problems
2. **Choose calmness over features**: If a decision trades calmness for features, choose calmness
3. **Work incrementally**: Build, test, commit in small steps
4. **Keyboard-first**: Every action should be keyboard accessible
5. **Motion ≤160ms**: Keep transitions fast and respect motion preferences

### Testing

- Unit tests for storage and date utilities
- E2E tests for critical user flows (add, complete, undo, persist)
- Tests should pass before committing

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- IndexedDB (or localStorage)
- CSS Grid/Flexbox
- Custom Properties (CSS variables)

## License

ISC

## Contributing

This is a personal project built for learning. Feel free to fork and adapt for your own use!

## Acknowledgments

Built with calm, for students who value focus over features.
