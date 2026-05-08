import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import type { ScaleSet } from "../minkowski-types";

export function renderEvents(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	departure: { ct: number; x: number },
	turnaround: { ct: number; x: number },
	arrival: { ct: number; x: number }
): void {
	const eventsGroup = svg.select("g.events");

	const eventData = [
		{ x: departure.x, y: departure.ct, label: "Departure", color: D3_COLORS.plasmaWhite },
		{ x: turnaround.x, y: turnaround.ct, label: "Turnaround", color: D3_COLORS.photonGold },
		{ x: arrival.x, y: arrival.ct, label: "Arrival", color: D3_COLORS.plasmaWhite },
	];

	eventsGroup
		.selectAll("circle.event")
		.data(eventData)
		.join("circle")
		.attr("class", "event")
		.attr("data-label", d => d.label)
		.attr("cx", d => scales.xScale(d.x))
		.attr("cy", d => scales.yScale(d.y))
		.attr("r", 7)
		.attr("fill", d => d.color)
		.attr("stroke", "rgba(0, 0, 0, 0.5)")
		.attr("stroke-width", 2)
		.style("cursor", "pointer");
}
