import { easeCubicInOut } from "d3-ease";
import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import type { MinkowskiData, ScaleSet } from "../minkowski-types";

export function renderAxes(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: MinkowskiData,
	withTransition: boolean
): void {
	const extent = scales.maxCoord;
	const beta = data.velocity;
	const angle = Math.atan(beta);
	const cosAngle = Math.cos(angle);
	const sinAngle = Math.sin(angle);

	const axesGroup = svg.select("g.axes");

	const originalAxes = [
		{
			x1: 0,
			y1: -extent,
			x2: 0,
			y2: extent,
			color: D3_COLORS.electricBlue,
			frame: "original",
			axis: "ct",
			isTimeAxis: true,
		},
		{
			x1: -extent,
			y1: 0,
			x2: extent,
			y2: 0,
			color: D3_COLORS.electricBlue,
			frame: "original",
			axis: "x",
			isTimeAxis: false,
		},
	];

	const ctPrimeLength = extent / cosAngle;
	const xPrimeLength = extent / cosAngle;

	const movingAxes = [
		{
			x1: -ctPrimeLength * sinAngle,
			y1: -ctPrimeLength * cosAngle,
			x2: ctPrimeLength * sinAngle,
			y2: ctPrimeLength * cosAngle,
			color: D3_COLORS.quantumGreen,
			frame: "moving",
			axis: "ct'",
			isTimeAxis: true,
		},
		{
			x1: -xPrimeLength * cosAngle,
			y1: -xPrimeLength * sinAngle,
			x2: xPrimeLength * cosAngle,
			y2: xPrimeLength * sinAngle,
			color: D3_COLORS.quantumGreen,
			frame: "moving",
			axis: "x'",
			isTimeAxis: false,
		},
	];

	const allAxes = [...originalAxes, ...movingAxes];

	const axisLines = axesGroup
		.selectAll("line")
		.data(allAxes)
		.join("line")
		.attr("class", d => `axis-${d.frame}`)
		.attr("data-axis", d => d.axis)
		.attr("stroke", d => d.color)
		.attr("stroke-width", 3)
		.attr("stroke-dasharray", d => (d.isTimeAxis ? "10,5" : null))
		.attr("marker-end", d => (d.frame === "original" ? "url(#arrowBlue)" : "url(#arrowGreen)"))
		.style("cursor", "pointer");

	if (withTransition) {
		axisLines
			.transition()
			.duration(600)
			.ease(easeCubicInOut)
			.attr("x1", d => scales.xScale(d.x1))
			.attr("y1", d => scales.yScale(d.y1))
			.attr("x2", d => scales.xScale(d.x2))
			.attr("y2", d => scales.yScale(d.y2));
	} else {
		axisLines
			.attr("x1", d => scales.xScale(d.x1))
			.attr("y1", d => scales.yScale(d.y1))
			.attr("x2", d => scales.xScale(d.x2))
			.attr("y2", d => scales.yScale(d.y2));
	}
}
