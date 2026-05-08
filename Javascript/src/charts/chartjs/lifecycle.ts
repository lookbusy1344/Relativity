import { Chart } from "chart.js";
import type { ChartRegistry } from "./chartTypes";
import { createChartOptions } from "./chartOptions";
import type { ChartDataset } from "./chartTypes";
import type { ChartStyleConfig } from "./chartTypes";

export function updateChart(
	registry: ChartRegistry,
	canvasId: string,
	datasets: ChartDataset[],
	config: ChartStyleConfig
): ChartRegistry {
	const newRegistry = new Map(registry);

	newRegistry.get(canvasId)?.destroy();

	const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
	const ctx = canvas?.getContext("2d");
	if (ctx) {
		const chart = new Chart(ctx, {
			type: "line",
			data: { datasets },
			options: createChartOptions(config),
		});
		newRegistry.set(canvasId, chart);
		chart.update("none");
	}

	return newRegistry;
}

export function destroyAll(registry: ChartRegistry): ChartRegistry {
	registry.forEach(chart => chart.destroy());
	return new Map();
}
