
using PeterO.Numbers;
using System;

namespace Relativity;

// This helper class wraps an EFloat with a context for calculations, so we can do
// (A + B) * C
// ..instead of..
// A.Add(B, context).Multiply(C, context)

// We don't want the inner EFloat to be null, but it's always a possibility with structs
// eg var arr = new BigFloat[10]; // all structs initialised to (null, null)
// so the Value property checks and throws if nessessary
// Context can be null, in which case the default context is used

public readonly struct BigFloat(EFloat value, EContext? context) : IEquatable<BigFloat>, IEquatable<EFloat>
{
	/// <summary>
	/// The EFloat value of this instance.
	/// </summary>
	public EFloat Value { get; } = value ?? throw new ArgumentNullException(nameof(value));

	/// <summary>
	/// Context for this BigFloat instance, if null, use the default context.
	/// </summary>
	public EContext Context => context ?? DefaultContext;

	/// <summary>
	/// Changing this immediately affects all instances without an explicit context.
	/// </summary>
	public static EContext DefaultContext { get; set; } = EContext.Unlimited;

#pragma warning disable CA2225 // Operator overloads have named alternates
	/// <summary>
	/// Implicit conversion from BigFloat to EFloat, helps with relativity functions that take EFloat.
	/// </summary>
	public static implicit operator EFloat(BigFloat bigFloat) => bigFloat.Value;
#pragma warning restore CA2225 // Operator overloads have named alternates

	public override readonly string ToString() => Value.ToString();

	public override readonly int GetHashCode() => HashCode.Combine(Value.GetHashCode(), Context.GetHashCode());

	public override readonly bool Equals(object? obj) => obj is BigFloat other && Equals(other);

	public readonly bool Equals(BigFloat other) => Value.Equals(other.Value) && Context.Equals(other.Context);

	public bool Equals(EFloat? other) => Value.Equals(other);

	public static bool operator ==(BigFloat left, BigFloat right) => left.Equals(right);

	public static bool operator !=(BigFloat left, BigFloat right) => !left.Equals(right);

	public static bool operator ==(BigFloat left, EFloat right) => left.Equals(right);

	public static bool operator !=(BigFloat left, EFloat right) => !left.Equals(right);

	/// <summary>
	/// Convert EFloat to BigFloat with default context.
	/// </summary>
	public static BigFloat FromEFloat(EFloat value) => new(value, null);

	/// <summary>
	/// Factory method from EFloat and explicit context
	/// </summary>
	public static BigFloat Build(EFloat value, EContext context) => new(value, context);

	public static BigFloat operator +(BigFloat left, BigFloat right) => Add(left, right);

	public static BigFloat operator +(BigFloat left, EFloat right) => Add(left, right);

	public static BigFloat operator +(BigFloat left, int right) => Add(left, right);

	public static BigFloat operator -(BigFloat left, BigFloat right) => Subtract(left, right);

	public static BigFloat operator -(BigFloat left, EFloat right) => Subtract(left, right);

	public static BigFloat operator -(BigFloat left, int right) => Subtract(left, right);

	public static BigFloat operator *(BigFloat left, BigFloat right) => Multiply(left, right);

	public static BigFloat operator *(BigFloat left, EFloat right) => Multiply(left, right);

	public static BigFloat operator *(BigFloat left, int right) => Multiply(left, right);

	public static BigFloat operator /(BigFloat left, BigFloat right) => Divide(left, right);

	public static BigFloat operator /(BigFloat left, EFloat right) => Divide(left, right);

	public static BigFloat operator /(BigFloat left, int right) => Divide(left, right);

	/// <summary>
	/// Negate an BigFloat instance.
	/// </summary>
	public static BigFloat operator -(BigFloat item) => Negate(item);

	/// <summary>
	/// Modulus of two BigFloat instances using the context of the left operand.
	/// </summary>
	public static BigFloat operator %(BigFloat left, BigFloat right) => Mod(left, right);

	/// <summary>
	/// Raise this BigFloat instance to the power of another BigFloat instance.
	/// </summary>
	public BigFloat Pow(int power) =>
		new(Value.Pow(power, Context), Context);

	/// <summary>
	/// Raise this BigFloat instance to the power of another BigFloat instance.
	/// </summary>
	public BigFloat Pow(BigFloat power) =>
		new(Value.Pow(power.Value, Context), Context);

	/// <summary>
	/// Square root of this BigFloat instance.
	/// </summary>
	/// <returns></returns>
	public BigFloat Sqrt() => new(Value.Sqrt(Context), Context);

	/// <summary>
	/// Absolute value of this BigFloat instance.
	/// </summary>
	/// <returns></returns>
	public BigFloat Abs() => new(Value.Abs(Context), Context);

	/// <summary>
	/// Add two BigFloat instances using the context of the left operand.
	/// </summary>
	public static BigFloat Add(BigFloat left, BigFloat right) =>
		new(
			left.Value.Add(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Add using the context of the left operand.
	/// </summary>
	public static BigFloat Add(BigFloat left, EFloat right) =>
		new(
			left.Value.Add(right, left.Context),
			left.Context
		);

	/// <summary>
	/// Add using the context of the left operand.
	/// </summary>
	public static BigFloat Add(BigFloat left, int right) =>
		new(
			left.Value.Add(right, left.Context),
			left.Context
		);

	/// <summary>
	/// Subtract two BigFloat instances using the context of the left operand.
	/// </summary>
	public static BigFloat Subtract(BigFloat left, BigFloat right) =>
		  new(
			left.Value.Subtract(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Subtract using the context of the left operand.
	/// </summary>
	public static BigFloat Subtract(BigFloat left, EFloat right) =>
		  new(
			left.Value.Subtract(right, left.Context),
			left.Context
		);


	/// <summary>
	/// Subtract using the context of the left operand.
	/// </summary>
	public static BigFloat Subtract(BigFloat left, int right) =>
		  new(
			left.Value.Subtract(right, left.Context),
			left.Context
		);

	/// <summary>
	/// Multiply two BigFloat instances using the context of the left operand.
	/// </summary>
	public static BigFloat Multiply(BigFloat left, BigFloat right) =>
		new(
			left.Value.Multiply(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Multiply using the context of the left operand.
	/// </summary>
	public static BigFloat Multiply(BigFloat left, EFloat right) =>
		new(
			left.Value.Multiply(right, left.Context),
			left.Context
		);

	/// <summary>
	/// Multiply using the context of the left operand.
	/// </summary>
	public static BigFloat Multiply(BigFloat left, int right) =>
		new(
			left.Value.Multiply(right, left.Context),
			left.Context
		);

	/// <summary>
	/// Divide two BigFloat instances using the context of the left operand.
	/// </summary>
	public static BigFloat Divide(BigFloat left, BigFloat right) =>
		new(
			left.Value.Divide(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Divide using the context of the left operand.
	/// </summary>
	public static BigFloat Divide(BigFloat left, EFloat right) =>
		new(
			left.Value.Divide(right, left.Context),
			left.Context
		);

	/// <summary>
	/// Divide using the context of the left operand.
	/// </summary>
	public static BigFloat Divide(BigFloat left, int right) =>
		new(
			left.Value.Divide(right, left.Context),
			left.Context
		);

	/// <summary>
	/// Negate an BigFloat instance.
	/// </summary>
	public static BigFloat Negate(BigFloat item) =>
		new(item.Value.Negate(item.Context), item.Context);

	/// <summary>
	/// Modulus of two BigFloat instances using the context of the left operand.
	/// </summary>
	public static BigFloat Mod(BigFloat left, BigFloat right) =>
		new(left.Value.Remainder(right.Value, left.Context), left.Context);

	// ====== Wrappers around hyperbolic trig functions ======

	public BigFloat Cosh() => new(Value.Cosh(Context), Context);

	public BigFloat Sinh() => new(Value.Sinh(Context), Context);

	public BigFloat Tanh() => new(Value.Tanh(Context), Context);

	public BigFloat Acosh() => new(Value.Acosh(Context), Context);

	public BigFloat Asinh() => new(Value.Asinh(Context), Context);

	public BigFloat Atanh() => new(Value.Atanh(Context), Context);
}
