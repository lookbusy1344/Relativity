import { timer } from "d3-timer";
import type { Selection } from "d3-selection";
import * as rl from "../../relativity_lib";
import type { AnimationController, MinkowskiData, ScaleSet } from "../minkowski-types";

const LOOP_DURATION = 16000;
const C = 299792.458;

export function startFrameAnimation(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	scales: ScaleSet,
	data: MinkowskiData,
	_onUpdate: () => void
): AnimationController {
	let startTime = Date.now();
	let isPaused = false;
	let totalPausedTime = 0;
	let pauseStartTime = 0;
	let manualPosition: number | null = null;

	const ct = data.time * C;
	const x = data.distance;
	const extent = scales.maxCoord;
	const beta = data.velocity;
	const targetAngle = Math.atan(beta);

	const updateFrame = (t: number) => {
		let p: number;
		if (t < 0.5) {
			p = (1 - Math.cos(t * 2 * Math.PI)) / 2;
		} else {
			p = (1 - Math.cos((t - 0.5) * 2 * Math.PI)) / 2;
			p = 1 - p;
		}

		const currentAngle = targetAngle * p;
		const cosCurrent = Math.cos(currentAngle);
		const sinCurrent = Math.sin(currentAngle);

		const ctPrimeLength = extent / (cosCurrent || 0.01);
		svg
			.selectAll(".axis-moving")
			.filter(function () {
				return (this as SVGLineElement).getAttribute("data-axis") === "ct'";
			})
			.attr("x1", scales.xScale(-ctPrimeLength * sinCurrent))
			.attr("y1", scales.yScale(-ctPrimeLength * cosCurrent))
			.attr("x2", scales.xScale(ctPrimeLength * sinCurrent))
			.attr("y2", scales.yScale(ctPrimeLength * cosCurrent));

		const xPrimeLength = extent / (cosCurrent || 0.01);
		svg
			.selectAll(".axis-moving")
			.filter(function () {
				return (this as SVGLineElement).getAttribute("data-axis") === "x'";
			})
			.attr("x1", scales.xScale(-xPrimeLength * cosCurrent))
			.attr("y1", scales.yScale(-xPrimeLength * sinCurrent))
			.attr("x2", scales.xScale(xPrimeLength * cosCurrent))
			.attr("y2", scales.yScale(xPrimeLength * sinCurrent));

		if (ct !== 0 || x !== 0) {
			const simLength = extent / (cosCurrent || 0.01);

			svg
				.selectAll(".simultaneity-moving")
				.filter(function () {
					return (this as SVGLineElement).getAttribute("data-line") === "simultaneity";
				})
				.attr("x1", scales.xScale(x - simLength * cosCurrent))
				.attr("y1", scales.yScale(ct - simLength * sinCurrent))
				.attr("x2", scales.xScale(x + simLength * cosCurrent))
				.attr("y2", scales.yScale(ct + simLength * sinCurrent));

			svg
				.selectAll(".simultaneity-moving")
				.filter(function () {
					return (this as SVGLineElement).getAttribute("data-line") === "position";
				})
				.attr("x1", scales.xScale(x - simLength * sinCurrent))
				.attr("y1", scales.yScale(ct - simLength * cosCurrent))
				.attr("x2", scales.xScale(x + simLength * sinCurrent))
				.attr("y2", scales.yScale(ct + simLength * cosCurrent));
		}

		const currentBeta = Math.tan(currentAngle);
		const currentBetaDecimal = rl.ensure(currentBeta);
		const currentGamma = 1 / Math.sqrt(1 - currentBeta * currentBeta);
		const currentCtPrime = currentGamma * (ct - currentBeta * x);
		const currentXPrime = currentGamma * (x - currentBeta * ct);
		const currentCtPrimeDecimal = rl.ensure(currentCtPrime / C);
		const currentXPrimeDecimal = rl.ensure(currentXPrime);

		svg
			.select(".velocity-label")
			.text(`Moving frame ${rl.formatSignificant(currentBetaDecimal, "9", 2, true)}c`);
		svg
			.select(".separation-time")
			.text(`${rl.formatSignificant(currentCtPrimeDecimal, "", 3, true)} sec`);
		svg
			.select(".separation-distance")
			.text(`${rl.formatSignificant(currentXPrimeDecimal, "0", 0)} km`);
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
		},
		setPosition(t: number) {
			manualPosition = t;
			updateFrame(t);
		},
	};
}
