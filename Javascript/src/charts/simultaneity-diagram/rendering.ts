import { COLORS as D3_COLORS } from "../minkowski-colors";
import * as rl from "../../relativity_lib";
import type { LayerGroups, SimultaneityEvent, SimultaneityState, ScaleSet } from "./types";
import { EVENT_RADIUS } from "./types";

export function renderGrid(layers: LayerGroups, scales: ScaleSet): void {
	const gridSpacing = Math.pow(10, Math.floor(Math.log10(scales.maxCoord)) - 1);
	const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

	for (let x = -scales.maxCoord; x <= scales.maxCoord; x += gridSpacing) {
		gridLines.push({
			x1: scales.xScale(x),
			y1: scales.yScale(-scales.maxCoord),
			x2: scales.xScale(x),
			y2: scales.yScale(scales.maxCoord),
		});
	}

	for (let ct = -scales.maxCoord; ct <= scales.maxCoord; ct += gridSpacing) {
		gridLines.push({
			x1: scales.xScale(-scales.maxCoord),
			y1: scales.yScale(ct),
			x2: scales.xScale(scales.maxCoord),
			y2: scales.yScale(ct),
		});
	}

	layers.grid
		.selectAll("line")
		.data(gridLines)
		.join("line")
		.attr("x1", d => d.x1)
		.attr("y1", d => d.y1)
		.attr("x2", d => d.x2)
		.attr("y2", d => d.y2)
		.attr("stroke", "rgba(0, 217, 255, 0.15)")
		.attr("stroke-width", 1);
}

export function renderAxes(
	layers: LayerGroups,
	scales: ScaleSet,
	size: number,
	state: SimultaneityState
): void {
	const beta = state.velocity;
	const centerX = size / 2;
	const centerY = size / 2;

	layers.axes.selectAll("*").remove();

	layers.axes
		.append("line")
		.attr("x1", 0)
		.attr("y1", centerY)
		.attr("x2", size)
		.attr("y2", centerY)
		.attr("stroke", D3_COLORS.electricBlue)
		.attr("stroke-width", 2)
		.attr("opacity", 0.5);

	layers.axes
		.append("line")
		.attr("x1", centerX)
		.attr("y1", 0)
		.attr("x2", centerX)
		.attr("y2", size)
		.attr("stroke", D3_COLORS.electricBlue)
		.attr("stroke-width", 2)
		.attr("opacity", 0.5);

	if (Math.abs(beta) > 0.001) {
		const minBeta = 0.1;
		const axisExtent = scales.maxCoord / Math.max(Math.abs(beta), minBeta);

		const x1Prime = -axisExtent;
		const ct1Prime = -axisExtent * beta;
		const x2Prime = axisExtent;
		const ct2Prime = axisExtent * beta;

		layers.axes
			.append("line")
			.attr("x1", scales.xScale(x1Prime))
			.attr("y1", scales.yScale(ct1Prime))
			.attr("x2", scales.xScale(x2Prime))
			.attr("y2", scales.yScale(ct2Prime))
			.attr("stroke", D3_COLORS.quantumGreen)
			.attr("stroke-width", 2)
			.attr("stroke-dasharray", "5,5")
			.attr("opacity", 0.7);

		const ct1AxisPrime = -axisExtent;
		const x1AxisPrime = -axisExtent * beta;
		const ct2AxisPrime = axisExtent;
		const x2AxisPrime = axisExtent * beta;

		layers.axes
			.append("line")
			.attr("x1", scales.xScale(x1AxisPrime))
			.attr("y1", scales.yScale(ct1AxisPrime))
			.attr("x2", scales.xScale(x2AxisPrime))
			.attr("y2", scales.yScale(ct2AxisPrime))
			.attr("stroke", D3_COLORS.quantumGreen)
			.attr("stroke-width", 2)
			.attr("stroke-dasharray", "5,5")
			.attr("opacity", 0.7);

		layers.axes
			.append("text")
			.attr("x", scales.xScale(axisExtent * 0.9))
			.attr("y", scales.yScale(axisExtent * beta * 0.9) - 10)
			.attr("fill", D3_COLORS.quantumGreen)
			.attr("class", "label")
			.attr("text-anchor", "middle")
			.text("x'");

		layers.axes
			.append("text")
			.attr("x", scales.xScale(axisExtent * beta * 0.9) + 15)
			.attr("y", scales.yScale(axisExtent * 0.9))
			.attr("fill", D3_COLORS.quantumGreen)
			.attr("class", "label")
			.attr("text-anchor", "middle")
			.text("ct'");
	}

	layers.axes
		.append("text")
		.attr("x", size - 20)
		.attr("y", centerY - 10)
		.attr("fill", D3_COLORS.electricBlue)
		.attr("class", "label")
		.attr("text-anchor", "end")
		.text("x");

	layers.axes
		.append("text")
		.attr("x", centerX + 15)
		.attr("y", 20)
		.attr("fill", D3_COLORS.electricBlue)
		.attr("class", "label")
		.text("ct");

	layers.axes
		.append("text")
		.attr("x", centerX)
		.attr("y", size - 20)
		.attr("fill", D3_COLORS.plasmaWhite)
		.attr("class", "header")
		.attr("text-anchor", "middle")
		.text(`v = ${rl.formatSignificant(state.velocityDecimal, "9", 2)}c`);
}

