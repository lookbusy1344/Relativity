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
- Calibrated to ~200 billion total stars in the galaxy

### UI Layer

- Type-safe DOM element access utilities
- Event handler factory functions for each calculator section

### Charts

- Chart.js for velocity, distance, and time visualization
- D3.js-based Minkowski spacetime diagrams with interactive animations
- Physics data generation from Decimal.js calculations

### Styles

- Modular CSS architecture with separate files for variables, animations, layout, components, and responsive design

## Key Dependencies

- `decimal.js` - High-precision decimal arithmetic for accurate physics calculations
- `chart.js` - Data visualization for velocity, distance, and time charts
- `d3-*` - D3.js modules for interactive Minkowski spacetime diagrams
- `typescript` - Type safety with strict configuration
- `vite` - Build tool and dev server
- `vitest` - Fast unit testing framework with watch mode and UI
- `esbuild` - Fast bundling

## Development Notes

### Testing Requirements

**IMPORTANT**: After making ANY changes to the codebase, always run the test suite to ensure correctness: `yarn test:run`

- All core physics functions have comprehensive unit tests
- Tests verify precision handling, edge cases, and mathematical correctness
- Tests must pass before committing changes or considering work complete

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

### Linting

**IMPORTANT**: Run ESLint to catch type safety issues and enforce coding standards.

- Run `yarn lint` to check for linting errors
- Run `yarn lint --fix` to automatically fix auto-fixable issues
- All linting errors must be resolved before committing changes
- ESLint enforces the `no-explicit-any` rule, aligning with the project's TypeScript coding standards
- ESLint uses caching (`.eslintcache`) to speed up subsequent runs by skipping unchanged files

**Pre-commit checklist**:

1. `yarn test:run` - Verify all tests pass
2. `yarn type-check` - Verify TypeScript compilation succeeds
3. `yarn format:check` - Verify code formatting is consistent
4. `yarn lint` - Verify no linting errors
5. `yarn build` - Verify production build completes

### Precision Handling Policy

To maintain calculation accuracy throughout the application:

- **Input Processing**: All user inputs must be immediately converted to `Decimal`. Never use `parseFloat()` or `Number()` on inputs before Decimal conversion.
  - If the value is known to be a string: use `new Decimal(str)` directly
  - If the value could be various types: use `rl.ensure(value)`
- **Calculations**: All physics calculations must be performed entirely in Decimal.js. String values should be passed directly to Decimal constructors to preserve precision.
- **Display**: Result labels must be converted directly from `Decimal` to strings using `rl.formatSignificant()` or similar formatting functions.
- **Visualization Exception**: Floats are acceptable **only** for Chart.js and D3.js rendering contexts.

**Conversion Rules (No Exceptions):**

| Source Type        | Target Type       | Correct Pattern                        | Wrong Pattern                    |
| ------------------ | ----------------- | -------------------------------------- | -------------------------------- |
| Decimal → number   | For charting/D3   | `decimal.toNumber()`                   | `parseFloat(decimal.toString())` |
| String → Decimal   | For physics       | `new Decimal(str)` or `rl.ensure(str)` | `parseFloat(str)` then Decimal   |
| DOM input → number | For charting only | `parseFloat(input.value)`              | N/A                              |
| Decimal → string   | For display       | `rl.formatSignificant(decimal)`        | `decimal.toString()` then format |

**When `parseFloat()` is Allowed:**

- Reading HTML input element values: `parseFloat(input.value)`
- Reading HTML attributes: `parseFloat(slider.min)`
- Reading dataset values: `parseFloat(el.dataset.value)`

**When `parseFloat()` is Prohibited:**

- Converting Decimal objects: use `.toNumber()` instead
- Processing user input for physics: use `rl.ensure()` instead

**Rationale**: JavaScript's `Number` type uses 64-bit IEEE 754 floats, which lose precision for values requiring more than ~15-17 significant digits. Relativistic calculations often require higher precision, especially for velocities near the speed of light.

### TypeScript Coding Standards

**IMPORTANT**: Never use `as any` type casts in production or test code.

- Type assertions bypass TypeScript's type safety and mask potential errors
- Use proper type guards, type narrowing, or unknown types instead
- If a type seems unavoidable, the underlying design likely needs refactoring
- Exception: Legitimate uses are extremely rare and require explicit justification

**Alternatives to `as any`:**

- Type guards: `if (typeof x === 'string')`
- Type narrowing: `if ('property' in obj)`
- Generic constraints: `<T extends BaseType>`
- Unknown type: `value as unknown as TargetType` (two-step assertion when necessary)
- Proper interface definitions for external libraries
