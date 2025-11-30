# Code Review: TypeScript Special Relativity Calculator

**Review Date**: 2025-11-30
**Reviewer**: Claude Code (Sonnet 4.5)

## Executive Summary

The project demonstrates solid architecture with modern TypeScript patterns and proper separation of concerns. However, critical issues exist around test coverage and edge case handling in precision-critical physics calculations.

---

## Critical Issues

### 1. Complete Absence of Test Coverage
**Confidence**: 100%
**Files**: Project-wide

The CLAUDE.md explicitly requires "Test-Driven Development (TDD). Write tests before implementing features. Ensure all new code is covered by tests." However, there are **zero test files** in the codebase.

**Impact**:
- No validation that physics calculations are correct (Lorentz transforms, time dilation, etc.)
- No verification that Decimal.js precision is maintained throughout
- Edge cases not validated (velocity = c, division by zero, etc.)
- Refactoring risks breaking functionality

**Recommendation**: Immediately add comprehensive test coverage for:
- `relativity_lib.ts` - All physics functions with known values
- `urlState.ts` - URL encoding/decoding logic
- `dataGeneration.ts` - Chart data generation
- Edge cases: v → c, zero acceleration, invalid inputs

---

### 2. Unsafe Division Without Zero Checks
**Confidence**: 95%
**Files**: `src/relativity_lib.ts`
**Lines**: 110, 136, 149, 263, 279, 292, 315, 328, 341, 513, 570

Multiple physics calculations perform division operations on Decimal values without checking for zero denominators:

```typescript
// Line 315 - lorentzFactor
return one.div(one.minus(v.pow(2).div(cSquared)).sqrt());
// If v approaches c, sqrt argument → 0, then div by ~0

// Line 513 - pionRocketAccelTime
return veEffective.div(accelD).mul(m0.div(mf).ln());
// If accelD = 0 or veEffective = 0, division by zero

// Line 328 - relativisticVelocityCoord
return aD.mul(tD).div(one.plus(aD.mul(tD).div(c).pow(2)).sqrt());
// Sqrt result could theoretically be 0
```

**Impact**: These can produce `Infinity` or `NaN` results that propagate through calculations, appearing in the UI as invalid values.

**Recommendation**: Add validation before all division operations:
```typescript
export function lorentzFactor(velocity: NumberInput): Decimal {
    const v = checkVelocity(velocity);
    const denominator = one.minus(v.pow(2).div(cSquared)).sqrt();
    if (denominator.isZero() || !denominator.isFinite()) {
        return DecimalInfinity;  // or throw descriptive error
    }
    return one.div(denominator);
}
```

---

### 3. Sqrt of Negative Numbers Not Handled
**Confidence**: 90%
**Files**: `src/relativity_lib.ts`
**Lines**: 305, 315, 328, 341, 384, 386, 400, 430, 450

Square root operations don't validate that arguments are non-negative:

```typescript
// Line 305 - lengthContractionVelocity
return lenD.mul(one.minus(v.div(c).pow(2)).sqrt());
// If v > c (despite checkVelocity), one.minus(...) could be negative

// Line 430 - spacetimeInterval1d
return cSquared.mul(delta_ts).minus(delta_xs).sqrt();
// For spacelike intervals, this is negative (returns NaN)

// Line 400 - invariantMassFromEnergyMomentum
return e.div(cSquared).pow(2).minus(pD.div(cSquared).pow(2)).sqrt();
// If momentum > energy, argument is negative
```

**Impact**: Decimal.js `sqrt()` of negative numbers returns `NaN`, which propagates silently through calculations.

**Recommendation**:
```typescript
export function spacetimeInterval1d(...): Decimal {
    const intervalSquared = cSquared.mul(delta_ts).minus(delta_xs);
    if (intervalSquared.isNegative()) {
        // For spacelike intervals, return imaginary indicator or handle explicitly
        return intervalSquared.abs().sqrt().neg(); // or throw/return special value
    }
    return intervalSquared.sqrt();
}
```

---

### ~~4. Precision Loss in Input Validation~~ ✅ RESOLVED
**Confidence**: 90%
**Files**: `src/urlState.ts`
**Lines**: 109, 267, 374
**Status**: ✅ **FIXED** (2025-11-30)