export function renderNowLine(
	layers: LayerGroups,
	scales: ScaleSet,
	state: SimultaneityState
): void {
	const beta = state.velocity;
	const minBeta = 0.1;
	const extent =
		Math.abs(beta) > 0.001 ? scales.maxCoord / Math.max(Math.abs(beta), minBeta) : scales.maxCoord;
	const animationRange = scales.maxCoord * (1 + Math.abs(beta));
	const currentCt = -animationRange + state.animationProgress * 2 * animationRange;

	if (state.showLightCone) {
		layers.lightCone.style("display", null);
	} else {
		layers.lightCone.style("display", "none");
	}

	layers.lightCone.selectAll("*").remove();
	const gamma = state.gamma;
	const intersectionCt = gamma * gamma * currentCt;
	const intersectionX = beta * intersectionCt;
	const coneExtent = scales.maxCoord * (gamma * gamma * (1 + Math.abs(beta)) + 1) * 1.1;

	const futureConeX1 = intersectionX - coneExtent;
	const futureConeX2 = intersectionX + coneExtent;
	const pastConeX1 = intersectionX - coneExtent;
	const pastConeX2 = intersectionX + coneExtent;

	const coneFillData = [
		{
			points: [
				[intersectionX, intersectionCt],
				[futureConeX2, intersectionCt + coneExtent],
				[futureConeX2, intersectionCt - coneExtent],
			],
			class: "future",
		},
		{
			points: [
				[intersectionX, intersectionCt],
				[pastConeX1, intersectionCt - coneExtent],
				[pastConeX1, intersectionCt + coneExtent],
			],
			class: "past",
		},
	];

	layers.lightCone
		.selectAll("polygon.cone-fill")
		.data(coneFillData)
		.join("polygon")
		.attr("class", "cone-fill")
		.attr("points", d =>
			d.points.map(p => `${scales.xScale(p[0])},${scales.yScale(p[1])}`).join(" ")
		)
		.attr("fill", `${D3_COLORS.photonGold}10`)
		.attr("stroke", "none");

	layers.lightCone
		.append("line")
		.attr("x1", scales.xScale(futureConeX1))
		.attr("y1", scales.yScale(intersectionCt - coneExtent))
		.attr("x2", scales.xScale(futureConeX2))
		.attr("y2", scales.yScale(intersectionCt + coneExtent))
		.attr("stroke", `${D3_COLORS.photonGold}40`)
		.attr("stroke-width", 1.5)
		.attr("stroke-dasharray", "8,4");

	layers.lightCone
		.append("line")
		.attr("x1", scales.xScale(pastConeX1))
		.attr("y1", scales.yScale(intersectionCt + coneExtent))
		.attr("x2", scales.xScale(pastConeX2))
		.attr("y2", scales.yScale(intersectionCt - coneExtent))
		.attr("stroke", `${D3_COLORS.photonGold}40`)
		.attr("stroke-width", 1.5)
		.attr("stroke-dasharray", "8,4");

	const x1 = -extent;
	const ct1 = currentCt + beta * x1;
	const x2 = extent;
	const ct2 = currentCt + beta * x2;

	layers.nowLine.selectAll("*").remove();

	layers.nowLine
		.append("line")
		.attr("x1", scales.xScale(x1))
		.attr("y1", scales.yScale(ct1))
		.attr("x2", scales.xScale(x2))
		.attr("y2", scales.yScale(ct2))
		.attr("stroke", D3_COLORS.quantumGreen)
		.attr("stroke-width", 3)
		.attr("stroke-opacity", 0.8)
		.style("filter", "drop-shadow(0 0 10px rgba(6, 255, 165, 0.8))");

	const labelX = scales.xScale(extent * 0.85);
	const labelY = scales.yScale(currentCt + beta * extent * 0.85);

	layers.nowLine
		.append("text")
		.attr("x", labelX)
		.attr("y", labelY - 10)
		.attr("fill", D3_COLORS.quantumGreen)
		.attr("class", "label")
		.attr("text-anchor", "end")
		.attr("font-weight", "bold")
		.text("NOW");
}

