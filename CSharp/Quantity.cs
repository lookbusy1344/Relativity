using PeterO.Numbers;

namespace Relativity.Quantity;

// This is not for full-features units of measure. Its just a way to prevent accidental assignment of quantities
// of different types. It doesn't do any conversions, just stores the value in an EFloat
// eg kg = metre is not allowed

// BUT WHERE TO WE KEEP THE CONTEXT? Perhaps it makes more sense to just take EFloat param, and let the caller
// sort out the context eg:
// var x = new Quantity<Length>(EFloat.FromString("1.0", ctx));

/// <summary>
/// Typed quantity with a EFloat value
/// </summary>
/// <typeparam name="T">Marker type for length, velocity, time etc. This prevents unintented assignments but doesn't do any conversions</typeparam>
/// <param name="Value">EFloat for storing the quantity</param>
internal readonly record struct Quantity<T>(EFloat Value) where T : BaseQuantity
{
	public Quantity(double value) : this(EFloat.FromDouble(value)) { }

	public Quantity(int value) : this(EFloat.FromInt32(value)) { }

	public Quantity(string value) : this(EFloat.FromString(value)) { }

	/// <summary>
	/// Get the contained EFloat. Its possible it will be null, so throw if it is
	/// </summary>
	public EFloat Get() => Value ?? throw new ArgumentNullException(nameof(Value));

	public static implicit operator EFloat(Quantity<T> quantity) => quantity.Get();

	public static implicit operator Quantity<T>(EFloat value) => new(value);

	//public static Quantity<T> FromRatio(long numerator, long denominator) =>
	//	new(EFloat.FromInt64(numerator).Divide(EFloat.FromInt64(denominator)));
}

/// <summary>
/// Abstract class for quantity types
/// </summary>
internal abstract class BaseQuantity;

/// <summary>
/// Metres
/// </summary>
internal class Length : BaseQuantity;

/// <summary>
/// Seconds
/// </summary>
internal class Time : BaseQuantity;

/// <summary>
/// Kilograms
/// </summary>
internal class Mass : BaseQuantity;

/// <summary>
/// Metres per second
/// </summary>
internal class Velocity : BaseQuantity;

/// <summary>
/// Metres per second squared
/// </summary>
internal class Acceleration : BaseQuantity;

/// <summary>
/// Rapidity
/// </summary>
internal class Rapidity : BaseQuantity;

/// <summary>
/// Lorentz factor
/// </summary>
internal class LorentzFactor : BaseQuantity;
