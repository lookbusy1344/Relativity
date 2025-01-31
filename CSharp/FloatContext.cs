
using PeterO.Numbers;
using System;

namespace Relativity;

// This helper class wraps an EFloat with a context for calculations, so we can do
// (A + B) * C
// ..instead of..
// A.Add(B, context).Multiply(C, context)

// We don't want the inner EFloat or EContext to be null, but it's always a possibility with structs
// eg var arr = new EFloatWithContext[10]; // all structs initialised to (null, null)
// so the Value and Context properties check and throw if nessessary

public readonly struct EFloatWithContext(EFloat value, EContext context) : IEquatable<EFloatWithContext>
{
	public EFloat Value { get; } = value ?? throw new ArgumentNullException(nameof(value));

	public EContext Context { get; } = context ?? throw new ArgumentNullException(nameof(context));

	/// <summary>
	/// Default context for all EFloatWithContext instances
	/// </summary>
	public static EContext DefaultContext { get; set; } = EContext.Unlimited;

	public static EFloatWithContext operator +(EFloatWithContext left, EFloatWithContext right) => Add(left, right);

	public static EFloatWithContext operator -(EFloatWithContext left, EFloatWithContext right) => Subtract(left, right);

	public static EFloatWithContext operator *(EFloatWithContext left, EFloatWithContext right) => Multiply(left, right);

	public static EFloatWithContext operator /(EFloatWithContext left, EFloatWithContext right) => Divide(left, right);

	public override readonly string ToString() => Value.ToString();

	public override readonly int GetHashCode() => HashCode.Combine(Value.GetHashCode(), Context.GetHashCode());

	public override readonly bool Equals(object? obj) => obj is EFloatWithContext other && Equals(other);

	public readonly bool Equals(EFloatWithContext other) => Value.Equals(other.Value) && Context.Equals(other.Context);

	///// <summary>
	///// Implicitly convert an EFloatWithContext to an EFloat with default context.
	///// </summary>
	//public static implicit operator EFloatWithContext(EFloat value) => FromEFloat(value);

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
		return new EFloatWithContext(
			left.Value.Divide(right.Value, left.Context),
			left.Context
		);
	}

	public static bool operator ==(EFloatWithContext left, EFloatWithContext right) => left.Equals(right);

	public static bool operator !=(EFloatWithContext left, EFloatWithContext right) => !left.Equals(right);
}
