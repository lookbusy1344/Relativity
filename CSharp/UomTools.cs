using UnitsNet;

namespace Relativity;

// Strongly typed classes for special relativity calculations
// These classes use units of measure, but are based on double (64-bit float) values so lack maximal precision.

#pragma warning disable RCS1231 // Make parameter ref read-only

/// <summary>
/// A struct representing a Lorentz factor, intentionally not convertible to a double. Implicit constructor is ok here
/// </summary>
internal readonly record struct LorentzFactor(double Value)
{
	public LorentzFactor(FractionOfC fraction) : this(1.0 / Math.Sqrt(1.0 - Math.Pow(fraction.Value, 2.0))) { }

	public LorentzFactor(Speed velocity) : this(1.0 / Math.Sqrt(1.0 - Math.Pow(Tools.CheckVelocity(velocity).MetersPerSecond / Tools.C_MPS, 2.0))) { }

	public LorentzFactor(Rapidity rapidity) : this(new FractionOfC(rapidity)) { }

	/// <summary>
	/// Calculate length contraction for a given proper length
	/// </summary>
	public Length LengthContraction(Length properLength) => properLength / Value;

	/// <summary>
	/// Calculate time dilation for a given proper time
	/// </summary>
	public Duration TimeDilation(Duration properTime) => properTime * Value;

	/// <summary>
	/// Calculate relativistic mass for a given rest mass
	/// </summary>
	public Mass RelativisticMass(Mass restMass) => restMass * Value;

	/// <summary>
	/// Calculate relativistic energy for a given rest mass
	/// </summary>
	public Energy RelativisticEnergy(Mass restMass) => Energy.FromJoules(restMass.Kilograms * Tools.C_SQUARED * Value);

	public override string ToString() => Value.ToString();
}

/// <summary>
/// A struct representing a fraction of the speed of light, intentionally not convertible to a double. No implicit constructor here so we check its not greater than 1.0
/// </summary>
internal readonly record struct FractionOfC
{
	public readonly double Value { get; }

	/// <summary>
	/// Create a new fraction of the speed of light
	/// </summary>
	public FractionOfC(double fraction) => Value = Math.Abs(fraction) < 1.0 ? fraction : throw new ArgumentException("Fraction of C must be less than 1.0");

	/// <summary>
	/// Create a new fraction of the speed of light from a rapidity
	/// </summary>
	public FractionOfC(Rapidity rapidity) : this(Math.Tanh(rapidity.Value)) { }

	/// <summary>
	/// Create a new fraction of the speed of light from a speed
	/// </summary>
	/// <param name="velocity">velocity to compare against C</param>
	/// <param name="checkC">should we error check values over C</param>
	public FractionOfC(Speed velocity, bool checkC = true) =>
		Value = (checkC ? Tools.CheckVelocity(velocity).MetersPerSecond : velocity.MetersPerSecond) / Tools.C_MPS;

	/// <summary>
	/// Convert the fraction of the speed of light to a speed
	/// </summary>
	public Speed ToSpeed() => Speed.FromMetersPerSecond(Tools.C_MPS * Value);

	/// <summary>
	/// Helper to get velocity from a fraction of C
	/// </summary>
	public static Speed GetSpeed(double fraction) => new FractionOfC(fraction).ToSpeed();

	public override string ToString() => Value.ToString();
}

