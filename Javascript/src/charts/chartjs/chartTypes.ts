import { Chart } from "chart.js";
import type { ChartDataset as ChartJsDataset } from "chart.js";

export type ChartRegistry = Map<string, Chart>;

export type ChartStyleConfig = {
	primaryColor: string;
	secondaryColor: string;
	xAxisLabel: string;
	yAxisLabel: string;
	xMax?: number;
	yMax?: number;
	yMin?: number;
	y1AxisLabel?: string;
	y1Max?: number;
};

export type ChartDataset = ChartJsDataset<"line", { x: number; y: number }[]>;
