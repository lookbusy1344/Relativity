import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import * as rl from "../../relativity_lib";
import type { ScaleSet } from "../minkowski-types";
import type { TwinParadoxMinkowskiData } from "./types";
import { formatVelocityMs } from "./geometry";

export function renderLabels(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: TwinParadoxMinkowskiData,
	departure: { ct: number; x: number },
	turnaround: { ct: number; x: number },
	arrival: { ct: number; x: number },
	size: number
): void {
	const labelsGroup = svg.select("g.labels");

	const eventLabels = [
		{ text: "Departure", x: departure.x, y: departure.ct, dx: -60, dy: 15 },
		{ text: "Turnaround", x: turnaround.x, y: turnaround.ct, dx: 10, dy: -15 },
		{ text: "Arrival", x: arrival.x, y: arrival.ct, dx: -50, dy: -15 },
	];

	labelsGroup
		.selectAll("text.event-label")
		.data(eventLabels)
		.join("text")
		.attr("class", "event-label label")
		.attr("x", d => scales.xScale(d.x) + d.dx)
		.attr("y", d => scales.yScale(d.y) + d.dy)
		.attr("fill", D3_COLORS.plasmaWhite)
		.attr("text-anchor", "start")
		.text(d => d.text);

	const infoData = [
		{
			text: `Velocity: ${formatVelocityMs(data.velocityC)} m/s`,
			y: size - 75,
			color: D3_COLORS.plasmaWhite,
		},
		{
			text: `γ = ${rl.formatSignificant(data.gammaDecimal, "0", 3)}`,
			y: size - 60,
			color: D3_COLORS.plasmaWhite,
		},
		{
			text: `Proper time: ${rl.formatSignificant(data.properTimeYearsDecimal, "", 2, true)} years`,
			y: size - 45,
			color: D3_COLORS.quantumGreen,
		},
		{
			text: `Earth time: ${rl.formatSignificant(data.earthTimeYearsDecimal, "", 2, true)} years`,
			y: size - 30,
			color: D3_COLORS.electricBlue,
		},
	];

	labelsGroup
		.selectAll("text.info-label")
		.data(infoData)
		.join("text")
		.attr("class", "info-label header")
		.attr("x", size - 15)
		.attr("y", d => d.y)
		.attr("text-anchor", "end")
		.attr("fill", d => d.color)
		.text(d => d.text);

	const ageDifferenceDecimal = data.earthTimeYearsDecimal.minus(data.properTimeYearsDecimal);
	labelsGroup
		.selectAll("text.legend")
		.data([{ text: `Age difference: ${rl.formatSignificant(ageDifferenceDecimal, "0", 2)} years` }])
		.join("text")
		.attr("class", "legend header")
		.attr("x", size - 15)
		.attr("y", 25)
		.attr("text-anchor", "end")
		.attr("fill", D3_COLORS.photonGold)
		.text(d => d.text);
}
