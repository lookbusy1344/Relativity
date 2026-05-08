import type { ChartDataset } from "./chartTypes";

type GradientColors = {
	high: string;
	mid: string;
	low: string;
};

export function createVelocityGradient(
	ctx: CanvasRenderingContext2D,
	height: number,
	colors: GradientColors
): CanvasGradient {
	const gradient = ctx.createLinearGradient(0, 0, 0, height);
	gradient.addColorStop(0, colors.high);
	gradient.addColorStop(0.5, colors.mid);
	gradient.addColorStop(1, colors.low);
	return gradient;
}

export function createArrowIndicators(
	data: { x: number; y: number }[],
	arrowIndices: number[]
): {
	pointRadii: number[];
	pointStyles: ("triangle" | "circle")[];
	pointRotations: number[];
} {
	const arrowSet = new Set(arrowIndices);
	const indexMap = new Map(arrowIndices.map((idx, pos) => [idx, pos]));

	const pointRadii = data.map((_, i) => (arrowSet.has(i) ? 4 : 0));
	const pointStyles = data.map((_, i) =>
		arrowSet.has(i) ? ("triangle" as const) : ("circle" as const)
	);
	const pointRotations = data.map((_, i) => {
		if (!arrowSet.has(i)) return 0;
		const pos = indexMap.get(i)!;
		if (pos === arrowIndices.length - 1) return 0;
		const nextArrowIdx = arrowIndices[pos + 1];
		const dx = data[nextArrowIdx].x - data[i].x;
		const dy = data[nextArrowIdx].y - data[i].y;
		return Math.atan2(dy, dx) + Math.PI / 2;
	});
	return { pointRadii, pointStyles, pointRotations };
}

export function createMassRemainingDatasets(
	data: { x: number; y: number }[],
	nozzleEfficiency: number
): ChartDataset[] {
	const efficiencyPercent = Math.round(nozzleEfficiency * 100);
	return [
		{
			label: `${efficiencyPercent}% Nozzle Efficiency`,
			data,
			borderColor: "#ffaa00",
			backgroundColor: "rgba(255, 170, 0, 0.1)",
			borderWidth: 2,
			fill: false,
			tension: 0.4,
			pointRadius: 0,
		},
	];
}

export function createDualTimeDatasets(
	properTimeData: { x: number; y: number }[],
	coordTimeData: { x: number; y: number }[],
	properLabel: string,
	coordLabel: string
): ChartDataset[] {
	return [
		{
			label: properLabel,
			data: properTimeData,
			borderColor: "#00d9ff",
			backgroundColor: "rgba(0, 217, 255, 0.1)",
			borderWidth: 2,
			fill: true,
			tension: 0.4,
			pointRadius: 0,
			clip: { top: 0, right: 0, bottom: 0, left: 0 },
		},
		{
			label: coordLabel,
			data: coordTimeData,
			borderColor: "#00ff9f",
			backgroundColor: "rgba(0, 255, 159, 0.1)",
			borderWidth: 2,
			fill: true,
			tension: 0.4,
			pointRadius: 0,
			clip: { top: 0, right: 0, bottom: 0, left: 0 },
		},
	];
}
