import type { ChartRegistry } from "../../charts/charts";
import { sliderToDistance } from "../sliderMath";

export function createMassChartSliderHandler(
	chartId: string,
	getSlider: () => HTMLInputElement | null,
	getValueDisplay: () => HTMLElement | null,
	unit: "days" | "years",
	chartRegistry: { current: ChartRegistry }
): () => void {
	return () => {
		const slider = getSlider();
		const valueDisplay = getValueDisplay();
		if (!slider || !valueDisplay) return;

		const newMax = parseFloat(slider.value);
		valueDisplay.textContent = `${newMax.toFixed(unit === "days" ? 0 : 1)} ${unit}`;

		const chart = chartRegistry.current.get(chartId);
		if (chart && chart.options.scales?.x) {
			chart.options.scales.x.max = newMax;
			chart.update("none");
		}
	};
}

export function initializeMassChartSlider(
	chartId: string,
	sliderId: string,
	valueDisplayId: string,
	unit: "days" | "years",
	chartRegistry: { current: ChartRegistry }
): void {
	const chart = chartRegistry.current.get(chartId);
	if (!chart || !chart.data.datasets.length) return;

	const data = chart.data.datasets[0].data as Array<{ x: number; y: number }>;
	const dataMax = Math.max(...data.map(d => d.x));
	const maxValue = Math.ceil(dataMax * 2) / 2;

	const slider = document.getElementById(sliderId) as HTMLInputElement;
	const valueDisplay = document.getElementById(valueDisplayId);
	if (slider && valueDisplay) {
		slider.max = maxValue.toString();
		slider.value = maxValue.toString();
		valueDisplay.textContent = `${maxValue.toFixed(unit === "days" ? 0 : 1)} ${unit}`;
	}
}

export function createPositionVelocitySliderHandler(
	chartId: string,
	getSlider: () => HTMLInputElement | null,
	getValueDisplay: () => HTMLElement | null,
	chartRegistry: { current: ChartRegistry }
): () => void {
	return () => {
		const slider = getSlider();
		const valueDisplay = getValueDisplay();
		if (!slider || !valueDisplay) return;

		const maxDistance = parseFloat(slider.dataset.maxDistance || slider.max);
		const sliderPercent = parseFloat(slider.value);
		const distance = sliderToDistance(sliderPercent, maxDistance);
		const chartDistance = Math.max(0.01, distance);

		const displayValue = distance < 10 ? distance.toFixed(2) : distance.toFixed(1);
		valueDisplay.textContent = `${displayValue} ly`;

		const chart = chartRegistry.current.get(chartId);
		if (chart && chart.options.scales?.x) {
			chart.options.scales.x.max = chartDistance;
			chart.options.scales.x.min = 0;
			chart.update("none");
		}
	};
}

export function initializePositionVelocitySlider(
	chartId: string,
	sliderId: string,
	valueDisplayId: string,
	chartRegistry: { current: ChartRegistry }
): void {
	const chart = chartRegistry.current.get(chartId);
	if (!chart || !chart.data.datasets.length) return;

	const maxValue = Math.max(
		...chart.data.datasets.flatMap(dataset => {
			const data = dataset.data as Array<{ x: number; y: number }>;
			return data.map(d => d.x);
		})
	);

	const slider = document.getElementById(sliderId) as HTMLInputElement;
	const valueDisplay = document.getElementById(valueDisplayId);
	if (slider && valueDisplay) {
		slider.min = "0";
		slider.max = "100";
		slider.step = "0.5";
		slider.value = "100";
		slider.dataset.maxDistance = maxValue.toString();
		valueDisplay.textContent = `${maxValue.toFixed(1)} ly`;
	}
}
