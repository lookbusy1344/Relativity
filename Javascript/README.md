# Special Relativity Calculator

TypeScript-based special relativity calculator with a web interface. Implements precise relativistic physics calculations using high-precision decimal arithmetic.

**Live Demo:** https://lookbusy1344.github.io/Relativity/

## Features

- High-precision calculations using Decimal.js (configurable to 150+ decimal places)
- Lorentz transformations, time dilation, and length contraction
- Relativistic velocity addition and kinematics
- Flip-and-burn spaceship maneuvers with dry mass and nozzle efficiency controls
- Spacetime intervals and four-momentum calculations
- Twin paradox calculations and visualizations with animated Minkowski diagrams
- **Relativity of Simultaneity** - Interactive visualization demonstrating how simultaneity changes between reference frames
  - Click to place/remove events on spacetime diagram (max 4)
  - Pre-loaded with Einstein's train thought experiment
  - Animated timeline with event flashing
  - Time and spatial separation displays
  - Smooth D3 transitions between reference frames
- Interactive Minkowski spacetime diagrams (D3.js) with animations and play/pause controls
- Real-time chart visualizations (Chart.js) with time scale sliders and coordinate/proper time toggles
- Smart mass scale formatting (Mount Everest, Moon, Supercluster, Observable Universe)
- Milky Way star estimation using Monte Carlo integration
- URL state management for sharing calculations via deep links
- Fully responsive mobile interface
- Interactive web interface with real-time results

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

index.html               # Web interface with Bootstrap tabs
vite.config.ts          # Vite build configuration
tsconfig.json           # TypeScript configuration
package.json            # Dependencies and scripts
```

## Architecture

### Core Library (`relativity_lib.ts`)

The physics engine uses Decimal.js for floating-point precision, avoiding standard JavaScript number limitations:

- **Constants:** speed of light (c), gravity (g), light year, parsec
- **Functions:** Lorentz factors, velocity addition, time dilation, length contraction
- **Advanced:** Relativistic kinematics, flip-and-burn maneuvers, spacetime intervals, four-momentum, twin paradox

### Galactic Library (`extra_lib.ts`)

Milky Way star estimation for astronomical mass context:

- **Monte Carlo Integration:** Shell-based sampling ensuring monotonicity
- **Density Model:** Three-component (exponential disk, Gaussian bulge, power-law halo)
- **Calibration:** ~200 billion total stars in galaxy
- **Usage:** Smart mass scale formatting for fuel mass displays

### UI Layer (`ui/`)
- `domUtils.ts` - Type-safe DOM element access helpers
- `eventHandlers.ts` - Factory functions creating event handlers for each calculator section

### Charts (`charts/`)
- `charts.ts` - Chart.js chart lifecycle management and configuration with time scale controls
- `dataGeneration.ts` - Converts physics calculations to chart-ready data
- Minkowski spacetime diagrams (D3.js-based):
  - `minkowski.ts` - Standard two-event Minkowski diagram (public API)
  - `minkowski-twins.ts` - Twin paradox diagram with dual reference frames, animation, and velocity slider
  - `simultaneity.ts` - Interactive simultaneity visualization with event placement
  - `simultaneityState.ts` - State management module for simultaneity events
  - `minkowski-core.ts` - Shared utilities and rendering functions for all diagrams
  - `minkowski-types.ts` - TypeScript interfaces (imported via public APIs)
  - `minkowski-colors.ts` - Color palette constants

### Styles (`styles/`)
- Modular CSS architecture extracted from inline styles
- `variables.css` - Theming constants and custom properties
- `animations.css` - All keyframe animations for UI elements
- `layout.css` - Base layout and global styles
- `header.css` - Header and navigation component styles
- `calculator.css` - Calculator UI component styles
- `responsive.css` - Mobile-first responsive design (768px+ breakpoints)

### Testing Utilities (`test-utils/`)
- `dom-helpers.ts` - DOM manipulation utilities for unit tests
- Provides helpers for creating test DOM environments in Vitest

### URL State (`urlState.ts`)
- Bidirectional sync between URL parameters and calculator inputs
- Deep linking support for sharing calculations (including simultaneity events)

## Installation

```bash
# Install dependencies
yarn

# Update Yarn (if needed)
yarn set version stable
```

## Development

```bash
# Start development server (http://localhost:5173)
yarn dev

# Build for production
yarn build

# Type checking only
yarn type-check

# Lint code
yarn lint

