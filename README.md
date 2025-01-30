# Special Relativity coding tools

Functions for playing with Special Relativity

MIT License, have fun space travelers!

## Python

https://github.com/lookbusy1344/Relativity/tree/main/Python

Python tools for Special Relativity, using `mpmath` for arbitrary precision calculations. A great place to start. Jupyter notebooks are included for playing with the tools.

## Rust

These libraries are compiled and higher performance than the Python tools. 

https://github.com/lookbusy1344/Relativity/tree/main/rust_uom

Strongly typed and units of measure safe tools for Special Relativity in Rust. However these are based on `f64` and so are not as accurate as the Python tools.

https://github.com/lookbusy1344/Relativity/tree/main/rust_astrofloat

Alternative Rust tools using the `astrofloat` crate for arbitrary precision calculations. Equivalent to the Python tools.

## C# 13 (.NET 9)

https://github.com/lookbusy1344/Relativity/tree/main/CSharp

This project contains both a strongly typed units of measure library (equivalent to the `rust_uom` library) and a library for arbitrary precision calculations (equivalent to the Python `mpmath` library or `rust_astrofloat`).

However note there are no built-in `EFloat` hyperbolic trigonometry functions. These are implemented by hand and are not as accurate as the Python/Rust tools.

## Which to use

For arbitrary precision calculations, use the Python or Rust `astrofloat` tools. For strongly typed units of measure, use the `rust_uom` or C# libraries.
