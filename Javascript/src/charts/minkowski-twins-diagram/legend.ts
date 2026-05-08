import { select } from "d3-selection";

export function renderLegend(container: HTMLElement): void {
	select(container).select(".twins-legend").remove();

	const legend = select(container)
		.append("div")
		.attr("class", "twins-legend")
		.style("margin-top", "1rem")
		.style("padding", "1rem")
		.style("background", "rgba(0, 0, 0, 0.5)")
		.style("border", "1px solid rgba(0, 217, 255, 0.2)");

	legend
		.append("div")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-weight", "bold")
		.style("font-size", "12px")
		.style("color", "#e8f1f5")
		.style("margin-bottom", "0.5rem")
		.text("LEGEND");

	const grid = legend
		.append("div")
		.style("display", "grid")
		.style("grid-template-columns", "repeat(auto-fit, minmax(200px, 1fr))")
		.style("gap", "0.5rem")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px");

	const legendItems = [
		{ color: "#00d9ff", text: "Earth frame (ct, x)", type: "solid" },
		{ color: "#00ff9f", text: "Outbound frame (ct₁', x₁')", type: "solid" },
		{ color: "#ffaa00", text: "Inbound frame (ct₂', x₂')", type: "solid" },
		{ color: "#e8f1f5", text: "Traveling twin worldline", type: "solid-thick" },
		{ color: "#00d9ff", text: "Earth twin (stationary)", type: "solid" },
		{ color: "#ffaa00", text: "Light cones (c)", type: "dashed" },
		{ color: "rgba(0, 217, 255, 0.5)", text: "Simultaneity lines", type: "solid" },
		{ color: "#e8f1f5", text: "Departure/Arrival events", type: "circle" },
		{ color: "#ffaa00", text: "Turnaround event", type: "circle" },
	];

	legendItems.forEach(item => {
		const itemDiv = grid
			.append("div")
			.style("display", "flex")
			.style("align-items", "center")
			.style("gap", "0.5rem");
		const indicator = itemDiv.append("div").style("flex-shrink", "0");

		if (item.type === "solid" || item.type === "solid-thick") {
			indicator
				.style("width", "35px")
				.style("height", item.type === "solid-thick" ? "4px" : "3px")
				.style("background", item.color);
		} else if (item.type === "dashed") {
			indicator
				.style("width", "35px")
				.style("height", "2px")
				.style(
					"background-image",
					`repeating-linear-gradient(90deg, ${item.color} 0px, ${item.color} 5px, transparent 5px, transparent 10px)`
				);
		} else {
			indicator
				.style("width", "12px")
				.style("height", "12px")
				.style("border-radius", "50%")
				.style("background", item.color)
				.style("border", "2px solid rgba(0, 0, 0, 0.5)");
		}

		itemDiv.append("span").style("color", "#e8f1f5").text(item.text);
	});
}
