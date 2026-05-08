import { timer } from "d3-timer";
import type { Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import * as rl from "../../relativity_lib";
import type { AnimationController, ScaleSet } from "../minkowski-types";
import type { TwinParadoxMinkowskiData } from "./types";
import { C } from "../minkowski-core";

const LOOP_DURATION = 12000;

export function startJourneyAnimation(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: TwinParadoxMinkowskiData,
	departure: { ct: number; x: number },
	turnaround: { ct: number; x: number },
	arrival: { ct: number; x: number },
	_onUpdate: () => void
): AnimationController {
	let startTime = Date.now();
	let isPaused = false;
	let totalPausedTime = 0;
	let pauseStartTime = 0;
	let manualPosition: number | null = null;

	const animatedGroup = svg.append("g").attr("class", "animated-journey");

	const updateFrame = (t: number) => {
		let currentPos: { ct: number; x: number };
		let properTime: number;

		if (t < 0.5) {
			const segmentT = t * 2;
			currentPos = {
				ct: departure.ct + (turnaround.ct - departure.ct) * segmentT,
				x: departure.x + (turnaround.x - departure.x) * segmentT,
			};
			properTime = (data.properTimeYears * segmentT) / 2;
		} else {
			const segmentT = (t - 0.5) * 2;
			currentPos = {
				ct: turnaround.ct + (arrival.ct - turnaround.ct) * segmentT,
				x: turnaround.x + (arrival.x - turnaround.x) * segmentT,
			};
			properTime = data.properTimeYears * (0.5 + segmentT / 2);
		}

		const earthTime = currentPos.ct / C / (365.25 * 24 * 3600);

		animatedGroup.selectAll("*").remove();

		const extent = scales.maxCoord;
		const largeExtent = extent * 2;

		const coneFillData = [
			{
				points: [
					[currentPos.x, currentPos.ct],
					[currentPos.x + largeExtent, currentPos.ct + largeExtent],
					[currentPos.x + largeExtent, currentPos.ct - largeExtent],
				],
				class: "future",
			},
			{
				points: [
					[currentPos.x, currentPos.ct],
					[currentPos.x - largeExtent, currentPos.ct - largeExtent],
					[currentPos.x - largeExtent, currentPos.ct + largeExtent],
				],
				class: "past",
			},
		];

		animatedGroup
			.selectAll("polygon.cone-fill")
			.data(coneFillData)
			.join("polygon")
			.attr("class", "cone-fill")
			.attr("points", d =>
				d.points.map(p => `${scales.xScale(p[0])},${scales.yScale(p[1])}`).join(" ")
			)
			.attr("fill", `${D3_COLORS.electricBlue}${D3_COLORS.lightConeFill}`)
			.attr("stroke", "none");

		const coneExtent = Math.min(extent, currentPos.ct);
		animatedGroup
			.append("line")
			.attr("x1", scales.xScale(currentPos.x - coneExtent))
			.attr("y1", scales.yScale(currentPos.ct - coneExtent))
			.attr("x2", scales.xScale(currentPos.x + coneExtent))
			.attr("y2", scales.yScale(currentPos.ct + coneExtent))
			.attr("stroke", `${D3_COLORS.photonGold}80`)
			.attr("stroke-width", 2)
			.attr("stroke-dasharray", "8,4");

		animatedGroup
			.append("line")
			.attr("x1", scales.xScale(currentPos.x - coneExtent))
			.attr("y1", scales.yScale(currentPos.ct + coneExtent))
			.attr("x2", scales.xScale(currentPos.x + coneExtent))
			.attr("y2", scales.yScale(currentPos.ct - coneExtent))
			.attr("stroke", `${D3_COLORS.photonGold}80`)
			.attr("stroke-width", 2)
			.attr("stroke-dasharray", "8,4");

		animatedGroup
			.append("circle")
			.attr("cx", scales.xScale(currentPos.x))
			.attr("cy", scales.yScale(currentPos.ct))
			.attr("r", 10)
			.attr("fill", D3_COLORS.quantumGreen)
			.attr("stroke", D3_COLORS.plasmaWhite)
			.attr("stroke-width", 3)
			.style("filter", "drop-shadow(0 0 8px " + D3_COLORS.quantumGreen + ")");

		const properTimeDecimal = rl.ensure(properTime);
		const earthTimeDecimal = rl.ensure(earthTime);
		svg
			.select("g.labels")
			.selectAll("text.info-label")
			.filter((_, i) => i === 2)
			.text(`Proper time: ${rl.formatSignificant(properTimeDecimal, "", 2, true)} years`);
		svg
			.select("g.labels")
			.selectAll("text.info-label")
			.filter((_, i) => i === 3)
			.text(`Earth time: ${rl.formatSignificant(earthTimeDecimal, "", 2, true)} years`);
	};

	const animationTimer = timer(() => {
		if (isPaused || manualPosition !== null) return;
		const elapsed = Date.now() - startTime - totalPausedTime;
		const t = (elapsed % LOOP_DURATION) / LOOP_DURATION;
		updateFrame(t);
	});

	return {
		pause() {
			if (!isPaused) {
				isPaused = true;
				pauseStartTime = Date.now();
			}
		},
		play() {
			if (isPaused) {
				totalPausedTime += Date.now() - pauseStartTime;
				isPaused = false;
				manualPosition = null;
			}
		},
		stop() {
			animationTimer.stop();
			animatedGroup.remove();
		},
		setPosition(t: number) {
			manualPosition = t;
			updateFrame(t);
		},
	};
}
