# Special Relativity Calculator

TypeScript-based special relativity calculator with a web interface. Implements precise relativistic physics calculations using high-precision decimal arithmetic.

**Live Demo:** https://lookbusy1344.github.io/Relativity/

## Features

- High-precision calculations using Decimal.js (configurable to 150+ decimal places)
- Lorentz transformations, time dilation, and length contraction
- Relativistic velocity addition and kinematics
- Flip-and-burn spaceship maneuvers
- Spacetime intervals and four-momentum calculations
- Interactive web interface with real-time results

## Project Structure

```
src/
├── main.ts              # Web interface and DOM event handlers
├── relativity_lib.ts    # Core physics calculation library
index.html               # Web interface
vite.config.ts          # Vite build configuration
tsconfig.json           # TypeScript configuration
```

### Core Library (`relativity_lib.ts`)

The physics engine uses Decimal.js for floating-point precision, avoiding standard JavaScript number limitations:

- **Constants:** speed of light (c), gravity (g), light year, parsec
- **Functions:** Lorentz factors, velocity addition, time dilation, length contraction
- **Advanced:** Relativistic kinematics, flip-and-burn maneuvers, spacetime intervals

View the library: [relativity_lib.ts](src/relativity_lib.ts)

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
- **typescript** - Type safety and modern JavaScript features
- **vite** - Fast build tool and dev server
- **esbuild** - Fast bundling
- **chart.js** - Data visualization (if used in web interface)

## Technology Stack

- **TypeScript** - ES2015 with strict type checking
- **Vite** - Development server with hot module replacement
- **Decimal.js** - Prevents floating-point precision errors in physics calculations
- **Modern ES Modules** - Clean, modular code organization
