# Galactic Stellar Density Research

This document summarizes research on Milky Way stellar density and structure, used to calibrate the `estimateStarsInSphere` function in `extra_lib.ts`.

## Local Stellar Density

### Observed Values

The stellar density in the solar neighborhood has been measured by multiple surveys:

| Source | Density (stars/pc³) | Density (stars/ly³) | Notes |
|--------|---------------------|---------------------|-------|
| [RECONS Census](http://www.recons.org/census.posted.htm) | 0.10-0.14 | 0.0029-0.0040 | Within 10 parsecs |
| [Gaia DR3 / Mamajek](https://www.pas.rochester.edu/~emamajek/memo_star_dens.html) | 0.0984 ± 0.0068 | 0.0028 | Excludes brown dwarfs |
| [Wikipedia - Stellar Density](https://en.wikipedia.org/wiki/Stellar_density) | 0.14 | 0.004 | General estimate |

**Unit Conversion**: 1 parsec = 3.26156 light-years, so 1 pc³ = 34.71 ly³

**Recommended Value**: 0.0034 stars/ly³ (midpoint of 0.10-0.14 stars/pc³ range)

### Star Counts at Specific Distances

| Distance | Known Stars | Estimated Total | Density Check |
|----------|-------------|-----------------|---------------|
| 10 ly | 12 | ~14 | Matches 0.0034 stars/ly³ |
| 10 pc (32.6 ly) | 378 (RECONS) | ~450-500 | Incompleteness in red dwarfs |
| 100 ly | ~10,000 | ~14,000 | Consistent with local density |

Sources:
- [RECONS Census](http://www.recons.org/census.posted.htm) - 378 stars within 10 parsecs (2018)
- [Stars within 10 light-years](https://chview.nova.org/solcom/stars/s10ly.htm) - 12 known stars

## Milky Way Structure

### Component Proportions

| Component | % of Stellar Mass | Estimated Stars | Source |
|-----------|-------------------|-----------------|--------|
| Disk (thin + thick) | 85-90% | 85-180 billion | [A&A Mass Models](https://academic.oup.com/mnras/article/414/3/2446/1042117) |
| Bulge | 5-15% | 10-30 billion | [Galactic Bulge Research](https://pages.uoregon.edu/imamura/SCS123/lecture-2/bulge.html) |
| Stellar Halo | ~1% | 1-2 billion | [Stellar Halo Mass](https://arxiv.org/abs/1908.02763) |

**Key Finding**: The bulge contains only 5-15% of stellar mass, NOT 20-50% as some older models assumed.

### Total Milky Way Stars

Estimates range from 100-400 billion stars, with most recent estimates favoring 100-200 billion for hydrogen-fusing stars (excluding brown dwarfs).

Sources:
- [NASA Blueshift](https://asd.gsfc.nasa.gov/blueshift/index.php/2015/07/22/how-many-stars-in-the-milky-way/) - 100-400 billion range
- [Space.com](https://www.space.com/25959-how-many-stars-are-in-the-milky-way.html) - Discussion of uncertainty
- [Milky Way Wikipedia](https://en.wikipedia.org/wiki/Milky_Way) - Comprehensive overview

## Disk Parameters

### Radial Scale Length (h_R)

The exponential scale length of the disk has been measured via multiple methods:

| Method | Scale Length | Source |
|--------|--------------|--------|
| Visible light | 2.71 +0.22/-0.20 kpc | [Meta-analysis](https://arxiv.org/abs/1607.05281) |
| Infrared | 2.51 +0.15/-0.13 kpc | [Meta-analysis](https://arxiv.org/abs/1607.05281) |
| Combined | 2.64 ± 0.13 kpc | [Meta-analysis](https://arxiv.org/abs/1607.05281) |
| Dynamical | 2.5 kpc | [IOPscience](https://iopscience.iop.org/article/10.1088/0004-637X/779/2/115) |

**Recommended Value**: 2.6-3.2 kpc = 8,500-10,500 ly

### Vertical Scale Height (h_z)

**CRITICAL**: Scale heights are measured in PARSECS, not light-years.

| Component | Scale Height (pc) | Scale Height (ly) | Source |
|-----------|-------------------|-------------------|--------|
| Young thin disk | ~100 pc | ~330 ly | [Gaia DR3 Study](https://www.mdpi.com/2075-4434/11/3/77) |
| Old thin disk | 260-325 pc | 850-1060 ly | [Gilmore & Reid 1983](https://en.wikipedia.org/wiki/Thin_disk) |
| Thick disk | 693-1350 pc | 2260-4400 ly | [Thick Disk Wikipedia](https://en.wikipedia.org/wiki/Thick_disk) |

**Key Finding**: The thin disk scale height of "300" refers to ~300 PARSECS (~1000 ly), not 300 light-years!

Sources:
- [Thin Disk Wikipedia](https://en.wikipedia.org/wiki/Thin_disk) - 300-400 pc scale height
- [Gaia DR3 Vertical Structure](https://www.mdpi.com/2075-4434/11/3/77) - 260 ± 26 pc for thin disk
- [Gilmore & Reid 1983](https://en.wikipedia.org/wiki/Thick_disk) - Seminal thick disk discovery paper

## Bulge Parameters

### Central Density

| Location | Density (stars/pc³) | Density (stars/ly³) | Source |
|----------|---------------------|---------------------|--------|
| Central parsec | 10,000-50,000 | 290-1440 | [Physics Stack Exchange](https://physics.stackexchange.com/questions/25706/what-is-the-density-of-stars-near-the-center-of-the-milky-way) |
| At 100 pc from center | ~100 | ~2.9 | [Ohio State Lecture](https://www.astronomy.ohio-state.edu/ryden.1/ast162_7/notes31.html) |
| Bulge average | ~2 | ~0.058 | [Oregon Lecture](https://pages.uoregon.edu/jschombe/ast122/lectures/lec26.html) |

### Bulge Mass and Size

- Total mass: ~2 × 10¹⁰ M☉ (20 billion solar masses)
- Radius: ~2 kpc (6,500 ly)
- Scale radius for Gaussian model: ~1 kpc (3,500 ly)

Sources:
- [Galactic Bulge Grokipedia](https://grokipedia.com/page/Galactic_bulge) - Mass and extent
- [Oregon Bulge Lecture](https://pages.uoregon.edu/imamura/SCS123/lecture-2/bulge.html) - Structure

## Sun's Position

The Sun is located approximately 27,000 light-years (8.3 kpc) from the galactic center, in the Orion Arm of the disk.

Source: [Milky Way Wikipedia](https://en.wikipedia.org/wiki/Milky_Way)

## Model Calibration

### Recommended Parameters

Based on this research, the stellar density model should use:

```typescript
// Local density (observationally constrained)
const rhoLocal = 0.0034;  // stars/ly³ (0.12 stars/pc³)

// Disk parameters
const hR = 10000;         // Radial scale length: 3.1 kpc = 10,000 ly
const hZ = 1000;          // Vertical scale height: 300 pc = 1,000 ly (NOT 300 ly!)

// Bulge parameters (tuned for 10-15% of total)
const rhoBulgeCenter = 0.12;  // Central density adjusted for proper proportions
const rBulge = 3500;          // Scale radius: ~1 kpc

// Halo (minor component)
const rhoHaloNorm = 1.5e-5;   // Normalization for ~1% of galaxy
const rHalo = 25000;

// Sun's position
const rSun = 27000;           // 8.3 kpc from galactic center
```

### Expected Distribution

With correctly calibrated parameters:

| Distance from Sun | Expected % of Galaxy | Rationale |
|-------------------|----------------------|-----------|
| 50,000 ly | 75-85% | Captures most of disk, all of bulge |
| 75,000 ly | 90-95% | Captures outer disk |
| 100,000 ly | 98-99% | Full galaxy extent |

The current broken model shows 97.7% at 50,000 ly because the bulge is massively over-weighted.

## Key Corrections Needed

1. **Scale Height Units**: Change `hZ` from 300 to 1000 (it's 300 parsecs, not 300 light-years)
2. **Bulge Density**: Reduce from 0.75 to ~0.10-0.15 (bulge should be 10-15% of total, not 89%)
3. **Disk Scale Length**: Consider increasing from 9000 to 10000-11000 ly for better distribution

## References

### Primary Sources
- [RECONS Census](http://www.recons.org/census.posted.htm) - Nearby star census
- [Gaia Data Release 3](https://www.cosmos.esa.int/web/gaia/dr3) - ESA space astrometry mission
- [Eric Mamajek's Stellar Density Memo](https://www.pas.rochester.edu/~emamajek/memo_star_dens.html)

### Structure and Mass
- [Milky Way Wikipedia](https://en.wikipedia.org/wiki/Milky_Way)
- [Thin Disk Wikipedia](https://en.wikipedia.org/wiki/Thin_disk)
- [Thick Disk Wikipedia](https://en.wikipedia.org/wiki/Thick_disk)
- [Stellar Halo Mass (arXiv)](https://arxiv.org/abs/1908.02763)

### Scale Length Meta-Analysis
- [Sizing Up the Milky Way (arXiv)](https://arxiv.org/abs/1607.05281)

### Galactic Center
- [Physics Stack Exchange - Center Density](https://physics.stackexchange.com/questions/25706/what-is-the-density-of-stars-near-the-center-of-the-milky-way)
- [Ohio State Galactic Center Lecture](https://www.astronomy.ohio-state.edu/ryden.1/ast162_7/notes31.html)
