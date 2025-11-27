// Relativity of Simultaneity Interactive Visualization
import { Selection } from 'd3-selection';
import { pointer } from 'd3-selection';
import 'd3-transition';
import { COLORS as D3_COLORS } from './minkowski-colors';
import type { ScaleSet } from './minkowski-types';
import {
    C,
    calculateGamma,
    lorentzTransform,
    createScaleSet,
    setupSVG,
    createAxisDefinitions
} from './minkowski-core';

/**
 * Event data structure
 */
interface SimultaneityEvent {
    id: string;
    ct: number;
    x: number;
    isReference: boolean;
    temporalOrder: 'future' | 'past' | 'simultaneous';
}

/**
 * Controller state
 */
interface SimultaneityState {
    events: SimultaneityEvent[];
    velocity: number;
    gamma: number;
    referenceEventId: string | null;
    isAnimating: boolean;
    animationProgress: number; // 0 to 1
}

/**
 * SVG layer groups
 */
interface LayerGroups {
    grid: Selection<SVGGElement, unknown, null, undefined>;
    axes: Selection<SVGGElement, unknown, null, undefined>;
    simultaneity: Selection<SVGGElement, unknown, null, undefined>;
    nowLine: Selection<SVGGElement, unknown, null, undefined>;
    events: Selection<SVGGElement, unknown, null, undefined>;
}

const MAX_EVENTS = 4;
const EVENT_LABELS = ['A', 'B', 'C', 'D'];
const EVENT_RADIUS = 8;
const CLICK_TOLERANCE = 15;

/**
 * Create Einstein's train example
 */
function createTrainExample(): SimultaneityEvent[] {
    const time = 2; // seconds
    const ct = time * C; // Convert to km
    const separation = 300000; // km (1 light-second)

    return [
        {
            id: 'A',
            ct,
            x: -separation,
            isReference: true,
            temporalOrder: 'simultaneous'
        },
        {
            id: 'B',
            ct,
            x: separation,
            isReference: false,
            temporalOrder: 'simultaneous'
        }
    ];
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
): 'future' | 'past' | 'simultaneous' {
    // Transform to moving frame
    const eventPrime = lorentzTransform(eventCt, eventX, beta);
    const refPrime = lorentzTransform(refCt, refX, beta);

    const deltaCtPrime = eventPrime.ctPrime - refPrime.ctPrime;

    // Tolerance for floating point comparison (0.01 km ≈ 0.03 microseconds)
    if (Math.abs(deltaCtPrime) < 0.01) return 'simultaneous';
    return deltaCtPrime > 0 ? 'future' : 'past';
}

/**
 * Get color for event based on temporal order
 */
function getEventColor(order: 'future' | 'past' | 'simultaneous', isReference: boolean): string {
    if (isReference) return D3_COLORS.electricBlue;
    switch (order) {
        case 'future': return D3_COLORS.quantumGreen;
        case 'past': return D3_COLORS.photonGold;
        case 'simultaneous': return D3_COLORS.plasmaWhite;
    }
}

/**
 * Extended controller interface with reset and clearAll methods
 */
