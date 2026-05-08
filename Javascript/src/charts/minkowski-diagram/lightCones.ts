import { easeCubicInOut } from "d3-ease";
import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import type { MinkowskiData, ScaleSet } from "../minkowski-types";

export function renderLightCones(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: MinkowskiData,
	withTransition: boolean
): void {
	const ct = data.time * 299792.458;
	const x = data.distance;
	const extent = scales.maxCoord;
	const largeExtent = extent * 2;

	const lightConesGroup = svg.select("g.light-cones");
	const backgroundGroup = svg.select("g.background");

	const mainFillData =
		ct !== 0 || x !== 0
			? [
					{
						points: [
							[0, 0],
							[extent, extent],
							[extent, -extent],
						],
						class: "future",
					},
					{
						points: [
							[0, 0],
							[-extent, -extent],
							[-extent, extent],
						],
						class: "past",
					},
				]
			: [];

	backgroundGroup
		.selectAll("polygon.main-cone-fill")
		.data(mainFillData)
		.join("polygon")
		.attr("class", "main-cone-fill")
		.attr("points", d =>
			d.points.map(p => `${scales.xScale(p[0])},${scales.yScale(p[1])}`).join(" ")
		)
		.attr("fill", `${D3_COLORS.photonGold}${D3_COLORS.lightConeFill}`)
		.attr("stroke", "none");

	const eventFillData =
		ct !== 0 || x !== 0
			? [
					{
						points: [
							[x, ct],
							[x + largeExtent, ct + largeExtent],
							[x + largeExtent, ct - largeExtent],
						],
						class: "future",
					},
					{
						points: [
							[x, ct],
							[x - largeExtent, ct - largeExtent],
							[x - largeExtent, ct + largeExtent],
						],
						class: "past",
					},
				]
			: [];

	backgroundGroup
		.selectAll("polygon.event-cone-fill")
		.data(eventFillData)
		.join("polygon")
		.attr("class", "event-cone-fill")
		.attr("points", d =>
			d.points.map(p => `${scales.xScale(p[0])},${scales.yScale(p[1])}`).join(" ")
		)
		.attr("fill", `${D3_COLORS.electricBlue}${D3_COLORS.lightConeFill}`)
		.attr("stroke", "none");

	const lineData = [
		{ x1: -extent, y1: -extent, x2: extent, y2: extent, from: "origin" },
		{ x1: -extent, y1: extent, x2: extent, y2: -extent, from: "origin" },
	];

	if (ct !== 0 || x !== 0) {
		lineData.push(
			{
				x1: x - largeExtent,
				y1: ct - largeExtent,
				x2: x + largeExtent,
				y2: ct + largeExtent,
				from: "event",
			},
			{
				x1: x - largeExtent,
				y1: ct + largeExtent,
				x2: x + largeExtent,
				y2: ct - largeExtent,
				from: "event",
			}
		);
	}

	const lines = lightConesGroup
		.selectAll("line")
		.data(lineData)
		.join("line")
		.attr("data-from", d => d.from)
		.attr("stroke", `${D3_COLORS.photonGold}${D3_COLORS.dashedLine}`)
		.attr("stroke-width", 2)
		.attr("stroke-dasharray", d => (d.from === "event" ? "2,3" : "5,5"))
		.style("cursor", "pointer");

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
