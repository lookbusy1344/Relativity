import type { Selection } from "d3-selection";
import { createTooltip } from "../minkowski-core";

export function setupTooltips(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	container: HTMLElement
): void {
	const tooltip = createTooltip(container);

	svg
		.selectAll("g.axes line")
		.on("mouseenter", function (event: MouseEvent) {
			const axis = (this as SVGLineElement).getAttribute("data-axis");
			const axisName =
				axis === "ct"
					? "ct axis - Earth Frame (time)"
					: axis === "x"
						? "x axis - Earth Frame (space)"
						: axis === "ct₁'"
							? "ct₁' axis - Outbound Frame (time)"
							: axis === "x₁'"
								? "x₁' axis - Outbound Frame (space)"
								: axis === "ct₂'"
									? "ct₂' axis - Inbound Frame (time)"
									: "x₂' axis - Inbound Frame (space)";

			tooltip.show(axisName, event.clientX + 10, event.clientY + 10);
		})
		.on("mouseleave", () => {
			tooltip.hide();
		});

	svg
		.selectAll("g.events circle")
		.on("mouseenter", function (event: MouseEvent) {
			const label = (this as SVGCircleElement).getAttribute("data-label");
			tooltip.show(label || "", event.clientX + 10, event.clientY + 10);
		})
		.on("mouseleave", () => {
			tooltip.hide();
		});

	svg
		.selectAll("g.simultaneity-lines line")
		.on("mouseenter", function (event: MouseEvent) {
			const label = (this as SVGLineElement).getAttribute("data-label");
			tooltip.show(label || "", event.clientX + 10, event.clientY + 10);
		})
		.on("mouseleave", () => {
			tooltip.hide();
		});

	svg
		.selectAll("g.light-cones line")
		.on("mouseenter", function (event: MouseEvent) {
			tooltip.show("Light cone boundary (c)", event.clientX + 10, event.clientY + 10);
		})
		.on("mouseleave", () => {
			tooltip.hide();
		});
}
