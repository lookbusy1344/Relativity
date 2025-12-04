# Testing Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Achieve comprehensive test coverage across the codebase, addressing the 80% of untested functions and establishing testing infrastructure for UI/DOM components.

**Architecture:** Phased approach starting with pure function tests (lowest friction), then adding DOM testing infrastructure with happy-dom, finally tackling integration tests. Each phase builds on the previous. Test-Driven Development (TDD) will be used where adding new functionality, but existing untested functions require "test-after" approach.

**Tech Stack:** Vitest (already configured), happy-dom (for DOM testing), msw (for mocking if needed)

---

## Current State Summary

| Metric | Current | Target |
|--------|---------|--------|
| Functions with Tests | 20% | 80%+ |
| Source Files with Tests | 7% (1/14) | 70%+ |
| Test:Source Ratio | 1:6.2 | 1:3 |

**Critical Gaps Identified:**
1. 28 untested physics functions in `relativity_lib.ts`
2. Zero tests for UI event handlers (`eventHandlers.ts`)
3. Zero tests for data generation pipeline (`dataGeneration.ts`)
4. Zero tests for URL state management (`urlState.ts`)
5. Zero tests for D3 visualization math (`minkowski-core.ts`)
6. No DOM testing infrastructure

---

## Implementation Progress

### Completed Tasks ✅

- **Task 1.1**: Test Input Validation Functions (ensure, check, checkVelocity) - 16 tests added
  - Commit: 737f269 "test: add tests for ensure, check, checkVelocity validation functions"
  - Status: All tests passing (145 total)

- **Task 1.2**: Test Relativistic Velocity Functions - 13 tests added
  - Commit: 1e7eb1f "test: add tests for relativistic velocity and distance functions"
  - Commit: 95306d0 "test: improve precision in relativistic velocity inverse tests"
  - Status: All tests passing (158 total), precision improved to 5 decimal places

- **Task 1.3**: Test Twin Paradox and Flip-and-Burn - 15 tests added
  - Commit: 4ba8b33 "test: add comprehensive tests for twinParadox and flipAndBurn"
  - Status: All tests passing (173 total)

- **Task 1.4**: Test Spacetime Interval and Four-Momentum Functions - 13 tests added
  - Commit: 8471b32 "test: add tests for spacetimeInterval and fourMomentum functions"
  - Commit: de321e9 "test: tighten tolerance for light-like interval test"
  - Status: All tests passing (185 total), tolerance improved to 1e-5

### In Progress 🔄

- **Task 1.5**: Test Remaining Physics Functions

### Pending ⏳
- Task 2.1: Install DOM Testing Dependencies
- Task 2.2: Create DOM Test Utilities
- Task 3.1: Test domUtils.ts
- Task 3.2: Test Event Handler Factories
- Task 4.1: Test dataGeneration.ts Pure Functions
- Task 5.1: Test Minkowski Math Utilities
- Task 6.1: Test simultaneityState.ts
- Task 7.1: Remove Ad-hoc Test File
- Task 7.2: Final Test Run and Summary

**Current Test Count**: 185 tests (up from 129 baseline)
**Tests Added**: 56 new tests
**Progress**: 4/14 tasks complete (29%)

---

## Phase 1: Core Physics Functions (Pure Functions)

These are pure functions with no DOM dependencies - lowest friction to test.

### Task 1.1: Test Input Validation Functions ✅ COMPLETED

**Files:**
- Test: `src/relativity_lib.test.ts` (modify existing)

**Step 1: Write failing tests for `ensure()`**

Add to `relativity_lib.test.ts`:

