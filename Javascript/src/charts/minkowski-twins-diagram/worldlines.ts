import { easeCubicInOut } from "d3-ease";
import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import type { ScaleSet } from "../minkowski-types";

export function renderWorldline(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	departure: { ct: number; x: number },
	turnaround: { ct: number; x: number },
	arrival: { ct: number; x: number },
	withTransition: boolean
): void {
	const worldlinesGroup = svg.select("g.worldlines");

	const earthPath = [
		{ x: departure.x, y: departure.ct },
		{ x: arrival.x, y: arrival.ct },
	];

	const earthLine = worldlinesGroup
		.selectAll("line.earth-worldline")
		.data([earthPath])
		.join("line")
		.attr("class", "earth-worldline")
		.attr("stroke", D3_COLORS.electricBlue)
		.attr("stroke-width", 3);

	if (withTransition) {
		earthLine
			.transition()
			.duration(600)
			.ease(easeCubicInOut)
			.attr("x1", d => scales.xScale(d[0].x))
			.attr("y1", d => scales.yScale(d[0].y))
			.attr("x2", d => scales.xScale(d[1].x))
			.attr("y2", d => scales.yScale(d[1].y));
	} else {
		earthLine
			.attr("x1", d => scales.xScale(d[0].x))
			.attr("y1", d => scales.yScale(d[0].y))
			.attr("x2", d => scales.xScale(d[1].x))
			.attr("y2", d => scales.yScale(d[1].y));
	}

	const travelPath = [departure, turnaround, arrival];
	const pathString = travelPath
		.map((p, i) => `${i === 0 ? "M" : "L"} ${scales.xScale(p.x)},${scales.yScale(p.ct)}`)
		.join(" ");

	const travelLine = worldlinesGroup
		.selectAll("path.travel-worldline")
		.data([pathString])
		.join("path")
		.attr("class", "travel-worldline")
		.attr("stroke", D3_COLORS.plasmaWhite)
		.attr("stroke-width", 4)
		.attr("fill", "none");

	if (withTransition) {
		travelLine
			.transition()
			.duration(600)
			.ease(easeCubicInOut)
			.attr("d", d => d);
	} else {
		travelLine.attr("d", d => d);
	}
}
