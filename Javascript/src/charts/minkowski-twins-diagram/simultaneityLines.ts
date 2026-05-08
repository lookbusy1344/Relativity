import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import type { ScaleSet } from "../minkowski-types";

export function renderSimultaneityLines(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	turnaround: { ct: number; x: number },
	beta: number,
	extent: number
): void {
	const simGroup = svg.select("g.simultaneity-lines");
	const angle = Math.atan(beta);
	const cosAngle = Math.cos(angle);
	const sinAngle = Math.sin(angle);
	const simLength = extent / cosAngle;

	const lineData = [
		{
			x1: -extent,
			y1: turnaround.ct,
			x2: extent,
			y2: turnaround.ct,
			color: D3_COLORS.electricBlue,
			class: "sim-earth",
			label: "Earth simultaneity",
		},
		{
			x1: turnaround.x - simLength * cosAngle,
			y1: turnaround.ct - simLength * sinAngle,
			x2: turnaround.x + simLength * cosAngle,
			y2: turnaround.ct + simLength * sinAngle,
			color: D3_COLORS.quantumGreen,
			class: "sim-outbound",
			label: "Outbound simultaneity",
		},
		{
			x1: turnaround.x - simLength * cosAngle,
			y1: turnaround.ct + simLength * sinAngle,
			x2: turnaround.x + simLength * cosAngle,
			y2: turnaround.ct - simLength * sinAngle,
			color: D3_COLORS.photonGold,
			class: "sim-inbound",
			label: "Inbound simultaneity",
		},
	];

	simGroup
		.selectAll("line.simultaneity")
		.data(lineData)
		.join("line")
		.attr("class", d => `simultaneity ${d.class}`)
		.attr("data-label", d => d.label)
		.attr("stroke", d => `${d.color}${D3_COLORS.simultaneity}`)
		.attr("stroke-width", 2)
		.attr("x1", d => scales.xScale(d.x1))
		.attr("y1", d => scales.yScale(d.y1))
		.attr("x2", d => scales.xScale(d.x2))
		.attr("y2", d => scales.yScale(d.y2))
		.style("cursor", "pointer");
}