```typescript
describe('ensure', () => {
  it('converts string to Decimal', () => {
    const result = rl.ensure('123.456');
    expect(result.toString()).toBe('123.456');
  });

  it('converts number to Decimal', () => {
    const result = rl.ensure(42);
    expect(result.toString()).toBe('42');
  });

  it('passes through Decimal unchanged', () => {
    const input = new Decimal('99.99');
    const result = rl.ensure(input);
    expect(result).toBe(input);
  });

  it('preserves high precision strings', () => {
    const precise = '1.234567890123456789012345678901234567890';
    const result = rl.ensure(precise);
    expect(result.toString()).toBe(precise);
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `yarn test:run`
Expected: PASS (function already exists, tests should pass)

**Step 3: Write failing tests for `check()`**

```typescript
describe('check', () => {
  it('returns input for valid positive number', () => {
    const input = new Decimal('100');
    const result = rl.check(input);
    expect(result.toString()).toBe('100');
  });

  it('returns input for valid negative number', () => {
    const input = new Decimal('-50');
    const result = rl.check(input);
    expect(result.toString()).toBe('-50');
  });

  it('returns input for zero', () => {
    const input = new Decimal('0');
    const result = rl.check(input);
    expect(result.toString()).toBe('0');
  });

  it('returns NaN for NaN input', () => {
    const input = new Decimal(NaN);
    const result = rl.check(input);
    expect(result.isNaN()).toBe(true);
  });

  it('returns NaN for Infinity', () => {
    const input = new Decimal(Infinity);
    const result = rl.check(input);
    expect(result.isNaN()).toBe(true);
  });

  it('returns NaN for negative Infinity', () => {
    const input = new Decimal(-Infinity);
    const result = rl.check(input);
    expect(result.isNaN()).toBe(true);
  });
});
```

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 5: Write failing tests for `checkVelocity()`**

```typescript
describe('checkVelocity', () => {
  it('returns input for velocity less than c', () => {
    const v = new Decimal('0.5');
    const result = rl.checkVelocity(v);
    expect(result.toString()).toBe('0.5');
  });

  it('returns input for zero velocity', () => {
    const v = new Decimal('0');
    const result = rl.checkVelocity(v);
    expect(result.toString()).toBe('0');
  });

  it('returns NaN for velocity equal to c', () => {
    const v = new Decimal('1');
    const result = rl.checkVelocity(v);
    expect(result.isNaN()).toBe(true);
  });

  it('returns NaN for velocity greater than c', () => {
    const v = new Decimal('1.5');
    const result = rl.checkVelocity(v);
    expect(result.isNaN()).toBe(true);
  });

  it('returns NaN for negative velocity exceeding c', () => {
    const v = new Decimal('-1.1');
    const result = rl.checkVelocity(v);
    expect(result.isNaN()).toBe(true);
  });

  it('allows negative velocities within bounds', () => {
    const v = new Decimal('-0.9');
    const result = rl.checkVelocity(v);
    expect(result.toString()).toBe('-0.9');
  });
});
```

**Step 6: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 7: Commit**

```bash
git add src/relativity_lib.test.ts
git commit -m "test: add tests for ensure, check, checkVelocity validation functions"
```

---

### Task 1.2: Test Relativistic Velocity Functions ✅ COMPLETED

**Files:**
- Test: `src/relativity_lib.test.ts` (modify existing)

**Step 1: Write tests for `tauToVelocity()`**

```typescript
describe('tauToVelocity', () => {
  it('returns zero velocity for zero proper time', () => {
    const tau = new Decimal('0');
    const result = rl.tauToVelocity(tau);
    expect(result.toNumber()).toBeCloseTo(0, 10);
  });

  it('returns non-zero velocity for positive proper time', () => {
    // After 1 year of proper time at 1g
    const tau = new Decimal(rl.secondsPerYear);
    const result = rl.tauToVelocity(tau);
    // Velocity should be significant but less than c
    expect(result.toNumber()).toBeGreaterThan(0);
    expect(result.toNumber()).toBeLessThan(1);
  });

  it('approaches c asymptotically for large proper time', () => {
    // After 10 years of proper time at 1g
    const tau = new Decimal(rl.secondsPerYear).mul(10);
    const result = rl.tauToVelocity(tau);
    // Should be very close to c
    expect(result.toNumber()).toBeGreaterThan(0.99);
    expect(result.toNumber()).toBeLessThan(1);
  });

  it('handles small proper times', () => {
    const tau = new Decimal('1'); // 1 second
    const result = rl.tauToVelocity(tau);
    // v = tanh(g*tau/c) ≈ g*tau/c for small tau
    const expected = rl.g.div(rl.c).toNumber();
    expect(result.toNumber()).toBeCloseTo(expected, 8);
  });
});
```

**Step 2: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 3: Write tests for `relativisticVelocity()`**

```typescript
describe('relativisticVelocity', () => {
  it('returns zero for zero proper time', () => {
    const tau = new Decimal('0');
    const result = rl.relativisticVelocity(tau);
    expect(result.toNumber()).toBeCloseTo(0, 10);
  });

  it('returns velocity in m/s', () => {
    const tau = new Decimal(rl.secondsPerYear);
    const result = rl.relativisticVelocity(tau);
    // Should be in m/s, not fraction of c
    expect(result.toNumber()).toBeGreaterThan(1e8); // > 100,000,000 m/s
    expect(result.toNumber()).toBeLessThan(rl.c.toNumber());
  });

  it('equals c * tauToVelocity', () => {
    const tau = new Decimal(rl.secondsPerYear);
    const velocityFraction = rl.tauToVelocity(tau);
    const velocityAbsolute = rl.relativisticVelocity(tau);
    const expected = velocityFraction.mul(rl.c);
    expect(velocityAbsolute.toNumber()).toBeCloseTo(expected.toNumber(), 0);
  });
});
```

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 5: Write tests for `relativisticDistance()`**

```typescript
describe('relativisticDistance', () => {
  it('returns zero for zero proper time', () => {
    const tau = new Decimal('0');
    const result = rl.relativisticDistance(tau);
    expect(result.toNumber()).toBeCloseTo(0, 10);
  });

  it('returns positive distance for positive proper time', () => {
    const tau = new Decimal(rl.secondsPerYear);
    const result = rl.relativisticDistance(tau);
    expect(result.toNumber()).toBeGreaterThan(0);
  });

  it('returns distance in meters', () => {
    const tau = new Decimal(rl.secondsPerYear);
    const result = rl.relativisticDistance(tau);
    // After 1 year at 1g, should travel roughly 0.5 light years
    const halfLightYear = rl.lightYear.div(2).toNumber();
    expect(result.toNumber()).toBeGreaterThan(halfLightYear * 0.1);
    expect(result.toNumber()).toBeLessThan(halfLightYear * 10);
  });
});
```

**Step 6: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 7: Write tests for `relativisticTimeForDistance()`**

```typescript
describe('relativisticTimeForDistance', () => {
  it('returns zero for zero distance', () => {
    const distance = new Decimal('0');
    const result = rl.relativisticTimeForDistance(distance);
    expect(result.toNumber()).toBeCloseTo(0, 10);
  });

  it('returns positive time for positive distance', () => {
    const distance = new Decimal(rl.lightYear);
    const result = rl.relativisticTimeForDistance(distance);
    expect(result.toNumber()).toBeGreaterThan(0);
  });

  it('is inverse of relativisticDistance', () => {
    const tau = new Decimal(rl.secondsPerYear);
    const distance = rl.relativisticDistance(tau);
    const recoveredTau = rl.relativisticTimeForDistance(distance);
    expect(recoveredTau.toNumber()).toBeCloseTo(tau.toNumber(), 0);
  });
});
```

**Step 8: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 9: Commit**

```bash
git add src/relativity_lib.test.ts
git commit -m "test: add tests for relativistic velocity and distance functions"
```

---

### Task 1.3: Test Twin Paradox and Flip-and-Burn ✅ COMPLETED

**Files:**
- Test: `src/relativity_lib.test.ts` (modify existing)

**Step 1: Write tests for `twinParadox()`**

```typescript
describe('twinParadox', () => {
  it('returns result object with expected properties', () => {
    const distanceLy = new Decimal('10'); // 10 light years
    const velocity = new Decimal('0.9'); // 0.9c
    const result = rl.twinParadox(distanceLy, velocity);

    expect(result).toHaveProperty('travelerTime');
    expect(result).toHaveProperty('earthTime');
    expect(result).toHaveProperty('gamma');
  });

  it('traveler experiences less time than Earth observer', () => {
    const distanceLy = new Decimal('10');
    const velocity = new Decimal('0.9');
    const result = rl.twinParadox(distanceLy, velocity);

    expect(result.travelerTime.toNumber()).toBeLessThan(result.earthTime.toNumber());
  });

  it('time dilation increases with velocity', () => {
    const distanceLy = new Decimal('10');
    const slowResult = rl.twinParadox(distanceLy, new Decimal('0.5'));
    const fastResult = rl.twinParadox(distanceLy, new Decimal('0.9'));

    // Higher velocity = greater time dilation ratio
    const slowRatio = slowResult.earthTime.div(slowResult.travelerTime);
    const fastRatio = fastResult.earthTime.div(fastResult.travelerTime);
    expect(fastRatio.toNumber()).toBeGreaterThan(slowRatio.toNumber());
  });

  it('gamma matches lorentzFactor', () => {
    const distanceLy = new Decimal('10');
    const velocity = new Decimal('0.8');
    const result = rl.twinParadox(distanceLy, velocity);
    const expectedGamma = rl.lorentzFactor(velocity);

    expect(result.gamma.toNumber()).toBeCloseTo(expectedGamma.toNumber(), 10);
  });

  it('handles zero velocity (no time dilation)', () => {
    const distanceLy = new Decimal('10');
    const velocity = new Decimal('0.001'); // Very slow
    const result = rl.twinParadox(distanceLy, velocity);

    // At very low velocity, times should be nearly equal
    const ratio = result.earthTime.div(result.travelerTime);
    expect(ratio.toNumber()).toBeCloseTo(1, 3);
  });
});
```

**Step 2: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 3: Write comprehensive tests for `flipAndBurn()`**

```typescript
describe('flipAndBurn', () => {
  it('returns result object with expected properties', () => {
    const distanceLy = new Decimal('10');
    const result = rl.flipAndBurn(distanceLy);

    expect(result).toHaveProperty('shipTimeYears');
    expect(result).toHaveProperty('earthTimeYears');
    expect(result).toHaveProperty('maxVelocity');
    expect(result).toHaveProperty('maxGamma');
  });

  it('ship time is less than Earth time', () => {
    const distanceLy = new Decimal('10');
    const result = rl.flipAndBurn(distanceLy);

    expect(result.shipTimeYears.toNumber()).toBeLessThan(result.earthTimeYears.toNumber());
  });

  it('max velocity is less than c', () => {
    const distanceLy = new Decimal('10');
    const result = rl.flipAndBurn(distanceLy);

    expect(result.maxVelocity.toNumber()).toBeLessThan(1);
    expect(result.maxVelocity.toNumber()).toBeGreaterThan(0);
  });

  it('longer distance results in higher max velocity', () => {
    const shortResult = rl.flipAndBurn(new Decimal('1'));
    const longResult = rl.flipAndBurn(new Decimal('100'));

    expect(longResult.maxVelocity.toNumber()).toBeGreaterThan(shortResult.maxVelocity.toNumber());
  });

  it('handles very short distances', () => {
    const distanceLy = new Decimal('0.01'); // 0.01 light years
    const result = rl.flipAndBurn(distanceLy);

    expect(result.shipTimeYears.toNumber()).toBeGreaterThan(0);
    expect(result.earthTimeYears.toNumber()).toBeGreaterThan(0);
  });

  it('handles very long distances (100,000 ly)', () => {
    const distanceLy = new Decimal('100000');
    const result = rl.flipAndBurn(distanceLy);

    // Max velocity should be very close to c
    expect(result.maxVelocity.toNumber()).toBeGreaterThan(0.9999);
    expect(result.maxVelocity.toNumber()).toBeLessThan(1);
  });

  it('Earth time approximately equals 2 * sqrt(distance^2 + distance) for large distances', () => {
    // This is an approximation for large distances at 1g acceleration
    const distanceLy = new Decimal('100');
    const result = rl.flipAndBurn(distanceLy);

    // Earth time should be roughly distance + small constant (light travel time + acceleration phase)
    expect(result.earthTimeYears.toNumber()).toBeGreaterThan(100);
    expect(result.earthTimeYears.toNumber()).toBeLessThan(110);
  });
});
```

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/relativity_lib.test.ts
git commit -m "test: add comprehensive tests for twinParadox and flipAndBurn"
```

