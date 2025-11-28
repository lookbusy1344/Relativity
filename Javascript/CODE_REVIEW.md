# Code Review: Special Relativity Calculator

**Review Date:** 2025-11-28
**Project:** TypeScript-based Special Relativity Calculator

---

## Executive Summary

The codebase demonstrates solid architectural design with functional programming patterns, good separation of concerns, and high-precision physics calculations. However, there are several runtime safety concerns that could cause user-facing bugs, particularly around memory management and type safety.

**Priority Distribution:**
- Critical: 1 issue
- High: 3 issues
- Medium: 4 issues

---

## Critical Issues

### 1. Memory Leaks from Event Listeners Not Cleaned Up

**Files:** `src/main.ts:24-351`, `src/urlState.ts:377-415`
**Severity:** CRITICAL

Multiple event listeners are registered but never removed, causing memory leaks if components are recreated or during SPA navigation.

**Problem:**
```typescript
// main.ts
document.addEventListener('DOMContentLoaded', () => {
    getButtonElement('lorentzButton')?.addEventListener('click', ...);
    getInputElement('twinsVelocityInput')?.addEventListener('input', ...);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    // 30+ more listeners
    // NO CLEANUP CODE
});

// urlState.ts
export function setupURLSync(): void {
    const allInputs = document.querySelectorAll('input[type="number"], input[type="range"]');
    allInputs.forEach(input => {
        input.addEventListener('input', ...);   // NEVER REMOVED
        input.addEventListener('change', ...);  // NEVER REMOVED
    });
    // 40+ listeners total
}
```

**Impact:** Cascading event listeners and memory consumption if tabs are dynamically recreated.

**Fix:**
```typescript
// Return cleanup function
export function setupURLSync(): () => void {
    const inputHandler = (e: Event) => { /* ... */ };
    const changeHandler = (e: Event) => { /* ... */ };

    allInputs.forEach(input => {
        input.addEventListener('input', inputHandler);
        input.addEventListener('change', changeHandler);
    });

    // Return cleanup function
    return () => {
        allInputs.forEach(input => {
            input.removeEventListener('input', inputHandler);
            input.removeEventListener('change', changeHandler);
        });
    };
}
```

---

## High Priority Issues

### 2. Race Condition in Chart Registry Updates

**File:** `src/ui/eventHandlers.ts:99-128`
**Severity:** HIGH

Chart updates wrapped in `requestAnimationFrame(() => setTimeout(...))` can cause race conditions if user clicks calculate button rapidly.

**Problem:**
```typescript
export function createAccelHandler(...): () => void {
    return () => {
        if (resultA1) resultA1.textContent = "Working...";

        requestAnimationFrame(() => setTimeout(() => {
            // Heavy calculations
            chartRegistry.current = updateAccelCharts(chartRegistry.current, data);
        }, 0));
    };
}
```

**Scenario:**
1. User clicks calculate twice rapidly
2. First calculation shows "Working...", schedules calculation A
3. Second calculation shows "Working...", schedules calculation B
4. Calculation A completes, updates `chartRegistry.current`
5. Calculation B completes, updates `chartRegistry.current`
6. **Result:** Stale charts from calculation A are destroyed but may still be referenced

**Impact:** Chart corruption, memory leaks from destroyed charts, incorrect displayed data.

**Fix:**
```typescript
let pendingCalculation: number | null = null;

return () => {
    // Cancel pending calculation
    if (pendingCalculation !== null) {
        clearTimeout(pendingCalculation);
    }

    if (resultA1) resultA1.textContent = "Working...";

    pendingCalculation = window.setTimeout(() => {
        // calculations
        chartRegistry.current = updateAccelCharts(chartRegistry.current, data);
        pendingCalculation = null;
    }, 0);
};
```

---

### 3. Type Safety Violations with `as any` Casts

**Files:** `src/main.ts:133,245,331,343`, `src/ui/eventHandlers.ts:260,488`
**Severity:** HIGH

Extensive use of `as any` bypasses TypeScript's type safety.