/// <summary>
/// Special relativity rapidity, a measure of the hyperbolic angle between the velocity and the speed of light
/// </summary>
internal readonly record struct Rapidity(double Value)
{
	/// <summary>
	/// Create a new rapidity from speed (velocity)
	/// </summary>
	public Rapidity(Speed velocity) : this(Math.Atanh(Tools.CheckVelocity(velocity).MetersPerSecond / Tools.C_MPS)) { }

	/// <summary>
	/// Create a new rapidity from acceleration and time
	/// </summary>
	public Rapidity(Acceleration acc, Duration time) : this(acc.MetersPerSecondSquared * time.Seconds / Tools.C_MPS) { }

	/// <summary>
	/// Create a new rapidity from a fraction of the speed of light
	/// </summary>
	public Rapidity(FractionOfC fraction) : this(Math.Atanh(fraction.Value)) { }

	/// <summary>
	/// Convert the rapidity to a speed
	/// </summary>
	public Speed ToSpeed() => Speed.FromMetersPerSecond(Tools.C_MPS * Math.Tanh(Value));

	/// <summary>
	/// Rapidities can be added together
	/// </summary>
	public static Rapidity operator +(Rapidity r1, Rapidity r2) => new(r1.Value + r2.Value);

	public override string ToString() => Value.ToString();
}

internal static class Tools
{
	/// <summary>
	/// Speed of light in metres per second
	/// </summary>
	public const double C_MPS = 299_792_458.0;

	/// <summary>
	/// Speed of light squared, use instead of Math.Pow(C_MPS, 2.0)
	/// </summary>
	public const double C_SQUARED = C_MPS * C_MPS;

	/// <summary>
	/// Checks that the speed is less than the speed of light
	/// </summary>
	public static Speed CheckVelocity(Speed velocity) => Math.Abs(velocity.MetersPerSecond) < C_MPS ?
		velocity : throw new ArgumentException($"Speed must be less than C: {velocity.MetersPerSecond} metres per second");

	/// <summary>
	/// Calculate relativistic acceleration for a given constant acceleration and time
	/// </summary>
	public static Speed RelativisticAcceleration(Acceleration acceleration, Duration time) => Speed.FromMetersPerSecond(C_MPS * Math.Tanh((acceleration.MetersPerSecondSquared * time.Seconds) / C_MPS));

	/// <summary>
	/// Calculate the fraction of the speed of light for a given constant acceleration and time
	/// </summary>
	public static FractionOfC RelativisticAccelerationAsFraction(Acceleration acceleration, Duration time) => new(new Rapidity(acceleration, time));

	/// <summary>
	/// Calculate the relativistic acceleration for a given constant acceleration and time, starting from an initial velocity
	/// </summary>
	public static Speed RelativisticAccelerationAdd(Speed initialVelocity, Acceleration acceleration, Duration time)
	{
		// Rapidity is a useful concept in special relativity because it allows velocities to be added linearly, which is not the case for velocities themselves

		var initialRapidity = new Rapidity(initialVelocity);
		var accelerationRapidity = new Rapidity(acceleration, time);

		// Rapidity allows velocities to be added, which is not the case for velocities themselves
		var totalRapidity = initialRapidity + accelerationRapidity;
		return totalRapidity.ToSpeed();
	}

	/// <summary>
	/// Add two speeds using rapidity (relativistic velocity addition)
	/// </summary>
	public static Speed AddVelocitiesUsingRapidity(Speed v1, Speed v2)
	{
		var rapidity1 = new Rapidity(v1);
		var rapidity2 = new Rapidity(v2);
		var totalRapidity = rapidity1 + rapidity2;

		return totalRapidity.ToSpeed();
	}

	/// <summary>
	/// Relativistic velocity addition, using fractions of C, without using rapidity
	/// </summary>
	public static Speed AddVelocities2(Speed v1, Speed v2)
	{
		var fraction1 = new FractionOfC(v1);
		var fraction2 = new FractionOfC(v2);

		return Speed.FromMetersPerSecond(C_MPS * (fraction1.Value + fraction2.Value) / (1.0 + (fraction1.Value * fraction2.Value)));
	}

	/// <summary>
	/// Relativistic velocity addition, using speeds, without using rapidity
	/// </summary>
	public static Speed AddVelocities3(Speed v1, Speed v2)
	{
		var u = CheckVelocity(v1).MetersPerSecond;
		var v = CheckVelocity(v2).MetersPerSecond;
		var resultingVelocity = (u + v) / (1 + (u * v / C_SQUARED));
		return Speed.FromMetersPerSecond(resultingVelocity);
	}
}