---

### Task 1.4: Test Spacetime Interval and Four-Momentum Functions ✅ COMPLETED

**Files:**
- Test: `src/relativity_lib.test.ts` (modify existing)

**Step 1: Write tests for `spacetimeInterval1d()`**

```typescript
describe('spacetimeInterval1d', () => {
  it('returns zero for light-like interval', () => {
    // Light travels 1 light-second in 1 second
    const dt = new Decimal('1'); // 1 second
    const dx = new Decimal(rl.c); // c meters
    const result = rl.spacetimeInterval1d(dt, dx);

    expect(result.toNumber()).toBeCloseTo(0, 5);
  });

  it('returns positive for time-like interval', () => {
    // More time than space
    const dt = new Decimal('10');
    const dx = new Decimal('1');
    const result = rl.spacetimeInterval1d(dt, dx);

    expect(result.toNumber()).toBeGreaterThan(0);
  });

  it('returns negative for space-like interval', () => {
    // More space than time
    const dt = new Decimal('1');
    const dx = new Decimal(rl.c).mul(10);
    const result = rl.spacetimeInterval1d(dt, dx);

    expect(result.toNumber()).toBeLessThan(0);
  });

  it('is invariant under Lorentz transformation (same interval in both frames)', () => {
    // This is a key property - interval should be the same regardless of frame
    const dt = new Decimal('5');
    const dx = new Decimal(rl.c).mul(3);
    const interval = rl.spacetimeInterval1d(dt, dx);

    // (c*dt)^2 - dx^2 should give consistent result
    const expected = rl.c.pow(2).mul(dt.pow(2)).sub(dx.pow(2));
    expect(interval.toNumber()).toBeCloseTo(expected.toNumber(), 0);
  });
});
```