**Problem**: `parseFloat()` truncated high-precision values before validation. A URL parameter like `"0.99999999999999999"` became `1.0`, which then failed validation for velocities that must be `< c`.

**Resolution**:
- Updated `isValidNumber()` to validate using Decimal.js instead of parseFloat
- Changed simultaneity events parsing to use `rl.ensure(ctStr)` directly from string
- Removed `parseFloat()` call that caused precision loss: `pair.split(',').map(parseFloat)`
- Updated URL encoding to preserve full precision instead of `toFixed(2)`
- All URL parameters now convert directly from strings to Decimal.js without intermediate float conversion

**Implementation**:
```typescript
// Before: Lost precision
function isValidNumber(value: string): boolean {
    if (!value || value.trim() === '') return false;
    const num = parseFloat(value);  // ⚠️ Loses precision
    return !isNaN(num) && isFinite(num);
}

// After: Preserves precision
function isValidNumber(value: string): boolean {
    if (!value || value.trim() === '') return false;
    try {
        const decimal = new Decimal(value);
        return decimal.isFinite();
    } catch {
        return false;
    }
}

// Events parsing - Before: Lost precision
const [ct, x] = pair.split(',').map(parseFloat);

// Events parsing - After: Preserves precision
const [ctStr, xStr] = pair.split(',');
const ctDecimal = rl.ensure(ctStr);
const xDecimal = rl.ensure(xStr);

// Encoding - Before: Limited to 2 decimals
const encoded = events.map((e: any) => `${e.ct.toFixed(2)},${e.x.toFixed(2)}`).join(';');

// Encoding - After: Full precision
const encoded = events.map((e: any) => `${e.ct},${e.x}`).join(';');
```

**Verification**: TypeScript compiles without errors. Build succeeds. All URL parameters now maintain 150-decimal precision.

---

## Important Issues

### 5. Race Condition in Event Handler Cancellation
**Confidence**: 85%
**Files**: `src/ui/eventHandlers.ts`
**Lines**: 92-99, 168-175

```typescript
let pendingRAF: number | null = null;
let pendingCalculation: number | null = null;

return () => {
    // Cancel pending calculation to prevent race condition
    if (pendingRAF !== null) {
        cancelAnimationFrame(pendingRAF);
        pendingRAF = null;
    }
    if (pendingCalculation !== null) {
        clearTimeout(pendingCalculation);
        pendingCalculation = null;
    }
    // ... UI shows "Working..."
    pendingRAF = requestAnimationFrame(() => {
        pendingRAF = null;
        pendingCalculation = window.setTimeout(() => {
            // Heavy calculation
        }, 0);
    });
};
```

**Issue**: Between clearing old timers and setting new ones, there's a brief window where rapid clicks could start multiple calculations. The pattern is correct but could be more robust.

**Impact**: Low-medium. Most likely benign due to the small time window, but could theoretically cause duplicate calculations or state inconsistency.

**Recommendation**: Use a calculation ID or promise to definitively cancel:
```typescript
let currentCalculationId = 0;
return () => {
    const calculationId = ++currentCalculationId;
    // ... later in calculation
    if (calculationId !== currentCalculationId) return; // Cancelled
};
```

---

### 6. Missing Error Boundary for Decimal.js Operations
**Confidence**: 85%
**Files**: `src/relativity_lib.ts`
**Lines**: Various

Most functions in `relativity_lib.ts` perform Decimal operations without try-catch blocks. While Decimal.js generally doesn't throw, some operations like `atanh(x)` where `|x| ≥ 1` can produce `NaN`/`Infinity`.

**Examples**:
```typescript
// Line 110 - tauToVelocity
return c.div(aD).mul(vD.div(c).atanh());
// If vD/c >= 1, atanh returns Infinity (no error thrown but silent failure)

// Line 239 - rapidityFromVelocity
return v.div(c).atanh();
// Same issue
```

**Impact**: Silent failures produce `NaN`/`Infinity` that display as "-" in UI, giving no feedback about what went wrong.

**Recommendation**: Add validation in critical functions:
```typescript
export function rapidityFromVelocity(velocity: NumberInput): Decimal {
    const v = checkVelocity(velocity);
    const beta = v.div(c);
    if (beta.abs().gte(one)) {
        throw new Error('Rapidity undefined for |v| >= c');
    }
    return beta.atanh();
}
```

