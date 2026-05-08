/**
 * Functional chart management with Chart.js
 * Provides configuration factories and lifecycle management
 */

import { Chart } from "chart.js";
import {
	createArrowIndicators,
	createDualTimeDatasets,
	createMassRemainingDatasets,
	createVelocityGradient,
	updateChart,
	type ChartRegistry,
} from "./chartjs";
import type {
	generateAccelChartData,
	generateFlipBurnChartData,
	generateVisualizationChartData,
} from "./dataGeneration";
export type { ChartRegistry, ChartStyleConfig, ChartDataset } from "./chartjs";
export { updateChart, destroyAll } from "./chartjs";

export function updateAccelCharts(
	registry: ChartRegistry,
	data: ReturnType<typeof generateAccelChartData>,
	nozzleEfficiency: number,
	timeModes: {
		velocity: "proper" | "coordinate";
		lorentz: "proper" | "coordinate";
		rapidity: "proper" | "coordinate";
	} = { velocity: "proper", lorentz: "proper", rapidity: "proper" }
): ChartRegistry {
	let newRegistry = registry;

	// Calculate max times for both proper and coordinate
	const maxProperTime = Math.max(...data.properTimeVelocity.map(d => d.x));
	const maxCoordTime = Math.max(...data.coordTimeVelocity.map(d => d.x));

	// Velocity Chart - x-axis based on selected mode
	const velocityXMax = timeModes.velocity === "proper" ? maxProperTime : maxCoordTime;
	newRegistry = updateChart(
		newRegistry,
		"accelVelocityChart",
		createDualTimeDatasets(
			data.properTimeVelocity,
			data.coordTimeVelocity,
			"Velocity vs Proper Time",
			"Velocity vs Coordinate Time"
		),
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Time (days)",
			yAxisLabel: "Velocity (fraction of c)",
			xMax: velocityXMax,
		}
	);

	// Lorentz/Time Dilation Chart - x-axis based on selected mode
	const lorentzXMax = timeModes.lorentz === "proper" ? maxProperTime : maxCoordTime;
	newRegistry = updateChart(
		newRegistry,
		"accelLorentzChart",
		createDualTimeDatasets(
			data.properTimeTimeDilation,
			data.coordTimeTimeDilation,
			"Time Dilation vs Proper Time (1/γ)",
			"Time Dilation vs Coordinate Time (1/γ)"
		),
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Time (days)",
			yAxisLabel: "Time Rate (1 = normal)",
			xMax: lorentzXMax,
			yMax: 1,
		}
	);

	// Rapidity Chart - x-axis based on selected mode
	const rapidityXMax = timeModes.rapidity === "proper" ? maxProperTime : maxCoordTime;
	newRegistry = updateChart(
		newRegistry,
		"accelRapidityChart",
		createDualTimeDatasets(
			data.properTimeRapidity,
			data.coordTimeRapidity,
			"Rapidity vs Proper Time",
			"Rapidity vs Coordinate Time"
		),
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Time (days)",
			yAxisLabel: "Rapidity",
			xMax: rapidityXMax,
		}
	);

	// Mass Remaining Chart
	newRegistry = updateChart(
		newRegistry,
		"accelMassChart",
		createMassRemainingDatasets(data.properTimeMassRemaining, nozzleEfficiency),
		{
			primaryColor: "#ffaa00",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Proper Time (days)",
			yAxisLabel: "% of Initial Mass",
			xMax: maxProperTime,
			yMax: 100,
		}
	);

	// Velocity over Distance
	const posVelCanvas = document.getElementById(
		"accelPositionVelocityChart"
	) as HTMLCanvasElement | null;
	if (posVelCanvas) {
		if (newRegistry.has("accelPositionVelocity")) {
			newRegistry.get("accelPositionVelocity")?.destroy();
		}
		newRegistry.set(
			"accelPositionVelocity",
			createPositionVelocityChart(posVelCanvas, data.positionVelocity)
		);
	}

	// Spacetime Worldline
	const spacetimeCanvas = document.getElementById(
		"accelSpacetimeChart"
	) as HTMLCanvasElement | null;
	if (spacetimeCanvas) {
		if (newRegistry.has("accelSpacetime")) {
			newRegistry.get("accelSpacetime")?.destroy();
		}
		newRegistry.set(
			"accelSpacetime",
			createSpacetimeChart(spacetimeCanvas, data.spacetimeWorldline)
		);
	}

	return newRegistry;
}