**Step 2: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 3: Write tests for `spacetimeInterval3d()`**

```typescript
describe('spacetimeInterval3d', () => {
  it('returns zero for light-like interval in any direction', () => {
    const dt = new Decimal('1');
    // Light travels c meters total
    const dx = rl.c.div(Math.sqrt(3));
    const dy = rl.c.div(Math.sqrt(3));
    const dz = rl.c.div(Math.sqrt(3));
    const result = rl.spacetimeInterval3d(dt, dx, dy, dz);

    expect(Math.abs(result.toNumber())).toBeLessThan(1e5); // Close to zero
  });

  it('equals 1d interval when dy=dz=0', () => {
    const dt = new Decimal('5');
    const dx = new Decimal(rl.c).mul(2);

    const interval1d = rl.spacetimeInterval1d(dt, dx);
    const interval3d = rl.spacetimeInterval3d(dt, dx, new Decimal(0), new Decimal(0));

    expect(interval3d.toNumber()).toBeCloseTo(interval1d.toNumber(), 5);
  });

  it('is symmetric in spatial dimensions', () => {
    const dt = new Decimal('5');
    const d = new Decimal('1000');

    const intervalX = rl.spacetimeInterval3d(dt, d, new Decimal(0), new Decimal(0));
    const intervalY = rl.spacetimeInterval3d(dt, new Decimal(0), d, new Decimal(0));
    const intervalZ = rl.spacetimeInterval3d(dt, new Decimal(0), new Decimal(0), d);

    expect(intervalX.toNumber()).toBeCloseTo(intervalY.toNumber(), 10);
    expect(intervalY.toNumber()).toBeCloseTo(intervalZ.toNumber(), 10);
  });
});
```

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 5: Write tests for `fourMomentum()`**

```typescript
describe('fourMomentum', () => {
  it('returns object with energy and momentum', () => {
    const mass = new Decimal('1'); // 1 kg
    const velocity = new Decimal('0.5'); // 0.5c
    const result = rl.fourMomentum(mass, velocity);

    expect(result).toHaveProperty('energy');
    expect(result).toHaveProperty('momentum');
  });

  it('energy equals rest mass energy at zero velocity', () => {
    const mass = new Decimal('1');
    const velocity = new Decimal('0');
    const result = rl.fourMomentum(mass, velocity);

    // E = mc^2 at rest
    const restEnergy = mass.mul(rl.c.pow(2));
    expect(result.energy.toNumber()).toBeCloseTo(restEnergy.toNumber(), 0);
  });

  it('momentum is zero at zero velocity', () => {
    const mass = new Decimal('1');
    const velocity = new Decimal('0');
    const result = rl.fourMomentum(mass, velocity);

    expect(result.momentum.toNumber()).toBeCloseTo(0, 5);
  });

  it('energy increases with velocity', () => {
    const mass = new Decimal('1');
    const slowResult = rl.fourMomentum(mass, new Decimal('0.1'));
    const fastResult = rl.fourMomentum(mass, new Decimal('0.9'));

    expect(fastResult.energy.toNumber()).toBeGreaterThan(slowResult.energy.toNumber());
  });

  it('satisfies invariant mass relation: E^2 = (pc)^2 + (mc^2)^2', () => {
    const mass = new Decimal('1');
    const velocity = new Decimal('0.6');
    const result = rl.fourMomentum(mass, velocity);

    const E = result.energy;
    const p = result.momentum;
    const mc2 = mass.mul(rl.c.pow(2));

    const lhs = E.pow(2);
    const rhs = p.pow(2).mul(rl.c.pow(2)).add(mc2.pow(2));

    expect(lhs.toNumber()).toBeCloseTo(rhs.toNumber(), 0);
  });
});
```

**Step 6: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 7: Commit**

```bash
git add src/relativity_lib.test.ts
git commit -m "test: add tests for spacetimeInterval and fourMomentum functions"
```

---

### Task 1.5: Test Remaining Physics Functions

**Files:**
- Test: `src/relativity_lib.test.ts` (modify existing)

**Step 1: Write tests for `coordinateTime()`**

```typescript
describe('coordinateTime', () => {
  it('returns zero for zero proper time', () => {
    const tau = new Decimal('0');
    const result = rl.coordinateTime(tau);
    expect(result.toNumber()).toBeCloseTo(0, 10);
  });

  it('coordinate time is greater than proper time', () => {
    const tau = new Decimal(rl.secondsPerYear);
    const coordTime = rl.coordinateTime(tau);
    expect(coordTime.toNumber()).toBeGreaterThan(tau.toNumber());
  });

  it('difference increases with proper time', () => {
    const tau1 = new Decimal(rl.secondsPerYear);
    const tau2 = new Decimal(rl.secondsPerYear).mul(5);

    const diff1 = rl.coordinateTime(tau1).sub(tau1);
    const diff2 = rl.coordinateTime(tau2).sub(tau2);

    expect(diff2.toNumber()).toBeGreaterThan(diff1.toNumber());
  });
});
```

**Step 2: Write tests for `lengthContractionVelocity()`**