**Problem:**
```typescript
// main.ts
(twinsMinkowskiState.controller as any).update(data);
(twinsMinkowskiState.controller as any).update(twinsMinkowskiState.lastData);
(simultaneityState.controller as any).reset();
(simultaneityState.controller as any).clearAll();

// eventHandlers.ts
onDiagramDrawn(container, minkowskiData, null as any);
onDiagramDrawn(container, diagramData, null as any);
```

**Root Cause:** Controllers have different types but are stored in the same state object. Type casts mask the incompatibility.

**Impact:** Runtime errors if methods don't exist, no compile-time safety, difficult to refactor.

**Fix:**
```typescript
// Define proper type hierarchy
interface BaseController {
    update(data: any): void;
    destroy(): void;
}

interface TwinsController extends BaseController {
    updateSlider?(velocity: number): void;
}

interface SimultaneityController extends BaseController {
    reset(): void;
    clearAll(): void;
}

// Use discriminated union or specific types
const twinsMinkowskiState: {
    controller: TwinsController | null;
    lastData: any;
};

const simultaneityState: {
    controller: SimultaneityController | null;
};
```

---

### 4. Global Window Pollution for Inter-Component Communication

**Files:** `src/charts/simultaneity.ts:956-961`, `src/urlState.ts:270,357-358`
**Severity:** HIGH

Components communicate via global window object.

**Problem:**
```typescript
// simultaneity.ts
(window as any).getSimultaneityEvents = () => state.events;

if ((window as any).pendingSimultaneityEvents) {
    const pendingEvents = (window as any).pendingSimultaneityEvents;
    delete (window as any).pendingSimultaneityEvents;
}

// urlState.ts
(window as any).pendingSimultaneityEvents = events;

if (typeof (window as any).getSimultaneityEvents === 'function') {
    const events = (window as any).getSimultaneityEvents();
}
```

**Impact:**
- Cannot run multiple instances
- Name collisions with other libraries
- Untestable without mocking window
- Violates encapsulation

**Fix:**
```typescript
// simultaneityState.ts - New module-level state manager
type EventCallback = (events: Event[]) => void;
const listeners = new Set<EventCallback>();

export function subscribeToEvents(callback: EventCallback): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

export function publishEvents(events: Event[]): void {
    listeners.forEach(cb => cb(events));
}

export function getEvents(): Event[] {
    // Return current events
}
```

---

## Medium Priority Issues

### 5. Missing Input Validation Before parseFloat

**File:** `src/ui/eventHandlers.ts:100-102,158-160,218-219`
**Severity:** MEDIUM

User input is converted to numbers without validation.

**Problem:**
```typescript
const accelG = parseFloat(accelInput.value ?? '1');
const secs = rl.ensure(timeInput.value ?? 0).mul(60 * 60 * 24);
const distanceLightYears = parseFloat(distanceInput.value ?? '0');
const velocityC = parseFloat(velocityInput.value ?? '0.8');
```

**Edge Cases:**
- `parseFloat("")` → `NaN`
- `parseFloat("abc")` → `NaN`
- `parseFloat("1.2.3")` → `1.2` (silently truncates)

**Impact:** NaN propagates through Decimal.js calculations, produces invalid results shown to user.

**Fix:**
```typescript
const rawValue = accelInput.value ?? '1';
const accelG = parseFloat(rawValue);

if (isNaN(accelG) || !isFinite(accelG) || accelG < 0.1) {
    setElement(resultA1, "Invalid acceleration", "");
    return;
}
```

---

### 6. Inconsistent Error Handling in Physics Library

**File:** `src/relativity_lib.ts`
**Severity:** MEDIUM

Error handling is inconsistent - some functions throw exceptions, others return `DecimalNaN`.

**Problem:**
```typescript
// Returns NaN (line 92)
export function checkVelocity(velocity: NumberInput): Decimal {
    const v = ensure(velocity);
    if (v.abs().gte(c)) {
        return DecimalNaN;  // Returns special value
    }
    return v;
}

// Throws exception (line 78)
export function check(v: NumberInput, msg: string = "Invalid number"): Decimal {
    const v1 = ensure(v);
    if (v1.isNaN() || !v1.isFinite()) {
        throw new Error(msg);  // Throws
    }
    return v1;
}
```

