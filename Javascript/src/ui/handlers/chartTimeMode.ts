import type { ChartRegistry } from "../../charts/charts";

export const chartTimeModes: Record<string, "proper" | "coordinate"> = {
	accelVelocity: "proper",
	accelLorentz: "proper",
	accelRapidity: "proper",
	flipVelocity: "proper",
	flipLorentz: "proper",
	flipRapidity: "proper",
};

export function createChartTimeModeHandler(
	chartId: string,
	chartRegistry: { current: ChartRegistry }
): (mode: "proper" | "coordinate") => void {
	return (mode: "proper" | "coordinate") => {
		chartTimeModes[chartId] = mode;

		const buttons = document.querySelectorAll(`[data-chart="${chartId}"]`);
		buttons.forEach(btn => {
			const btnElement = btn as HTMLButtonElement;
			if (btnElement.dataset.mode === mode) {
				btnElement.classList.add("active");
			} else {
				btnElement.classList.remove("active");
			}
		});

		const chartName = chartId + "Chart";
		const chart = chartRegistry.current.get(chartName);

		if (chart && chart.data.datasets.length >= 2) {
			const properTimeData = chart.data.datasets[0].data as Array<{ x: number; y: number }>;
			const coordTimeData = chart.data.datasets[1].data as Array<{ x: number; y: number }>;

			const maxProperTime = Math.max(...properTimeData.map(d => d.x));
			const maxCoordTime = Math.max(...coordTimeData.map(d => d.x));
			const newXMax = mode === "proper" ? maxProperTime : maxCoordTime;

			if (chart.options.scales?.x) {
				chart.options.scales.x.max = newXMax;
				chart.update("none");
			}
		}
	};
}

export function getChartTimeModes() {
	return { ...chartTimeModes };
}

export function setChartTimeMode(chartId: string, mode: "proper" | "coordinate") {
	if (chartId in chartTimeModes) {
		chartTimeModes[chartId] = mode;
	}
}
