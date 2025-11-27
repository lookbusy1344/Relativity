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

### UI Layer (`ui/`)
- `domUtils.ts` - Type-safe DOM element access helpers
- `eventHandlers.ts` - Factory functions creating event handlers for each calculator section

### Charts (`charts/`)
- `charts.ts` - Chart.js chart lifecycle management and configuration
- `dataGeneration.ts` - Converts physics calculations to chart-ready data
- `minkowski*.ts` - D3.js-based interactive Minkowski spacetime diagrams

### URL State (`urlState.ts`)
- Bidirectional sync between URL parameters and calculator inputs
- Deep linking support for sharing calculations

## Key Dependencies

- `decimal.js` - High-precision decimal arithmetic for accurate physics calculations
- `chart.js` - Data visualization for velocity, distance, and time charts
- `d3-*` - D3.js modules for interactive Minkowski spacetime diagrams
- `typescript` - Type safety with strict configuration
- `vite` - Build tool and dev server
- `esbuild` - Fast bundling

## Development Notes

- The project uses ES2015 modules with strict TypeScript configuration
- All physics calculations use Decimal.js to avoid floating-point precision errors
- Input validation ensures velocities don't exceed the speed of light
- Charts use Chart.js; Minkowski diagrams use D3.js for interactivity
- URL state sync enables deep linking for sharing specific calculations
- The web interface is hosted at: https://lookbusy1344.github.io/Relativity/
