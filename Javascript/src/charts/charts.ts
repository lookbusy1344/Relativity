/**
 * Functional chart management with Chart.js
 * Provides configuration factories and lifecycle management
 */

import { Chart, ChartOptions } from 'chart.js';
import type { generateAccelChartData, generateFlipBurnChartData, generateVisualizationChartData } from './dataGeneration';

export type ChartRegistry = Map<string, Chart>;

export type ChartStyleConfig = {
    primaryColor: string;
    secondaryColor: string;
    xAxisLabel: string;
    yAxisLabel: string;
    xMax?: number;
    yMax?: number;
    yMin?: number;
    y1AxisLabel?: string;
    y1Max?: number;
};

type GradientColors = {
    high: string;
    mid: string;
    low: string;
};

type ChartDataset = {
    label: string;
    data: { x: number; y: number }[];
    borderColor: string | CanvasGradient;
    backgroundColor: string;
    borderWidth: number;
    fill: boolean;
    tension: number;
    pointRadius?: number | number[];
    pointStyle?: 'circle' | 'triangle' | ('circle' | 'triangle')[];
    pointRotation?: number | number[];
    pointBackgroundColor?: string | CanvasGradient | (string | CanvasGradient)[];
    borderDash?: number[];
    yAxisID?: string;
};

/**
 * Create a vertical velocity-based gradient for charts
 */
function createVelocityGradient(
    ctx: CanvasRenderingContext2D,
    height: number,
    colors: GradientColors
): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.high);
    gradient.addColorStop(0.5, colors.mid);
    gradient.addColorStop(1, colors.low);
    return gradient;
}

/**
 * Calculate arrow indicator properties for trajectory visualization
 */
function createArrowIndicators(
    data: { x: number; y: number }[],
    arrowIndices: number[]
): {
    pointRadii: number[];
    pointStyles: ('triangle' | 'circle')[];
    pointRotations: number[];
} {
    const arrowSet = new Set(arrowIndices);
    const indexMap = new Map(arrowIndices.map((idx, pos) => [idx, pos]));
    
    const pointRadii = data.map((_, i) => arrowSet.has(i) ? 4 : 0);
    const pointStyles = data.map((_, i) => arrowSet.has(i) ? 'triangle' as const : 'circle' as const);
    const pointRotations = data.map((_, i) => {
        if (!arrowSet.has(i)) return 0;
        const pos = indexMap.get(i)!;
        if (pos === arrowIndices.length - 1) return 0;
        const nextArrowIdx = arrowIndices[pos + 1];
        const dx = data[nextArrowIdx].x - data[i].x;
        const dy = data[nextArrowIdx].y - data[i].y;
        return Math.atan2(dy, dx) + Math.PI / 2;
    });
    return { pointRadii, pointStyles, pointRotations };
}

/**
 * Create standard mass remaining dataset configuration for fuel charts
 */
function createMassRemainingDatasets(
    data70: { x: number; y: number }[],
    data75: { x: number; y: number }[],
    data80: { x: number; y: number }[],
    data85: { x: number; y: number }[]
): ChartDataset[] {
    return [{
        label: '70% Nozzle Efficiency',
        data: data70,
        borderColor: '#ff5555',
        backgroundColor: 'rgba(255, 85, 85, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0
    }, {
        label: '75% Nozzle Efficiency',
        data: data75,
        borderColor: '#ffaa00',
        backgroundColor: 'rgba(255, 170, 0, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0
    }, {
        label: '80% Nozzle Efficiency',
        data: data80,
        borderColor: '#00ff9f',
        backgroundColor: 'rgba(0, 255, 159, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0
    }, {
        label: '85% Nozzle Efficiency',
        data: data85,
        borderColor: '#aa55ff',
        backgroundColor: 'rgba(170, 85, 255, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0
    }];
}

/**
 * Create dual-time dataset configuration (proper time vs coordinate time)
 */
function createDualTimeDatasets(
    properTimeData: { x: number; y: number }[],
    coordTimeData: { x: number; y: number }[],
    properLabel: string,
    coordLabel: string
): ChartDataset[] {
    return [{
        label: properLabel,
        data: properTimeData,
        borderColor: '#00d9ff',
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0
    }, {
        label: coordLabel,
        data: coordTimeData,
        borderColor: '#00ff9f',
        backgroundColor: 'rgba(0, 255, 159, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0
    }];
}

