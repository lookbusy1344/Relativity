import type { ChartOptions } from "chart.js";
import type { ChartStyleConfig } from "./chartTypes";

export function createChartOptions(config: ChartStyleConfig): ChartOptions {
	const baseOptions: ChartOptions = {
		responsive: true,
		plugins: {
			legend: {
				display: true,
				labels: {
					color: "#e8f1f5",
					font: { family: "IBM Plex Mono", size: 12 },
				},
			},
			title: { display: false },
		},
		scales: {
			x: {
				type: "linear",
				title: {
					display: true,
					text: config.xAxisLabel,
					color: "#00d9ff",
					font: { family: "IBM Plex Mono", size: 11, weight: 600 },
				},
				max: config.xMax,
				ticks: {
					maxTicksLimit: 10,
					color: "#e8f1f5",
					font: { family: "IBM Plex Mono" },
				},
				grid: {
					color: "rgba(0, 217, 255, 0.15)",
				},
			},
			y: {
				title: {
					display: true,
					text: config.yAxisLabel,
					color: "#00d9ff",
					font: { family: "IBM Plex Mono", size: 11, weight: 600 },
				},
				beginAtZero: config.yMin === undefined,
				max: config.yMax,
				min: config.yMin,
				ticks: {
					color: "#e8f1f5",
					font: { family: "IBM Plex Mono" },
				},
				grid: {
					color: "rgba(0, 217, 255, 0.15)",
				},
			},
		},
	};

	if (config.y1AxisLabel && baseOptions.scales) {
		baseOptions.scales.y1 = {
			type: "linear",
			display: true,
			position: "right",
			title: {
				display: true,
				text: config.y1AxisLabel,
				color: "#00d9ff",
				font: { family: "IBM Plex Mono", size: 11, weight: 600 },
			},
			beginAtZero: true,
			max: config.y1Max,
			ticks: {
				color: "#e8f1f5",
				font: { family: "IBM Plex Mono" },
			},
			grid: {
				drawOnChartArea: false,
			},
		};
	}

	return baseOptions;
}
