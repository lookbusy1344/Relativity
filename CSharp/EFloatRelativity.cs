﻿using PeterO.Numbers;
using System.Runtime.CompilerServices;

namespace Relativity;

// These utilities are based on the EFloat class from PeterO.Numbers, which is an arbitrary-precision decimal class
// These may be inferior to the Python mpmath versions

using FourMomentum = (EFloat energy, EFloat momentum);
using Interval = (EFloat x, EFloat y, EFloat z, EFloat time);
using SimplifiedInterval = (EFloat x, EFloat time);

internal sealed class EFloatRelativity
{
	public readonly EFloat C;
	public readonly EFloat G;
	public readonly EFloat LIGHT_YR;
	public readonly EFloat AU;
	public readonly EFloat SECONDS_IN_YEAR;

	private const string PRECISION_ERR = "Calculated velocity at or above C, increase EContext precision";
	private readonly EFloat C_SQUARED;
	private readonly BigFloat Half;
	private readonly BigFloat One;
	private readonly BigFloat C_B;
	private readonly BigFloat CSQUARED_B;

	/// <summary>
	/// The context for all calculations
	/// </summary>
	public EContext Context { get; }

	/// <summary>
	/// Create a new EFloatRelativity instance with default context
	/// </summary>
	public EFloatRelativity() : this(300) { }

	/// <summary>
	/// Create a new EFloatRelativity instance with custom precision
	/// </summary>
	public EFloatRelativity(int precision)
	{
		Context = BuildContext(precision);

		// Populate constants with required precision
		C = EFloat.FromString("299792458", Context); // m/s
		C_SQUARED = C.Pow(2, Context);
		G = EFloat.FromString("9.80665", Context); // m/s^2
		LIGHT_YR = EFloat.FromString("9460730472580800", Context); // metres
		AU = EFloat.FromString("149597870700", Context); // metres
		SECONDS_IN_YEAR = EFloat.FromString("31557600", Context); // seconds

		// Populate the BigFloats now we have a context
		Half = B(EFloat.FromString("0.5", Context));
		One = B(EFloat.One);
		C_B = B(C);
		CSQUARED_B = B(C_SQUARED);
	}

	public static EContext BuildContext(int precision)
	{
		// Default exponent range is from -2147483648 to 2147483647, here set them to -9000000000 to 9000000000
		var exponentMax = EInteger.FromString("9000000000");
		return EContext.ForPrecisionAndRounding(precision, ERounding.HalfEven)
			.WithBigExponentRange(EInteger.Zero.Subtract(exponentMax), exponentMax);
	}

	/// <summary>
	/// Check this velocity is less than C in m/s
	/// </summary>
	private EFloat CheckVelocity(EFloat velocity, string msg = "Velocity must be less than C")
	{
		if (velocity.Abs(Context).CompareTo(C) >= 0) {
			throw new ArgumentException(msg);
		}

		return velocity;
	}

	/// <summary>
	/// Check this velocity is less than C in m/s and return BigFloat
	/// </summary>
	private BigFloat CheckVelocityB(EFloat velocity, string msg = "Velocity must be less than C") =>
		B(CheckVelocity(velocity, msg));

	/// <summary>
	/// Turn given number of days into seconds
	/// </summary>
	/// <returns>Seconds</returns>
	public EFloat Days(double days) => B(days) * (60 * 60 * 24);

	/// <summary>
	/// Turn given number of light years into metres
	/// </summary>
	/// <returns>Metres</returns>
	public EFloat LightYears(double lightYears) => B(lightYears) * LIGHT_YR;

	/// <summary>
	/// Turns fraction of C into a velocity in m/s
	/// </summary>
	/// <param name="fraction">Fraction of c, must be less than 1.0</param>
	/// <returns>Velocity in m/s</returns>
	public EFloat FractionOfC(EFloat fraction)
	{
		if (fraction.Abs(Context).CompareTo(One) >= 0) {
			throw new ArgumentException("Fraction of c must be less than 1.0");
		}
		return CheckVelocity(C_B * fraction, PRECISION_ERR);
	}

	/// <summary>
	/// Calculate relativistic velocity for a given acceleration and proper time
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="tau">Proper time in s</param>
	/// <returns>Velocity in m/s</returns>
	public EFloat RelativisticVelocity(EFloat accel, EFloat tau) =>
		// c * tanh(a * tau / c)
		C_B * Tanh(B(accel) * tau / C_B);

	/// <summary>
	/// Calculate distance travelled for a given acceleration and proper time
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="tau">Proper time in s</param>
	/// <returns>Distance in m</returns>
	public EFloat RelativisticDistance(EFloat accel, EFloat tau) =>
		// (csquared / a) * (cosh(a * tau / c) - one)
		(CSQUARED_B / accel * Cosh(B(accel) * tau / C_B)) - 1;