function createChartOptions(config: ChartStyleConfig): ChartOptions {
    const baseOptions: ChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#e8f1f5',
                    font: { family: 'IBM Plex Mono', size: 12 }
                }
            },
            title: { display: false }
        },
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: config.xAxisLabel,
                    color: '#00d9ff',
                    font: { family: 'IBM Plex Mono', size: 11, weight: 600 }
                },
                max: config.xMax,
                ticks: {
                    maxTicksLimit: 10,
                    color: '#e8f1f5',
                    font: { family: 'IBM Plex Mono' }
                },
                grid: {
                    color: 'rgba(0, 217, 255, 0.15)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: config.yAxisLabel,
                    color: '#00d9ff',
                    font: { family: 'IBM Plex Mono', size: 11, weight: 600 }
                },
                beginAtZero: config.yMin === undefined,
                max: config.yMax,
                min: config.yMin,
                ticks: {
                    color: '#e8f1f5',
                    font: { family: 'IBM Plex Mono' }
                },
                grid: {
                    color: 'rgba(0, 217, 255, 0.15)'
                }
            }
        }
    };

    // Add second y-axis if configured
    if (config.y1AxisLabel && baseOptions.scales) {
        baseOptions.scales.y1 = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: config.y1AxisLabel,
                color: '#00d9ff',
                font: { family: 'IBM Plex Mono', size: 11, weight: 600 }
            },
            beginAtZero: true,
            max: config.y1Max,
            ticks: {
                color: '#e8f1f5',
                font: { family: 'IBM Plex Mono' }
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    return baseOptions;
}

export function updateChart(
    registry: ChartRegistry,
    canvasId: string,
    datasets: ChartDataset[],
    config: ChartStyleConfig
): ChartRegistry {
    const newRegistry = new Map(registry);

    // Destroy old chart if exists
    newRegistry.get(canvasId)?.destroy();

    // Create new chart
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        const chart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: createChartOptions(config)
        });
        newRegistry.set(canvasId, chart);
    }

    return newRegistry;
}

export function destroyAll(registry: ChartRegistry): ChartRegistry {
    registry.forEach(chart => chart.destroy());
    return new Map();
}

export function updateAccelCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateAccelChartData>
): ChartRegistry {
    let newRegistry = registry;

    // Calculate max x values for both proper and coordinate time
    const maxProperTime = Math.max(...data.properTimeVelocity.map(d => d.x));
    const maxCoordTime = Math.max(...data.coordTimeVelocity.map(d => d.x));
    const maxTime = Math.max(maxProperTime, maxCoordTime);

    // Velocity Chart
    newRegistry = updateChart(
        newRegistry,
        'accelVelocityChart',
        createDualTimeDatasets(
            data.properTimeVelocity,
            data.coordTimeVelocity,
            'Velocity vs Proper Time',
            'Velocity vs Coordinate Time'
        ),
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (days)',
            yAxisLabel: 'Velocity (fraction of c)',
            xMax: maxTime
        }
    );

    // Lorentz/Time Dilation Chart
    newRegistry = updateChart(
        newRegistry,
        'accelLorentzChart',
        createDualTimeDatasets(
            data.properTimeTimeDilation,
            data.coordTimeTimeDilation,
            'Time Dilation vs Proper Time (1/γ)',
            'Time Dilation vs Coordinate Time (1/γ)'
        ),
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (days)',
            yAxisLabel: 'Time Rate (1 = normal)',
            xMax: maxTime,
            yMax: 1
        }
    );

    // Rapidity Chart
    newRegistry = updateChart(
        newRegistry,
        'accelRapidityChart',
        createDualTimeDatasets(
            data.properTimeRapidity,
            data.coordTimeRapidity,
            'Rapidity vs Proper Time',
            'Rapidity vs Coordinate Time'
        ),
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (days)',
            yAxisLabel: 'Rapidity',
            xMax: maxTime
        }
    );

    // Mass Remaining Chart
    newRegistry = updateChart(
        newRegistry,
        'accelMassChart',
        createMassRemainingDatasets(
            data.properTimeMassRemaining40,
            data.properTimeMassRemaining50,
            data.properTimeMassRemaining60,
            data.properTimeMassRemaining70
        ),
        {
            primaryColor: '#ffaa00',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: '% of Initial Mass',
            xMax: maxProperTime,
            yMax: 100
        }
    );

    // Velocity over Distance
    const posVelCanvas = document.getElementById('accelPositionVelocityChart') as HTMLCanvasElement | null;
    if (posVelCanvas) {
        if (newRegistry.has('accelPositionVelocity')) {
            newRegistry.get('accelPositionVelocity')?.destroy();
        }
        newRegistry.set('accelPositionVelocity',
            createPositionVelocityChart(posVelCanvas, data.positionVelocity)
        );
    }

    // Spacetime Worldline
    const spacetimeCanvas = document.getElementById('accelSpacetimeChart') as HTMLCanvasElement | null;
    if (spacetimeCanvas) {
        if (newRegistry.has('accelSpacetime')) {
            newRegistry.get('accelSpacetime')?.destroy();
        }
        newRegistry.set('accelSpacetime',
            createSpacetimeChart(spacetimeCanvas, data.spacetimeWorldline)
        );
    }

    return newRegistry;
}

