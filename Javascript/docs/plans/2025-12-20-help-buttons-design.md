# Help Button Feature Design

**Date:** 2025-12-20
**Feature:** Context-sensitive help buttons for calculator tabs

## Overview

Add help buttons next to each calculator tab title that open Bootstrap modals containing educational explanations (~half page) about the physics concepts and practical applications.

## Scope

Add help buttons to 5 tabs:
1. Constant Acceleration (motion tab)
2. Flip-and-Burn (travel tab) - emphasize The Expanse TV show reference
3. Twin Paradox (twins tab)
4. Simultaneity (simultaneity tab)
5. Spacetime Interval (spacetime tab)

The "Calc" tab already has explanations and does not need a help button.

## UI Implementation

### Button Placement

Help buttons will be positioned in the `.calc-label` div, immediately after the title text and before any "Learn more" links:

```html
<div class="calc-label">
    Constant Acceleration
    <button class="help-btn" data-help-target="const-accel-help">?</button>
    <a href="..." class="notebook-link">Learn more</a>
</div>
```

### Button Styling

The `.help-btn` class will provide:
- Small circular button (~24px diameter)
- Cyan border (`var(--electric-cyan)`) with transparent background
- "?" character in cyan, using IBM Plex Mono font
- Hover state: fills with cyan, text turns black, adds glow effect
- Positioned with `margin-left: auto` to align right before "Learn more" link
- Smooth transition effects matching existing UI patterns
- Cursor pointer

### Data Attributes

Each button uses `data-help-target` attribute to identify which modal to open, enabling clean JavaScript mapping.

## Modal Structure

### Bootstrap Modal Template

Each tab gets its own Bootstrap 5 modal:

```html
<div class="modal fade" id="const-accel-help" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content help-modal">
      <div class="modal-header">
        <h5 class="modal-title">Constant Acceleration</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        [Help content here]
      </div>
    </div>
  </div>
</div>
```

### Modal Styling

Custom `.help-modal` class provides theme-consistent styling:
- Dark background (similar to `var(--panel-gray)`)
- Cyan border and glow effects matching existing UI
- Modal header: dark background with cyan accent border-bottom
- Title in Orbitron font, uppercase, cyan color
- Body text in IBM Plex Mono for consistency
- Close button styled with cyan colors
- Backdrop with slight cyan tint
- Uses `modal-lg` for comfortable reading

### Modal Placement

All modals placed at the end of HTML, just before closing `</body>` tag, keeping them separate from tab content structure.

## Content Structure

Each modal contains approximately half a page of text following this template:

1. **What is it?** (2-3 sentences)
   - Brief explanation of the physics concept

2. **How it works** (1 paragraph)
   - Key physics principles and equations involved
   - Avoiding heavy mathematics in favor of intuitive explanations

3. **Practical applications** (1 paragraph)
   - When to use this calculator
   - Real-world scenarios it models
   - For Flip-and-Burn: emphasize The Expanse TV show and artificial gravity benefits

4. **Understanding the results** (1 paragraph)
   - How to interpret outputs
   - What different fields mean

5. **Key insights** (2-3 bullet points)
   - Important relativistic effects
   - Surprising results to watch for

### Content Tone

- Educational but accessible to senior engineers
- Emphasizes the "wow factor" of relativistic effects
- Uses concrete examples (traveling to nearby stars, The Expanse scenarios)
- Focuses on physics concepts and practical use
- Avoids excessive formalism

## Implementation Details

### Files to Modify

1. **index.html**
   - Add help buttons to 5 calc-label elements
   - Add 5 modal definitions before closing `</body>` tag

2. **src/styles/calculator.css**
   - Add `.help-btn` styling
   - Add `.help-modal` styling (header, body, close button)
   - Add `.modal-backdrop` override for cyan tint

3. **src/main.ts** or **src/ui/eventHandlers.ts**
   - Add event delegation for help button clicks
   - Initialize Bootstrap modals

### JavaScript Implementation

Simple event delegation approach using Bootstrap 5 Modal API:

```typescript
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.help-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-help-target');
      const modal = new bootstrap.Modal(document.getElementById(targetId));
      modal.show();
    });
  });
});
```

### Modal IDs

- `#const-accel-help` - Constant Acceleration
- `#flip-burn-help` - Flip-and-Burn Maneuver
- `#twin-paradox-help` - Twin Paradox
- `#simultaneity-help` - Relativity of Simultaneity
- `#spacetime-help` - Spacetime Interval

## Dependencies

No additional dependencies required. Bootstrap 5.3.0 modal JavaScript is already loaded in the project.

## Testing Considerations

- Verify modals open/close correctly on all 5 tabs
- Test keyboard accessibility (ESC to close, tab focus)
- Verify responsive behavior on mobile devices
- Ensure backdrop click closes modal
- Check text readability in modal at various screen sizes
- Validate that help buttons don't interfere with existing "Learn more" links

## Future Enhancements

- Could add deep linking to open specific help modals via URL parameters
- Could add keyboard shortcut (e.g., "?" key) to open help for active tab
- Could track help usage analytics if desired
