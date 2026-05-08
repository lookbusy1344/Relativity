import { easeCubicInOut } from "d3-ease";
import { select, type Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import * as rl from "../../relativity_lib";
import { formatCoordinate } from "../minkowski-core";
import type { MinkowskiData, ScaleSet } from "../minkowski-types";

const SIZE = 900;

export function renderLabels(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: MinkowskiData,
	withTransition: boolean
): void {
	const ct = data.time * 299792.458;
	const x = data.distance;

	const c_km_per_s = rl.c.div(1000);
	const ctDecimal = data.timeDecimal.mul(c_km_per_s);
	const xDecimal = data.distanceDecimal;
	const ctPrimeDecimal = data.deltaTPrimeDecimal.mul(c_km_per_s);
	const xPrimeDecimal = data.deltaXPrimeDecimal;

	const labelsGroup = svg.select("g.labels");

	const labelData: Array<{
		text: string;
		x: number;
		y: number;
		dx: number;
		dy: number;
		color: string;
		class: string;
	}> = [
		{ text: "Origin", x: 0, y: 0, dx: 10, dy: -10, color: D3_COLORS.plasmaWhite, class: "label" },
	];

	if (ct !== 0 || x !== 0) {
		labelData.push({
			text: `(ct=${formatCoordinate(ctDecimal)}, x=${formatCoordinate(xDecimal)})`,
			x,
			y: ct,
			dx: 12,
			dy: -25,
			color: D3_COLORS.electricBlue,
			class: "label label-original",
		});
		labelData.push({
			text: `(ct'=${formatCoordinate(ctPrimeDecimal)}, x'=${formatCoordinate(xPrimeDecimal)})`,
			x,
			y: ct,
			dx: 12,
			dy: -8,
			color: D3_COLORS.quantumGreen,
			class: "label label-moving",
		});
	}

	const labels = labelsGroup
		.selectAll("text")
		.data(labelData)
		.join("text")
		.attr("class", d => d.class)
		.attr("fill", d => d.color)
		.attr("text-anchor", "start")
		.text(d => d.text);

	if (withTransition) {
		labels
			.transition()
			.duration(600)
			.ease(easeCubicInOut)
			.attr("x", d => scales.xScale(d.x) + d.dx)
			.attr("y", d => scales.yScale(d.y) + d.dy);
	} else {
		labels.attr("x", d => scales.xScale(d.x) + d.dx).attr("y", d => scales.yScale(d.y) + d.dy);
	}

	const causalData = ct !== 0 || x !== 0 ? [{ type: data.intervalType, y: SIZE - 35 }] : [];

	const causalIndicator = labelsGroup
		.selectAll("text.causal")
		.data(causalData)
		.join("text")
		.attr("class", "causal header")
		.attr("x", 15)
		.attr("y", d => d.y);

	causalIndicator.each(function (d) {
		const elem = select(this);
		elem.selectAll("tspan").remove();

		if (d.type === "timelike") {
			elem.attr("fill", D3_COLORS.timelike);
			elem.append("tspan").text("✓ CAUSALLY CONNECTED");
			elem
				.append("tspan")
				.attr("x", 15)
				.attr("dy", "1.2em")
				.attr("font-size", "13px")
				.attr("font-weight", "normal")
				.text("(Event inside light cone)");
		} else if (d.type === "spacelike") {
			elem.attr("fill", D3_COLORS.spacelike);
			elem.append("tspan").text("✗ NOT CAUSALLY CONNECTED");
			elem
				.append("tspan")
				.attr("x", 15)
				.attr("dy", "1.2em")
				.attr("font-size", "13px")
				.attr("font-weight", "normal")
				.text("(Event outside light cone)");
		} else {
			elem.attr("fill", D3_COLORS.lightlike);
			elem.append("tspan").text("⚡ ON LIGHT CONE");
			elem
				.append("tspan")
				.attr("x", 15)
				.attr("dy", "1.2em")
				.attr("font-size", "13px")
				.attr("font-weight", "normal")
				.text("(Connected by light signal)");
		}
	});

	const labelGroup = labelsGroup
		.selectAll("g.velocity-info")
		.data([
			{
				velocityDecimal: data.velocityDecimal,
				deltaTPrimeDecimal: data.deltaTPrimeDecimal,
				deltaXPrimeDecimal: data.deltaXPrimeDecimal,
			},
		])
		.join("g")
		.attr("class", "velocity-info");

	labelGroup
		.selectAll("text.velocity-label")
		.data(d => [d])
		.join("text")
		.attr("class", "velocity-label header")
		.attr("x", SIZE - 15)
		.attr("y", SIZE - 60)
		.attr("text-anchor", "end")
		.attr("fill", D3_COLORS.quantumGreen)
		.text(d => `Moving frame ${rl.formatSignificant(d.velocityDecimal, "9", 2, true)}c`);

	labelGroup
		.selectAll("text.separation-time")
		.data(d => [d])
		.join("text")
		.attr("class", "separation-time header")
		.attr("x", SIZE - 15)
		.attr("y", SIZE - 45)
		.attr("text-anchor", "end")
		.attr("fill", D3_COLORS.quantumGreen)
		.text(d => `${rl.formatSignificant(d.deltaTPrimeDecimal, "", 3, true)} sec`);

	labelGroup
		.selectAll("text.separation-distance")
		.data(d => [d])
		.join("text")
		.attr("class", "separation-distance header")
		.attr("x", SIZE - 15)
		.attr("y", SIZE - 30)
		.attr("text-anchor", "end")
		.attr("fill", D3_COLORS.quantumGreen)
		.text(d => `${rl.formatSignificant(d.deltaXPrimeDecimal, "0", 0)} km`);
}