export function updateFlipBurnCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateFlipBurnChartData>
): ChartRegistry {
    let newRegistry = registry;

    // Calculate max x values for both proper and coordinate time
    const maxProperTime = Math.max(...data.properTimeVelocity.map(d => d.x));
    const maxCoordTime = Math.max(...data.coordTimeVelocity.map(d => d.x));
    const maxTime = Math.max(maxProperTime, maxCoordTime);
    const maxMassProperTime = Math.max(...data.properTimeMassRemaining50.map(d => d.x));

    // Velocity Chart
    newRegistry = updateChart(
        newRegistry,
        'flipVelocityChart',
        createDualTimeDatasets(
            data.properTimeVelocity,
            data.coordTimeVelocity,
            'Velocity vs Proper Time',
            'Velocity vs Coordinate Time'
        ),
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (years)',
            yAxisLabel: 'Velocity (fraction of c)',
            xMax: maxTime
        }
    );

    // Time Dilation / Lorentz Chart
    newRegistry = updateChart(
        newRegistry,
        'flipLorentzChart',
        createDualTimeDatasets(
            data.properTimeLorentz,
            data.coordTimeLorentz,
            'Time Dilation vs Proper Time (1/γ)',
            'Time Dilation vs Coordinate Time (1/γ)'
        ),
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (years)',
            yAxisLabel: 'Time Rate (1 = normal)',
            xMax: maxTime,
            yMax: 1
        }
    );

    // Rapidity Chart
    newRegistry = updateChart(
        newRegistry,
        'flipRapidityChart',
        createDualTimeDatasets(
            data.properTimeRapidity,
            data.coordTimeRapidity,
            'Rapidity vs Proper Time',
            'Rapidity vs Coordinate Time'
        ),
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (years)',
            yAxisLabel: 'Rapidity',
            xMax: maxTime
        }
    );

    // Mass Remaining Chart
    newRegistry = updateChart(
        newRegistry,
        'flipMassChart',
        createMassRemainingDatasets(
            data.properTimeMassRemaining40,
            data.properTimeMassRemaining50,
            data.properTimeMassRemaining60,
            data.properTimeMassRemaining70
        ),
        {
            primaryColor: '#ffaa00',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (years)',
            yAxisLabel: '% of Initial Mass',
            xMax: maxMassProperTime,
            yMax: 100
        }
    );

    // Velocity over Distance (with separate accel/decel phases)
    const posVelCanvas = document.getElementById('flipPositionVelocityChart') as HTMLCanvasElement | null;
    if (posVelCanvas) {
        if (newRegistry.has('flipPositionVelocity')) {
            newRegistry.get('flipPositionVelocity')?.destroy();
        }
        newRegistry.set('flipPositionVelocity',
            createPositionVelocityFlipBurnChart(posVelCanvas, data.positionVelocityAccel, data.positionVelocityDecel)
        );
    }

    // Spacetime Worldline
    const spacetimeCanvas = document.getElementById('flipSpacetimeChart') as HTMLCanvasElement | null;
    if (spacetimeCanvas) {
        if (newRegistry.has('flipSpacetime')) {
            newRegistry.get('flipSpacetime')?.destroy();
        }
        newRegistry.set('flipSpacetime',
            createSpacetimeChart(spacetimeCanvas, data.spacetimeWorldline)
        );
    }

    return newRegistry;
}