export function updateFlipBurnCharts(
	registry: ChartRegistry,
	data: ReturnType<typeof generateFlipBurnChartData>,
	nozzleEfficiency: number,
	timeModes: {
		velocity: "proper" | "coordinate";
		lorentz: "proper" | "coordinate";
		rapidity: "proper" | "coordinate";
	} = { velocity: "proper", lorentz: "proper", rapidity: "proper" }
): ChartRegistry {
	let newRegistry = registry;

	// Calculate max x values for both proper and coordinate time
	const maxProperTime = Math.max(...data.properTimeVelocity.map(d => d.x));
	const maxCoordTime = Math.max(...data.coordTimeVelocity.map(d => d.x));
	const maxMassProperTime = Math.max(...data.properTimeMassRemaining.map(d => d.x));

	// Velocity Chart - x-axis based on selected mode
	const velocityChartXMax = timeModes.velocity === "proper" ? maxProperTime : maxCoordTime;
	newRegistry = updateChart(
		newRegistry,
		"flipVelocityChart",
		createDualTimeDatasets(
			data.properTimeVelocity,
			data.coordTimeVelocity,
			"Velocity vs Proper Time",
			"Velocity vs Coordinate Time"
		),
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Time (years)",
			yAxisLabel: "Velocity (fraction of c)",
			xMax: velocityChartXMax,
		}
	);

	// Time Dilation / Lorentz Chart - x-axis based on selected mode
	const lorentzChartXMax = timeModes.lorentz === "proper" ? maxProperTime : maxCoordTime;
	newRegistry = updateChart(
		newRegistry,
		"flipLorentzChart",
		createDualTimeDatasets(
			data.properTimeLorentz,
			data.coordTimeLorentz,
			"Time Dilation vs Proper Time (1/γ)",
			"Time Dilation vs Coordinate Time (1/γ)"
		),
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Time (years)",
			yAxisLabel: "Time Rate (1 = normal)",
			xMax: lorentzChartXMax,
			yMax: 1,
		}
	);

	// Rapidity Chart - x-axis based on selected mode
	const rapidityChartXMax = timeModes.rapidity === "proper" ? maxProperTime : maxCoordTime;
	newRegistry = updateChart(
		newRegistry,
		"flipRapidityChart",
		createDualTimeDatasets(
			data.properTimeRapidity,
			data.coordTimeRapidity,
			"Rapidity vs Proper Time",
			"Rapidity vs Coordinate Time"
		),
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Time (years)",
			yAxisLabel: "Rapidity",
			xMax: rapidityChartXMax,
		}
	);

	// Mass Remaining Chart
	newRegistry = updateChart(
		newRegistry,
		"flipMassChart",
		createMassRemainingDatasets(data.properTimeMassRemaining, nozzleEfficiency),
		{
			primaryColor: "#ffaa00",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Proper Time (years)",
			yAxisLabel: "% of Initial Mass",
			xMax: maxMassProperTime,
			yMax: 100,
		}
	);

	// Velocity over Distance (with separate accel/decel phases)
	const posVelCanvas = document.getElementById(
		"flipPositionVelocityChart"
	) as HTMLCanvasElement | null;
	if (posVelCanvas) {
		if (newRegistry.has("flipPositionVelocity")) {
			newRegistry.get("flipPositionVelocity")?.destroy();
		}
		newRegistry.set(
			"flipPositionVelocity",
			createPositionVelocityFlipBurnChart(
				posVelCanvas,
				data.positionVelocityAccel,
				data.positionVelocityDecel
			)
		);
	}

	// Spacetime Worldline
	const spacetimeCanvas = document.getElementById("flipSpacetimeChart") as HTMLCanvasElement | null;
	if (spacetimeCanvas) {
		if (newRegistry.has("flipSpacetime")) {
			newRegistry.get("flipSpacetime")?.destroy();
		}
		newRegistry.set(
			"flipSpacetime",
			createSpacetimeChart(spacetimeCanvas, data.spacetimeWorldline)
		);
	}

	return newRegistry;
}

