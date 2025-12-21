# Project Overview

This is a TypeScript-based special relativity calculator with a web interface. The project implements precise relativistic physics calculations using the Decimal.js library for high-precision arithmetic.

## Commands

```bash
# Install dependencies
yarn

# Start development server
yarn dev

# Build for production
yarn build

# Type checking only
yarn type-check

# Lint code
yarn lint

# Format code
yarn format

# Check code formatting
yarn format:check

# Run tests (watch mode)
yarn test

# Run tests with UI
yarn test:ui

# Run tests once (for CI)
yarn test:run

# Update Yarn
yarn set version stable

# Update dependencies interactively
yarn upgrade-interactive
```

## Project Structure

```
src/
├── main.ts                     # Application entry point and initialization
├── relativity_lib.ts           # Core physics calculations (Decimal.js)
├── extra_lib.ts                # Galactic star estimation (Monte Carlo integration)
├── urlState.ts                 # URL parameter management for deep linking
├── ui/
│   ├── domUtils.ts             # DOM element access utilities
│   └── eventHandlers.ts        # Event handler factory functions
├── charts/
│   ├── charts.ts               # Chart.js chart management
│   ├── dataGeneration.ts       # Physics data generation for charts
│   ├── minkowski.ts            # D3-based Minkowski diagram (spacetime)
│   ├── minkowski-twins.ts      # D3-based twin paradox diagram with animation
│   ├── simultaneity.ts         # D3-based simultaneity visualization
│   ├── simultaneityState.ts    # State management for simultaneity events
│   ├── minkowski-core.ts       # Shared D3 utilities
│   ├── minkowski-types.ts      # TypeScript interfaces
│   └── minkowski-colors.ts     # Color palette constants
├── test-utils/
│   └── dom-helpers.ts          # Testing utilities for DOM manipulation
└── styles/
    ├── variables.css           # CSS custom properties for theming
    ├── animations.css          # Keyframe animations
    ├── layout.css              # Base layout and global styles
    ├── header.css              # Header and navigation components
    ├── calculator.css          # Calculator UI components
    └── responsive.css          # Media queries for all breakpoints
```

- `index.html` - Web interface with Bootstrap tabs
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration

## Architecture

### Core Library (`relativity_lib.ts`)

- Exports physics calculation functions using Decimal.js for precision
- Configurable precision (default 150 decimal places)
- Constants: speed of light (c), gravity (g), light year, etc.
- Functions for: Lorentz factors, velocity addition, time dilation, length contraction, relativistic kinematics
- Specialized calculations: flip-and-burn maneuvers, spacetime intervals, four-momentum, twin paradox

### Galactic Library (`extra_lib.ts`)

- Milky Way star estimation using Monte Carlo integration
- Three-component density model: exponential thin disk, Gaussian bulge, power-law halo
- Shell-based integration ensuring monotonicity (larger spheres contain more stars)
- Used for smart mass scale formatting (displays fuel mass in astronomical units)
- Calibrated to produce ~200 billion total stars in the galaxy

### UI Layer (`ui/`)

- `domUtils.ts` - Type-safe DOM element access helpers
- `eventHandlers.ts` - Factory functions creating event handlers for each calculator section

### Charts (`charts/`)

- `charts.ts` - Chart.js chart lifecycle management and configuration
- `dataGeneration.ts` - Converts physics calculations to chart-ready data
- Minkowski spacetime diagrams (D3.js-based):
  - `minkowski.ts` - Standard two-event Minkowski diagram (public API)
  - `minkowski-twins.ts` - Twin paradox diagram with dual reference frames, animation, and play/pause controls
  - `simultaneity.ts` - Interactive simultaneity visualization with event placement, animated timeline, and temporal ordering
  - `simultaneityState.ts` - State management module for simultaneity events (replaces global window pollution)
  - `minkowski-core.ts` - Shared utilities and rendering functions for all diagrams
  - `minkowski-types.ts` - TypeScript interfaces (imported via public APIs)
  - `minkowski-colors.ts` - Color palette constants

### Styles (`styles/`)

- Modular CSS architecture extracted from inline styles (830+ lines refactored)
- `variables.css` - CSS custom properties for theming
- `animations.css` - All keyframe animations for UI elements
- `layout.css` - Base layout and global styles
- `header.css` - Header and navigation component styles
- `calculator.css` - Calculator UI component styles
- `responsive.css` - Mobile-first responsive design with breakpoints for all visualizations

### Testing Utilities (`test-utils/`)

- `dom-helpers.ts` - DOM manipulation utilities for unit tests
- Provides helpers for creating test DOM environments in Vitest

### URL State (`urlState.ts`)

- Bidirectional sync between URL parameters and calculator inputs
- Deep linking support for sharing calculations

## Key Dependencies

- `decimal.js` - High-precision decimal arithmetic for accurate physics calculations
- `chart.js` - Data visualization for velocity, distance, and time charts
- `d3-*` - D3.js modules for interactive Minkowski spacetime diagrams
- `typescript` - Type safety with strict configuration
- `vite` - Build tool and dev server
- `vitest` - Fast unit testing framework with watch mode and UI
- `esbuild` - Fast bundling

## Development Notes

- The project uses ES2015 modules with strict TypeScript configuration
- All physics calculations use Decimal.js to avoid floating-point precision errors
- Input validation ensures velocities don't exceed the speed of light
- Charts use Chart.js; Minkowski diagrams use D3.js for interactivity and smooth animations
- URL state sync enables deep linking for sharing specific calculations (including simultaneity events)
- Modular CSS architecture with clear separation of concerns
- Fully responsive design with mobile-optimized layouts for all visualizations
- The web interface is hosted at: https://lookbusy1344.github.io/Relativity/