	/// <summary>
	/// Calculate proper time for a given acceleration and distance, how long it takes to travel that distance
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="dist">Distance in m</param>
	/// <returns>Proper time in s</returns>
	public EFloat RelativisticTimeForDistance(EFloat accel, EFloat dist) =>
		// (c / a) * acosh((dist * a) / csquared + one)
		C_B / accel * Acosh((B(dist) * accel / CSQUARED_B) + 1);

	/// <summary>
	/// Calculate distance travelled for a given acceleration and velocity. Newtonian physics not relativistic
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="time">Time in s</param>
	/// <returns>Distance in m</returns>
	public EFloat SimpleDistance(EFloat accel, EFloat time) =>
		// 0.5 * a * t**2
		Half * accel * B(time).Pow(2);

	/// <summary>
	/// Calculate the rapidity for a given velocity
	/// </summary>
	/// <param name="velocity">Velocify in m/s</param>
	/// <returns>Rapidity</returns>
	public EFloat RapidityFromVelocity(EFloat velocity) =>
		// atanh(velocity / c)
		Atanh(CheckVelocityB(velocity) / C_B);

	/// <summary>
	/// Calculate velocity for a given rapidity
	/// </summary>
	/// <param name="rapidity">Rapidity</param>
	/// <returns>Velocity in m/s</returns>
	public EFloat VelocityFromRapidity(EFloat rapidity) =>
		// c * tanh(rapidity)
		CheckVelocity(C_B * Tanh(rapidity), PRECISION_ERR);

	/// <summary>
	/// Add two velocities relativistically. The velocities must be less than c
	/// </summary>
	public EFloat AddVelocities(EFloat v1, EFloat v2) =>
		// (v1 + v2) / (one + (v1 * v2) / csquared)
		(CheckVelocityB(v1) + CheckVelocityB(v2)) / (One + ((B(v1) * v2) / CSQUARED_B));

	/// <summary>
	/// Calculate coordinate time for a given acceleration and proper time
	/// </summary>
	/// <param name="accel">Constant acceleration in m/s^2</param>
	/// <param name="tau">Proper time in s</param>
	/// <returns>Coordinate time in s</returns>
	public EFloat CoordinateTime(EFloat accel, EFloat tau) =>
		// (c / a) * sinh(a * tau / c)
		(C_B / accel) * Sinh(B(accel) * tau / C_B);

	/// <summary>
	/// Calculate the length contraction factor for a given length and velocity
	/// </summary>
	/// <param name="len">Proper length in m</param>
	/// <param name="velocity">Velocity in m/s</param>
	/// <returns>Contracted length in m</returns>
	public EFloat LengthContractionVelocity(EFloat len, EFloat velocity) =>
		// len * sqrt(one - (velocity / c) ** 2)
		B(len) / (One - (CheckVelocityB(velocity) / C_B).Pow(2)).Sqrt();

	/// <summary>
	/// Calculate Lorentz factor for a given velocity
	/// </summary>
	/// <param name="velocity">Velocity in m/s</param>
	/// <returns>Lorentz factor</returns>
	public EFloat LorentzFactor(EFloat velocity) =>
		// 1 / sqrt(1 - (velocity / c) ** 2)
		One / (One - (CheckVelocityB(velocity) / C_B).Pow(2)).Sqrt();

	/// <summary>
	/// Calculate the velocity under constant proper acceleration and coordinate time
	/// </summary>
	/// <param name="accel">Proper acceleration in m/s^2</param>
	/// <param name="t">Coordinate time in s</param>
	/// <returns>Velocity in m/s</returns>
	public EFloat RelativisticVelocityCoord(EFloat accel, EFloat t) =>
		// (a * t) / sqrt(one + (a * t / c) ** 2)
		(B(accel) * t) / (One + (B(accel) * t / C_B).Pow(2)).Sqrt();

	/// <summary>
	/// Calculate the distance traveled under constant proper acceleration and coordinate time
	/// </summary>
	/// <param name="accel">Proper acceleration in m/s^2</param>
	/// <param name="t">Coordinate time in s</param>
	/// <returns>The coordinate distance traveled in m</returns>
	public EFloat RelativisticDistanceCoord(EFloat accel, EFloat t) =>
		// (csquared / a) * (sqrt(one + (a * t / c) ** 2) - one)
		(CSQUARED_B / accel) * ((One + (B(accel) * t / C_B).Pow(2)).Sqrt() - 1);

	/// <summary>
	/// Calculate the relativistic momentum
	/// </summary>
	/// <param name="mass">Rest mass in kg</param>
	/// <param name="velocity">Velocity in m/s</param>
	/// <returns>The relativistic momentum (kg m/s)</returns>
	public EFloat RelativisticMomentum(EFloat mass, EFloat velocity) =>
		// mass * velocity * gamma
		B(mass) * CheckVelocityB(velocity) * LorentzFactor(velocity);