export function updateVisualizationCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateVisualizationChartData>
): ChartRegistry {
    let newRegistry = registry;
    const maxTime = data.timePoints[data.timePoints.length - 1];

    // Velocity Chart
    newRegistry = updateChart(
        newRegistry,
        'velocityChart',
        [{
            label: 'Velocity (fraction of c)',
            data: data.timePoints.map((x, i) => ({ x, y: data.velocityC[i] })),
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00d9ff',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Velocity (c)',
            xMax: maxTime,
            yMax: 1
        }
    );

    // Distance Chart
    newRegistry = updateChart(
        newRegistry,
        'distanceChart',
        [{
            label: 'Distance (light years)',
            data: data.timePoints.map((x, i) => ({ x, y: data.distanceLy[i] })),
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Distance (ly)',
            xMax: maxTime
        }
    );

    // Rapidity Chart
    newRegistry = updateChart(
        newRegistry,
        'rapidityChart',
        [{
            label: 'Rapidity',
            data: data.timePoints.map((x, i) => ({ x, y: data.rapidity[i] })),
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }],
        {
            primaryColor: '#ffaa00',
            secondaryColor: '#ffaa00',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Rapidity',
            xMax: maxTime
        }
    );

    // Time Dilation & Length Contraction Chart
    const timeDilationData = data.timePoints.map((x, i) => ({ x, y: data.timeDilation[i] }));
    newRegistry = updateChart(
        newRegistry,
        'lorentzChart',
        [{
            label: 'Time Dilation (1/γ)',
            data: timeDilationData,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        }, {
            label: 'Length Contraction (1/γ)',
            data: timeDilationData,
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            borderDash: [5, 5],
            yAxisID: 'y1'
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Time Rate (1 = normal)',
            xMax: maxTime,
            yMax: 1,
            y1AxisLabel: 'Length (1 = no contraction)',
            y1Max: 1
        }
    );

    return newRegistry;
}

function createPositionVelocityChart(
    canvas: HTMLCanvasElement,
    data: { x: number; y: number }[]
): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Create velocity-based gradient
    const gradient = createVelocityGradient(ctx, canvas.height, {
        high: '#ffaa00',   // amber at high velocity (top)
        mid: '#00ff9f',    // scientific green at mid
        low: '#00d9ff'     // electric cyan at low velocity (bottom)
    });

    // Add directional arrow indicators at intervals
    const { pointRadii, pointStyles, pointRotations } = createArrowIndicators(data, [0, 25, 50, 75]);

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Trajectory',
                data: data,
                borderColor: gradient,
                backgroundColor: 'rgba(0, 217, 255, 0.15)',
                borderWidth: 3,
                pointRadius: pointRadii,
                pointStyle: pointStyles,
                pointRotation: pointRotations,
                pointBackgroundColor: '#00d9ff',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                title: {
                    display: false
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (light years)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                },
                y: {
                    type: 'linear',
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Velocity (c)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                }
            }
        }
    }) as Chart;
}

