# Special Relativity in Python, Javascript, Rust and C#

This repository contains libraries for working with special relativity, implemented in Python, Rust, C# and Typescript / Javascript. It also contains some Jupyter notebooks demonstrating their use.

MIT License, have fun space travellers!

## Web-based calculator

A web-based calculator with visualizations is available here https://lookbusy1344.github.io/Relativity/

## Python

https://github.com/lookbusy1344/Relativity/tree/main/Python

This section contains Jupyter notebooks, and a shared Python library. A great place to start.

## Typescript / Javascript

The source code for the web-based calculator is available here:

https://github.com/lookbusy1344/Relativity/tree/main/Javascript

This uses the *Decimal.js* library for arbitrary precision calculations, similar to the the Python *mpmath* library.

## Rust

These libraries are compiled and higher performance than the Python tools. Two projects are included:

https://github.com/lookbusy1344/Relativity/tree/main/rust_uom

Strongly typed and units of measure tools. These are based on `f64` (double precision floats) and so are not as accurate as the Python tools.

https://github.com/lookbusy1344/Relativity/tree/main/rust_astrofloat

Alternative Rust tools using the `astrofloat` crate for arbitrary precision calculations. However the astrofloat hyperbolic trig functions are not as accurate as the Python *mpmath* functions.

## C# (combined project for both units of measure and arbitrary precision)

https://github.com/lookbusy1344/Relativity/tree/main/CSharp

This project contains both a strongly typed units of measure library (equivalent to the `rust_uom` library) and a library for arbitrary precision calculations (equivalent to the Python library or `rust_astrofloat`).