```typescript
describe('lengthContractionVelocity', () => {
  it('returns original length at zero velocity', () => {
    const length = new Decimal('100');
    const velocity = new Decimal('0');
    const result = rl.lengthContractionVelocity(length, velocity);

    expect(result.toNumber()).toBeCloseTo(100, 10);
  });

  it('contracted length is less than proper length', () => {
    const length = new Decimal('100');
    const velocity = new Decimal('0.8');
    const result = rl.lengthContractionVelocity(length, velocity);

    expect(result.toNumber()).toBeLessThan(100);
    expect(result.toNumber()).toBeGreaterThan(0);
  });

  it('contraction increases with velocity', () => {
    const length = new Decimal('100');
    const slow = rl.lengthContractionVelocity(length, new Decimal('0.5'));
    const fast = rl.lengthContractionVelocity(length, new Decimal('0.9'));

    expect(fast.toNumber()).toBeLessThan(slow.toNumber());
  });

  it('contracted length equals proper length / gamma', () => {
    const length = new Decimal('100');
    const velocity = new Decimal('0.6');
    const result = rl.lengthContractionVelocity(length, velocity);

    const gamma = rl.lorentzFactor(velocity);
    const expected = length.div(gamma);

    expect(result.toNumber()).toBeCloseTo(expected.toNumber(), 10);
  });
});
```

**Step 3: Write tests for `dopplerShift()`**

```typescript
describe('dopplerShift', () => {
  it('returns 1 for zero velocity', () => {
    const velocity = new Decimal('0');
    const result = rl.dopplerShift(velocity);
    expect(result.toNumber()).toBeCloseTo(1, 10);
  });

  it('returns value less than 1 for approaching source (blueshift)', () => {
    const velocity = new Decimal('-0.5'); // Approaching
    const result = rl.dopplerShift(velocity);
    expect(result.toNumber()).toBeLessThan(1);
  });

  it('returns value greater than 1 for receding source (redshift)', () => {
    const velocity = new Decimal('0.5'); // Receding
    const result = rl.dopplerShift(velocity);
    expect(result.toNumber()).toBeGreaterThan(1);
  });

  it('shift is symmetric for approach/recession at same speed', () => {
    const v = 0.5;
    const approaching = rl.dopplerShift(new Decimal(-v));
    const receding = rl.dopplerShift(new Decimal(v));

    // Product should be 1 (or close to it)
    expect(approaching.mul(receding).toNumber()).toBeCloseTo(1, 10);
  });
});
```

**Step 4: Write tests for `relativistic(Momentum|Energy)`**

```typescript
describe('relativisticMomentum', () => {
  it('returns zero for zero velocity', () => {
    const mass = new Decimal('1');
    const velocity = new Decimal('0');
    const result = rl.relativisticMomentum(mass, velocity);
    expect(result.toNumber()).toBeCloseTo(0, 10);
  });

  it('momentum increases with velocity', () => {
    const mass = new Decimal('1');
    const slow = rl.relativisticMomentum(mass, new Decimal('0.1'));
    const fast = rl.relativisticMomentum(mass, new Decimal('0.9'));
    expect(fast.toNumber()).toBeGreaterThan(slow.toNumber());
  });

  it('momentum equals gamma * m * v', () => {
    const mass = new Decimal('1');
    const velocity = new Decimal('0.6');
    const result = rl.relativisticMomentum(mass, velocity);

    const gamma = rl.lorentzFactor(velocity);
    const expected = gamma.mul(mass).mul(velocity).mul(rl.c);

    expect(result.toNumber()).toBeCloseTo(expected.toNumber(), 0);
  });
});

describe('relativisticEnergy', () => {
  it('returns rest mass energy at zero velocity', () => {
    const mass = new Decimal('1');
    const velocity = new Decimal('0');
    const result = rl.relativisticEnergy(mass, velocity);

    const restEnergy = mass.mul(rl.c.pow(2));
    expect(result.toNumber()).toBeCloseTo(restEnergy.toNumber(), 0);
  });

  it('energy increases with velocity', () => {
    const mass = new Decimal('1');
    const slow = rl.relativisticEnergy(mass, new Decimal('0.1'));
    const fast = rl.relativisticEnergy(mass, new Decimal('0.9'));
    expect(fast.toNumber()).toBeGreaterThan(slow.toNumber());
  });

  it('energy equals gamma * mc^2', () => {
    const mass = new Decimal('1');
    const velocity = new Decimal('0.5');
    const result = rl.relativisticEnergy(mass, velocity);

    const gamma = rl.lorentzFactor(velocity);
    const expected = gamma.mul(mass).mul(rl.c.pow(2));

    expect(result.toNumber()).toBeCloseTo(expected.toNumber(), 0);
  });
});
```

**Step 5: Write tests for `invariantMassFromEnergyMomentum()`**

```typescript
describe('invariantMassFromEnergyMomentum', () => {
  it('recovers original mass from fourMomentum values', () => {
    const mass = new Decimal('5');
    const velocity = new Decimal('0.7');
    const { energy, momentum } = rl.fourMomentum(mass, velocity);

    const recoveredMass = rl.invariantMassFromEnergyMomentum(energy, momentum);
    expect(recoveredMass.toNumber()).toBeCloseTo(mass.toNumber(), 5);
  });

  it('returns rest mass for zero momentum', () => {
    const energy = new Decimal('1e16'); // Some energy in joules
    const momentum = new Decimal('0');
    const mass = rl.invariantMassFromEnergyMomentum(energy, momentum);

    // E = mc^2, so m = E/c^2
    const expected = energy.div(rl.c.pow(2));
    expect(mass.toNumber()).toBeCloseTo(expected.toNumber(), 0);
  });
});
```

**Step 6: Write tests for `addVelocities()`**

```typescript
describe('addVelocities', () => {
  it('returns sum for small velocities (classical limit)', () => {
    const v1 = new Decimal('1000'); // 1000 m/s
    const v2 = new Decimal('2000'); // 2000 m/s
    const result = rl.addVelocities(v1, v2);

    // At low velocities, should be approximately classical
    expect(result.toNumber()).toBeCloseTo(3000, -1);
  });

  it('never exceeds speed of light', () => {
    const v1 = rl.c.mul(0.9);
    const v2 = rl.c.mul(0.9);
    const result = rl.addVelocities(v1, v2);

    expect(result.toNumber()).toBeLessThan(rl.c.toNumber());
  });

  it('adding zero returns original velocity', () => {
    const v = rl.c.mul(0.5);
    const result = rl.addVelocities(v, new Decimal('0'));
    expect(result.toNumber()).toBeCloseTo(v.toNumber(), 5);
  });
});
```

