import Decimal from "decimal.js";
import * as rl from "../../relativity_lib";
import { setElement } from "../domUtils";
import { drawMinkowskiDiagramD3, type MinkowskiData } from "../../charts/minkowski";

export function createSpacetimeIntervalHandler(
	getTime2Input: () => HTMLInputElement | null,
	getX2Input: () => HTMLInputElement | null,
	getVelocityInput: () => HTMLInputElement | null,
	getResultSquared: () => HTMLElement | null,
	getResultType: () => HTMLElement | null,
	getResultDeltaT: () => HTMLElement | null,
	getResultDeltaX: () => HTMLElement | null,
	getResultMinSep: () => HTMLElement | null,
	getResultVelocity: () => HTMLElement | null,
	onDiagramDrawn?: (
		container: HTMLElement,
		data: MinkowskiData,
		controller: ReturnType<typeof drawMinkowskiDiagramD3> | null
	) => void
): () => void {
	return () => {
		const time2Input = getTime2Input();
		const x2Input = getX2Input();
		const velocityInput = getVelocityInput();
		const resultSquared = getResultSquared();
		const resultType = getResultType();
		const resultDeltaT = getResultDeltaT();
		const resultDeltaX = getResultDeltaX();
		const resultMinSep = getResultMinSep();
		const resultVelocity = getResultVelocity();
		if (
			!time2Input ||
			!x2Input ||
			!velocityInput ||
			!resultSquared ||
			!resultType ||
			!resultDeltaT ||
			!resultDeltaX ||
			!resultMinSep ||
			!resultVelocity
		)
			return;

		// Validate and clamp inputs
		let t2Str = time2Input.value ?? "2";
		try {
			const t2Dec = rl.ensure(t2Str);
			if (t2Dec.lt(0.001)) {
				t2Str = "0.001";
				time2Input.value = "0.001";
			} else if (t2Dec.gt(1000000)) {
				t2Str = "1000000";
				time2Input.value = "1000000";
			}
		} catch {
			t2Str = "2";
			time2Input.value = "2";
		}

		let x2KmStr = x2Input.value ?? "299792.458";
		try {
			const x2KmDec = rl.ensure(x2KmStr);
			if (x2KmDec.lt(1)) {
				x2KmStr = "1";
				x2Input.value = "1";
			} else if (x2KmDec.gt(10000000000)) {
				x2KmStr = "10000000000";
				x2Input.value = "10000000000";
			}
		} catch {
			x2KmStr = "299792.458";
			x2Input.value = "299792.458";
		}

		let velocityCStr = velocityInput.value ?? "0.99";
		try {
			const velocityCDec = rl.ensure(velocityCStr);
			if (velocityCDec.lt(-0.999)) {
				velocityCStr = "-0.999";
				velocityInput.value = "-0.999";
			} else if (velocityCDec.gt(0.999)) {
				velocityCStr = "0.999";
				velocityInput.value = "0.999";
			}
		} catch {
			velocityCStr = "0.99";
			velocityInput.value = "0.99";
		}

		// Event 1 is always at (0, 0)
		const t1 = new Decimal(0);
		const x1 = new Decimal(0);

		const t2 = rl.ensure(t2Str);
		const x2Km = rl.ensure(x2KmStr);
		const velocityC = rl.ensure(velocityCStr);

		// Convert km to m for calculations
		const x2 = x2Km.mul(1000);

		// Calculate interval squared: s² = c²(Δt)² - (Δx)²
		const deltaT = t2.minus(t1);
		const deltaX = x2.minus(x1);
		const intervalSquared = rl.c.pow(2).mul(deltaT.pow(2)).minus(deltaX.pow(2));

		// Display interval squared in km²
		const intervalSquaredKm = intervalSquared.div(1000000);
		setElement(resultSquared, rl.formatSignificant(intervalSquaredKm, "0", 1), "km²");

		// Interpret the interval
		const tolerance = new Decimal(1e-10);
		if (intervalSquared.abs().lt(tolerance)) {
			// Lightlike interval
			setElement(resultType, "Lightlike: Light-speed connection", "");
			setElement(resultMinSep, "N/A (lightlike)", "");
			setElement(resultVelocity, "1c", "");
		} else if (intervalSquared.gt(0)) {
			// Timelike interval - causally connected
			const properTime = intervalSquared.sqrt().div(rl.c);
			setElement(
				resultType,
				`Timelike: ${rl.formatSignificant(properTime, "0", 3)} s - Events are causally connected`,
				""
			);

			// For timelike: minimum separation is proper time (in frame where events occur at same place)
			setElement(resultMinSep, rl.formatSignificant(properTime, "0", 3), "s");

			// Required velocity: v = Δx/Δt
			const requiredVel = deltaX.div(deltaT);
			const requiredVelC = requiredVel.div(rl.c);
			setElement(resultVelocity, rl.formatSignificant(requiredVelC, "9", 3), "c");
		} else {
			// Spacelike interval - not causally connected
			const properDistanceM = intervalSquared.abs().sqrt();
			const properDistanceKm = properDistanceM.div(1000);
			setElement(
				resultType,
				`Spacelike: ${rl.formatSignificant(properDistanceKm, "0", 1)} km - Events cannot be causally connected`,
				""
			);

			// For spacelike: minimum separation is proper distance (in frame where events are simultaneous)
			setElement(resultMinSep, rl.formatSignificant(properDistanceKm, "0", 3), "km");

			// Required velocity to make events simultaneous: v = c²Δt/Δx
			const requiredVel = rl.c.pow(2).mul(deltaT).div(deltaX);
			const requiredVelC = requiredVel.div(rl.c);
			setElement(resultVelocity, rl.formatSignificant(requiredVelC, "9", 3), "c");
		}

		// Calculate Lorentz transformation
		const v = velocityC.mul(rl.c); // Convert from c to m/s
		const gamma = rl.lorentzFactor(v);

		// Δt' = γ(Δt - vΔx/c²)
		const deltaTprime = gamma.mul(deltaT.minus(v.mul(deltaX).div(rl.c.pow(2))));

		// Δx' = γ(Δx - vΔt)
		const deltaXprimeM = gamma.mul(deltaX.minus(v.mul(deltaT)));
		const deltaXprimeKm = deltaXprimeM.div(1000);

		setElement(resultDeltaT, rl.formatSignificant(deltaTprime, "0", 3), "s");
		setElement(resultDeltaX, rl.formatSignificant(deltaXprimeKm, "0", 1), "km");

		// Draw Minkowski diagram
		const container = document.getElementById("minkowskiContainer");
		if (container) {
			// Determine interval type
			let intervalType: "timelike" | "spacelike" | "lightlike";
			if (intervalSquared.abs().lt(tolerance)) {
				intervalType = "lightlike";
			} else if (intervalSquared.gt(0)) {
				intervalType = "timelike";
			} else {
				intervalType = "spacelike";
			}

			const diagramData: MinkowskiData = {
				time: t2.toNumber(),
				distance: x2Km.toNumber(),
				velocity: velocityC.toNumber(),
				deltaTPrime: deltaTprime.toNumber(),
				deltaXPrime: deltaXprimeKm.toNumber(),
				intervalType,
				// Decimal versions for display
				timeDecimal: t2,
				distanceDecimal: x2Km,
				velocityDecimal: velocityC,
				deltaTPrimeDecimal: deltaTprime,
				deltaXPrimeDecimal: deltaXprimeKm,
			};

			// Notify caller that diagram was drawn (for resize handling)
			// The callback will handle creating or updating the diagram
			if (onDiagramDrawn) {
				onDiagramDrawn(container, diagramData, null);
			}
		}
	};
}
