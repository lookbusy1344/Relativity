import type { Chart } from "chart.js";
import { distanceToSlider } from "../ui/sliderMath";

let pendingSliderValues: Record<string, number> = {};

export function applyPendingSliderValue(
	sliderId: string,
	valueDisplayId: string,
	unit: "days" | "years",
	chartId: string,
	chartRegistry: { current: Map<string, Chart> }
): void {
	const pendingValue = pendingSliderValues[sliderId];
	if (pendingValue !== undefined) {
		const slider = document.getElementById(sliderId) as HTMLInputElement;
		const valueDisplay = document.getElementById(valueDisplayId);

		if (slider) {
			const min = parseFloat(slider.min || "0");
			const max = parseFloat(slider.max || String(Number.MAX_SAFE_INTEGER));
			if (!isNaN(min) && !isNaN(max) && pendingValue >= min && pendingValue <= max) {
				slider.value = pendingValue.toString();
				if (valueDisplay) {
					valueDisplay.textContent = `${pendingValue.toFixed(unit === "days" ? 0 : 1)} ${unit}`;
				}

				try {
					const chart = chartRegistry.current.get(chartId);
					if (chart && chart.options.scales?.x) {
						chart.options.scales.x.max = pendingValue;
						chart.update("none");
					}
				} catch (error) {
					console.error(`Failed to update chart ${chartId} with slider value:`, error);
				}
			}
		}

		delete pendingSliderValues[sliderId];
	}
}

export function applyPendingDistanceSliderValue(
	sliderId: string,
	valueDisplayId: string,
	chartId: string,
	chartRegistry: { current: Map<string, Chart> }
): void {
	const pendingDistance = pendingSliderValues[sliderId];
	if (pendingDistance !== undefined) {
		const slider = document.getElementById(sliderId) as HTMLInputElement;
		const valueDisplay = document.getElementById(valueDisplayId);

		if (slider) {
			const maxDistance = parseFloat(slider.dataset.maxDistance || "100");

			if (pendingDistance >= 0 && pendingDistance <= maxDistance) {
				const sliderPercent = distanceToSlider(pendingDistance, maxDistance);
				slider.value = sliderPercent.toString();

				const displayValue =
					pendingDistance < 10 ? pendingDistance.toFixed(2) : pendingDistance.toFixed(1);
				if (valueDisplay) {
					valueDisplay.textContent = `${displayValue} ly`;
				}

				try {
					const chart = chartRegistry.current.get(chartId);
					if (chart && chart.options.scales?.x) {
						chart.options.scales.x.max = Math.max(0.01, pendingDistance);
						chart.options.scales.x.min = 0;
						chart.update("none");
					}
				} catch (error) {
					console.error(`Failed to update chart ${chartId} with slider value:`, error);
				}
			}
		}

		delete pendingSliderValues[sliderId];
	}
}
