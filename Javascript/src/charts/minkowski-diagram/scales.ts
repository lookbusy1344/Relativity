import type { MinkowskiData, ScaleSet } from "../minkowski-types";

const SIZE = 900;

export function createScales(data: MinkowskiData, size: number = SIZE): ScaleSet {
	const ct = data.time * 299792.458;
	const x = data.distance;
	const maxCoord = Math.max(Math.abs(ct), Math.abs(x)) * 1.2;

	const centerX = size / 2;
	const centerY = size / 2;
	const scale = size / 2 / maxCoord;

	return {
		xScale: (xCoord: number) => centerX + xCoord * scale,
		yScale: (ctCoord: number) => centerY - ctCoord * scale,
		maxCoord,
	};
}
