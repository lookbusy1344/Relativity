// Relativity of Simultaneity Interactive Visualization
import { select, Selection } from "d3-selection";
import { pointer } from "d3-selection";
import "d3-transition";
import Decimal from "decimal.js";
import { COLORS as D3_COLORS } from "./minkowski-colors";
import type { BaseController, ScaleSet } from "./minkowski-types";
import {
	C,
	calculateGamma,
	lorentzTransform,
	createScaleSet,
	setupSVG,
	createAxisDefinitions,
	debounce,
} from "./minkowski-core";
import { updateURL } from "../urlState";
import * as simultaneityState from "./simultaneityState";
import * as rl from "../relativity_lib";

/**
 * Event data structure
 */
interface SimultaneityEvent {
	id: string;
	ct: number;
	x: number;
	isReference: boolean;
	temporalOrder: "future" | "past" | "simultaneous";
}

/**
 * Controller state
 */
interface SimultaneityState {
	events: SimultaneityEvent[];
	velocity: number;
	velocityDecimal: Decimal;
	gamma: number;
	referenceEventId: string | null;
	isAnimating: boolean;
	animationProgress: number; // 0 to 1
	showLightCone: boolean;
}

/**
 * SVG layer groups
 */
interface LayerGroups {
	grid: Selection<SVGGElement, unknown, null, undefined>;
	axes: Selection<SVGGElement, unknown, null, undefined>;
	lightCone: Selection<SVGGElement, unknown, null, undefined>;
	nowLine: Selection<SVGGElement, unknown, null, undefined>;
	events: Selection<SVGGElement, unknown, null, undefined>;
}

const MAX_EVENTS = 4;
const EVENT_LABELS = ["A", "B", "C", "D"];
const EVENT_RADIUS = 8;
const CLICK_TOLERANCE = 15;

// Fixed scale for train example: ct = 2 * C ≈ 599584.916 km, with 1.3 multiplier
const TRAIN_EXAMPLE_SCALE = 2 * C * 1.3;

/**
 * Create Einstein's train example
 */
function createTrainExample(): SimultaneityEvent[] {
	const time = 2; // seconds
	const ct = time * C; // Convert to km
	const separation = 300000; // km (1 light-second)

	return [
		{
			id: "A",
			ct,
			x: -separation,
			isReference: true,
			temporalOrder: "simultaneous",
		},
		{
			id: "B",
			ct,
			x: separation,
			isReference: false,
			temporalOrder: "simultaneous",
		},
	];
}

/**
 * Sync internal state.events to the state module for URL encoding
 */
function syncStateToModule(events: SimultaneityEvent[]): void {
	const eventData = events.map(e => ({
		ct: e.ct,
		x: e.x,
		ctDecimal: rl.ensure(e.ct),
		xDecimal: rl.ensure(e.x),
	}));
	simultaneityState.setEvents(eventData);
}

/**
 * Calculate temporal ordering of event relative to reference
 */
function calculateTemporalOrder(
	eventCt: number,
	eventX: number,
	refCt: number,
	refX: number,
	beta: number
): "future" | "past" | "simultaneous" {
	// Transform to moving frame
	const eventPrime = lorentzTransform(eventCt, eventX, beta);
	const refPrime = lorentzTransform(refCt, refX, beta);

	const deltaCtPrime = eventPrime.ctPrime - refPrime.ctPrime;

	// Tolerance for floating point comparison (0.01 km ≈ 0.03 microseconds)
	if (Math.abs(deltaCtPrime) < 0.01) return "simultaneous";
	return deltaCtPrime > 0 ? "future" : "past";
}

/**
 * Get color for event based on temporal order
 */
function getEventColor(order: "future" | "past" | "simultaneous", isReference: boolean): string {
	if (isReference) return D3_COLORS.electricBlue;
	switch (order) {
		case "future":
			return D3_COLORS.quantumGreen;
		case "past":
			return D3_COLORS.photonGold;
		case "simultaneous":
			return D3_COLORS.plasmaWhite;
	}
}

/**
 * Controller for simultaneity diagram with event placement and animation
 */
export interface SimultaneityController extends BaseController {
	update(): void;
	updateSlider?(velocity: number): void;
	reset(): void;
	clearAll(): void;
}

/**
 * Create simultaneity diagram controller
 */
