
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
	public EContext Context { get; } = context ?? DefaultContext;

	/// <summary>
	/// Changing this immediately affects all instances without an explicit context.
	/// </summary>
	public static EContext DefaultContext { get; set; } = EContext.Unlimited;

	public override readonly string ToString() => Value.ToString();

	public override readonly int GetHashCode() => HashCode.Combine(Value?.GetHashCode() ?? -1, Context?.GetHashCode() ?? -1);

	public override readonly bool Equals(object? obj) => obj is EFloatWithContext other && Equals(other);

	public readonly bool Equals(EFloatWithContext other) => (Value?.Equals(other.Value) ?? other.Value is null)
		&& (Context?.Equals(other.Context) ?? other.Context is null);

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

	public static bool operator ==(EFloatWithContext left, EFloatWithContext right) => left.Equals(right);

	public static bool operator !=(EFloatWithContext left, EFloatWithContext right) => !left.Equals(right);
}
