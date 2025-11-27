# Special Relativity Calculator

TypeScript-based special relativity calculator with a web interface. Implements precise relativistic physics calculations using high-precision decimal arithmetic.

**Live Demo:** https://lookbusy1344.github.io/Relativity/

## Features

- High-precision calculations using Decimal.js (configurable to 150+ decimal places)
- Lorentz transformations, time dilation, and length contraction
- Relativistic velocity addition and kinematics
- Flip-and-burn spaceship maneuvers
- Spacetime intervals and four-momentum calculations
- Twin paradox calculations and visualizations
- Interactive Minkowski spacetime diagrams (D3.js)
- Real-time chart visualizations (Chart.js) for velocity, distance, and time
- URL state management for sharing calculations via deep links
- Interactive web interface with real-time results

## Project Structure

```
src/
├── main.ts                     # Application entry point and initialization
├── relativity_lib.ts           # Core physics calculations (Decimal.js)
├── urlState.ts                 # URL parameter management for deep linking
├── ui/
│   ├── domUtils.ts             # DOM element access utilities
│   └── eventHandlers.ts        # Event handler factory functions
└── charts/
    ├── charts.ts               # Chart.js chart management
    ├── dataGeneration.ts       # Physics data generation for charts
    ├── minkowski.ts            # D3-based Minkowski diagram (spacetime)
    ├── minkowski-twins.ts      # D3-based twin paradox diagram
    ├── minkowski-core.ts       # Shared D3 utilities
    ├── minkowski-types.ts      # TypeScript interfaces
    └── minkowski-colors.ts     # Color palette constants

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

### UI Layer (`ui/`)
- `domUtils.ts` - Type-safe DOM element access helpers
- `eventHandlers.ts` - Factory functions creating event handlers for each calculator section

### Charts (`charts/`)
- `charts.ts` - Chart.js chart lifecycle management and configuration
- `dataGeneration.ts` - Converts physics calculations to chart-ready data
- Minkowski spacetime diagrams (D3.js-based):
  - `minkowski.ts` - Standard two-event Minkowski diagram (public API)
  - `minkowski-twins.ts` - Twin paradox diagram with dual reference frames
  - `minkowski-core.ts` - Shared utilities and rendering functions for both diagrams
  - `minkowski-types.ts` - TypeScript interfaces (imported via public APIs)
  - `minkowski-colors.ts` - Color palette constants

### URL State (`urlState.ts`)
- Bidirectional sync between URL parameters and calculator inputs
- Deep linking support for sharing calculations

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
- **typescript** - Type safety with strict configuration
- **vite** - Build tool and dev server with hot module replacement
- **esbuild** - Fast bundling

## Technology Stack

- **TypeScript** - ES2015 with strict type checking
- **Vite** - Development server with hot module replacement
- **Decimal.js** - Prevents floating-point precision errors in physics calculations
- **Chart.js** - Data visualization for velocity, distance, and time charts
- **D3.js** - Interactive Minkowski spacetime diagrams with transitions and animations
- **Bootstrap** - Used minimally for tab navigation structure (most styling is custom CSS)
- **Modern ES Modules** - Clean, modular code organization

## Development Notes

- The project uses ES2015 modules with strict TypeScript configuration
- All physics calculations use Decimal.js to avoid floating-point precision errors
- Input validation ensures velocities don't exceed the speed of light
- Charts use Chart.js; Minkowski diagrams use D3.js for interactivity
- URL state sync enables deep linking for sharing specific calculations
- The web interface is hosted at: https://lookbusy1344.github.io/Relativity/