**Impact:** Callers must know which functions throw vs return NaN. Easy to miss NaN returns, leading to silent failures.

**Fix:** Standardize on throwing for invalid physics inputs:
```typescript
export function checkVelocity(velocity: NumberInput): Decimal {
    const v = ensure(velocity);
    if (v.abs().gte(c)) {
        throw new Error(`Velocity ${v.toFixed(3)}c exceeds speed of light`);
    }
    return v;
}
```

---

### 7. Resize Handler Memory Leak

**File:** `src/main.ts:228-248`
**Severity:** MEDIUM

Resize handler uses `setTimeout` stored in closure but timeout isn't cleared on cleanup.

**Problem:**
```typescript
let resizeTimeout: number | undefined;
const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
        // Resize operations
    }, 700);
};

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);
// NO removeEventListener or clearTimeout on page unload
```

**Impact:** If page navigation occurs while resize timeout is pending, timeout continues to hold references, causing memory leaks.

**Fix:**
```typescript
const cleanup = () => {
    clearTimeout(resizeTimeout);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
};

window.addEventListener('beforeunload', cleanup);
```

---

### 8. Production Console Errors

**File:** `src/urlState.ts:273`
**Severity:** LOW-MEDIUM

Errors are logged to console in production code.

**Problem:**
```typescript
console.error('Failed to parse simultaneity events from URL:', e);
```

**Impact:** Exposes internal errors to users, lacks proper error reporting infrastructure.

**Fix:** Implement proper error reporting:
```typescript
// errorReporting.ts
export function reportError(message: string, error: Error, context?: any): void {
    if (process.env.NODE_ENV === 'production') {
        // Send to error tracking service
    } else {
        console.error(message, error, context);
    }
}
```

---

## Code Quality Improvements (Non-Critical)

### 1. Duplicate Code in Chart Generation

**File:** `src/charts/dataGeneration.ts`

Acceleration and flip-burn functions share ~80% identical code for fuel calculations. Extract to shared function.

**Suggestion:**
```typescript
function calculateFuelMass(
    mass: Decimal,
    velocity: Decimal,
    exhaustVelocity: Decimal
): Decimal {
    // Shared rocket equation calculation
}
```

---

### 2. Magic Numbers

**File:** `src/charts/simultaneity.ts:57`

```typescript
const TRAIN_EXAMPLE_SCALE = 2 * C * 1.3;  // Why 1.3?
```

**Fix:** Add explanatory comment or use named constant:
```typescript
// Scale factor to ensure train fits comfortably in viewport with padding
const VIEWPORT_PADDING_FACTOR = 1.3;
const TRAIN_EXAMPLE_SCALE = 2 * C * VIEWPORT_PADDING_FACTOR;
```

---

### 3. Missing JSDoc Documentation

Many complex physics functions lack documentation explaining the mathematics, units, and assumptions.

**Example - Add documentation:**
```typescript
/**
 * Calculates relativistic time dilation factor (gamma).
 *
 * @param velocity - Velocity as fraction of c (0 to <1)
 * @returns Lorentz factor γ = 1/√(1 - v²/c²)
 * @throws {Error} If velocity >= c (faster than light)
 *
 * @example
 * gammaFactor(0.8) // Returns ~1.667 (time runs 1.667x slower)
 */
export function gammaFactor(velocity: NumberInput): Decimal {
    // ...
}
```

---

## Implementation Priority

**Immediate (this sprint):**
1. Fix event listener memory leaks (#1)
2. Fix race condition in chart updates (#2)

**High Priority (next sprint):**
3. Resolve type safety violations (#3)
4. Remove global window pollution (#4)

**Medium Priority (backlog):**
5. Add input validation (#5)
6. Standardize error handling (#6)
7. Fix resize handler leak (#7)

**Code Quality (ongoing):**
8. Extract duplicate code
9. Document magic numbers
10. Add JSDoc to physics functions

---

## Notes

- The codebase shows excellent architectural patterns: functional programming, separation of concerns, high-precision arithmetic
- Main concerns are runtime safety (memory leaks, race conditions) and type safety
- Most issues are fixable without major refactoring
- Consider implementing lifecycle management for event listeners and chart controllers
