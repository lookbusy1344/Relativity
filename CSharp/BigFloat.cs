namespace Relativity;

using System;
using System.Runtime.CompilerServices;
using PeterO.Numbers;

// This helper class wraps an EFloat with a context for calculations, so we can do
// (A + B) * C
// ..instead of..
// A.Add(B, context).Multiply(C, context)

// We don't want the inner EFloat to be null, but it's always a possibility with structs
// eg var arr = new BigFloat[10]; // all structs initialised to (null, null)
// so the Value property checks and throws if necessary
// Context can be null, in which case the default context is used

// Framework design guidelines page 213, 'in' parameters "Do not pass value types by read-only reference (in)"
// and page 91, structs should represent a single value, be immutable and less than 24 bytes (3 references).
// BigFloat here represents a single value, is immutable and is 2 references (16 bytes on 64 bit systems)

#pragma warning disable CA2225 // Operator overloads have named alternates

[System.Diagnostics.DebuggerDisplay("{ToDebugString(),nq}")]
public readonly struct BigFloat(EFloat value, EContext? context) : IEquatable<BigFloat>, IComparable<BigFloat>, IComparable
{
	/// <summary>
	/// The EFloat value of this instance.
	/// Implemented this way, there is a backing field so the null check only happens once. This is what we want, in case BigFloat is zero-initialised (eg an BigFloat[])
	/// </summary>
	public readonly EFloat Value { get; } = value ?? throw new ArgumentNullException(nameof(value));

	/// <summary>
	/// Context for this BigFloat instance, if null, use the default context.
	/// Implemented this way, there is no backing field so any changes to DefaultContext are immediately reflected
	/// </summary>
	public readonly EContext Context => context ?? DefaultContext;

	/// <summary>
	/// Changing this immediately affects all instances without an explicit context.
	/// </summary>
	public static EContext DefaultContext { get; set; } = EContext.UnlimitedHalfEven;

	public override readonly string ToString() => Value.ToString();

	/// <summary>
	/// Debug string, highlighting any use of the default context, which may be unexpected.
	/// </summary>
	public readonly string ToDebugString() => Context == null ? $"default-{Value}" : Value.ToString();

	public override readonly int GetHashCode() => Value.GetHashCode(); // don't include the context, because it can be indirectly changed via DefaultContext

	public override readonly bool Equals(object? obj) => obj is BigFloat other && Equals(other);

	public readonly bool Equals(BigFloat other) => Value.Equals(other.Value); // don't check the context

	public readonly int CompareTo(BigFloat other) => Value.CompareTo(other.Value); // don't compare the context

	public readonly int CompareTo(EFloat other) => Value.CompareTo(other);

	public readonly int CompareTo(object? obj)
	{
#pragma warning disable IDE0046 // Convert to conditional expression
		if (obj == null) {
			return 1;
		}
#pragma warning restore IDE0046 // Convert to conditional expression

		return obj is BigFloat x ? CompareTo(x) : throw new ArgumentException("Comparison with invalid type", nameof(obj));
	}

	///// <summary>
	///// Convert EFloat to BigFloat with default context.
	///// </summary>
	//[MethodImpl(MethodImplOptions.AggressiveInlining)]
	//public static BigFloat FromEFloat(EFloat value) => new(value, null);

	/// <summary>
	/// Factory method from EFloat and explicit context
	/// </summary>
	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	public static BigFloat Build(EFloat value, EContext context) => new(value, context);

	// ====== Comparison operator overloads ======

	public static bool operator ==(BigFloat left, BigFloat right) => left.Equals(right);

	public static bool operator !=(BigFloat left, BigFloat right) => !left.Equals(right);

	public static bool operator <(BigFloat left, BigFloat right) => left.CompareTo(right) < 0;

	public static bool operator >(BigFloat left, BigFloat right) => left.CompareTo(right) > 0;

	public static bool operator <=(BigFloat left, BigFloat right) => left.CompareTo(right) <= 0;

	public static bool operator >=(BigFloat left, BigFloat right) => left.CompareTo(right) >= 0;

	// ====== Math operator overloads ======

	public static BigFloat operator +(BigFloat left, BigFloat right) => new(
		left.Value.Add(right.Value, left.Context),
		left.Context
	);

	public static BigFloat operator +(BigFloat left, EFloat right) => new(
		left.Value.Add(right, left.Context),
		left.Context
	);

	public static BigFloat operator -(BigFloat left, BigFloat right) => new(
		left.Value.Subtract(right.Value, left.Context),
		left.Context
	);

	public static BigFloat operator -(BigFloat left, EFloat right) => new(
		left.Value.Subtract(right, left.Context),
		left.Context
	);

	public static BigFloat operator *(BigFloat left, BigFloat right) => new(
		left.Value.Multiply(right.Value, left.Context),
		left.Context
		);

	public static BigFloat operator *(BigFloat left, EFloat right) => new(
		left.Value.Multiply(right, left.Context),
		left.Context
	);

	public static BigFloat operator /(BigFloat left, BigFloat right) => new(
		left.Value.Divide(right.Value, left.Context),
		left.Context
	);

	public static BigFloat operator /(BigFloat left, EFloat right) => new(
		left.Value.Divide(right, left.Context),
		left.Context
	);

	/// <summary>
	/// Negate an BigFloat instance.
	/// </summary>
	public static BigFloat operator -(BigFloat item) => Negate(item);

	/// <summary>
	/// Modulus of two BigFloat instances using the context of the left operand.
	/// </summary>
	public static BigFloat operator %(BigFloat left, BigFloat right) => Mod(left, right.Value);

	/// <summary>
	/// Modulus of BigFloat and EFloat using the context of the left operand.
	/// </summary>
	public static BigFloat operator %(BigFloat left, EFloat right) => Mod(left, right);

	/// <summary>
	/// Raise this BigFloat instance to the power of another BigFloat instance.
	/// </summary>
	public readonly BigFloat Pow(int power) => new(Value.Pow(power, Context), Context);

	/// <summary>
	/// Raise this BigFloat instance to the power of another BigFloat instance.
	/// </summary>
	public readonly BigFloat Pow(EFloat power) => new(Value.Pow(power, Context), Context);

	/// <summary>
	/// Square root of this BigFloat instance.
	/// </summary>
	/// <returns></returns>
	public readonly BigFloat Sqrt() => new(Value.Sqrt(Context), Context);

	/// <summary>
	/// Absolute value of this BigFloat instance.
	/// </summary>
	/// <returns></returns>
	public readonly BigFloat Abs() => new(Value.Abs(Context), Context);

	/// <summary>
	/// Negate an BigFloat instance
	/// </summary>
	public static BigFloat Negate(BigFloat item) =>
		new(item.Value.Negate(item.Context), item.Context);

	/// <summary>
	/// Modulus of two BigFloat instances using the context of the left operand
	/// </summary>
	public static BigFloat Mod(BigFloat left, EFloat right) =>
		new(left.Value.Remainder(right, left.Context), left.Context);

	// ====== Wrappers around hyperbolic trig functions ======

	//public readonly BigFloat Cosh() => new(Value.Cosh(Context), Context);

	//public readonly BigFloat Sinh() => new(Value.Sinh(Context), Context);

	//public readonly BigFloat Tanh() => new(Value.Tanh(Context), Context);

	//public readonly BigFloat Acosh() => new(Value.Acosh(Context), Context);

	//public readonly BigFloat Asinh() => new(Value.Asinh(Context), Context);

	//public readonly BigFloat Atanh() => new(Value.Atanh(Context), Context);
}