# Run tests (watch mode)
yarn test

# Run tests with UI
yarn test:ui

# Run tests once (for CI)
yarn test:run

# Update dependencies interactively
yarn upgrade-interactive
```

## Debugging in WebStorm

The project includes WebStorm run configurations for debugging TypeScript code with breakpoints.

### Prerequisites

- Chrome browser installed (Edge also works, Safari not supported)
- Source maps enabled (already configured in `vite.config.ts`)

### Setup

1. **Start the dev server:**
   - Select "Dev Server" from run configuration dropdown
   - Click Run (green play button)
   - Wait for server to start on http://localhost:5173

2. **Start debugging:**
   - Select "Debug in Chrome" from run configuration dropdown
   - Click Debug (green bug icon)
   - Chrome will launch automatically

3. **Set breakpoints:**
   - Open TypeScript files in WebStorm (`src/main.ts`, `src/relativity_lib.ts`)
   - Click in the gutter (left of line numbers) to set breakpoints
   - Interact with the app in Chrome
   - Execution will pause at breakpoints, showing variables in WebStorm debugger

### Configuration Files

Run configurations are stored in `.idea/runConfigurations/`:
- `Dev_Server.xml` - Runs the Vite dev server
- `Debug_in_Chrome.xml` - Launches Chrome with remote debugging

## Key Dependencies

- **decimal.js** - High-precision decimal arithmetic for accurate physics calculations
- **chart.js** - Data visualization for velocity, distance, and time charts
- **d3-\*** - D3.js modules for interactive Minkowski spacetime diagrams (d3-selection, d3-transition, d3-ease, d3-timer)
- **seedrandom** - Deterministic random number generation for Monte Carlo star estimation
- **typescript** - Type safety with strict configuration
- **vite** - Build tool and dev server with hot module replacement
- **vitest** - Fast unit testing framework with watch mode and UI
- **esbuild** - Fast bundling

## Technology Stack

- **TypeScript** - ES2015 with strict type checking
- **Vite** - Development server with hot module replacement
- **Decimal.js** - Prevents floating-point precision errors in physics calculations
- **Chart.js** - Data visualization for velocity, distance, and time charts
- **D3.js** - Interactive Minkowski spacetime diagrams with transitions and animations
- **Bootstrap** - Used minimally for tab navigation structure (most styling is custom CSS)
- **Modern ES Modules** - Clean, modular code organization

## Testing

Comprehensive test coverage for physics calculations and UI components:

- **Unit Tests:** Core physics functions in `relativity_lib.ts` and galactic calculations in `extra_lib.ts`
- **Test Framework:** Vitest with watch mode and UI
- **Coverage:** Lorentz factors, velocity addition, rapidity conversions, precision handling, galactic star estimation
- **Run Tests:** `yarn test` (watch mode), `yarn test:ui` (with UI), `yarn test:run` (CI mode)

## Development Notes

- The project uses ES2015 modules with strict TypeScript configuration
- All physics calculations use Decimal.js to avoid floating-point precision errors
- Input validation ensures velocities don't exceed the speed of light
- Charts use Chart.js with time scale sliders and coordinate/proper time toggles
- Minkowski diagrams use D3.js for interactivity, smooth animations, and play/pause controls
- URL state sync enables deep linking for sharing specific calculations (including simultaneity events)
- Modular CSS architecture with separation of concerns (830+ lines extracted from inline styles)
- Fully responsive design with mobile-optimized layouts for all visualizations
- Smart mass scale formatting uses astronomical references for context
- Galactic star estimation calibrated to ~200 billion total stars
- The web interface is hosted at: https://lookbusy1344.github.io/Relativity/

## Recent Updates

### December 2025
- Added x-axis time scale sliders for mass charts (proper time and coordinate time)
- Implemented per-chart time mode toggles (coordinate vs proper time)
- Unified slider styling across all range inputs
- Added smart mass unit formatting (Mount Everest, Moon, Supercluster, Observable Universe)
- Implemented Milky Way star estimation using Monte Carlo integration
- Added dry mass and nozzle efficiency inputs for Constant Acceleration tab
- Improved chart scaling for velocity and time dilation charts
- Eliminated spline interpolation artifacts on initial render

### November 2025
- Implemented Relativity of Simultaneity interactive visualization
- Enhanced Twin Paradox diagram with interactive velocity slider
- Extracted 830+ lines of inline CSS into modular architecture
- Added mobile-responsive layouts for all visualizations
