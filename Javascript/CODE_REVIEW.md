# Code Review: Special Relativity Calculator

**Review Date:** 2025-11-28
**Project:** TypeScript-based Special Relativity Calculator

---

## Executive Summary

The codebase demonstrates solid architectural design with functional programming patterns, good separation of concerns, and high-precision physics calculations. However, there are several runtime safety concerns that could cause user-facing bugs, particularly around memory management and type safety.

**Priority Distribution:**
- Critical: 0 issues (1 resolved)
- High: 2 issues (1 resolved)
- Medium: 2 issues (2 resolved)

---

## Critical Issues

### ~~1. Memory Leaks from Event Listeners Not Cleaned Up~~ ✅ RESOLVED

**Files:** `src/main.ts`, `src/urlState.ts`
**Severity:** CRITICAL
**Status:** ✅ **FIXED** (2025-11-28)

**Resolution:**
- Added event handler tracking array in `main.ts` with custom `addEventListener` wrapper
- All event listeners now stored and properly removed on cleanup
- `setupURLSync()` now returns cleanup function that removes all URL sync listeners
- Added cleanup function triggered on `window.beforeunload` event
- Clears pending timeouts (resize debounce timer)
- Destroys chart controllers on cleanup

**Implementation:**
```typescript
// main.ts - Event handler tracking and cleanup
const eventHandlers: Array<{ element: Element | Window, event: string, handler: EventListener }> = [];
const addEventListener = (element: Element | Window | null, event: string, handler: EventListener) => {
    if (element) {
        element.addEventListener(event, handler as any);
        eventHandlers.push({ element, event, handler: handler as EventListener });
    }
};

// Cleanup function
const cleanup = () => {
    clearTimeout(resizeTimeout);
    eventHandlers.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler as any);
    });
    cleanupURLSync();
    minkowskiState.controller?.destroy?.();
    twinsMinkowskiState.controller?.destroy?.();
    simultaneityState.controller?.destroy?.();
};

addEventListener(window, 'beforeunload', cleanup);

// urlState.ts - Returns cleanup function
export function setupURLSync(): () => void {
    const handlers = new Map<Element, Map<string, EventListener>>();
    // ... register handlers ...
    return () => {
        clearTimeout(debounceTimer);
        handlers.forEach((eventMap, element) => {
            eventMap.forEach((handler, event) => {
                element.removeEventListener(event, handler);
            });
        });
        handlers.clear();
    };
}
```

---

## High Priority Issues

### ~~2. Race Condition in Chart Registry Updates~~ ✅ RESOLVED

**Files:** `src/ui/eventHandlers.ts`
**Severity:** HIGH
**Status:** ✅ **FIXED** (2025-11-28)

**Problem:**
Chart updates wrapped in `requestAnimationFrame(() => setTimeout(...))` caused race conditions when users clicked calculate buttons rapidly, leading to chart corruption and memory leaks.

**Resolution:**
- Added both `pendingRAF` and `pendingCalculation` tracking to all four affected handlers:
  - `createAccelHandler` (lines 82-147)
  - `createFlipBurnHandler` (lines 149-224)
  - `createTwinParadoxHandler` (lines 226-322)
  - `createGraphUpdateHandler` (lines 324-367)
- Each handler cancels both pending RAF and timeout before starting new calculations
- Preserves `requestAnimationFrame()` to ensure "Working..." message is visible before calculation starts
- Eliminates race conditions while maintaining UI responsiveness and user feedback

**Implementation:**
```typescript
export function createAccelHandler(...): () => void {
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

        if (resultA1) resultA1.textContent = "Working...";

        // requestAnimationFrame ensures UI updates before calculation
        pendingRAF = requestAnimationFrame(() => {
            pendingRAF = null;
            pendingCalculation = window.setTimeout(() => {
                // Heavy calculations
                chartRegistry.current = updateAccelCharts(chartRegistry.current, data);
                pendingCalculation = null;
            }, 0);
        });
    };
}
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

### ~~7. Resize Handler Memory Leak~~ ✅ RESOLVED

**File:** `src/main.ts`
**Severity:** MEDIUM
**Status:** ✅ **FIXED** (2025-11-28)

**Resolution:**
Fixed as part of the comprehensive event listener cleanup (#1). The resize handler timeout is now properly cleared in the cleanup function, and the resize event listeners are tracked and removed on page unload.

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

**✅ Completed:**
1. ~~Fix event listener memory leaks (#1)~~ - DONE
2. ~~Fix resize handler leak (#7)~~ - DONE (fixed with #1)
3. ~~Fix race condition in chart updates (#2)~~ - DONE

**Immediate (this sprint):**

**High Priority (next sprint):**
4. Resolve type safety violations (#3)
5. Remove global window pollution (#4)

**Medium Priority (backlog):**
6. Add input validation (#5)
7. Standardize error handling (#6)
8. Remove production console errors (#8)

**Code Quality (ongoing):**
9. Extract duplicate code
10. Document magic numbers
11. Add JSDoc to physics functions

---

## Notes

- The codebase shows excellent architectural patterns: functional programming, separation of concerns, high-precision arithmetic
- Main concerns are runtime safety (memory leaks, race conditions) and type safety
- Most issues are fixable without major refactoring
- Consider implementing lifecycle management for event listeners and chart controllers