export function updateVisualizationCharts(
	registry: ChartRegistry,
	data: ReturnType<typeof generateVisualizationChartData>
): ChartRegistry {
	let newRegistry = registry;
	const maxTime = data.timePoints[data.timePoints.length - 1];

	// Velocity Chart
	newRegistry = updateChart(
		newRegistry,
		"velocityChart",
		[
			{
				label: "Velocity (fraction of c)",
				data: data.timePoints.map((x, i) => ({ x, y: data.velocityC[i] })),
				borderColor: "#00d9ff",
				backgroundColor: "rgba(0, 217, 255, 0.15)",
				borderWidth: 2,
				fill: true,
				tension: 0.4,
			},
		],
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00d9ff",
			xAxisLabel: "Proper Time (days)",
			yAxisLabel: "Velocity (c)",
			xMax: maxTime,
			yMax: 1,
		}
	);

	// Distance Chart
	newRegistry = updateChart(
		newRegistry,
		"distanceChart",
		[
			{
				label: "Distance (light years)",
				data: data.timePoints.map((x, i) => ({ x, y: data.distanceLy[i] })),
				borderColor: "#00ff9f",
				backgroundColor: "rgba(0, 255, 159, 0.15)",
				borderWidth: 2,
				fill: true,
				tension: 0.4,
			},
		],
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Proper Time (days)",
			yAxisLabel: "Distance (ly)",
			xMax: maxTime,
		}
	);

	// Rapidity Chart
	newRegistry = updateChart(
		newRegistry,
		"rapidityChart",
		[
			{
				label: "Rapidity",
				data: data.timePoints.map((x, i) => ({ x, y: data.rapidity[i] })),
				borderColor: "#ffaa00",
				backgroundColor: "rgba(255, 170, 0, 0.15)",
				borderWidth: 2,
				fill: true,
				tension: 0.4,
			},
		],
		{
			primaryColor: "#ffaa00",
			secondaryColor: "#ffaa00",
			xAxisLabel: "Proper Time (days)",
			yAxisLabel: "Rapidity",
			xMax: maxTime,
		}
	);

	// Time Dilation & Length Contraction Chart
	const timeDilationData = data.timePoints.map((x, i) => ({ x, y: data.timeDilation[i] }));
	newRegistry = updateChart(
		newRegistry,
		"lorentzChart",
		[
			{
				label: "Time Dilation (1/γ)",
				data: timeDilationData,
				borderColor: "#00ff9f",
				backgroundColor: "rgba(0, 255, 159, 0.15)",
				borderWidth: 2,
				fill: true,
				tension: 0.4,
				yAxisID: "y",
			},
			{
				label: "Length Contraction (1/γ)",
				data: timeDilationData,
				borderColor: "#ffaa00",
				backgroundColor: "rgba(255, 170, 0, 0.1)",
				borderWidth: 2,
				fill: false,
				tension: 0.4,
				borderDash: [5, 5],
				yAxisID: "y1",
			},
		],
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Proper Time (days)",
			yAxisLabel: "Time Rate (1 = normal)",
			xMax: maxTime,
			yMax: 1,
			y1AxisLabel: "Length (1 = no contraction)",
			y1Max: 1,
		}
	);

	return newRegistry;
}