export function createSimultaneityDiagram(container: HTMLElement): SimultaneityController {
	const size = 900;
	let scales: ScaleSet;
	let state: SimultaneityState = {
		events: createTrainExample(),
		velocity: 0,
		velocityDecimal: rl.ensure(0),
		gamma: 1,
		referenceEventId: "A",
		isAnimating: true,
		animationProgress: 0,
		showLightCone: false,
	};
	let animationFrameId: number | null = null;
	let lastTimestamp = 0;

	// Setup SVG
	const svg = setupSVG(container, size);
	createAxisDefinitions(svg);

	// Create layer groups (back to front rendering order)
	const layers: LayerGroups = {
		grid: svg.append("g").attr("class", "grid-layer"),
		axes: svg.append("g").attr("class", "axes-layer"),
		lightCone: svg.append("g").attr("class", "light-cone-layer"),
		nowLine: svg.append("g").attr("class", "now-line-layer"),
		events: svg.append("g").attr("class", "events-layer"),
	};

	// Calculate initial scales based on train example
	scales = createScaleSet(TRAIN_EXAMPLE_SCALE, size);

	// Initially hide light cone layer
	layers.lightCone.style("display", "none");

	/**
	 * Render grid
	 */
	function renderGrid(): void {
		const gridSpacing = Math.pow(10, Math.floor(Math.log10(scales.maxCoord)) - 1);
		const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

		// Vertical lines
		for (let x = -scales.maxCoord; x <= scales.maxCoord; x += gridSpacing) {
			gridLines.push({
				x1: scales.xScale(x),
				y1: scales.yScale(-scales.maxCoord),
				x2: scales.xScale(x),
				y2: scales.yScale(scales.maxCoord),
			});
		}

		// Horizontal lines
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

	/**
	 * Render reference frame axes
	 */
	function renderAxes(): void {
		const beta = state.velocity;
		const centerX = size / 2;
		const centerY = size / 2;

		// Clear existing axes
		layers.axes.selectAll("*").remove();

		// Original frame axes (stationary)
		// X axis (horizontal)
		layers.axes
			.append("line")
			.attr("x1", 0)
			.attr("y1", centerY)
			.attr("x2", size)
			.attr("y2", centerY)
			.attr("stroke", D3_COLORS.electricBlue)
			.attr("stroke-width", 2)
			.attr("opacity", 0.5);

		// CT axis (vertical)
		layers.axes
			.append("line")
			.attr("x1", centerX)
			.attr("y1", 0)
			.attr("x2", centerX)
			.attr("y2", size)
			.attr("stroke", D3_COLORS.electricBlue)
			.attr("stroke-width", 2)
			.attr("opacity", 0.5);

		// Moving frame axes (transformed)
		if (Math.abs(beta) > 0.001) {
			// For tilted axes, extend far enough to cover full diagram
			// Clamp beta to avoid excessive extent at low velocities
			const minBeta = 0.1;
			const axisExtent = scales.maxCoord / Math.max(Math.abs(beta), minBeta);

			// X' axis (tilted)
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

			// CT' axis (tilted)
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

			// Axis labels
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

		// Axis labels for original frame
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

		// Velocity label
		layers.axes
			.append("text")
			.attr("x", centerX)
			.attr("y", size - 20)
			.attr("fill", D3_COLORS.plasmaWhite)
			.attr("class", "header")
			.attr("text-anchor", "middle")
			.text(`v = ${rl.formatSignificant(state.velocityDecimal, "9", 2)}c`);
	}

	/**
	 * Render animated "now" line and light cone at origin
	 */
	function renderNowLine(): void {
		const beta = state.velocity;

		// For tilted lines, extend far enough to cover full diagram height
		// extent = maxCoord / |beta| ensures vertical span = 2 * maxCoord
		// Clamp beta to avoid excessive extent at low velocities
		const minBeta = 0.1;
		const extent =
			Math.abs(beta) > 0.001
				? scales.maxCoord / Math.max(Math.abs(beta), minBeta)
				: scales.maxCoord;

		// Calculate current "now" position based on animation progress
		// Animation range must expand by (1 + |beta|) for tilted lines to sweep all corners
		const animationRange = scales.maxCoord * (1 + Math.abs(beta));
		const currentCt = -animationRange + state.animationProgress * 2 * animationRange;

		// Toggle light cone visibility
		if (state.showLightCone) {
			layers.lightCone.style("display", null);
		} else {
			layers.lightCone.style("display", "none");
		}

		// Render light cone at origin of moving frame (x'=0)
		// Find where "now" line intersects x'=0 worldline (x = beta*ct)
		// Now line: ct = currentCt + beta*x
		// Worldline: x = beta*ct
		// Solving: ct = currentCt + beta*(beta*ct) => ct = gamma^2 * currentCt
		layers.lightCone.selectAll("*").remove();
		const gamma = state.gamma;
		const intersectionCt = gamma * gamma * currentCt;
		const intersectionX = beta * intersectionCt;

		// Extend light cone to edges of diagram (use large extent to ensure full coverage)
		// At high velocities, the intersection point moves far from origin due to gamma² factor
		// Required: coneExtent ≥ intersectionCt + maxCoord = gamma² * maxCoord * (1 + |beta|) + maxCoord
		// Add 10% safety margin for floating point errors
		const coneExtent = scales.maxCoord * (gamma * gamma * (1 + Math.abs(beta)) + 1) * 1.1;

		// Light cone centered at intersection point
		const futureConeX1 = intersectionX - coneExtent;
		const futureConeX2 = intersectionX + coneExtent;
		const pastConeX1 = intersectionX - coneExtent;
		const pastConeX2 = intersectionX + coneExtent;

		// Draw subtle light cone fill polygons (very subtle, more so than twins diagram)
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
			.attr("fill", `${D3_COLORS.photonGold}10`) // Very subtle fill (10 hex = ~6% opacity)
			.attr("stroke", "none");

		// Draw light cone boundary lines with reduced opacity (less prominent than twins diagram)
		layers.lightCone
			.append("line")
			.attr("x1", scales.xScale(futureConeX1))
			.attr("y1", scales.yScale(intersectionCt - coneExtent))
			.attr("x2", scales.xScale(futureConeX2))
			.attr("y2", scales.yScale(intersectionCt + coneExtent))
			.attr("stroke", `${D3_COLORS.photonGold}40`) // Reduced opacity
			.attr("stroke-width", 1.5)
			.attr("stroke-dasharray", "8,4");

		layers.lightCone
			.append("line")
			.attr("x1", scales.xScale(pastConeX1))
			.attr("y1", scales.yScale(intersectionCt + coneExtent))
			.attr("x2", scales.xScale(pastConeX2))
			.attr("y2", scales.yScale(intersectionCt - coneExtent))
			.attr("stroke", `${D3_COLORS.photonGold}40`) // Reduced opacity
			.attr("stroke-width", 1.5)
			.attr("stroke-dasharray", "8,4");

		// Line parallel to simultaneity line (horizontal in moving frame)
		const x1 = -extent;
		const ct1 = currentCt + beta * x1;
		const x2 = extent;
		const ct2 = currentCt + beta * x2;

		layers.nowLine.selectAll("*").remove();

		// Draw glowing "now" line
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

		// Add "NOW" label
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

	/**
	 * Check if now line is crossing an event and flash it
	 */
	function checkEventFlashes(): void {
		const beta = state.velocity;
		// Animation range must match renderNowLine calculation
		const animationRange = scales.maxCoord * (1 + Math.abs(beta));
		const currentCt = -animationRange + state.animationProgress * 2 * animationRange;

		state.events.forEach(event => {
			// Calculate the ct coordinate of the now line at this event's x position
			const nowCtAtEventX = currentCt + beta * event.x;

			// Check if we just crossed this event (within a small threshold)
			const distance = Math.abs(nowCtAtEventX - event.ct);
			const threshold = scales.maxCoord * 0.02; // 2% of max coord

			if (distance < threshold) {
				// Flash this event
				flashEvent(event.id);
			}
		});
	}

	/**
	 * Flash an event
	 */
	function flashEvent(eventId: string): void {
		const eventGroup = layers.events
			.selectAll<SVGGElement, SimultaneityEvent>("g.event")
			.filter(d => d.id === eventId);

		if (eventGroup.empty()) return;

		const circle = eventGroup.select("circle");

		// Pulse animation
		circle
			.transition()
			.duration(150)
			.attr("r", EVENT_RADIUS * 2)
			.style("filter", "drop-shadow(0 0 20px currentColor)")
			.transition()
			.duration(150)
			.attr("r", EVENT_RADIUS)
			.style("filter", d => {
				const color = getEventColor(d.temporalOrder, d.isReference);
				return `drop-shadow(0 0 8px ${color})`;
			});
	}

	/**
	 * Animation loop
	 */
	function animate(timestamp: number): void {
		if (!state.isAnimating) {
			animationFrameId = null;
			return;
		}

		if (lastTimestamp === 0) {
			lastTimestamp = timestamp;
		}

		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		// Update progress (complete cycle in 5 seconds)
		const speed = 1 / 5000; // 1 cycle per 5 seconds
		state.animationProgress += deltaTime * speed;

		if (state.animationProgress >= 1) {
			state.animationProgress = 0; // Loop back to start
		}

		// Render now line
		renderNowLine();

		// Check for event flashes
		checkEventFlashes();

		// Continue animation
		animationFrameId = requestAnimationFrame(animate);
	}

	/**
	 * Start animation
	 */
	function startAnimation(): void {
		if (animationFrameId === null) {
			state.isAnimating = true;
			lastTimestamp = 0;
			animationFrameId = requestAnimationFrame(animate);
		}
	}

	/**
	 * Stop animation
	 */
	function stopAnimation(): void {
		state.isAnimating = false;
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	/**
	 * Render events
	 */
	function renderEvents(): void {
		layers.events
			.selectAll("g.event")
			.data(state.events, (d: SimultaneityEvent) => d.id)
			.join(
				enter => {
					const g = enter
						.append("g")
						.attr("class", "event")
						.attr("transform", d => `translate(${scales.xScale(d.x)}, ${scales.yScale(d.ct)})`)
						.style("cursor", "pointer")
						.style("opacity", 0);

					// Event circle with glow
					g.append("circle")
						.attr("r", EVENT_RADIUS)
						.attr("fill", d => getEventColor(d.temporalOrder, d.isReference))
						.attr("stroke", d => (d.isReference ? D3_COLORS.electricBlue : "none"))
						.attr("stroke-width", d => (d.isReference ? 3 : 0))
						.style("filter", d => {
							const color = getEventColor(d.temporalOrder, d.isReference);
							return `drop-shadow(0 0 8px ${color})`;
						});

					// Event label
					g.append("text")
						.attr("text-anchor", "middle")
						.attr("dominant-baseline", "middle")
						.attr("fill", "#0a0e27")
						.attr("class", "label")
						.attr("font-weight", "bold")
						.text(d => d.id);

					// Animate in
					g.transition().duration(300).style("opacity", 1);

					return g;
				},
				update => {
					// Ensure opacity is 1 (in case enter transition hasn't completed)
					update.style("opacity", 1);

					// Update position with transition
					update
						.transition()
						.duration(500)
						.attr("transform", d => `translate(${scales.xScale(d.x)}, ${scales.yScale(d.ct)})`);

					// Update colors with transition
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

	/**
	 * Update all temporal orderings based on current velocity
	 */
	function updateTemporalOrderings(): void {
		const refEvent = state.events.find(e => e.isReference);
		if (!refEvent) return;

		state.events.forEach(event => {
			if (event.isReference) {
				event.temporalOrder = "simultaneous";
			} else {
				event.temporalOrder = calculateTemporalOrder(
					event.ct,
					event.x,
					refEvent.ct,
					refEvent.x,
					state.velocity
				);
			}
		});
	}

	/**
	 * Handle click on diagram
	 */
	function handleClick(event: MouseEvent): void {
		const [mouseX, mouseY] = pointer(event, svg.node());

		// Check if clicked on existing event
		for (const evt of state.events) {
			const evtScreenX = scales.xScale(evt.x);
			const evtScreenY = scales.yScale(evt.ct);
			const distance = Math.sqrt(
				Math.pow(mouseX - evtScreenX, 2) + Math.pow(mouseY - evtScreenY, 2)
			);

			if (distance <= CLICK_TOLERANCE) {
				// Remove event
				removeEvent(evt.id);
				return;
			}
		}

		// Add new event if under limit
		if (state.events.length < MAX_EVENTS) {
			const x = (mouseX - size / 2) / (size / 2 / scales.maxCoord);
			const ct = -(mouseY - size / 2) / (size / 2 / scales.maxCoord);
			addEvent(ct, x);
		}
	}

	/**
	 * Add new event
	 */
	function addEvent(ct: number, x: number): void {
		const nextLabel = EVENT_LABELS[state.events.length];
		const isFirst = state.events.length === 0;

		const newEvent: SimultaneityEvent = {
			id: nextLabel,
			ct,
			x,
			isReference: isFirst,
			temporalOrder: "simultaneous",
		};

		state.events.push(newEvent);
		syncStateToModule(state.events);

		if (isFirst) {
			state.referenceEventId = nextLabel;
		}

		updateTemporalOrderings();
		render();
		updateTimeSeparations();
		updateSpatialSeparations();

		// Update URL to persist events
		updateURL();
	}

	/**
	 * Remove event
	 */
	function removeEvent(id: string): void {
		const index = state.events.findIndex(e => e.id === id);
		if (index === -1) return;

		const wasReference = state.events[index].isReference;
		state.events.splice(index, 1);
		syncStateToModule(state.events);

		// Reassign IDs
		state.events.forEach((e, i) => {
			e.id = EVENT_LABELS[i];
		});

		// If removed reference, make first event new reference
		if (wasReference && state.events.length > 0) {
			state.events[0].isReference = true;
			state.referenceEventId = state.events[0].id;
		} else if (state.events.length === 0) {
			state.referenceEventId = null;
		}

		updateTemporalOrderings();
		render();
		updateTimeSeparations();
		updateSpatialSeparations();

		// Update URL to persist events
		updateURL();
	}

	/**
	 * Update velocity
	 */
	function updateVelocity(velocity: number): void {
		state.velocity = velocity;
		state.velocityDecimal = rl.ensure(velocity);
		state.gamma = calculateGamma(velocity);
		updateTemporalOrderings();
		render();
		updateTimeSeparations();
		updateSpatialSeparations();

		// When paused, manually render the now line since animation loop isn't running
		if (!state.isAnimating) {
			renderNowLine();
		}

		// Update velocity label on slider
		velocityLabel.text(`${rl.formatSignificant(state.velocityDecimal, "9", 2)}c`);
	}

	/**
	 * Reset to train example
	 */
	function reset(): void {
		state.events = createTrainExample();
		syncStateToModule(state.events);
		state.velocity = 0;
		state.velocityDecimal = rl.ensure(0);
		state.gamma = 1;
		state.referenceEventId = "A";

		// Apply fixed scale for the train example
		scales = createScaleSet(TRAIN_EXAMPLE_SCALE, size);

		render();
		updateTimeSeparations();
		updateSpatialSeparations();

		// Update URL to persist events
		updateURL();
	}

	/**
	 * Clear all events
	 */
	function clearAll(): void {
		state.events = [];
		syncStateToModule(state.events);
		state.referenceEventId = null;
		render();
		updateTimeSeparations();
		updateSpatialSeparations();

		// Update URL to persist events
		updateURL();
	}

	/**
	 * Main render function
	 */
	function render(): void {
		renderGrid();
		renderAxes();
		renderEvents();
		// Now line is rendered in animation loop
	}

	// Attach click handler
	svg.on("click", handleClick);

	// Initial render
	render();

	// Create animation controls container (bottom-center of diagram)
	const controlContainer = select<HTMLElement, unknown>(container)
		.append("div")
		.attr("class", "simultaneity-controls")
		.style("position", "absolute")
		.style("bottom", "220px")
		.style("left", "50%")
		.style("transform", "translateX(-50%)")
		.style("display", "flex")
		.style("flex-direction", "column")
		.style("align-items", "center")
		.style("gap", "8px")
		.style("z-index", "1000");

	// Create velocity slider container
	const sliderContainer = controlContainer
		.append("div")
		.style("display", "flex")
		.style("align-items", "center")
		.style("gap", "8px")
		.style("padding", "8px 12px")
		.style("background", "rgba(10, 14, 39, 0.9)")
		.style("border", "1px solid rgba(0, 217, 255, 0.4)")
		.style("border-radius", "4px")
		.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)");

	sliderContainer
		.append("label")
		.style("color", "#00d9ff")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.style("font-weight", "600")
		.text("Velocity:");

	// Debounce timer for URL updates
	let urlUpdateTimer: number | undefined;

	const velocitySlider = sliderContainer
		.append("input")
		.attr("type", "range")
		.attr("id", "simVelocitySlider")
		.attr("min", "-0.99")
		.attr("max", "0.99")
		.attr("step", "0.01")
		.attr("value", "0")
		.style("width", "200px")
		.style("cursor", "pointer")
		.on("input", function () {
			const velocity = parseFloat((this).value);
			updateVelocity(velocity);

			// Update text input if it exists
			const textInput = document.getElementById("simVelocityInput") as HTMLInputElement;
			if (textInput) {
				textInput.value = velocity.toString();
			}

			// Debounced URL update (wait 500ms after user stops moving slider)
			clearTimeout(urlUpdateTimer);
			urlUpdateTimer = window.setTimeout(() => {
				updateURL();
			}, 500);
		});

	const velocityLabel = sliderContainer
		.append("span")
		.style("color", "#e8f1f5")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.style("font-weight", "600")
		.style("min-width", "50px")
		.style("text-align", "right")
		.text("0.00c");

	// Create position slider container (hidden when animating)
	const positionSliderContainer = controlContainer
		.append("div")
		.attr("class", "simultaneity-position-slider-container")
		.style("display", "none")
		.style("align-items", "center")
		.style("gap", "8px")
		.style("padding", "8px 12px")
		.style("background", "rgba(10, 14, 39, 0.9)")
		.style("border", "1px solid rgba(0, 217, 255, 0.4)")
		.style("border-radius", "4px")
		.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)");

	positionSliderContainer
		.append("label")
		.style("color", "#00d9ff")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.style("font-weight", "600")
		.text("Position:");

	const positionSlider = positionSliderContainer
		.append("input")
		.attr("type", "range")
		.attr("id", "simPositionSlider")
		.attr("min", "0")
		.attr("max", "1")
		.attr("step", "0.001")
		.attr("value", "0")
		.style("width", "200px")
		.style("cursor", "pointer")
		.on("input", function () {
			const progress = parseFloat((this).value);
			state.animationProgress = progress;
			positionLabel.text(`${Math.round(progress * 100)}%`);
			renderNowLine();
		});

	const positionLabel = positionSliderContainer
		.append("span")
		.style("color", "#e8f1f5")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.style("font-weight", "600")
		.style("min-width", "50px")
		.style("text-align", "right")
		.text("0%");

	// Create button container for play/pause and light cone toggle
	const buttonContainer = controlContainer
		.append("div")
		.style("display", "flex")
		.style("gap", "8px");

	// Create Play/Pause button
	const playPauseButton = buttonContainer
		.append("button")
		.attr("class", "simultaneity-toggle-button")
		.text("⏸ Pause")
		.style("padding", "8px 16px")
		.style("background", "rgba(10, 14, 39, 0.9)")
		.style("border", "1px solid rgba(0, 217, 255, 0.4)")
		.style("color", "#e8f1f5")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "12px")
		.style("cursor", "pointer")
		.style("border-radius", "4px")
		.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)")
		.style("transition", "all 200ms")
		.on("mouseenter", function () {
			select(this)
				.style("background", "rgba(0, 217, 255, 0.2)")
				.style("box-shadow", "0 0 15px rgba(0, 217, 255, 0.5)");
		})
		.on("mouseleave", function () {
			select(this)
				.style("background", "rgba(10, 14, 39, 0.9)")
				.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)");
		})
		.on("click", () => {
			if (state.isAnimating) {
				stopAnimation();
				playPauseButton.text("▶ Play");
				// Show position slider when paused
				positionSliderContainer.style("display", "flex");
				// Update position slider to current progress
				positionSlider.property("value", state.animationProgress);
				positionLabel.text(`${Math.round(state.animationProgress * 100)}%`);
				// Ensure now line is rendered at current position
				renderNowLine();
			} else {
				startAnimation();
				playPauseButton.text("⏸ Pause");
				// Hide position slider when animating
				positionSliderContainer.style("display", "none");
			}
		});

	// Create Light Cone toggle button
	void buttonContainer
		.append("button")
		.attr("class", "simultaneity-toggle-button")
		.text("Light cone")
		.style("padding", "8px 16px")
		.style("background", "rgba(10, 14, 39, 0.9)")
		.style("border", "1px solid rgba(0, 217, 255, 0.4)")
		.style("color", "#e8f1f5")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "12px")
		.style("cursor", "pointer")
		.style("border-radius", "4px")
		.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)")
		.style("transition", "all 200ms")
		.on("mouseenter", function () {
			select(this)
				.style("background", "rgba(0, 217, 255, 0.2)")
				.style("box-shadow", "0 0 15px rgba(0, 217, 255, 0.5)");
		})
		.on("mouseleave", function () {
			select(this)
				.style("background", "rgba(10, 14, 39, 0.9)")
				.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)");
		})
		.on("click", () => {
			state.showLightCone = !state.showLightCone;
			renderNowLine();
		});

	// Create time separation display container (bottom-right of diagram)
	const timeSeparationContainer = select<HTMLElement, unknown>(container)
		.append("div")
		.attr("class", "simultaneity-time-display")
		.style("position", "absolute")
		.style("bottom", "50px")
		.style("right", "20px")
		.style("padding", "8px 12px")
		.style("background", "rgba(10, 14, 39, 0.9)")
		.style("border", "1px solid rgba(0, 217, 255, 0.4)")
		.style("border-radius", "4px")
		.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)")
		.style("z-index", "1000")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.style("color", "#e8f1f5")
		.style("min-width", "180px");

	// Create spatial separation display container (bottom-left of diagram)
	const spatialSeparationContainer = select<HTMLElement, unknown>(container)
		.append("div")
		.attr("class", "simultaneity-space-display")
		.style("position", "absolute")
		.style("bottom", "50px")
		.style("left", "20px")
		.style("padding", "8px 12px")
		.style("background", "rgba(10, 14, 39, 0.9)")
		.style("border", "1px solid rgba(0, 217, 255, 0.4)")
		.style("border-radius", "4px")
		.style("box-shadow", "0 0 10px rgba(0, 217, 255, 0.3)")
		.style("z-index", "1000")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.style("color", "#e8f1f5")
		.style("min-width", "180px");

	// Function to update time separation display
	function updateTimeSeparations(): void {
		if (state.events.length === 0) {
			timeSeparationContainer.style("display", "none");
			return;
		}

		timeSeparationContainer.style("display", "block");

		const refEvent = state.events.find(e => e.isReference);
		if (!refEvent) {
			timeSeparationContainer.html('<div style="color: #ffaa00;">No reference event</div>');
			return;
		}

		// Calculate time separations in moving frame
		const separations: string[] = [];
		separations.push(
			`<div style="font-weight: bold; margin-bottom: 4px; color: #00d9ff;">Time in frame (v=${rl.formatSignificant(state.velocityDecimal, "9", 2)}c):</div>`
		);

		state.events.forEach(event => {
			if (event.id === refEvent.id) return; // Skip reference event

			// Transform both events to moving frame
			const eventPrime = lorentzTransform(event.ct, event.x, state.velocity);
			const refPrime = lorentzTransform(refEvent.ct, refEvent.x, state.velocity);
			const deltaCtPrime = eventPrime.ctPrime - refPrime.ctPrime;

			// Convert to time (ct is in km, so divide by c to get seconds)
			const deltaTime = deltaCtPrime / C;

			// Format with appropriate units using Decimal for consistent precision
			let timeStr: string;
			const deltaTimeDecimal = rl.ensure(deltaTime);
			const tolerance = rl.ensure(0.001);
			if (deltaTimeDecimal.abs().lt(tolerance)) {
				timeStr = "≈ 0 s (simultaneous)";
			} else if (deltaTimeDecimal.abs().lt(rl.one)) {
				const deltaTimeMs = deltaTimeDecimal.mul(1000);
				timeStr = `${rl.formatSignificant(deltaTimeMs, "0", 2)} ms`;
			} else {
				timeStr = `${rl.formatSignificant(deltaTimeDecimal, "0", 3)} s`;
			}

			const color =
				event.temporalOrder === "future"
					? "#00ff9f"
					: event.temporalOrder === "past"
						? "#ffaa00"
						: "#e8f1f5";

			const sign = deltaTimeDecimal.gte(0) ? "+" : "";
			separations.push(
				`<div style="color: ${color}; margin: 2px 0;">Event ${event.id}: ${sign}${timeStr}</div>`
			);
		});

		timeSeparationContainer.html(separations.join(""));
	}

	// Function to update spatial separation display
	function updateSpatialSeparations(): void {
		if (state.events.length === 0) {
			spatialSeparationContainer.style("display", "none");
			return;
		}

		spatialSeparationContainer.style("display", "block");

		const refEvent = state.events.find(e => e.isReference);
		if (!refEvent) {
			spatialSeparationContainer.html('<div style="color: #ffaa00;">No reference event</div>');
			return;
		}

		// Calculate spatial separations in moving frame
		const separations: string[] = [];
		separations.push(
			`<div style="font-weight: bold; margin-bottom: 4px; color: #00d9ff;">Space in frame (v=${rl.formatSignificant(state.velocityDecimal, "9", 2)}c):</div>`
		);

		state.events.forEach(event => {
			if (event.id === refEvent.id) return; // Skip reference event

			// Transform both events to moving frame
			const eventPrime = lorentzTransform(event.ct, event.x, state.velocity);
			const refPrime = lorentzTransform(refEvent.ct, refEvent.x, state.velocity);
			const deltaXPrime = eventPrime.xPrime - refPrime.xPrime;

			// Format as whole number with thousands separator
			const formattedDistance = Math.round(Math.abs(deltaXPrime)).toLocaleString("en-US");

			const color =
				event.temporalOrder === "future"
					? "#00ff9f"
					: event.temporalOrder === "past"
						? "#ffaa00"
						: "#e8f1f5";

			const sign = deltaXPrime >= 0 ? "+" : "−";
			separations.push(
				`<div style="color: ${color}; margin: 2px 0;">Event ${event.id}: ${sign}${formattedDistance} km</div>`
			);
		});

		spatialSeparationContainer.html(separations.join(""));
	}

	// Initial update
	updateTimeSeparations();
	updateSpatialSeparations();

	// Check for pending events from URL and restore them
	const pendingEvents = simultaneityState.consumePendingEvents();
	if (pendingEvents && pendingEvents.length > 0) {
		// Restore events (limit to 4, assign IDs)
		state.events = pendingEvents.slice(0, 4).map((e, i) => ({
			id: EVENT_LABELS[i],
			ct: e.ct,
			x: e.x,
			isReference: i === 0,
			temporalOrder: "simultaneous" as const,
		}));
		syncStateToModule(state.events);

		if (state.events.length > 0) {
			state.referenceEventId = state.events[0].id;
		}

		// Recalculate scales based on restored events
		const maxCoord =
			Math.max(...state.events.map(e => Math.max(Math.abs(e.ct), Math.abs(e.x)))) * 1.3;
		scales = createScaleSet(maxCoord, size);

		updateTemporalOrderings();
		render();
		updateTimeSeparations();
		updateSpatialSeparations();

		// Update URL to persist restored events
		updateURL();
	}

	// Start animation
	startAnimation();

	// Resize handler for orientation changes and window resizing
	let lastInnerWidth = window.innerWidth;
	const resizeHandler = debounce(() => {
		// iOS Safari fires resize during scroll (height-only visual viewport changes)
		if (window.innerWidth === lastInnerWidth) return;
		lastInnerWidth = window.innerWidth;

		render();
	}, 150);

	window.addEventListener("resize", resizeHandler);

	// Return controller interface with extended methods
	return {
		update: () => render(),
		updateSlider: (velocity: number) => {
			// Clamp velocity to valid range
			const clampedVelocity = Math.max(-0.99, Math.min(0.99, velocity));
			const clampedVelocityDecimal = rl.ensure(clampedVelocity);
			velocitySlider.property("value", clampedVelocity);
			velocityLabel.text(`${rl.formatSignificant(clampedVelocityDecimal, "9", 2)}c`);
			updateVelocity(clampedVelocity);
		},
		pause: () => {
			stopAnimation();
			playPauseButton.text("▶ Play");
		},
		play: () => {
			startAnimation();
			playPauseButton.text("⏸ Pause");
		},
		reset: () => {
			reset();
			// Reset slider and label
			velocitySlider.property("value", 0);
			velocityLabel.text("0.00c");
			// Ensure animation is running after reset
			if (!state.isAnimating) {
				startAnimation();
			}
			playPauseButton.text("⏸ Pause");
			// Hide position slider since animation is running
			positionSliderContainer.style("display", "none");
		},
		clearAll,
		destroy: () => {
			stopAnimation();
			window.removeEventListener("resize", resizeHandler);
			svg.selectAll("*").remove();
			svg.on("click", null);
		},
	};
}
