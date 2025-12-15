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

- `src/main.ts` - Web interface DOM manipulation and event handlers
- `src/relativity_lib.ts` - Core physics calculation library with high-precision Decimal arithmetic
- `index.html` - Web interface
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

## Architecture

### Core Library (`relativity_lib.ts`)

- Exports physics calculation functions using Decimal.js for precision
- Configurable precision (default 150 decimal places)
- Constants: speed of light (c), gravity (g), light year, etc.
- Functions for: Lorentz factors, velocity addition, time dilation, length contraction, relativistic kinematics
- Specialized calculations: flip-and-burn maneuvers, spacetime intervals, four-momentum

### Web Interface (`main.ts`)

- DOM event handlers for calculator inputs
- Calls library functions and displays formatted results
- Handles multiple calculation types: velocity conversions, relativistic motion, velocity addition

## Key Dependencies

- `decimal.js` - High-precision decimal arithmetic for accurate physics calculations
- `typescript` - Type safety
- `vite` - Build tool and dev server
- `esbuild` - Fast bundling

## Development Notes

- The project uses ES2015 modules with strict TypeScript configuration
- All physics calculations use Decimal.js to avoid floating-point precision errors
- Input validation ensures velocities don't exceed the speed of light
- The web interface is hosted at: https://lookbusy1344.github.io/Relativity/
