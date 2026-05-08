import { generateTwinParadoxChartData } from "../dataGeneration";
import { createDualTimeDatasets } from "./datasets";
import { updateChart } from "./lifecycle";
import type { ChartRegistry } from "./chartTypes";

export function updateTwinParadoxCharts(
	registry: ChartRegistry,
	data: ReturnType<typeof generateTwinParadoxChartData>
): ChartRegistry {
	let newRegistry = registry;

	const maxProperTime = Math.max(...data.travelingTwinAging.map(d => d.x));
	const maxEarthTime = Math.max(...data.earthTwinAging.map(d => d.y));

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

	return newRegistry;
}
