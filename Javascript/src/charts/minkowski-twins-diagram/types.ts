import Decimal from "decimal.js";
import type { BaseController } from "../minkowski-types";

export interface TwinParadoxMinkowskiData {
	velocityC: number; // Velocity as fraction of c
	properTimeYears: number; // Proper time in years
	earthTimeYears: number; // Coordinate time in years
	distanceLY: number; // One-way distance in light years
	gamma: number; // Lorentz factor
	velocityCDecimal: Decimal;
	properTimeYearsDecimal: Decimal;
	earthTimeYearsDecimal: Decimal;
	distanceLYDecimal: Decimal;
	gammaDecimal: Decimal;
}

export interface TwinParadoxController extends BaseController {
	update(data: TwinParadoxMinkowskiData): void;
	updateSlider(velocityC: number): void;
}
