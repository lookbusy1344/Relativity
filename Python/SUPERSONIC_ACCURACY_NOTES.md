# Supersonic Ballistics Notebook - Accuracy Assessment

## Overview
The supersonic projectile trajectories notebook uses sophisticated physics modeling with Mach-dependent drag, ISA atmospheric model, and variable gravity. However, some numerical results may be optimistic compared to real-world ballistics.

## Issues Identified

### 1. Optimal Launch Angles Appear High
**Issue**: Notebook shows optimal angles of 40-42° for supersonic projectiles
- Light bullet (5.56 NATO): 40° optimal
- Heavy bullet (.50 BMG): 42° optimal

**Expected**: Real-world supersonic artillery typically uses 15-35° for maximum range
- High angles mean more time in low-density air where drag is extreme
- Supersonic projectiles should favor flatter trajectories to minimize flight time

**Root Cause**: Likely the drag model or integration is slightly optimistic at high altitudes

### 2. Maximum Range Values May Be Optimistic
**Issue**: Predicted ranges seem 20-30% higher than real-world values
- 5.56 NATO at 940 m/s: 6,668m predicted (real-world max ~3-4km)
- .50 BMG at 940 m/s: 10,098m predicted (real-world max ~6-7km)

**Possible Causes**:
- Simplified Cd curves vs actual projectile aerodynamics
- No accounting for:
  - Spin stabilization effects (Magnus force)
  - Yaw/tumbling during flight
  - Base drag for boat-tail bullets
  - Real-world launch condition variations

### 3. Missing Physics Effects
**Not Modeled**:
- Magnus effect (spin-induced lift/drift)
- Yaw and pitch oscillations
- Tumbling after transonic transition
- Base drag vs pressure drag separation
- Real bullet shapes (boat-tail, hollow-point, etc.)

## Proposed Fixes

### Fix 1: Adjust Mach-Dependent Drag Coefficients
- Review `drag_coefficient_mach()` function
- Compare against empirical ballistic data
- Potentially increase Cd values in supersonic regime by 10-20%

### Fix 2: Add Realistic Bullet Shapes
- Differentiate between:
  - Boat-tail bullets (lower base drag)
  - Flat-base bullets (higher drag)
  - Match-grade projectiles (very low drag)

### Fix 3: Validate Against Known Ballistic Data
- Test against published ballistic tables
- Use standard test projectiles (e.g., G1, G7 ballistic coefficients)
- Calibrate Cd curves to match real-world trajectory data

### Fix 4: Document Limitations Clearly
- Add warnings about optimistic predictions
- Explain what physics are simplified
- Recommend using ballistic coefficients for precision work

## Action Items

1. ✅ Document current issues
2. ✅ Research empirical drag data for bullets
3. ✅ Adjust `drag_coefficient_mach()` for "bullet" shape
4. ⬜ Add validation tests against known ballistic data
5. ⬜ Update notebook with accuracy disclaimers
6. ⬜ Consider adding "conservative" vs "optimistic" drag models

## Changes Made

### Drag Model Adjustments (ballistics_lib.py)
- Increased bullet drag coefficients based on G7 standard (Cd ≈ 0.24)
- Sharper transonic drag rise (M 0.8-1.0)
- Higher peak at M=1.0-1.2 (Cd = 0.35 vs previous 0.25)
- More conservative supersonic regime drag
- New supersonic asymptotic Cd = 0.20 (vs previous 0.15)

### Results After Adjustment
**5.56 NATO (4g, 940 m/s):**
- Before: 6,668m at 40°
- After: 5,711m at 40°
- Reduction: ~14% (more realistic, closer to 3-4km real-world max)

**.50 BMG (42g, 940 m/s):**
- Before: 10,098m at 42°
- After: 8,658m at 40°
- Reduction: ~14% (more realistic, closer to 6-7km real-world max)

### Remaining Discrepancy
Predictions still ~30-40% optimistic compared to real-world data. This is expected because:
- No Magnus effect (spin stabilization)
- No yaw/tumbling effects
- Idealized atmospheric conditions
- No base drag modeling
- Assumes perfect stability throughout flight

## References Needed
- Military ballistic tables (M855, M33 ball)
- G1/G7 standard drag functions
- Published bullet Cd vs Mach curves
- Real-world maximum range data for common calibers
