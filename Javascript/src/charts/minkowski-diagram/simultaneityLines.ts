import { easeCubicInOut } from "d3-ease";
import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import type { MinkowskiData, ScaleSet } from "../minkowski-types";

export function renderSimultaneityLines(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: MinkowskiData,
	withTransition: boolean
): void {
	const ct = data.time * 299792.458;
	const x = data.distance;
	const extent = scales.maxCoord;
	const beta = data.velocity;
	const angle = Math.atan(beta);
	const cosAngle = Math.cos(angle);
	const sinAngle = Math.sin(angle);

	const simGroup = svg.select("g.simultaneity-lines");

	if (ct === 0 && x === 0) {
		simGroup.selectAll("line").remove();
		return;
	}

	const lineData = [
		{
			x1: -extent,
			y1: ct,
			x2: extent,
			y2: ct,
			color: D3_COLORS.electricBlue,
			frame: "original",
			line: "simultaneity",
		},
		{
			x1: x,
			y1: -extent,
			x2: x,
			y2: extent,
			color: D3_COLORS.electricBlue,
			frame: "original",
			line: "position",
		},
		{
			x1: x - (extent / cosAngle) * cosAngle,
			y1: ct - (extent / cosAngle) * sinAngle,
			x2: x + (extent / cosAngle) * cosAngle,
			y2: ct + (extent / cosAngle) * sinAngle,
			color: D3_COLORS.quantumGreen,
			frame: "moving",
			line: "simultaneity",
		},
		{
			x1: x - (extent / cosAngle) * sinAngle,
			y1: ct - (extent / cosAngle) * cosAngle,
			x2: x + (extent / cosAngle) * sinAngle,
			y2: ct + (extent / cosAngle) * cosAngle,
			color: D3_COLORS.quantumGreen,
			frame: "moving",
			line: "position",
		},
	];

	const lines = simGroup
		.selectAll("line")
		.data(lineData)
		.join("line")
		.attr("class", d => `simultaneity-${d.frame}`)
		.attr("data-line", d => d.line)
		.attr("stroke", d => `${d.color}${D3_COLORS.simultaneity}`)
		.attr("stroke-width", 1.5)
		.attr("stroke-dasharray", "3,3");

	if (withTransition) {
		lines
			.transition()
			.duration(600)
			.ease(easeCubicInOut)
			.attr("x1", d => scales.xScale(d.x1))
			.attr("y1", d => scales.yScale(d.y1))
			.attr("x2", d => scales.xScale(d.x2))
			.attr("y2", d => scales.yScale(d.y2));
	} else {
		lines
			.attr("x1", d => scales.xScale(d.x1))
			.attr("y1", d => scales.yScale(d.y1))
			.attr("x2", d => scales.xScale(d.x2))
			.attr("y2", d => scales.yScale(d.y2));
	}
}
