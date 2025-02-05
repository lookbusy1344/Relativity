using PeterO.Numbers;
using System;

namespace Relativity;

/// <summary>
/// EFloat hyperbolic trigonometry functions
/// </summary>
internal static class HyperbolicTrig
{
	private static readonly EFloat Two = EFloat.FromInt32(2);

	public static EFloat Cosh(this EFloat value, EContext ctx)
	{
		// [ \cosh(x) = \frac{e^{x} + e^{-x}}{2} ]
		var expX = value.Exp(ctx);
		var expNegX = EFloat.One.Divide(expX, ctx);
		return expX.Add(expNegX, ctx).Divide(Two, ctx);
	}

	public static EFloat Sinh(this EFloat value, EContext ctx)
	{
		// [ \sinh(x) = \frac{e^x - e^{-x}}{2} ]
		var expX = value.Exp(ctx);
		var expNegX = value.Negate(ctx).Exp(ctx);
		return expX.Subtract(expNegX, ctx).Divide(Two, ctx);
	}

	public static EFloat Tanh(this EFloat value, EContext ctx)
	{
		// [ \tanh(x) = 1 - \frac{2}{e^{2x} + 1} ]
		var twoX = value.Multiply(Two, ctx);
		var expTwoX = twoX.Exp(ctx);
		var denominator = expTwoX.Add(EFloat.One, ctx);
		var fraction = EFloat.FromInt32(2).Divide(denominator, ctx);
		return EFloat.One.Subtract(fraction, ctx);
	}

	public static EFloat Acosh(this EFloat value, EContext ctx)
	{
		// [ \text{acosh}(x) = \ln\left(x + \sqrt{x^2 - 1}\right) ]
		if (value.CompareTo(EFloat.One) < 0) {
			throw new ArgumentOutOfRangeException(nameof(value), "Input must be greater than or equal to 1.");
		}
		var squareMinusOne = value.Pow(2, ctx).Subtract(EFloat.One, ctx);
		var sqrt = squareMinusOne.Sqrt(ctx);
		var sum = value.Add(sqrt, ctx);
		return sum.Log(ctx);
	}

	public static EFloat Asinh(this EFloat value, EContext ctx)
	{
		// [ \text{asinh}(x) = \ln\left(x + \sqrt{x^{2} + 1}\right) ]
		var squarePlusOne = value.Pow(2, ctx).Add(EFloat.One, ctx);
		var sqrt = squarePlusOne.Sqrt(ctx);
		var sum = value.Add(sqrt, ctx);
		return sum.Log(ctx);
	}

	public static EFloat Atanh(this EFloat value, EContext ctx)
	{
		// Domain: -1 < x < 1
		if (value.CompareTo(EFloat.One) >= 0 || value.CompareTo(EFloat.One.Negate(ctx)) <= 0) {
			throw new ArgumentOutOfRangeException(nameof(value), "Input must be between -1 and 1 (exclusive).");
		}
		var numerator = value.Add(EFloat.One, ctx);
		var denominator = EFloat.One.Subtract(value, ctx);
		var fraction = numerator.Divide(denominator, ctx);
		var lnValue = fraction.Log(ctx);
		return lnValue.Divide(Two, ctx);
	}

	//public static EFloat Recip(this EFloat value, EContext ctx) =>
	//	// [ \text{recip}(x) = \frac{1}{x} ]
	//	EFloat.One.Divide(value, ctx);
}
