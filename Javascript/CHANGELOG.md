# Changelog

All notable changes to the Relativity JavaScript/TypeScript library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Breaking Changes

#### `formatSignificant` behavior change

**Previous behavior:** Numbers in scientific notation (e.g., `1e100`, `1.23e-50`) were returned as-is in scientific notation format.

**New behavior:** All numbers are now formatted in decimal notation with:

- Full decimal expansion (no scientific notation)
- Thousand separators (commas) for readability
- Configurable decimal places with proper rounding
- Trailing zero removal

**Migration guide:**

If your code relied on scientific notation being preserved:

```typescript
// Old behavior (v1.x)
formatSignificant(new Decimal("1e100")); // Returns: "1e100"

// New behavior (v2.x)
formatSignificant(new Decimal("1e100")); // Returns: "10,000,000,000,000,000,000..." (full decimal)
```

To handle this change:

1. If you need scientific notation, use `Decimal.toString()` or `Decimal.toExponential()` instead
2. If you want decimal notation but without thousand separators, you can use `Decimal.toFixed()`
3. If you need to parse the formatted string back to a number, remove commas first:
   ```typescript
   const formatted = formatSignificant(value); // "1,234.56"
   const parsed = new Decimal(formatted.replace(/,/g, "")); // Remove commas before parsing
   ```
4. The new behavior is beneficial for most UI display purposes where readability is important

**Rationale:** This change ensures:

- Consistent formatting across all numeric ranges
- No precision loss for large/small numbers
- Better readability with thousand separators
- Predictable behavior (always decimal format)

### Added

- Comprehensive test suite (47 test cases) for `formatSignificant` function covering:
  - Very large numbers beyond safe integer range
  - Very small numbers near scientific notation boundaries
  - Edge cases: zeros, trailing zeros, boundary conditions
  - Real-world physics constants (speed of light, Planck length)
  - Relativistic velocities extremely close to c
  - `ignoreChar` functionality for selective digit formatting
- Vitest testing framework with test scripts:
  - `yarn test` - Run tests in watch mode
  - `yarn test:ui` - Run tests with UI
  - `yarn test:run` - Run tests once
- Vitest configuration file (`vitest.config.ts`)
- Thousand separators (commas) for integer parts in formatted numbers
- Dynamic precision support based on configured Decimal.js precision

### Changed

- `formatSignificant` now uses `Decimal.toFixed()` for proper rounding instead of string parsing
- `formatSignificant` respects the configured precision from `configure()` function
- Integer parts now formatted with thousand separators for better readability

### Fixed

- Precision preservation when converting very large numbers to strings
- Proper rounding behavior for edge cases (e.g., 999.999 rounds to 1,000)
- Trailing zero handling in decimal parts