export function renderEvents(
	layers: LayerGroups,
	scales: ScaleSet,
	state: SimultaneityState,
	getEventColor: (order: "future" | "past" | "simultaneous", isReference: boolean) => string
): void {
	layers.events
		.selectAll("g.event")
		.data(state.events, (d: unknown) => (d as SimultaneityEvent).id)
		.join(
			enter => {
				const g = enter
					.append("g")
					.attr("class", "event")
					.attr("transform", d => `translate(${scales.xScale(d.x)}, ${scales.yScale(d.ct)})`)
					.style("cursor", "pointer")
					.style("opacity", 0);

				g.append("circle")
					.attr("r", EVENT_RADIUS)
					.attr("fill", d => getEventColor(d.temporalOrder, d.isReference))
					.attr("stroke", d => (d.isReference ? D3_COLORS.electricBlue : "none"))
					.attr("stroke-width", d => (d.isReference ? 3 : 0))
					.style("filter", d => {
						const color = getEventColor(d.temporalOrder, d.isReference);
						return `drop-shadow(0 0 8px ${color})`;
					});

				g.append("text")
					.attr("text-anchor", "middle")
					.attr("dominant-baseline", "middle")
					.attr("fill", "#0a0e27")
					.attr("class", "label")
					.attr("font-weight", "bold")
					.text(d => d.id);

				g.transition().duration(300).style("opacity", 1);

				return g;
			},
			update => {
				update.style("opacity", 1);
				update
					.transition()
					.duration(500)
					.attr("transform", d => `translate(${scales.xScale(d.x)}, ${scales.yScale(d.ct)})`);

				update
					.select("circle")
					.transition()
					.duration(500)
					.attr("fill", d => getEventColor(d.temporalOrder, d.isReference))
					.attr("stroke", d => (d.isReference ? D3_COLORS.electricBlue : "none"))
					.attr("stroke-width", d => (d.isReference ? 3 : 0))
					.style("filter", d => {
						const color = getEventColor(d.temporalOrder, d.isReference);
						return `drop-shadow(0 0 8px ${color})`;
					});

				return update;
			},
			exit => {
				exit.transition().duration(200).style("opacity", 0).remove();
			}
		);
}
