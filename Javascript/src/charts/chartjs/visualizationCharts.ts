import { generateVisualizationChartData } from "../dataGeneration";
import { updateChart } from "./lifecycle";
import type { ChartRegistry } from "./chartTypes";

export function updateVisualizationCharts(
	registry: ChartRegistry,
	data: ReturnType<typeof generateVisualizationChartData>
): ChartRegistry {
	let newRegistry = registry;
	const maxTime = data.timePoints[data.timePoints.length - 1];

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
