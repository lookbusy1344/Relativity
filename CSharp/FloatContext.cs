
using PeterO.Numbers;
using System;

namespace Relativity;

// This helper class wraps an EFloat with a context for calculations, so we can do
// (A + B) * C
// ..instead of..
// A.Add(B, context).Multiply(C, context)

// We don't want the inner EFloat to be null, but it's always a possibility with structs
// eg var arr = new EFloatWithContext[10]; // all structs initialised to (null, null)
// so the Value property check and throw if nessessary

public readonly struct EFloatWithContext(EFloat value, EContext? context) : IEquatable<EFloatWithContext>
{
	/// <summary>
	/// The EFloat value of this instance.
	/// </summary>
	public EFloat Value { get; } = value ?? throw new ArgumentNullException(nameof(value));

	/// <summary>
	/// Context for this EFloatWithContext instance, if null, use the default context.
	/// </summary>
	public EContext Context => context ?? DefaultContext;

	/// <summary>
	/// Changing this immediately affects all instances without an explicit context.
	/// </summary>
	public static EContext DefaultContext { get; set; } = EContext.Unlimited;

	public override readonly string ToString() => Value.ToString();

	public override readonly int GetHashCode() => HashCode.Combine(Value?.GetHashCode() ?? -1, Context?.GetHashCode() ?? -1);

	public override readonly bool Equals(object? obj) => obj is EFloatWithContext other && Equals(other);

	public readonly bool Equals(EFloatWithContext other) => (Value?.Equals(other.Value) ?? other.Value is null)
		&& (Context?.Equals(other.Context) ?? other.Context is null);

	public static bool operator ==(EFloatWithContext left, EFloatWithContext right) => left.Equals(right);

	public static bool operator !=(EFloatWithContext left, EFloatWithContext right) => !left.Equals(right);

	/// <summary>
	/// Convert EFloat to EFloatWithContext with default context.
	/// </summary>
	public static EFloatWithContext FromEFloat(EFloat value) => new(value, null);

	/// <summary>
	/// Factory method from EFloat and explicit context
	/// </summary>
	public static EFloatWithContext Build(EFloat value, EContext context) => new(value, context);

	/// <summary>
	/// Use the left context to add two EFloatWithContext instances.
	/// </summary>
	public static EFloatWithContext operator +(EFloatWithContext left, EFloatWithContext right) => Add(left, right);

	/// <summary>
	/// Use the left context to subtract two EFloatWithContext instances.
	/// </summary>
	public static EFloatWithContext operator -(EFloatWithContext left, EFloatWithContext right) => Subtract(left, right);

	/// <summary>
	/// Use the left context to multiply two EFloatWithContext instances.
	/// </summary>
	public static EFloatWithContext operator *(EFloatWithContext left, EFloatWithContext right) => Multiply(left, right);

	/// <summary>
	/// Use the left context to divide two EFloatWithContext instances.
	/// </summary>
	public static EFloatWithContext operator /(EFloatWithContext left, EFloatWithContext right) => Divide(left, right);

	/// <summary>
	/// Negate an EFloatWithContext instance.
	/// </summary>
	public static EFloatWithContext operator -(EFloatWithContext item) => Negate(item);

	/// <summary>
	/// Modulus of two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext operator %(EFloatWithContext left, EFloatWithContext right) => Mod(left, right);

	/// <summary>
	/// Raise this EFloatWithContext instance to the power of another EFloatWithContext instance.
	/// </summary>
	public EFloatWithContext Pow(int power) =>
		new(Value.Pow(power, Context), Context);

	/// <summary>
	/// Raise this EFloatWithContext instance to the power of another EFloatWithContext instance.
	/// </summary>
	public EFloatWithContext Pow(EFloatWithContext power) =>
		new(Value.Pow(power.Value, Context), Context);

	/// <summary>
	/// Square root of this EFloatWithContext instance.
	/// </summary>
	/// <returns></returns>
	public EFloatWithContext Sqrt() => new(Value.Sqrt(Context), Context);

	/// <summary>
	/// Absolute value of this EFloatWithContext instance.
	/// </summary>
	/// <returns></returns>
	public EFloatWithContext Abs() => new(Value.Abs(Context), Context);

	/// <summary>
	/// Add two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Add(EFloatWithContext left, EFloatWithContext right) =>
		new(
			left.Value.Add(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Subtract two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Subtract(EFloatWithContext left, EFloatWithContext right) =>
		  new(
			left.Value.Subtract(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Multiply two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Multiply(EFloatWithContext left, EFloatWithContext right) =>
		new(
			left.Value.Multiply(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Divide two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Divide(EFloatWithContext left, EFloatWithContext right) =>
		new(
			left.Value.Divide(right.Value, left.Context),
			left.Context
		);

	/// <summary>
	/// Negate an EFloatWithContext instance.
	/// </summary>
	public static EFloatWithContext Negate(EFloatWithContext item) =>
		new(item.Value.Negate(item.Context), item.Context);

	/// <summary>
	/// Modulus of two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Mod(EFloatWithContext left, EFloatWithContext right) =>
		new(left.Value.Remainder(right.Value, left.Context), left.Context);

	// ====== Wrappers around hyperbolic trig functions ======

	public EFloatWithContext Cosh() => new(Value.Cosh(Context), Context);

	public EFloatWithContext Sinh() => new(Value.Sinh(Context), Context);

	public EFloatWithContext Tanh() => new(Value.Tanh(Context), Context);

	public EFloatWithContext Acosh() => new(Value.Acosh(Context), Context);

	public EFloatWithContext Asinh() => new(Value.Asinh(Context), Context);

	public EFloatWithContext Atanh() => new(Value.Atanh(Context), Context);
}
