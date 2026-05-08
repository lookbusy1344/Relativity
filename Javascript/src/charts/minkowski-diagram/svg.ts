import { select, type Selection } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";

const SIZE = 900;

export function setupSVG(
	container: HTMLElement
): Selection<SVGSVGElement, unknown, null, undefined> {
	const padding = 10;

	select(container).select("svg").remove();

	const svg = select(container)
		.append("svg")
		.attr("viewBox", `${-padding} ${-padding} ${SIZE + 2 * padding} ${SIZE + 2 * padding}`)
		.attr("preserveAspectRatio", "xMidYMid meet")
		.style("width", "100%")
		.style("height", "auto")
		.style("display", "block");

	svg.append("defs").append("style").text(`
            text {
                font-family: 'IBM Plex Mono', monospace;
                user-select: none;
                pointer-events: none;
            }
            text.label { font-size: 11px; }
            text.header { font-size: 13px; font-weight: bold; }
            text.secondary { font-size: 10px; }

            @media (max-width: 768px) {
                text.label { font-size: 10px; }
                text.header { font-size: 12px; }
            }

            @media (max-width: 480px) {
                text.label { font-size: 10px; }
                text.header { font-size: 11px; }
                text.secondary { display: none; }
            }
        `);

	const defs = svg.select("defs");

	defs
		.append("linearGradient")
		.attr("id", "axisGradientBlue")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "0%")
		.attr("y2", "100%")
		.selectAll("stop")
		.data([
			{ offset: "0%", color: D3_COLORS.electricBlue, opacity: 0.3 },
			{ offset: "50%", color: D3_COLORS.electricBlue, opacity: 1 },
			{ offset: "100%", color: D3_COLORS.electricBlue, opacity: 0.3 },
		])
		.join("stop")
		.attr("offset", d => d.offset)
		.attr("stop-color", d => d.color)
		.attr("stop-opacity", d => d.opacity);

	defs
		.append("linearGradient")
		.attr("id", "axisGradientGreen")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "0%")
		.attr("y2", "100%")
		.selectAll("stop")
		.data([
			{ offset: "0%", color: D3_COLORS.quantumGreen, opacity: 0.3 },
			{ offset: "50%", color: D3_COLORS.quantumGreen, opacity: 1 },
			{ offset: "100%", color: D3_COLORS.quantumGreen, opacity: 0.3 },
		])
		.join("stop")
		.attr("offset", d => d.offset)
		.attr("stop-color", d => d.color)
		.attr("stop-opacity", d => d.opacity);

	const filter = defs
		.append("filter")
		.attr("id", "glow")
		.attr("x", "-50%")
		.attr("y", "-50%")
		.attr("width", "200%")
		.attr("height", "200%");

	filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");

	const feMerge = filter.append("feMerge");
	feMerge.append("feMergeNode").attr("in", "coloredBlur");
	feMerge.append("feMergeNode").attr("in", "SourceGraphic");

	defs
		.append("marker")
		.attr("id", "arrowBlue")
		.attr("viewBox", "0 0 10 10")
		.attr("refX", "5")
		.attr("refY", "5")
		.attr("markerWidth", "6")
		.attr("markerHeight", "6")
		.attr("orient", "auto-start-reverse")
		.append("path")
		.attr("d", "M 0 0 L 10 5 L 0 10 z")
		.attr("fill", D3_COLORS.electricBlue);

	defs
		.append("marker")
		.attr("id", "arrowGreen")
		.attr("viewBox", "0 0 10 10")
		.attr("refX", "5")
		.attr("refY", "5")
		.attr("markerWidth", "6")
		.attr("markerHeight", "6")
		.attr("orient", "auto-start-reverse")
		.append("path")
		.attr("d", "M 0 0 L 10 5 L 0 10 z")
		.attr("fill", D3_COLORS.quantumGreen);

	svg.append("g").attr("class", "background");
	svg.append("g").attr("class", "light-cones");
	svg.append("g").attr("class", "simultaneity-lines");
	svg.append("g").attr("class", "axes");
	svg.append("g").attr("class", "interval");
	svg.append("g").attr("class", "events");
	svg.append("g").attr("class", "labels");
	svg.append("g").attr("class", "controls");

	return svg;
}
