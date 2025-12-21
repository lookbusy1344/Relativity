# iPad touch-scroll Minkowski glitch (Twins tab)

## Symptom
On iPad Safari (touch scrolling the page), the Twin Paradox Minkowski diagram briefly renders at the *default* velocity (~0.8c) and then snaps back to the user-selected velocity (e.g. 0.2c).

## Key observation
iOS Safari fires `window.resize` events during scroll because the *visual viewport height* changes as browser chrome (address bar / toolbars) collapses/expands.

## Root cause (actual bug)
`drawTwinParadoxMinkowski()` installed a debounced `window.resize` handler that re-rendered the diagram using **stale captured values**:

- `const beta = data.velocityC;` was computed once at initial draw (often 0.8c).
- `data` was never reassigned inside the controller’s `update()` method.

So during scroll-triggered `resize`, the handler would re-render with the initial/default `beta` (0.8c). The running animation loop (created during the *most recent* `update()` at 0.2c) then repainted shortly after, making it “snap back”.

This explains:
- why it only appears on touch devices that emit scroll-resize,
- why it is brief,
- why it tends to flash specifically to the initial/default velocity.

## Fix applied
Make the resize handler read the *current* state, not captured state:

- `update()` now assigns `data = newData` so all closures see the latest velocity.
- The resize handler computes `const beta = data.velocityC` at execution time.

This prevents the velocity flash even if iOS continues to emit resize events during scroll.

## “Out of the box” next steps / alternative strategies
If we still want to reduce iOS scroll jank (even without the flash), a better long-term approach is to avoid reacting to scroll-resize at all:

1. **Replace `window.resize` with `ResizeObserver` on the diagram container**
   - Re-render only when the actual container box changes.
   - iOS scroll chrome changes usually won’t affect container width, so no spurious rerenders.

2. **Filter resize events to width/orientation changes only**
   - Cache `lastInnerWidth` and ignore `resize` events when only height changed.
   - Useful if we only need rerendering for orientation changes.

3. **Defer expensive redraws while scrolling** (if we ever need it)
   - Use a `scroll` listener + timer (e.g. “scroll end” after 150–300ms) to batch redraws.
   - Only makes sense if we truly need to rerender on height-only viewport changes.