### Testing Requirements

**IMPORTANT**: After making ANY changes to the codebase, always run the test suite to ensure correctness: `yarn test:run`

- All core physics functions in `relativity_lib.ts` have comprehensive unit tests
- Tests verify precision handling, edge cases, and mathematical correctness
- Tests must pass before committing changes or considering work complete
- For development with auto-reload: `yarn test`
- Tests are located in `src/relativity_lib.test.ts` and other `*.test.ts` files

**Test Coverage Includes**:

- Lorentz factor calculations
- Rapidity conversions (velocity ↔ rapidity)
- Relativistic velocity addition
- Charged-pion rocket fuel calculations
- Round-trip conversions and precision validation
- Edge cases (zero velocity, velocities near c, negative velocities)

### Build and Type Checking

**IMPORTANT**: Always verify the project builds and type-checks successfully before committing changes.

- Run `yarn type-check` to ensure TypeScript compilation succeeds
- Run `yarn build` to verify the production build completes without errors
- Both commands must pass before considering work complete
- These checks catch issues early and ensure the codebase remains buildable

### Code Formatting

**IMPORTANT**: Maintain consistent code formatting across the codebase using Prettier.

- Run `yarn format:check` to verify all files conform to the formatting rules
- Run `yarn format` to automatically format all source files
- Format checking should be performed alongside type checking and testing before committing changes
- Configuration is in `.prettierrc.json` (tabs, semicolons, 100-char line width)
- Files excluded via `.prettierignore` (node_modules, dist, build artifacts)

**Pre-commit checklist**:

1. `yarn test:run` - Verify all tests pass
2. `yarn type-check` - Verify TypeScript compilation succeeds
3. `yarn format:check` - Verify code formatting is consistent
4. `yarn build` - Verify production build completes

### Troubleshooting

#### Yarn Commands Not Finding Binaries

**Symptom**: `yarn test`, `yarn build`, or other yarn scripts fail with `command not found: vitest` (or `vite`, etc.), even though the packages are installed.

**Cause**: Yarn 4's bin symlinks in `node_modules/.bin/` are out of sync.

**Fix**: Run `yarn install` to re-establish the bin links. This refreshes the symlinks and resolves the issue.

**Workaround**: If you need to run commands immediately, use the full path: `node_modules/.bin/vitest run`

### Precision Handling Policy

To maintain calculation accuracy throughout the application:

- **Input Processing**: All user inputs must be immediately converted to `Decimal`. Never use `parseFloat()` or `Number()` on inputs before Decimal conversion.
  - If the value is known to be a string: use `new Decimal(str)` directly
  - If the value could be various types: use `rl.ensure(value)`
- **Calculations**: All physics calculations must be performed entirely in Decimal.js. String values should be passed directly to Decimal constructors to preserve precision.
- **Display**: Result labels must be converted directly from `Decimal` to strings using `rl.formatSignificant()` or similar formatting functions.
- **Visualization Exception**: Floats via `parseFloat()` or `.toNumber()` are acceptable only for:
  - Chart.js data points (charts/)
  - D3.js visualizations (Minkowski diagrams)
  - Other rendering contexts where approximation is acceptable

**Rationale**: JavaScript's `Number` type uses 64-bit IEEE 754 floats, which lose precision for values requiring more than ~15-17 significant digits. Relativistic calculations often require higher precision, especially for velocities near the speed of light.

## Recent Major Features

### Chart Scaling and Time Mode Controls (Dec 2025)

Enhanced chart functionality for better data visualization:

- X-axis time scale sliders for mass charts (proper time and coordinate time)
- Per-chart time mode toggles (coordinate vs proper time)
- Unified slider styling across all range inputs
- Improved chart scaling for velocity and time dilation charts
- Eliminated spline interpolation artifacts on initial render
- Better proper time visibility through dynamic x-axis scaling

### Mass Scale and Astronomical Features (Dec 2025)

Advanced mass calculations and astronomical context:

- Smart mass unit formatting (Mount Everest, Moon, Supercluster, Observable Universe)
- Milky Way star estimation using Monte Carlo integration
- Three-component galactic density model (disk, bulge, halo)
- Calibrated to ~200 billion total stars in the galaxy
- Dry mass and nozzle efficiency inputs for Constant Acceleration tab

### Relativity of Simultaneity (Nov 2025)

Interactive visualization demonstrating how simultaneity changes between reference frames:

- Click-to-place event system (max 4 events)
- Pre-loaded with Einstein's train thought experiment
- Animated "now" line sweeping through diagram with event flashing
- Real-time temporal and spatial separation displays
- Smooth D3 transitions when changing reference frames
- URL persistence for sharing specific event configurations
- Mobile-responsive with controls repositioned below diagram on small screens

### Twin Paradox Enhancements (Nov 2025)

- Interactive velocity slider embedded in diagram
- Animated worldline with play/pause controls
- Light cones visualization at origin and turnaround
- Reference frame animation showing perspective switches
- Mobile-optimized layout with stacked controls

### CSS Architecture Refactoring (Nov 2025)

Extracted 830+ lines of inline CSS into modular files:

- Improved maintainability through separation of concerns
- Theme variables in dedicated file
- Centralized animation definitions
- Responsive breakpoints consolidated
- Better organization for future styling changes
