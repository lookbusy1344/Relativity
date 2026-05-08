function getDistanceExponent(maxDistance: number): number {
	if (maxDistance <= 1) return 1.5;
	if (maxDistance >= 1000) return 3;
	const logMin = Math.log10(1);
	const logMax = Math.log10(1000);
	const logDist = Math.log10(maxDistance);
	const t = (logDist - logMin) / (logMax - logMin);
	return 1.5 + t * 1.5;
}

export function sliderToDistance(percentage: number, maxDistance: number): number {
	const exponent = getDistanceExponent(maxDistance);
	return maxDistance * Math.pow(percentage / 100, exponent);
}

export function distanceToSlider(distance: number, maxDistance: number): number {
	if (maxDistance <= 0) return 100;
	const exponent = getDistanceExponent(maxDistance);
	return 100 * Math.pow(distance / maxDistance, 1 / exponent);
}
