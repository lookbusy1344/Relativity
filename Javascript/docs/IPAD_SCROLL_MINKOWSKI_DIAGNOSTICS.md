# iOS Touch-Scroll D3.js Diagram Glitch

## Executive Summary

Interactive visualizations using D3.js on iOS Safari can exhibit "flickering" or "snapping" behavior during page scrolling due to two compounding issues:

1. **Stale state capture** in event handlers (closure bug)
2. **Spurious resize events** triggered by iOS visual viewport changes during scroll

This document describes the specific bug found in the Twin Paradox Minkowski diagram, the two-part fix applied, and generic patterns for preventing similar issues in web applications with interactive visualizations.

**Fixed in commits:**

Repository https://github.com/lookbusy1344/Relativity

- `4fbb1c6c4af5567a07a69e8b21387ee6a31a6cf1` - Fix stale state in Twins diagram
- `fe977605550863c93cbfacc81cbb6e23332b55e1` - Add width-only resize filtering to all diagrams

## Quick Reference

**Problem**: Interactive visualization flickers/snaps to initial state during iOS scroll

**Root causes**:

1. Closure captures stale state (initialization values)
2. iOS fires `resize` events during scroll (visual viewport height changes)

**Immediate fix**:

```typescript
// 1. Make parameter mutable, reassign in update()
function createVisualization(data) {
	// DON'T extract values early: const value = data.property;

	const resizeHandler = debounce(() => {
		const value = data.property; // ✅ Read at execution time
		render(value);
	}, 150);

	return {
		update(newData) {
			data = newData; // ✅ Reassign closure variable
		},
	};
}

// 2. Filter height-only resize events
let lastInnerWidth = window.innerWidth;
const resizeHandler = debounce(() => {
	if (window.innerWidth === lastInnerWidth) return; // ✅ iOS scroll guard
	lastInnerWidth = window.innerWidth;
	expensiveRender();
}, 150);
```

**Long-term solution**: Use `ResizeObserver` on the container instead of `window.resize`

## Symptom

On iOS Safari (touch scrolling the page), the Twin Paradox Minkowski diagram briefly renders at the _default_ velocity (~0.8c) and then snaps back to the user-selected velocity (e.g. 0.2c).

The visual effect:

- User sets velocity to 0.2c using the slider
- User scrolls the page with touch
- Diagram flashes to 0.8c (initial/default velocity)
- Diagram immediately snaps back to 0.2c

This created a distracting "flickering" effect during scrolling, specific to touch devices (iPads, iPhones).

### How to Recognize This Problem

Your visualization has this bug if **ALL** of these are true:

- ✅ **Flickering only on iOS/mobile Safari** (not desktop browsers during normal use)
- ✅ **Triggered by scrolling the page** (not window resize or orientation change)
- ✅ **Content flashes to initial/default values** (not random values or garbage)
- ✅ **Immediately snaps back to correct state** (< 200ms, not permanent)
- ✅ **You have a `window.resize` handler** that re-renders the visualization
- ✅ **Your component has an `update()` method** that changes rendering parameters

**Differential diagnosis**:

- If flickering occurs on desktop during manual window resize → Missing debounce or different bug
- If values are random/garbage (not initial values) → Data corruption, not stale closure
- If change is permanent (doesn't snap back) → State management bug, not resize issue
- If triggered by user interaction (not scroll) → Event handler bug, not iOS resize issue

## Key Observation: iOS Visual Viewport Behavior

iOS Safari fires `window.resize` events during scroll because the _visual viewport height_ changes as browser chrome (address bar / toolbars) collapses/expands.

This is standard iOS behavior to maximize screen real estate:

- When scrolling down, the URL bar shrinks/hides → visual viewport height increases → `resize` event
- When scrolling up, the URL bar expands/reappears → visual viewport height decreases → `resize` event
- Desktop browsers don't exhibit this behavior; window resizes only occur when the user drags the window border

**Critical distinction**: These are _height-only_ viewport changes. The window width and the actual container dimensions typically remain unchanged, yet the `window.resize` event fires repeatedly during scroll.

## Root Cause: Stale State Capture in Closures

The primary bug was a **JavaScript closure capturing stale state** in the resize handler.

### The Problematic Code Pattern

```typescript
export function drawTwinParadoxMinkowski(
	container: HTMLElement,
	data: TwinParadoxMinkowskiData,
	onVelocityChange?: (velocityC: number) => void
): TwinParadoxController {
	const beta = data.velocityC; // ❌ CAPTURED AT INITIALIZATION (e.g., 0.8c)

	// ... initialization code ...

	const resizeHandler = debounce(() => {
		// ❌ Uses the CAPTURED beta, not current state
		renderTransformedAxes(svg, scales, beta, "green");
		// ...
	}, 150);

	window.addEventListener("resize", resizeHandler);

	return {
		update(newData: TwinParadoxMinkowskiData) {
			// ❌ BUG: data is never reassigned
			const twinsData = newData; // Local variable only

			// The resize handler still sees the OLD data.velocityC
			events = calculateEvents(twinsData);
			// ...
		},
	};
}
```

### What Went Wrong

1. **Initialization**: Function is called with `data = { velocityC: 0.8 }` (default)
   - `const beta = 0.8` is captured in the closure
   - Resize handler is registered with this captured value

2. **User interaction**: User slides velocity to 0.2c
   - `controller.update({ velocityC: 0.2 })` is called
   - Diagram renders correctly at 0.2c
   - **BUT**: The `data` variable is never reassigned, so the resize handler still captures `beta = 0.8`

3. **iOS scroll**: User scrolls the page
   - iOS fires `window.resize` (visual viewport height change)
   - Debounced resize handler executes
   - **Uses stale `beta = 0.8`** to re-render the diagram
   - Diagram briefly shows 0.8c

4. **Animation loop**: The running animation (created during the most recent `update()` at 0.2c) continues
   - Next animation frame repaints the diagram at the correct 0.2c
   - Creates the "snap back" visual effect

### Why This Manifested on iOS Only

- **Desktop browsers**: `window.resize` only fires when the user manually resizes the browser window
  - Rare during normal interaction
  - Stale state bug exists but rarely triggered

- **iOS Safari**: `window.resize` fires during every scroll due to visual viewport changes
  - Fires 10+ times per second during scroll
  - Stale state bug triggered constantly, creating visible flickering

## Solution: Two-Part Fix

We applied two complementary fixes to address both the closure bug and the spurious resize events.

### Part 1: Fix Stale State Capture (Commit `4fbb1c6`)

Make the resize handler read _current_ state instead of captured state by using mutable closure variables.

#### The Fix

```typescript
export function drawTwinParadoxMinkowski(
	container: HTMLElement,
	data: TwinParadoxMinkowskiData, // ✅ Now mutable via reassignment
	onVelocityChange?: (velocityC: number) => void
): TwinParadoxController {
	// ✅ REMOVED: const beta = data.velocityC; (no longer captured at init)

	// ... initialization code ...

	const resizeHandler = debounce(() => {
		const beta = data.velocityC; // ✅ Read current state at execution time
		renderTransformedAxes(svg, scales, beta, "green");
		// ...
	}, 150);

	window.addEventListener("resize", resizeHandler);

	return {
		update(newData: TwinParadoxMinkowskiData) {
			data = newData; // ✅ CRITICAL: Reassign the closure variable
			const twinsData = data;

			// Now the resize handler sees updated data.velocityC
			events = calculateEvents(twinsData);
			// ...
		},
	};
}
```

#### Key Changes

1. **Removed early `const beta` capture**: Don't extract `beta` at initialization time
2. **Added `data = newData` in `update()`**: Reassign the mutable closure variable so all handlers see current state
3. **Read state at handler execution time**: `const beta = data.velocityC` computed inside the resize handler

This ensures the resize handler always uses the current velocity, regardless of when it fires.

### Part 2: Filter Height-Only Resize Events (Commit `fe97760`)

Even with correct state, iOS Safari emits many `resize` events during scroll due to visual viewport changes. These trigger expensive D3 rerenders and can cause animation jank.

#### The Fix

Add width-change detection to all diagram resize handlers:

```typescript
// Applied to: minkowski-twins.ts, minkowski.ts, simultaneity.ts
let lastInnerWidth = window.innerWidth;
const resizeHandler = debounce(() => {
	// ✅ Early-return if only height changed (iOS scroll-resize)
	if (window.innerWidth === lastInnerWidth) return;
	lastInnerWidth = window.innerWidth;

	// Only execute expensive rerender when width actually changed
	const beta = data.velocityC;
	renderTransformedAxes(svg, scales, beta, "green");
	// ...
}, 150);
```

#### Why This Works

- **iOS scroll**: Visual viewport height changes → `window.innerHeight` changes, but `window.innerWidth` stays constant
  - Early-return prevents expensive D3 rerenders
  - Animations continue smoothly

- **Orientation change / desktop resize**: `window.innerWidth` changes
  - Guard passes, rerender executes normally
  - Diagram adapts to new dimensions

#### Where Applied

This guard was added to:

- `src/charts/minkowski-twins.ts` - Twin paradox diagram
- `src/charts/minkowski.ts` - Standard Minkowski diagram
- `src/charts/simultaneity.ts` - Simultaneity visualization
- `src/main.ts` - Global app resize handler (Chart.js charts + diagram updates)

## Generic Patterns and Lessons Learned

This bug demonstrates several common patterns and anti-patterns in JavaScript/TypeScript development.

### Pattern 1: Mutable Closure Variables for Shared State

**Problem**: Event handlers and callbacks need access to current application state, but closures capture values at creation time.

**Anti-pattern**:

```typescript
function createController(data) {
	const value = data.someProperty; // ❌ Captured at initialization

	const handler = () => {
		useValue(value); // Always uses initial value
	};

	return {
		update(newData) {
			const localValue = newData.someProperty; // ❌ Doesn't update closure
		},
	};
}
```

**Correct pattern**:

```typescript
function createController(data) {
	// ✅ Parameter is mutable
	// Don't extract values early - read from 'data' in handlers

	const handler = () => {
		const value = data.someProperty; // ✅ Read current state at execution
		useValue(value);
	};

	return {
		update(newData) {
			data = newData; // ✅ Reassign closure variable
		},
	};
}
```

**Key principle**: For shared state accessed by async callbacks, use mutable closure variables and reassign them in update methods.

### Pattern 2: iOS Visual Viewport Resize Filtering

**Problem**: iOS Safari fires `resize` events during scroll due to browser chrome changes, triggering expensive rerenders unnecessarily.

**Solution**: Filter resize events to width/orientation changes only:

```typescript
let lastInnerWidth = window.innerWidth;
const resizeHandler = debounce(() => {
	// Early-return for height-only changes (iOS scroll)
	if (window.innerWidth === lastInnerWidth) return;
	lastInnerWidth = window.innerWidth;

	// Expensive rerender only when width changed
	expensiveRender();
}, 150);
```

**When to apply**:

- Interactive visualizations (D3.js, Canvas, WebGL)
- Chart libraries (Chart.js, Recharts, etc.)
- Any expensive render operation triggered by `window.resize`

**Trade-off**: This pattern assumes your layout only needs updates when width changes. If you need to respond to height changes (e.g., full-viewport canvas), consider ResizeObserver instead.

### Pattern 3: ResizeObserver for Container-Specific Resizing

**Better alternative to `window.resize`**:

```typescript
const resizeObserver = new ResizeObserver(entries => {
	for (const entry of entries) {
		const { width, height } = entry.contentRect;
		// Rerender only when this specific container resizes
		render(width, height);
	}
});

resizeObserver.observe(containerElement);
```

**Advantages**:

- Only fires when the observed element's dimensions change
- Immune to iOS visual viewport scroll-resize events (if container dimensions don't change)
- More precise than `window.innerWidth` tracking
- Can observe multiple elements with different handlers

**When to use**:

- D3 visualizations in flexible layouts
- Responsive charts/graphs
- Canvas/WebGL renderers
- Any component that needs to adapt to its container size

### Pattern 4: Debouncing and Event Throttling

Both fixes use debouncing, but understanding when to use debounce vs. throttle is important:

**Debounce** (used here):

- Waits for event storm to end, then executes once
- Good for expensive operations triggered by resize/scroll
- Example: 150ms debounce = wait 150ms after last resize before rendering

**Throttle**:

- Executes at most once per time period during event storm
- Good for continuous feedback (e.g., scroll position indicators)
- Example: 100ms throttle = execute at most once every 100ms during scroll

For resize handlers, **debounce is usually correct** because users want the final result, not intermediate renders.

## Diagnostic Workflow

If you suspect this bug in your code, follow this systematic debugging approach:

### Step 1: Confirm iOS-Specific Resize Events

Add logging to your resize handler:

```typescript
const resizeHandler = debounce(() => {
	console.log("RESIZE:", {
		width: window.innerWidth,
		height: window.innerHeight,
		timestamp: Date.now(),
	});
	expensiveRender();
}, 150);
```

**Expected result**: On iOS during scroll, you'll see many resize logs with changing `height` but constant `width`.

### Step 2: Identify Stale State Capture

Search your code for this anti-pattern:

```typescript
// SEARCH FOR: Early extraction of values from closure parameters
function create(data) {
	const value = data.property; // ❌ SUSPECT: Captured at init
	// ...
	const handler = () => {
		doSomething(value); // ❌ Uses captured value
	};
}
```

**Key indicators**:

- `const` variables extracted from function parameters at the top of the function
- Those variables used in event handlers (resize, scroll, etc.)
- `update()` method doesn't reassign the parameter

### Step 3: Verify Current vs. Captured State

Add logging inside your resize handler to check what it sees:

```typescript
function create(data) {
	const capturedValue = data.property; // Stale

	const resizeHandler = debounce(() => {
		console.log("Resize sees:", {
			capturedValue, // Will show initial value
			currentValue: data.property, // Will also show initial (if not reassigned)
		});
	}, 150);

	return {
		update(newData) {
			// If data is NOT reassigned here, both logs above will show stale values
			const local = newData.property;
		},
	};
}
```

**Diagnosis**: If both `capturedValue` and `data.property` show the initial value (not the updated value), you have the stale state bug.

### Step 4: Apply Fixes

Apply both fixes in order:

#### Fix 1: Mutable Closures (Critical)

```diff
  function create(data) {
-   const value = data.property;  // Remove early extraction

    const resizeHandler = debounce(() => {
+     const value = data.property;  // Read at execution time
      render(value);
    }, 150);

    return {
      update(newData) {
+       data = newData;  // Reassign closure variable
-       const local = newData.property;  // Remove local-only variable
      }
    };
  }
```

#### Fix 2: iOS Scroll Guard (Performance)

```diff
+ let lastInnerWidth = window.innerWidth;
  const resizeHandler = debounce(() => {
+   if (window.innerWidth === lastInnerWidth) return;
+   lastInnerWidth = window.innerWidth;

    const value = data.property;
    render(value);
  }, 150);
```

### Step 5: Verify Fix

1. Test on iOS Safari (real device preferred, not simulator)
2. Change visualization parameters using UI controls
3. Scroll the page up and down vigorously
4. Verify no flickering to initial/default values
5. Check console - should see zero resize logs during scroll (after Fix 2)

### Step 6: Consider Long-Term Migration

Once the immediate issue is fixed, consider migrating to `ResizeObserver`:

```typescript
// Replace window.resize with container-specific observer
const resizeObserver = new ResizeObserver(entries => {
	for (const entry of entries) {
		const { width, height } = entry.contentRect;
		render(width, height);
	}
});

resizeObserver.observe(containerElement);

// Cleanup
return {
	destroy() {
		resizeObserver.disconnect();
	},
};
```

## Alternative Strategies

The fixes applied solve the immediate problem, but here are alternative or complementary approaches for similar scenarios.

### Strategy 1: ResizeObserver Instead of window.resize

**Best long-term solution** for container-aware rendering:

```typescript
// Replace window resize listener with container observer
const resizeObserver = new ResizeObserver(entries => {
	for (const entry of entries) {
		if (entry.target === containerElement) {
			render(); // Only when container dimensions change
		}
	}
});

resizeObserver.observe(containerElement);

// Cleanup
return {
	destroy() {
		resizeObserver.disconnect();
	},
};
```

**Benefits**:

- iOS scroll chrome changes won't trigger rerenders (container size unchanged)
- More precise than width-only filtering
- Works correctly in complex responsive layouts
- Supported in all modern browsers (including iOS Safari 13.4+)

### Strategy 2: Visual Viewport API for Fine-Grained Control

For advanced use cases that genuinely need to distinguish visual viewport from layout viewport:

```typescript
if (window.visualViewport) {
	window.visualViewport.addEventListener("resize", event => {
		const layoutViewport = { width: window.innerWidth, height: window.innerHeight };
		const visualViewport = {
			width: window.visualViewport.width,
			height: window.visualViewport.height,
		};

		// Handle differently based on which viewport changed
		if (layoutViewport.width !== lastLayoutWidth) {
			// True window resize or orientation change
			expensiveRerender();
			lastLayoutWidth = layoutViewport.width;
		}
		// Ignore visual-only changes (iOS scroll chrome)
	});
}
```

**When to use**: Rare - only when you need explicit visual viewport tracking (e.g., positioning UI relative to visible area).

### Strategy 3: Scroll-End Detection for Height-Dependent Rendering

If you genuinely need to respond to height changes (e.g., full-viewport visualizations):

```typescript
let scrollEndTimer: number | null = null;

window.addEventListener("scroll", () => {
	// Clear previous timer
	if (scrollEndTimer) clearTimeout(scrollEndTimer);

	// Set new timer - fires only when scrolling stops
	scrollEndTimer = setTimeout(() => {
		// Scroll has ended, safe to do expensive work
		renderWithNewHeight(window.innerHeight);
		scrollEndTimer = null;
	}, 200); // 200ms after last scroll event
});
```

**Trade-off**: Delays rendering until scroll ends. Only use if height-responsive rendering is essential.

### Strategy 4: CSS-Only Responsive Diagrams

For simple cases, pure CSS can eliminate resize handlers entirely:

```css
.diagram-container {
	width: 100%;
	aspect-ratio: 1; /* Maintain square */
	container-type: size; /* CSS Container Queries */
}

.diagram-container svg {
	width: 100%;
	height: 100%;
}
```

Then use `viewBox` on SVG for automatic scaling:

```typescript
const svg = d3
	.select(container)
	.append("svg")
	.attr("viewBox", "0 0 900 900") // Virtual coordinates
	.attr("preserveAspectRatio", "xMidYMid meet");
// No resize handler needed - browser scales automatically
```

**Limitation**: Only works when you don't need to recalculate data based on pixel dimensions (e.g., tick counts, label sizes).

## Summary and Recommendations

### What We Fixed

1. **Closure state bug** (`4fbb1c6`): Made resize handlers read current state by reassigning `data = newData` in update methods
2. **iOS scroll-resize filtering** (`fe97760`): Added width-change detection to prevent expensive rerenders during iOS scrolling

### Impact

- ✅ Eliminated velocity "flashing" during iOS scroll
- ✅ Reduced unnecessary rerenders on iOS devices
- ✅ Maintained correct behavior for desktop resize and orientation changes
- ✅ No changes to public APIs or user-facing functionality

### Best Practices for Interactive Visualizations

**For new code**:

1. Prefer **ResizeObserver** over `window.resize` for container-aware rendering
2. Use **mutable closure variables** for state accessed by async handlers
3. Apply **width-only filtering** as a defensive measure for iOS compatibility
4. Always **debounce** expensive resize/scroll handlers (150-300ms)

**For existing code**:

1. Audit resize handlers for stale state capture (captured `const` variables)
2. Add width-change filtering to expensive `window.resize` handlers
3. Consider migrating to ResizeObserver incrementally

### When to Use Each Pattern

| Scenario                                        | Recommended Approach                        |
| ----------------------------------------------- | ------------------------------------------- |
| D3/Canvas visualization in responsive container | ResizeObserver on container                 |
| Chart library (Chart.js, etc.)                  | Width-filtered window.resize + debounce     |
| Full-viewport interactive graphics              | Visual Viewport API or scroll-end detection |
| Simple SVG diagrams                             | CSS + SVG viewBox (no JS resize handler)    |
| Legacy code with stale state                    | Mutable closures + reassignment in update() |

### Testing Checklist for iOS Resize Issues

When implementing interactive visualizations:

- [ ] Test on iOS Safari (real device, not simulator)
- [ ] Verify no flickering during page scroll
- [ ] Check orientation change handling (portrait ↔ landscape)
- [ ] Verify desktop browser resize works correctly
- [ ] Profile rerender frequency during scroll (should be 0 or near-0)
- [ ] Audit event handlers for captured state vs. current state
- [ ] Consider ResizeObserver as first choice for new code
