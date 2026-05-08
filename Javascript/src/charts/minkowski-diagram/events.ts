import { easeCubicInOut } from "d3-ease";
import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import type { MinkowskiData, ScaleSet } from "../minkowski-types";

export function renderEvents(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: MinkowskiData,
	withTransition: boolean
): void {
	const ct = data.time * 299792.458;
	const x = data.distance;

	const intervalGroup = svg.select("g.interval");
	if (ct !== 0 || x !== 0) {
		const intervalLine = intervalGroup
			.selectAll("line")
			.data([{ x1: 0, y1: 0, x2: x, y2: ct }])
			.join("line")
			.attr("stroke", D3_COLORS.plasmaWhite)
			.attr("stroke-width", 3);

		if (withTransition) {
			intervalLine
				.transition()
				.duration(600)
				.ease(easeCubicInOut)
				.attr("x1", d => scales.xScale(d.x1))
				.attr("y1", d => scales.yScale(d.y1))
				.attr("x2", d => scales.xScale(d.x2))
				.attr("y2", d => scales.yScale(d.y2));
		} else {
			intervalLine
				.attr("x1", d => scales.xScale(d.x1))
				.attr("y1", d => scales.yScale(d.y1))
				.attr("x2", d => scales.xScale(d.x2))
				.attr("y2", d => scales.yScale(d.y2));
		}
	} else {
		intervalGroup.selectAll("line").remove();
	}

	const eventsGroup = svg.select("g.events");

	let eventColor: string = D3_COLORS.plasmaWhite;
	if (data.intervalType === "timelike") {
		eventColor = D3_COLORS.timelike;
	} else if (data.intervalType === "spacelike") {
		eventColor = D3_COLORS.spacelike;
	} else if (data.intervalType === "lightlike") {
		eventColor = D3_COLORS.lightlike;
	}

	const timeDecimal = data.timeDecimal;
	const xDecimal = data.distanceDecimal;

	const eventData = [
		{
			x: 0,
			y: 0,
			color: D3_COLORS.plasmaWhite,
			radius: 8,
			label: "Origin",
			timeDecimal: "0",
			xDecimal: "0",
		},
		{
			x,
			y: ct,
			color: eventColor,
			radius: 8,
			label: "Event",
			timeDecimal: timeDecimal.toString(),
			xDecimal: xDecimal.toString(),
		},
	];

	const events = eventsGroup
		.selectAll("circle")
		.data(eventData)
		.join("circle")
		.attr("data-label", d => d.label)
		.attr("data-x", d => d.x)
		.attr("data-y", d => d.y)
		.attr("data-time-decimal", d => d.timeDecimal)
		.attr("data-x-decimal", d => d.xDecimal)
		.attr("r", d => d.radius)
		.attr("fill", d => d.color)
		.style("cursor", "pointer");

	if (withTransition) {
		events
			.transition()
			.duration(600)
			.ease(easeCubicInOut)
			.attr("cx", d => scales.xScale(d.x))
			.attr("cy", d => scales.yScale(d.y));
	} else {
		events.attr("cx", d => scales.xScale(d.x)).attr("cy", d => scales.yScale(d.y));
	}
}
