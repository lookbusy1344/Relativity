using PeterO.Numbers;
using System;

namespace Relativity;

/// <summary>
/// EFloat math helpers, eg Cosh, Acosh
/// </summary>
internal static class EFloatHelpers
{
	private static readonly EFloat Two = EFloat.FromInt32(2);

	public static EFloat Cosh(this EFloat value, EContext ctx)
	{
		// [ \cosh(x) = \frac{e^x + e^{-x}}{2} ]
		var expX = value.Exp(ctx);
		var expNegX = value.Negate(ctx).Exp(ctx);
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
		// [ \tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}} ]
		var expX = value.Exp(ctx);
		var expNegX = value.Negate(ctx).Exp(ctx);
		var numerator = expX.Subtract(expNegX, ctx);
		var denominator = expX.Add(expNegX, ctx);
		return numerator.Divide(denominator, ctx);
	}

	public static EFloat Acosh(this EFloat value, EContext ctx)
	{
		// [ \text{acosh}(x) = \ln\left(x + \sqrt{x^2 - 1}\right) ]
		var squareMinusOne = value.Pow(2, ctx).Subtract(EFloat.One, ctx);
		var sqrt = squareMinusOne.Sqrt(ctx);
		var sum = value.Add(sqrt, ctx);
		return sum.Log(ctx);
	}

	public static EFloat Asinh(this EFloat value, EContext ctx)
	{
		// [ \text{asinh}(x) = \ln\left(x + \sqrt{x^2 + 1}\right) ]
		var squarePlusOne = value.Pow(2, ctx).Add(EFloat.One, ctx);
		var sqrt = squarePlusOne.Sqrt(ctx);
		var sum = value.Add(sqrt, ctx);
		return sum.Log(ctx);
	}

	public static EFloat Atanh(this EFloat value, EContext ctx)
	{
		// [ \text{atanh}(x) = \frac{1}{2} \ln\left(\frac{1 + x}{1 - x}\right) ]
		var numerator = value.Add(EFloat.One, ctx);
		var denominator = EFloat.One.Subtract(value, ctx);
		var fraction = numerator.Divide(denominator, ctx);
		var lnValue = fraction.Log(ctx);
		return lnValue.Divide(Two, ctx);
	}
}