	/// <summary>
	/// Calculate the relativistic energy.
	/// </summary>
	/// <param name="mass">Rest mass in kg</param>
	/// <param name="velocity">Velocity in m/s</param>
	/// <returns>The total relativistic energy (joules)</returns>
	public EFloat RelativisticEnergy(EFloat mass, EFloat velocity) =>
		// mass * csquared * gamma
		B(mass) * CSQUARED_B * LorentzFactor(velocity);

	/// <summary>
	/// Calculate the relativistic Doppler shift for light
	/// </summary>
	/// <param name="frequency">Emitted frequency (Hz)</param>
	/// <param name="velocity">Velocity (m/s)</param>
	/// <param name="source_moving_towards">Is the source approaching / retreating</param>
	/// <returns>Observed frequency (Hz)</returns>
	public EFloat DopplerShift(EFloat frequency, EFloat velocity, bool source_moving_towards = true)
	{
		var beta = CheckVelocityB(velocity) / C_B;
		if (source_moving_towards) {
			return B(frequency) * ((One + beta) / (One - beta)).Sqrt();
		} else {
			return B(frequency) * ((One - beta) / (One + beta)).Sqrt();
		}
	}

	/// <summary>
	/// Calculate the invariant (proper) mass of a system from energy and momentum
	/// </summary>
	/// <param name="energy">The total energy (J)</param>
	/// <param name="momentum">The total momentum (kg m/s)</param>
	/// <returns>Proper mass in kg</returns>
	public EFloat InvariantMassFromEnergyMomentum(EFloat energy, EFloat momentum) =>
		// sqrt((energy / csquared) ** 2 - (p / csquared) ** 2)
		((B(energy) / CSQUARED_B).Pow(2) - (B(momentum) / CSQUARED_B).Pow(2)).Sqrt();

	/// <summary>
	/// Calculate the four-momentum of a particle
	/// </summary>
	/// <param name="mass">Rest mass in kg</param>
	/// <param name="velocity">Velocity in m/s</param>
	/// <returns>Tuple of energy (j) and momentum (kg·m/s)</returns>
	public FourMomentum FourMomentum(EFloat mass, EFloat velocity)
	{
		var gamma = B(LorentzFactor(velocity)); // this checks velocity is less than C
		var energy = B(mass) * CSQUARED_B * gamma;
		var momentum = B(mass) * velocity * gamma;
		return (energy, momentum);
	}

	/// <summary>
	/// Calculate the invariant interval between two events in 1D space (x, time)
	/// </summary>
	/// <param name="event1">x, time for event 1</param>
	/// <param name="event2">x, time for event 2</param>
	/// <returns>The invariant interval (spacetime interval squared, or seconds^2 - meters^2 / c^2)</returns>
	public EFloat InvariantInterval(SimplifiedInterval event1, SimplifiedInterval event2) =>
		// delta_t**2 - (delta_x**2) / csquared
		(B(event2.time) - event1.time).Pow(2) - ((B(event2.x) - event1.x).Pow(2) / CSQUARED_B);

	/// <summary>
	/// Calculate the invariant interval between two events in 3D space (x, y, z, time)
	/// </summary>
	/// <param name="event1">x, y, z, time for event 1</param>
	/// <param name="event2">x, y, z, time for event 2</param>
	/// <returns>The invariant interval (spacetime interval squared, or seconds^2 - meters^2 / c^2)</returns>
	public EFloat InvariantInterval(Interval event1, Interval event2) =>
		// delta_t**2 - (delta_x**2 + delta_y**2 + delta_z**2) / csquared
		(B(event2.time) - event1.time).Pow(2) - ((
			(B(event2.x) - event1.x).Pow(2) +
			(B(event2.y) - event1.y).Pow(2) +
			(B(event2.z) - event1.z).Pow(2)
		) / CSQUARED_B);

	// ====== Wrappers around hyperbolic trig functions ======

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat Cosh(EFloat f) => BigFloat.Build(f.Cosh(Context), Context);

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat Sinh(EFloat f) => BigFloat.Build(f.Sinh(Context), Context);

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat Tanh(EFloat f) => BigFloat.Build(f.Tanh(Context), Context);

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat Atanh(EFloat f) => BigFloat.Build(f.Atanh(Context), Context);

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat Acosh(EFloat f) => BigFloat.Build(f.Acosh(Context), Context);

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat Asinh(EFloat f) => BigFloat.Build(f.Asinh(Context), Context);

	// ================= Helpers to create BigFloats from EFloat or double =================

	/// <summary>
	/// Helper to create a BigFloat from an EFloat, using instance context
	/// </summary>
	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat B(EFloat f) => BigFloat.Build(f, Context);

	/// <summary>
	/// Helper to create a BigFloat from a double, using instance context
	/// </summary>
	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	private BigFloat B(double d) => BigFloat.Build(EFloat.FromDouble(d), Context);
}
