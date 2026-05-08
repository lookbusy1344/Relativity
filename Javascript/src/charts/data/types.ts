import Decimal from "decimal.js";

export type ChartDataPoint = {
	x: number;
	y: number;
	xDecimal: Decimal;
	yDecimal: Decimal;
};

export type ChartDataPointWithVelocity = {
	x: number;
	y: number;
	velocity: number;
	xDecimal: Decimal;
	yDecimal: Decimal;
	velocityDecimal: Decimal;
};