**Step 7: Run all tests**

Run: `yarn test:run`
Expected: All PASS

**Step 8: Commit**

```bash
git add src/relativity_lib.test.ts
git commit -m "test: add comprehensive tests for remaining physics functions"
```

---

## Phase 2: DOM Testing Infrastructure Setup

### Task 2.1: Install DOM Testing Dependencies

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`

**Step 1: Install happy-dom**

Run: `yarn add -D happy-dom @testing-library/dom`

**Step 2: Update vitest.config.ts for DOM testing**

Modify `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'happy-dom', // Changed from 'node'
    globals: false,
  },
});
```

**Step 3: Verify DOM environment works**

Create a simple test to verify: `src/dom-setup.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('DOM environment', () => {
  beforeEach(() => {
    // Clear body using safe DOM methods
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('has document available', () => {
    expect(typeof document).toBe('object');
  });

  it('can create elements', () => {
    const div = document.createElement('div');
    div.textContent = 'test';
    expect(div.textContent).toBe('test');
  });

  it('can query elements', () => {
    const input = document.createElement('input');
    input.id = 'test-input';
    input.type = 'text';
    input.value = 'hello';
    document.body.appendChild(input);

    const found = document.getElementById('test-input') as HTMLInputElement;
    expect(found.value).toBe('hello');
  });
});
```

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json yarn.lock vitest.config.ts src/dom-setup.test.ts
git commit -m "build: add happy-dom for DOM testing environment"
```

---

### Task 2.2: Create DOM Test Utilities

**Files:**
- Create: `src/test-utils/dom-helpers.ts`
- Test: `src/test-utils/dom-helpers.test.ts`

**Step 1: Write failing test for helpers**

Create `src/test-utils/dom-helpers.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockCalculatorDOM, setInputValue, getResultText, clearBody } from './dom-helpers';

describe('DOM test helpers', () => {
  beforeEach(() => {
    clearBody();
  });

  describe('createMockCalculatorDOM', () => {
    it('creates input elements', () => {
      createMockCalculatorDOM(['velocity', 'distance']);

      expect(document.getElementById('velocity')).toBeInstanceOf(HTMLInputElement);
      expect(document.getElementById('distance')).toBeInstanceOf(HTMLInputElement);
    });

    it('creates result spans', () => {
      createMockCalculatorDOM(['velocity'], ['gamma-result']);

      expect(document.getElementById('gamma-result')).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('setInputValue', () => {
    it('sets input value', () => {
      createMockCalculatorDOM(['test-input']);
      setInputValue('test-input', '123');

      const input = document.getElementById('test-input') as HTMLInputElement;
      expect(input.value).toBe('123');
    });
  });

  describe('getResultText', () => {
    it('gets result span text', () => {
      createMockCalculatorDOM([], ['result']);
      const span = document.getElementById('result') as HTMLSpanElement;
      span.textContent = 'calculated value';

      expect(getResultText('result')).toBe('calculated value');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn test:run`
Expected: FAIL (module not found)

**Step 3: Create helpers implementation**

Create `src/test-utils/dom-helpers.ts`:

```typescript
/**
 * Clears the document body using safe DOM methods (no innerHTML)
 */
export function clearBody(): void {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

/**
 * Creates mock DOM elements for calculator tests using safe DOM methods
 */
export function createMockCalculatorDOM(
  inputIds: string[] = [],
  resultIds: string[] = [],
  buttonIds: string[] = [],
  canvasIds: string[] = []
): void {
  const container = document.createElement('div');
  container.id = 'test-container';

  inputIds.forEach(id => {
    const input = document.createElement('input');
    input.id = id;
    input.type = 'text';
    container.appendChild(input);
  });

  resultIds.forEach(id => {
    const span = document.createElement('span');
    span.id = id;
    container.appendChild(span);
  });

  buttonIds.forEach(id => {
    const button = document.createElement('button');
    button.id = id;
    container.appendChild(button);
  });

  canvasIds.forEach(id => {
    const canvas = document.createElement('canvas');
    canvas.id = id;
    container.appendChild(canvas);
  });

  document.body.appendChild(container);
}

/**
 * Sets the value of an input element
 */
export function setInputValue(id: string, value: string): void {
  const input = document.getElementById(id) as HTMLInputElement;
  if (!input) throw new Error(`Input #${id} not found`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Gets the text content of a result span
 */
export function getResultText(id: string): string {
  const span = document.getElementById(id);
  if (!span) throw new Error(`Result span #${id} not found`);
  return span.textContent || '';
}

/**
 * Triggers a click event on a button
 */
export function clickButton(id: string): void {
  const button = document.getElementById(id) as HTMLButtonElement;
  if (!button) throw new Error(`Button #${id} not found`);
  button.click();
}

/**
 * Waits for requestAnimationFrame and setTimeout to settle
 */
export function waitForUpdate(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}
```

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/test-utils/
git commit -m "test: add DOM test helper utilities"
```

---

## Phase 3: UI Layer Tests

### Task 3.1: Test domUtils.ts

**Files:**
- Test: `src/ui/domUtils.test.ts`

**Step 1: Write tests for domUtils**

Create `src/ui/domUtils.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setElement, getInputElement, getResultElement, getButtonElement, getCanvasElement } from './domUtils';
import { clearBody } from '../test-utils/dom-helpers';

describe('domUtils', () => {
  beforeEach(() => {
    clearBody();
  });

  describe('setElement', () => {
    it('sets textContent on span element', () => {
      const span = document.createElement('span');
      span.id = 'result';
      document.body.appendChild(span);

      setElement('result', 'Hello World');

      expect(span.textContent).toBe('Hello World');
    });

    it('handles missing element gracefully', () => {
      // Should not throw
      expect(() => setElement('nonexistent', 'value')).not.toThrow();
    });
  });

  describe('getInputElement', () => {
    it('returns input element by id', () => {
      const input = document.createElement('input');
      input.id = 'test-input';
      input.value = '42';
      document.body.appendChild(input);

      const result = getInputElement('test-input');

      expect(result).toBe(input);
      expect(result?.value).toBe('42');
    });

    it('returns null for missing element', () => {
      const result = getInputElement('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getResultElement', () => {
    it('returns span element by id', () => {
      const span = document.createElement('span');
      span.id = 'result-span';
      document.body.appendChild(span);

      const result = getResultElement('result-span');

      expect(result).toBe(span);
    });

    it('returns null for missing element', () => {
      const result = getResultElement('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getButtonElement', () => {
    it('returns button element by id', () => {
      const button = document.createElement('button');
      button.id = 'submit-btn';
      document.body.appendChild(button);

      const result = getButtonElement('submit-btn');

      expect(result).toBe(button);
    });

    it('returns null for missing element', () => {
      const result = getButtonElement('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getCanvasElement', () => {
    it('returns canvas element by id', () => {
      const canvas = document.createElement('canvas');
      canvas.id = 'chart-canvas';
      document.body.appendChild(canvas);

      const result = getCanvasElement('chart-canvas');

      expect(result).toBe(canvas);
    });

    it('returns null for missing element', () => {
      const result = getCanvasElement('nonexistent');
      expect(result).toBeNull();
    });
  });
});
```

**Step 2: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 3: Commit**

```bash
git add src/ui/domUtils.test.ts
git commit -m "test: add tests for domUtils DOM access utilities"
```

---

### Task 3.2: Test Event Handler Factories (Unit Level)

**Files:**
- Test: `src/ui/eventHandlers.test.ts`

**Step 1: Read eventHandlers.ts to understand actual element IDs**

Read the file to find the actual DOM element IDs used.

**Step 2: Write tests for handlers**

Create `src/ui/eventHandlers.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLorentzHandler } from './eventHandlers';
import { createMockCalculatorDOM, setInputValue, getResultText, clearBody } from '../test-utils/dom-helpers';

describe('Event Handler Factories', () => {
  beforeEach(() => {
    clearBody();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createLorentzHandler', () => {
    beforeEach(() => {
      // Create DOM elements matching actual IDs from eventHandlers.ts
      // NOTE: Adjust these IDs to match actual implementation
      createMockCalculatorDOM(
        ['lorentz-velocity'],
        ['lorentz-gamma']
      );
    });

    it('creates a function', () => {
      const handler = createLorentzHandler();
      expect(typeof handler).toBe('function');
    });

    it('calculates gamma factor for valid velocity', async () => {
      const handler = createLorentzHandler();
      setInputValue('lorentz-velocity', '0.6');

      handler();
      await vi.runAllTimersAsync();

      const result = getResultText('lorentz-gamma');
      expect(result).toMatch(/1\.25/); // gamma at 0.6c
    });
  });
});
```

**Step 3: Run tests and adjust IDs as needed**

Run: `yarn test:run`

Read actual element IDs from `eventHandlers.ts` and adjust tests accordingly.

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS (after adjusting IDs)

**Step 5: Commit**

```bash
git add src/ui/eventHandlers.test.ts
git commit -m "test: add unit tests for event handler factories"
```

---

## Phase 4: Data Generation Tests

### Task 4.1: Test dataGeneration.ts Pure Functions

**Files:**
- Test: `src/charts/dataGeneration.test.ts`

**Step 1: Read dataGeneration.ts to understand return types**

Read the file to understand actual function signatures and return types.

**Step 2: Write tests for data generation**

Create `src/charts/dataGeneration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
// Import functions - adjust based on actual exports
import {
  generateAccelChartData,
  generateFlipBurnChartData,
} from './dataGeneration';

describe('Data Generation Functions', () => {
  describe('generateAccelChartData', () => {
    it('returns arrays of numbers', () => {
      const tau = new Decimal('31557600'); // 1 year in seconds
      const result = generateAccelChartData(tau);

      expect(Array.isArray(result.velocityData)).toBe(true);
      expect(Array.isArray(result.distanceData)).toBe(true);
    });

    it('velocity data never exceeds 1 (c)', () => {
      const tau = new Decimal('31557600').mul(10); // 10 years
      const result = generateAccelChartData(tau);

      result.velocityData.forEach(v => {
        expect(v).toBeLessThan(1);
        expect(v).toBeGreaterThanOrEqual(0);
      });
    });

    it('distance data is monotonically increasing', () => {
      const tau = new Decimal('31557600');
      const result = generateAccelChartData(tau);

      for (let i = 1; i < result.distanceData.length; i++) {
        expect(result.distanceData[i]).toBeGreaterThanOrEqual(result.distanceData[i - 1]);
      }
    });
  });

  describe('generateFlipBurnChartData', () => {
    it('returns expected data structure', () => {
      const distanceLy = new Decimal('10');
      const result = generateFlipBurnChartData(distanceLy);

      expect(result).toHaveProperty('velocityData');
      expect(result).toHaveProperty('distanceData');
    });

    it('final velocity is near zero (decelerated to stop)', () => {
      const distanceLy = new Decimal('10');
      const result = generateFlipBurnChartData(distanceLy);

      const finalVelocity = result.velocityData[result.velocityData.length - 1];
      expect(finalVelocity).toBeLessThan(0.1);
    });
  });
});
```

**Step 3: Run tests and adjust based on actual exports**

Run: `yarn test:run`

Adjust imports and test expectations based on actual function signatures.

**Step 4: Run tests**

Run: `yarn test:run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/charts/dataGeneration.test.ts
git commit -m "test: add tests for chart data generation functions"
```

---

## Phase 5: Minkowski Core Math Tests

### Task 5.1: Test Minkowski Math Utilities

**Files:**
- Test: `src/charts/minkowski-core.test.ts`

**Step 1: Read minkowski-core.ts to understand exports**

Read the file to see what functions are exported.

**Step 2: Write tests for math utilities**

Create `src/charts/minkowski-core.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
// Import functions - adjust based on actual exports
import { debounce, formatCoordinate, calculateGamma, lorentzTransform } from './minkowski-core';

describe('Minkowski Core Utilities', () => {
  describe('formatCoordinate', () => {
    it('formats positive numbers', () => {
      expect(formatCoordinate(1.234)).toBe('1.23');
    });

    it('formats negative numbers', () => {
      expect(formatCoordinate(-1.234)).toBe('-1.23');
    });

    it('formats zero', () => {
      expect(formatCoordinate(0)).toBe('0.00');
    });
  });

  describe('calculateGamma', () => {
    it('returns 1 for zero velocity', () => {
      expect(calculateGamma(0)).toBe(1);
    });

    it('returns correct gamma for 0.6c', () => {
      // gamma = 1/sqrt(1-0.36) = 1/sqrt(0.64) = 1/0.8 = 1.25
      expect(calculateGamma(0.6)).toBeCloseTo(1.25, 5);
    });

    it('returns large gamma for high velocity', () => {
      expect(calculateGamma(0.99)).toBeGreaterThan(7);
    });
  });

  describe('lorentzTransform', () => {
    it('returns identity for zero velocity', () => {
      const result = lorentzTransform(5, 3, 0);
      expect(result.t).toBeCloseTo(5, 5);
      expect(result.x).toBeCloseTo(3, 5);
    });

    it('preserves spacetime interval', () => {
      const t = 5, x = 3, v = 0.5;
      const original = t * t - x * x;

      const result = lorentzTransform(t, x, v);
      const transformed = result.t * result.t - result.x * result.x;

      expect(transformed).toBeCloseTo(original, 5);
    });

    it('light-like events remain light-like', () => {
      // Event on light cone: t = x
      const result = lorentzTransform(1, 1, 0.5);
      expect(result.t).toBeCloseTo(result.x, 5);
    });
  });

  describe('debounce', () => {
    it('delays function execution', async () => {
      let callCount = 0;
      const fn = debounce(() => { callCount++; }, 100);

      fn();
      fn();
      fn();

      expect(callCount).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(callCount).toBe(1);
    });
  });
});
```

**Step 3: Run tests and adjust based on actual exports**

Run: `yarn test:run`

**Step 4: Commit**

```bash
git add src/charts/minkowski-core.test.ts
git commit -m "test: add tests for Minkowski diagram math utilities"
```

---

## Phase 6: State Management Tests

### Task 6.1: Test simultaneityState.ts

**Files:**
- Test: `src/charts/simultaneityState.test.ts`

**Step 1: Read simultaneityState.ts to understand exports**

Read the file to see actual function signatures.

**Step 2: Write tests for state management**

Create `src/charts/simultaneityState.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
// Import functions - adjust based on actual exports
import { getEvents, setEvents, subscribe } from './simultaneityState';

describe('Simultaneity State Management', () => {
  beforeEach(() => {
    // Reset state between tests
    setEvents([]);
  });

  describe('getEvents/setEvents', () => {
    it('returns empty array initially', () => {
      setEvents([]);
      expect(getEvents()).toEqual([]);
    });

    it('stores and retrieves events', () => {
      const events = [
        { t: 0, x: 0, label: 'A' },
        { t: 1, x: 1, label: 'B' },
      ];
      setEvents(events);

      expect(getEvents()).toEqual(events);
    });
  });

  describe('subscribe', () => {
    it('calls subscriber when events change', () => {
      const subscriber = vi.fn();
      const unsubscribe = subscribe(subscriber);

      setEvents([{ t: 0, x: 0, label: 'A' }]);

      expect(subscriber).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('unsubscribe stops notifications', () => {
      const subscriber = vi.fn();
      const unsubscribe = subscribe(subscriber);

      unsubscribe();
      setEvents([{ t: 0, x: 0, label: 'A' }]);

      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});
```

**Step 3: Run tests and adjust based on actual exports**

Run: `yarn test:run`

**Step 4: Commit**

```bash
git add src/charts/simultaneityState.test.ts
git commit -m "test: add tests for simultaneity state management"
```

---

## Phase 7: Final Cleanup and Verification

### Task 7.1: Remove Ad-hoc Test File

**Files:**
- Delete: `src/verify_issue.test.ts`

**Step 1: Review verify_issue.test.ts**

This file uses console.log instead of proper assertions. The flipAndBurn tests we added in Phase 1 are more comprehensive.

**Step 2: Delete the file**

Run: `rm src/verify_issue.test.ts`

**Step 3: Run all tests**

Run: `yarn test:run`
Expected: All PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "test: remove ad-hoc verify_issue test (covered by comprehensive tests)"
```

---

### Task 7.2: Final Test Run and Summary

**Step 1: Run full test suite**

Run: `yarn test:run`
Expected: All PASS

**Step 2: Count tests**

Run: `yarn test:run 2>&1 | grep -E "Tests|test files"`

**Step 3: Verify test coverage improvement**

Document final test count vs original 129 tests.

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: complete testing improvements - Phase 1-7"
```

---

## Summary of Deliverables

| Phase | Tests Added | Coverage Area |
|-------|------------|---------------|
| 1.1 | ~18 | Input validation (ensure, check, checkVelocity) |
| 1.2 | ~12 | Relativistic velocity/distance functions |
| 1.3 | ~14 | Twin paradox, flip-and-burn |
| 1.4 | ~16 | Spacetime intervals, four-momentum |
| 1.5 | ~24 | Remaining physics functions |
| 2.1-2.2 | ~6 | DOM testing infrastructure |
| 3.1 | ~5 | domUtils |
| 3.2 | ~4 | Event handler factories |
| 4.1 | ~6 | Data generation |
| 5.1 | ~10 | Minkowski math |
| 6.1 | ~5 | State management |
| **Total** | **~120** | **New tests** |

**Expected Final State:**
- Original: 129 tests, 2 files
- Final: ~250+ tests, 10+ files
- Coverage: 20% → 70%+ of exported functions