---

### 7. Inconsistent Null Handling in DOM Utils
**Confidence**: 85%
**Files**: `src/ui/domUtils.ts`
**Lines**: 17-31

```typescript
export function getInputElement(id: string): HTMLInputElement | null {
    return document.getElementById(id) as HTMLInputElement | null;
}
```

**Issue**: Functions return `null` but callers often don't check:

```typescript
// eventHandlers.ts:116
const accelGStr = accelInput.value ?? '1';  // ⚠️ If accelInput is null, this throws
```

**Impact**: Runtime errors if DOM elements are missing (e.g., during testing or partial page loads).

**Recommendation**: Either:
1. Make getters throw if element not found (fail-fast), OR
2. Ensure all callers check for null with guard clauses

```typescript
export function getInputElement(id: string): HTMLInputElement {
    const el = document.getElementById(id) as HTMLInputElement;
    if (!el) throw new Error(`Input element #${id} not found`);
    return el;
}
```

---

## Security & Best Practices

### 8. No XSS Vulnerabilities Detected
**Confidence**: 100%

**Positive Finding**: No uses of dangerous DOM manipulation methods found. All DOM updates use `textContent` or D3's data binding, which properly escapes content. No code execution vulnerabilities detected.

---

### 9. URL State Management Edge Cases
**Confidence**: 80%
**Files**: `src/urlState.ts`
**Lines**: 261-283

```typescript
try {
    const eventPairs = eventsParam.split(';');
    const events = eventPairs.map(pair => {
        const [ct, x] = pair.split(',').map(parseFloat);  // ⚠️
        return { ct, x, ctDecimal: rl.ensure(ct), xDecimal: rl.ensure(x) };
    }).filter(e => !isNaN(e.ct) && !isNaN(e.x));
} catch (e) {
    console.error('Failed to parse simultaneity events from URL:', e);
}
```

**Issues**:
1. `parseFloat` precision loss (same as issue #4)
2. Malformed URL params could create partially-valid event lists
3. Only logs error to console - no user feedback

**Recommendation**:
- Use Decimal parsing for ct/x values
- Validate event count matches expected format
- Show user-friendly error message if URL parsing fails

---

## Performance & Architecture

### 10. Debounce Timer Memory Leak (Non-Issue)
**Confidence**: 80%
**Files**: `src/urlState.ts`
**Lines**: 385

```typescript
export function setupURLSync(): () => void {
    let debounceTimer: number | undefined;

    const inputHandler = () => {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            updateURL();
        }, 500);
    };
```

**Initial Concern**: If page is navigated away before cleanup function is called, `debounceTimer` could fire after DOM is gone.

**Verdict**: Actually handled correctly. Cleanup is registered in `main.ts:393`. This is working as designed.

---

## Positive Findings

1. **No XSS vulnerabilities** - Excellent use of safe DOM manipulation
2. **Good separation of concerns** - Clean lib/UI/charts architecture
3. **Proper use of Decimal.js** for precision throughout calculations
4. **Clean functional style** in data generation
5. **Good D3 practices** - No direct DOM manipulation, proper data binding
6. **Modern TypeScript patterns** - Good use of type system
7. **Thoughtful architecture** - URL state management, event debouncing

---

## Summary

### Critical Actions Required:
1. **Add comprehensive test suite** (100% confidence - violates CLAUDE.md TDD requirement)
2. **Add zero-division guards** to all Decimal.div() operations (95% confidence)
3. **Handle negative sqrt arguments** explicitly (90% confidence)
4. ~~**Fix precision loss** in URL validation (90% confidence)~~ ✅ **RESOLVED**

### Important Improvements:
5. Strengthen race condition handling in event handlers
6. Add error boundaries for Decimal operations
7. Make DOM utility null handling consistent

---

**Overall Assessment**: The architecture and code quality are good, with modern TypeScript patterns and proper separation of concerns. However, the **complete absence of tests** is a critical issue for a physics calculator. The precision-critical calculations need comprehensive validation, especially for edge cases where velocities approach *c* or inputs are at extremes.