function createPositionVelocityChart(
	canvas: HTMLCanvasElement,
	data: { x: number; y: number }[]
): Chart {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas context");

	// Create velocity-based gradient
	const gradient = createVelocityGradient(ctx, canvas.height, {
		high: "#ffaa00", // amber at high velocity (top)
		mid: "#00ff9f", // scientific green at mid
		low: "#00d9ff", // electric cyan at low velocity (bottom)
	});

	// Add directional arrow indicators at intervals
	const { pointRadii, pointStyles, pointRotations } = createArrowIndicators(data, [0, 25, 50, 75]);

	return new Chart(ctx, {
		type: "line",
		data: {
			datasets: [
				{
					label: "Trajectory",
					data: data,
					borderColor: gradient,
					backgroundColor: "rgba(0, 217, 255, 0.15)",
					borderWidth: 3,
					pointRadius: pointRadii,
					pointStyle: pointStyles,
					pointRotation: pointRotations,
					pointBackgroundColor: "#00d9ff",
					tension: 0.4,
					fill: true,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			aspectRatio: 2.5,
			plugins: {
				title: {
					display: false,
				},
				legend: { display: false },
			},
			scales: {
				x: {
					type: "linear",
					title: {
						display: true,
						text: "Distance (light years)",
						color: "#00d9ff",
						font: { size: 14 },
					},
					grid: { color: "rgba(0, 217, 255, 0.1)" },
					ticks: { color: "#e8f1f5" },
				},
				y: {
					type: "linear",
					min: 0,
					max: 1,
					title: {
						display: true,
						text: "Velocity (c)",
						color: "#00d9ff",
						font: { size: 14 },
					},
					grid: { color: "rgba(0, 217, 255, 0.1)" },
					ticks: { color: "#e8f1f5" },
				},
			},
		},
	});
}

function createPositionVelocityFlipBurnChart(
	canvas: HTMLCanvasElement,
	accelData: { x: number; y: number }[],
	decelData: { x: number; y: number }[]
): Chart {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas context");

	// Create velocity-based gradients with different color schemes for each phase
	const accelGradient = createVelocityGradient(ctx, canvas.height, {
		high: "#ffaa00", // amber at high velocity (top)
		mid: "#00ff9f", // scientific green at mid
		low: "#00d9ff", // electric cyan at low velocity (bottom)
	});

	const decelGradient = createVelocityGradient(ctx, canvas.height, {
		high: "#ff55aa", // magenta at high velocity (top)
		mid: "#aa55ff", // purple at mid
		low: "#5588ff", // blue at low velocity (bottom)
	});

	// Add directional indicators for acceleration and deceleration phases
	const {
		pointRadii: accelPointRadii,
		pointStyles: accelPointStyles,
		pointRotations: accelPointRotations,
	} = createArrowIndicators(accelData, [0, 17, 34, 50]);
	const {
		pointRadii: decelPointRadii,
		pointStyles: decelPointStyles,
		pointRotations: decelPointRotations,
	} = createArrowIndicators(decelData, [0, 16, 33, 49]);

	return new Chart(ctx, {
		type: "line",
		data: {
			datasets: [
				{
					label: "Acceleration",
					data: accelData,
					borderColor: accelGradient,
					backgroundColor: "rgba(0, 217, 255, 0.2)",
					borderWidth: 3,
					pointRadius: accelPointRadii,
					pointStyle: accelPointStyles,
					pointRotation: accelPointRotations,
					pointBackgroundColor: accelGradient,
					tension: 0.4,
					fill: true,
				},
				{
					label: "Deceleration",
					data: decelData,
					borderColor: decelGradient,
					backgroundColor: "rgba(170, 85, 255, 0.15)",
					borderWidth: 3,
					pointRadius: decelPointRadii,
					pointStyle: decelPointStyles,
					pointRotation: decelPointRotations,
					pointBackgroundColor: decelGradient,
					tension: 0.4,
					fill: true,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			aspectRatio: 2.5,
			plugins: {
				title: {
					display: false,
				},
				legend: {
					display: true,
					labels: {
						color: "#e8f1f5",
						font: { family: "IBM Plex Mono", size: 11 },
					},
				},
			},
			scales: {
				x: {
					type: "linear",
					title: {
						display: true,
						text: "Distance (light years)",
						color: "#00d9ff",
						font: { size: 14 },
					},
					grid: { color: "rgba(0, 217, 255, 0.1)" },
					ticks: { color: "#e8f1f5" },
				},
				y: {
					type: "linear",
					min: 0,
					max: 1,
					title: {
						display: true,
						text: "Velocity (c)",
						color: "#00d9ff",
						font: { size: 14 },
					},
					grid: { color: "rgba(0, 217, 255, 0.1)" },
					ticks: { color: "#e8f1f5" },
				},
			},
		},
	});
}

function createSpacetimeChart(
	canvas: HTMLCanvasElement,
	data: { x: number; y: number; velocity?: number }[]
): Chart {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas context");

	// Find max values for light cone
	const maxTime = Math.max(...data.map(d => d.x));

	// Create velocity-based gradient (vertical, since distance is on y-axis)
	const gradient = createVelocityGradient(ctx, canvas.height, {
		high: "#ffaa00", // amber at far distance (high velocity region)
		mid: "#00ff9f", // scientific green at mid
		low: "#00d9ff", // electric cyan at near distance (low velocity)
	});

	return new Chart(ctx, {
		type: "line",
		data: {
			datasets: [
				{
					label: "Worldline",
					data: data,
					borderColor: gradient,
					backgroundColor: "rgba(0, 217, 255, 0.15)",
					borderWidth: 3,
					pointRadius: 0,
					tension: 0.4,
					fill: true,
				},
				{
					label: "Light Cone",
					data: [
						{ x: 0, y: 0 },
						{ x: maxTime, y: maxTime },
					],
					borderColor: "rgba(255, 170, 0, 0.3)",
					borderWidth: 1,
					borderDash: [5, 5],
					pointRadius: 0,
					fill: false,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			aspectRatio: 2.5,
			plugins: {
				title: {
					display: false,
				},
				legend: { display: false },
			},
			scales: {
				x: {
					type: "linear",
					title: {
						display: true,
						text: "Coordinate Time (years)",
						color: "#00d9ff",
						font: { size: 14 },
					},
					grid: { color: "rgba(0, 217, 255, 0.1)" },
					ticks: { color: "#e8f1f5" },
				},
				y: {
					type: "linear",
					title: {
						display: true,
						text: "Distance (light years)",
						color: "#00d9ff",
						font: { size: 14 },
					},
					grid: { color: "rgba(0, 217, 255, 0.1)" },
					ticks: { color: "#e8f1f5" },
				},
			},
		},
	});
}

export function updateTwinParadoxCharts(
	registry: ChartRegistry,
	data: ReturnType<typeof import("./dataGeneration").generateTwinParadoxChartData>
): ChartRegistry {
	let newRegistry = registry;

	// Calculate max values
	const maxProperTime = Math.max(...data.travelingTwinAging.map(d => d.x));
	const maxEarthTime = Math.max(...data.earthTwinAging.map(d => d.y));

	// Comparative Aging (Dual Timeline) Chart
	newRegistry = updateChart(
		newRegistry,
		"twinsAgingChart",
		[
			{
				label: "Traveling Twin",
				data: data.travelingTwinAging,
				borderColor: "#00d9ff",
				backgroundColor: "rgba(0, 217, 255, 0.1)",
				borderWidth: 2,
				fill: false,
				tension: 0,
				pointRadius: 0,
			},
			{
				label: "Earth Twin",
				data: data.earthTwinAging,
				borderColor: "#00ff9f",
				backgroundColor: "rgba(0, 255, 159, 0.1)",
				borderWidth: 2,
				fill: false,
				tension: 0,
				pointRadius: 0,
			},
		],
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Proper Time - Traveling Twin (years)",
			yAxisLabel: "Age (years)",
			xMax: maxProperTime,
			yMax: maxEarthTime,
		}
	);

	// Distance from Earth Chart
	newRegistry = updateChart(
		newRegistry,
		"twinsDistanceChart",
		createDualTimeDatasets(
			data.properTimeDistance,
			data.coordTimeDistance,
			"Distance vs Proper Time",
			"Distance vs Coordinate Time"
		),
		{
			primaryColor: "#00d9ff",
			secondaryColor: "#00ff9f",
			xAxisLabel: "Time (years)",
			yAxisLabel: "Distance (light years)",
			yMin: 0,
		}
	);

	// Spacetime worldline now rendered with Minkowski diagram (D3)
	// See minkowski-twins.ts

	return newRegistry;
}