function createPositionVelocityFlipBurnChart(
    canvas: HTMLCanvasElement,
    accelData: { x: number; y: number }[],
    decelData: { x: number; y: number }[]
): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Create velocity-based gradients with different color schemes for each phase
    const accelGradient = createVelocityGradient(ctx, canvas.height, {
        high: '#ffaa00',   // amber at high velocity (top)
        mid: '#00ff9f',    // scientific green at mid
        low: '#00d9ff'     // electric cyan at low velocity (bottom)
    });

    const decelGradient = createVelocityGradient(ctx, canvas.height, {
        high: '#ff55aa',   // magenta at high velocity (top)
        mid: '#aa55ff',    // purple at mid
        low: '#5588ff'     // blue at low velocity (bottom)
    });

    // Add directional indicators for acceleration and deceleration phases
    const { pointRadii: accelPointRadii, pointStyles: accelPointStyles, pointRotations: accelPointRotations } = 
        createArrowIndicators(accelData, [0, 17, 34, 50]);
    const { pointRadii: decelPointRadii, pointStyles: decelPointStyles, pointRotations: decelPointRotations } = 
        createArrowIndicators(decelData, [0, 16, 33, 49]);

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Acceleration',
                data: accelData,
                borderColor: accelGradient,
                backgroundColor: 'rgba(0, 217, 255, 0.2)',
                borderWidth: 3,
                pointRadius: accelPointRadii,
                pointStyle: accelPointStyles,
                pointRotation: accelPointRotations,
                pointBackgroundColor: accelGradient,
                tension: 0.4,
                fill: true
            }, {
                label: 'Deceleration',
                data: decelData,
                borderColor: decelGradient,
                backgroundColor: 'rgba(170, 85, 255, 0.15)',
                borderWidth: 3,
                pointRadius: decelPointRadii,
                pointStyle: decelPointStyles,
                pointRotation: decelPointRotations,
                pointBackgroundColor: decelGradient,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    labels: {
                        color: '#e8f1f5',
                        font: { family: 'IBM Plex Mono', size: 11 }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (light years)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                },
                y: {
                    type: 'linear',
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Velocity (c)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                }
            }
        }
    }) as Chart;
}

function createSpacetimeChart(
    canvas: HTMLCanvasElement,
    data: { x: number; y: number; velocity?: number }[]
): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Find max values for light cone
    const maxTime = Math.max(...data.map(d => d.x));

    // Create velocity-based gradient (vertical, since distance is on y-axis)
    const gradient = createVelocityGradient(ctx, canvas.height, {
        high: '#ffaa00',   // amber at far distance (high velocity region)
        mid: '#00ff9f',    // scientific green at mid
        low: '#00d9ff'     // electric cyan at near distance (low velocity)
    });

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Worldline',
                    data: data,
                    borderColor: gradient,
                    backgroundColor: 'rgba(0, 217, 255, 0.15)',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Light Cone',
                    data: [{ x: 0, y: 0 }, { x: maxTime, y: maxTime }],
                    borderColor: 'rgba(255, 170, 0, 0.3)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                title: {
                    display: false
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Coordinate Time (years)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (light years)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                }
            }
        }
    }) as Chart;
}

export function updateTwinParadoxCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof import('./dataGeneration').generateTwinParadoxChartData>
): ChartRegistry {
    let newRegistry = registry;

    // Calculate max values
    const maxProperTime = Math.max(...data.velocityProfile.map(d => d.x));
    const maxEarthTime = Math.max(...data.earthTwinAging.map(d => d.y));
    const maxDistance = Math.max(...data.distanceProfile.map(d => d.y));

    // Velocity Profile Chart
    newRegistry = updateChart(
        newRegistry,
        'twinsVelocityChart',
        [{
            label: 'Velocity',
            data: data.velocityProfile,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (years)',
            yAxisLabel: 'Velocity (fraction of c)',
            xMax: maxProperTime
        }
    );

    // Comparative Aging (Dual Timeline) Chart
    newRegistry = updateChart(
        newRegistry,
        'twinsAgingChart',
        [{
            label: 'Traveling Twin',
            data: data.travelingTwinAging,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0,
            pointRadius: 0
        }, {
            label: 'Earth Twin',
            data: data.earthTwinAging,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time - Traveling Twin (years)',
            yAxisLabel: 'Age (years)',
            xMax: maxProperTime,
            yMax: maxEarthTime
        }
    );

    // Distance from Earth Chart
    newRegistry = updateChart(
        newRegistry,
        'twinsDistanceChart',
        [{
            label: 'Distance from Earth',
            data: data.distanceProfile,
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0,
            pointRadius: 0
        }],
        {
            primaryColor: '#ffaa00',
            secondaryColor: '#00d9ff',
            xAxisLabel: 'Proper Time (years)',
            yAxisLabel: 'Distance (light years)',
            xMax: maxProperTime,
            yMax: maxDistance,
            yMin: 0
        }
    );

    // Spacetime worldline now rendered with Minkowski diagram (D3)
    // See minkowski-twins.ts

    return newRegistry;
}