export interface SimultaneityController {
    update(): void;
    updateSlider?(velocity: number): void;
    pause(): void;
    play(): void;
    reset(): void;
    clearAll(): void;
    destroy(): void;
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
        gamma: 1,
        referenceEventId: 'A',
        isAnimating: true,
        animationProgress: 0
    };
    let animationFrameId: number | null = null;
    let lastTimestamp = 0;

    // Setup SVG
    const svg = setupSVG(container, size);
    createAxisDefinitions(svg);

    // Create layer groups (back to front rendering order)
    const layers: LayerGroups = {
        grid: svg.append('g').attr('class', 'grid-layer'),
        axes: svg.append('g').attr('class', 'axes-layer'),
        simultaneity: svg.append('g').attr('class', 'simultaneity-layer'),
        nowLine: svg.append('g').attr('class', 'now-line-layer'),
        events: svg.append('g').attr('class', 'events-layer')
    };

    // Calculate initial scales based on train example
    const maxCoord = Math.max(...state.events.map(e => Math.max(Math.abs(e.ct), Math.abs(e.x)))) * 1.3;
    scales = createScaleSet(maxCoord, size);

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
                y2: scales.yScale(scales.maxCoord)
            });
        }

        // Horizontal lines
        for (let ct = -scales.maxCoord; ct <= scales.maxCoord; ct += gridSpacing) {
            gridLines.push({
                x1: scales.xScale(-scales.maxCoord),
                y1: scales.yScale(ct),
                x2: scales.xScale(scales.maxCoord),
                y2: scales.yScale(ct)
            });
        }

        layers.grid
            .selectAll('line')
            .data(gridLines)
            .join('line')
            .attr('x1', d => d.x1)
            .attr('y1', d => d.y1)
            .attr('x2', d => d.x2)
            .attr('y2', d => d.y2)
            .attr('stroke', 'rgba(0, 217, 255, 0.15)')
            .attr('stroke-width', 1);
    }

    /**
     * Render reference frame axes
     */
    function renderAxes(): void {
        const beta = state.velocity;
        const centerX = size / 2;
        const centerY = size / 2;

        // Clear existing axes
        layers.axes.selectAll('*').remove();

        // Original frame axes (stationary)
        // X axis (horizontal)
        layers.axes.append('line')
            .attr('x1', 0)
            .attr('y1', centerY)
            .attr('x2', size)
            .attr('y2', centerY)
            .attr('stroke', D3_COLORS.electricBlue)
            .attr('stroke-width', 2)
            .attr('opacity', 0.5);

        // CT axis (vertical)
        layers.axes.append('line')
            .attr('x1', centerX)
            .attr('y1', 0)
            .attr('x2', centerX)
            .attr('y2', size)
            .attr('stroke', D3_COLORS.electricBlue)
            .attr('stroke-width', 2)
            .attr('opacity', 0.5);

        // Moving frame axes (transformed)
        if (Math.abs(beta) > 0.001) {
            const axisExtent = scales.maxCoord;

            // X' axis (tilted)
            const x1Prime = -axisExtent;
            const ct1Prime = -axisExtent * beta;
            const x2Prime = axisExtent;
            const ct2Prime = axisExtent * beta;

            layers.axes.append('line')
                .attr('x1', scales.xScale(x1Prime))
                .attr('y1', scales.yScale(ct1Prime))
                .attr('x2', scales.xScale(x2Prime))
                .attr('y2', scales.yScale(ct2Prime))
                .attr('stroke', D3_COLORS.quantumGreen)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5')
                .attr('opacity', 0.7);

            // CT' axis (tilted)
            const ct1AxisPrime = -axisExtent;
            const x1AxisPrime = -axisExtent * beta;
            const ct2AxisPrime = axisExtent;
            const x2AxisPrime = axisExtent * beta;

            layers.axes.append('line')
                .attr('x1', scales.xScale(x1AxisPrime))
                .attr('y1', scales.yScale(ct1AxisPrime))
                .attr('x2', scales.xScale(x2AxisPrime))
                .attr('y2', scales.yScale(ct2AxisPrime))
                .attr('stroke', D3_COLORS.quantumGreen)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5')
                .attr('opacity', 0.7);

            // Axis labels
            layers.axes.append('text')
                .attr('x', scales.xScale(axisExtent * 0.9))
                .attr('y', scales.yScale(axisExtent * beta * 0.9) - 10)
                .attr('fill', D3_COLORS.quantumGreen)
                .attr('class', 'label')
                .attr('text-anchor', 'middle')
                .text("x'");

            layers.axes.append('text')
                .attr('x', scales.xScale(axisExtent * beta * 0.9) + 15)
                .attr('y', scales.yScale(axisExtent * 0.9))
                .attr('fill', D3_COLORS.quantumGreen)
                .attr('class', 'label')
                .attr('text-anchor', 'middle')
                .text("ct'");
        }

        // Axis labels for original frame
        layers.axes.append('text')
            .attr('x', size - 20)
            .attr('y', centerY - 10)
            .attr('fill', D3_COLORS.electricBlue)
            .attr('class', 'label')
            .attr('text-anchor', 'end')
            .text('x');

        layers.axes.append('text')
            .attr('x', centerX + 15)
            .attr('y', 20)
            .attr('fill', D3_COLORS.electricBlue)
            .attr('class', 'label')
            .text('ct');

        // Velocity label
        layers.axes.append('text')
            .attr('x', centerX)
            .attr('y', size - 20)
            .attr('fill', D3_COLORS.plasmaWhite)
            .attr('class', 'header')
            .attr('text-anchor', 'middle')
            .text(`v = ${state.velocity.toFixed(2)}c`);
    }

    /**
     * Render simultaneity line through reference event
     */
    function renderSimultaneityLine(): void {
        const refEvent = state.events.find(e => e.isReference);
        if (!refEvent) {
            layers.simultaneity.selectAll('*').remove();
            return;
        }

        const beta = state.velocity;
        const extent = scales.maxCoord;

        // Line through reference event with slope = beta
        const x1 = -extent;
        const ct1 = refEvent.ct + beta * (x1 - refEvent.x);
        const x2 = extent;
        const ct2 = refEvent.ct + beta * (x2 - refEvent.x);

        // Remove old line
        layers.simultaneity.selectAll('*').remove();

        // Draw gradient band
        const bandWidth = 15;
        layers.simultaneity.append('line')
            .attr('x1', scales.xScale(x1))
            .attr('y1', scales.yScale(ct1))
            .attr('x2', scales.xScale(x2))
            .attr('y2', scales.yScale(ct2))
            .attr('stroke', D3_COLORS.electricBlue)
            .attr('stroke-width', bandWidth)
            .attr('stroke-opacity', 0.15)
            .attr('stroke-linecap', 'round');

        // Draw center line
        layers.simultaneity.append('line')
            .attr('x1', scales.xScale(x1))
            .attr('y1', scales.yScale(ct1))
            .attr('x2', scales.xScale(x2))
            .attr('y2', scales.yScale(ct2))
            .attr('stroke', D3_COLORS.electricBlue)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '8,4')
            .attr('opacity', 0.8)
            .style('filter', 'drop-shadow(0 0 5px rgba(0, 217, 255, 0.5))');
    }

    /**
     * Render animated "now" line
     */
    function renderNowLine(): void {
        const beta = state.velocity;
        const extent = scales.maxCoord;

        // Calculate current "now" position based on animation progress
        const currentCt = -scales.maxCoord + (state.animationProgress * 2 * scales.maxCoord);

        // Line parallel to simultaneity line (horizontal in moving frame)
        const x1 = -extent;
        const ct1 = currentCt + beta * x1;
        const x2 = extent;
        const ct2 = currentCt + beta * x2;

        layers.nowLine.selectAll('*').remove();

        // Draw glowing "now" line
        layers.nowLine.append('line')
            .attr('x1', scales.xScale(x1))
            .attr('y1', scales.yScale(ct1))
            .attr('x2', scales.xScale(x2))
            .attr('y2', scales.yScale(ct2))
            .attr('stroke', D3_COLORS.quantumGreen)
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 0.8)
            .style('filter', 'drop-shadow(0 0 10px rgba(6, 255, 165, 0.8))');

        // Add "NOW" label
        const labelX = scales.xScale(extent * 0.85);
        const labelY = scales.yScale(currentCt + beta * extent * 0.85);

        layers.nowLine.append('text')
            .attr('x', labelX)
            .attr('y', labelY - 10)
            .attr('fill', D3_COLORS.quantumGreen)
            .attr('class', 'label')
            .attr('text-anchor', 'end')
            .attr('font-weight', 'bold')
            .text('NOW');
    }

    /**
     * Check if now line is crossing an event and flash it
     */
    function checkEventFlashes(): void {
        const beta = state.velocity;
        const currentCt = -scales.maxCoord + (state.animationProgress * 2 * scales.maxCoord);

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
        const eventGroup = layers.events.selectAll<SVGGElement, SimultaneityEvent>('g.event')
            .filter(d => d.id === eventId);

        if (eventGroup.empty()) return;

        const circle = eventGroup.select('circle');

        // Pulse animation
        circle.transition()
            .duration(150)
            .attr('r', EVENT_RADIUS * 2)
            .style('filter', 'drop-shadow(0 0 20px currentColor)')
            .transition()
            .duration(150)
            .attr('r', EVENT_RADIUS)
            .style('filter', d => {
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
        layers.nowLine.selectAll('*').remove();
    }

    /**
     * Render events
     */
    function renderEvents(): void {
        layers.events
            .selectAll('g.event')
            .data(state.events, (d: any) => d.id)
            .join(
                enter => {
                    const g = enter.append('g')
                        .attr('class', 'event')
                        .attr('transform', d => `translate(${scales.xScale(d.x)}, ${scales.yScale(d.ct)})`)
                        .style('cursor', 'pointer')
                        .style('opacity', 0);

                    // Event circle with glow
                    g.append('circle')
                        .attr('r', EVENT_RADIUS)
                        .attr('fill', d => getEventColor(d.temporalOrder, d.isReference))
                        .attr('stroke', d => d.isReference ? D3_COLORS.electricBlue : 'none')
                        .attr('stroke-width', d => d.isReference ? 3 : 0)
                        .style('filter', d => {
                            const color = getEventColor(d.temporalOrder, d.isReference);
                            return `drop-shadow(0 0 8px ${color})`;
                        });

                    // Event label
                    g.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('fill', '#0a0e27')
                        .attr('class', 'label')
                        .attr('font-weight', 'bold')
                        .text(d => d.id);

                    // Animate in
                    g.transition()
                        .duration(300)
                        .style('opacity', 1);

                    return g;
                },
                update => {
                    // Update colors with transition
                    update.select('circle')
                        .transition()
                        .duration(500)
                        .attr('fill', d => getEventColor(d.temporalOrder, d.isReference))
                        .attr('stroke', d => d.isReference ? D3_COLORS.electricBlue : 'none')
                        .attr('stroke-width', d => d.isReference ? 3 : 0)
                        .style('filter', d => {
                            const color = getEventColor(d.temporalOrder, d.isReference);
                            return `drop-shadow(0 0 8px ${color})`;
                        });

                    return update;
                },
                exit => {
                    exit.transition()
                        .duration(200)
                        .style('opacity', 0)
                        .remove();
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
                event.temporalOrder = 'simultaneous';
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
            const x = (mouseX - size / 2) / ((size / 2) / scales.maxCoord);
            const ct = -(mouseY - size / 2) / ((size / 2) / scales.maxCoord);
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
            temporalOrder: 'simultaneous'
        };

        state.events.push(newEvent);

        if (isFirst) {
            state.referenceEventId = nextLabel;
        }

        updateTemporalOrderings();
        render();
    }

    /**
     * Remove event
     */
    function removeEvent(id: string): void {
        const index = state.events.findIndex(e => e.id === id);
        if (index === -1) return;

        const wasReference = state.events[index].isReference;
        state.events.splice(index, 1);

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
    }

    /**
     * Update velocity
     */
    function updateVelocity(velocity: number): void {
        state.velocity = velocity;
        state.gamma = calculateGamma(velocity);
        updateTemporalOrderings();
        render();
    }

    /**
     * Reset to train example
     */
    function reset(): void {
        state.events = createTrainExample();
        state.velocity = 0;
        state.gamma = 1;
        state.referenceEventId = 'A';
        render();
    }

    /**
     * Clear all events
     */
    function clearAll(): void {
        state.events = [];
        state.referenceEventId = null;
        render();
    }

    /**
     * Main render function
     */
    function render(): void {
        renderGrid();
        renderAxes();
        renderSimultaneityLine();
        renderEvents();
        // Now line is rendered in animation loop
    }

    // Attach click handler
    svg.on('click', handleClick);

    // Initial render
    render();

    // Start animation
    startAnimation();

    // Return controller interface with extended methods
    return {
        update: () => render(),
        updateSlider: updateVelocity,
        pause: () => {
            stopAnimation();
        },
        play: () => {
            startAnimation();
        },
        reset,
        clearAll,
        destroy: () => {
            stopAnimation();
            svg.selectAll('*').remove();
            svg.on('click', null);
        }
    };
}
