# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a C# implementation of special relativity calculations with two main components:

1. **Units of Measure Library** (`UomTools.cs`): Strongly typed units using UnitsNet for double-precision calculations
2. **Arbitrary Precision Library** (`EFloatRelativity.cs`): High-precision calculations using PeterO.Numbers.EFloat

The project demonstrates relativistic physics calculations including time dilation, length contraction, Lorentz factors, and spacetime intervals.

## Development Commands

### Build
```bash
dotnet build
dotnet build --configuration Release
```

### Run
```bash
dotnet run
```

### Clean
```bash
dotnet clean
```

### Format
```bash
dotnet format Relativity.sln
```

## Workflow

After making code changes, always run:
```bash
dotnet format Relativity.sln
```

## Architecture

### Core Components

- **Program.cs**: Main entry point with demonstration examples
- **UomTools.cs**: Strongly typed units of measure for relativity calculations using doubles
- **EFloatRelativity.cs**: Arbitrary precision relativity calculations using EFloat
- **BigFloat.cs**: Wrapper around EFloat+EContext for simplified arbitrary precision operations
- **Quantity.cs**: Generic quantity types with dimensional analysis
- **HyperbolicTrig.cs**: Hyperbolic trigonometric functions for EFloat

### Key Types

- `FractionOfC`: Represents velocity as fraction of speed of light (< 1.0)
- `LorentzFactor`: γ factor for relativistic transformations
- `Rapidity`: Additive velocity parameter in special relativity
- `BigFloat`: Immutable wrapper combining `(EFloat, EContext)` for cleaner syntax

### Dependencies

- **PeterO.Numbers**: Arbitrary precision decimal arithmetic
- **UnitsNet**: Strongly typed units of measure
- **Roslynator.Analyzers**: Code analysis and style enforcement
- **RecordValueAnalyser**: Custom analyzer for record types

### Architecture Patterns

The codebase uses two parallel approaches:
1. **Double-precision path**: Fast calculations using UnitsNet for typical use cases
2. **Arbitrary precision path**: EFloat-based calculations for extreme precision requirements

Both paths implement the same relativistic formulas but with different precision characteristics. The BigFloat wrapper simplifies EFloat usage by automatically handling context propagation.

## Code Conventions

- Uses C# 14 features and targets .NET 10
- Nullable reference types enabled
- Comprehensive code analysis rules enabled (Design, Security, Performance, Reliability, Usage)
- Immutable record structs for value types like `FractionOfC` and `LorentzFactor`
- Extension methods in static classes for utility functions
- Defensive programming with velocity validation (must be < c)