
using PeterO.Numbers;
using System;

namespace Relativity;

// This helper class wraps an EFloat with a context for calculations, so we can do
// (A + B) * C
// ..instead of..
// A.Add(B, context).Multiply(C, context)

public sealed class EFloatWithContext(EFloat value, EContext context) : IEquatable<EFloatWithContext>
{
	public EFloat Value { get; } = value;

	public EContext Context { get; } = context;

	public static EContext DefaultContext { get; set; } = EContext.Unlimited;

	public static EFloatWithContext operator +(EFloatWithContext left, EFloatWithContext right) => Add(left, right);

	public static EFloatWithContext operator -(EFloatWithContext left, EFloatWithContext right) => Subtract(left, right);

	public static EFloatWithContext operator *(EFloatWithContext left, EFloatWithContext right) => Multiply(left, right);

	public static EFloatWithContext operator /(EFloatWithContext left, EFloatWithContext right) => Divide(left, right);

	public override string ToString() => Value.ToString();

	public override int GetHashCode() => HashCode.Combine(Value.GetHashCode(), Context.GetHashCode());

	public override bool Equals(object? obj) => obj is EFloatWithContext other && Equals(other);

	public bool Equals(EFloatWithContext? other) => other is not null && Value.Equals(other.Value) && Context.Equals(other.Context);

	/// <summary>
	/// Implicitly convert an EFloatWithContext to an EFloat with default context.
	/// </summary>
	public static implicit operator EFloatWithContext(EFloat value) => FromEFloat(value);

	/// <summary>
	/// Convert EFloat to EFloatWithContext with default context.
	/// </summary>
	public static EFloatWithContext FromEFloat(EFloat value) => new(value, DefaultContext);

	/// <summary>
	/// Factory method from EFloat and explicit context
	/// </summary>
	public static EFloatWithContext Build(EFloat value, EContext context) => new(value, context);

	/// <summary>
	/// Add two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Add(EFloatWithContext left, EFloatWithContext right)
	{
		ArgumentNullException.ThrowIfNull(left);
		ArgumentNullException.ThrowIfNull(right);

		return new EFloatWithContext(
			left.Value.Add(right.Value, left.Context),
			left.Context
		);
	}

	/// <summary>
	/// Subtract two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Subtract(EFloatWithContext left, EFloatWithContext right)
	{
		ArgumentNullException.ThrowIfNull(left);
		ArgumentNullException.ThrowIfNull(right);

		return new EFloatWithContext(
			left.Value.Subtract(right.Value, left.Context),
			left.Context
		);
	}

	/// <summary>
	/// Multiply two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Multiply(EFloatWithContext left, EFloatWithContext right)
	{
		ArgumentNullException.ThrowIfNull(left);
		ArgumentNullException.ThrowIfNull(right);

		return new EFloatWithContext(
			left.Value.Multiply(right.Value, left.Context),
			left.Context
		);
	}

	/// <summary>
	/// Divide two EFloatWithContext instances using the context of the left operand.
	/// </summary>
	public static EFloatWithContext Divide(EFloatWithContext left, EFloatWithContext right)
	{
		ArgumentNullException.ThrowIfNull(left);
		ArgumentNullException.ThrowIfNull(right);

		return new EFloatWithContext(
			left.Value.Divide(right.Value, left.Context),
			left.Context
		);
	}
}
