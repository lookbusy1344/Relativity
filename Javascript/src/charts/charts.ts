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
    datasets: any[],
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
        [{
            label: 'Velocity vs Proper Time',
            data: data.properTimeVelocity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Velocity vs Coordinate Time',
            data: data.coordTimeVelocity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
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
        [{
            label: 'Time Dilation vs Proper Time (1/γ)',
            data: data.properTimeTimeDilation,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Time Dilation vs Coordinate Time (1/γ)',
            data: data.coordTimeTimeDilation,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
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
        [{
            label: 'Rapidity vs Proper Time',
            data: data.properTimeRapidity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Rapidity vs Coordinate Time',
            data: data.coordTimeRapidity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
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
        [{
            label: '40% Efficiency',
            data: data.properTimeMassRemaining40,
            borderColor: '#ff5555',
            backgroundColor: 'rgba(255, 85, 85, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: '50% Efficiency',
            data: data.properTimeMassRemaining50,
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: '60% Efficiency',
            data: data.properTimeMassRemaining60,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: '70% Efficiency',
            data: data.properTimeMassRemaining70,
            borderColor: '#aa55ff',
            backgroundColor: 'rgba(170, 85, 255, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#ffaa00',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: '% of Initial Mass',
            xMax: maxProperTime,
            yMax: 100
        }
    );

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
        [{
            label: 'Velocity vs Proper Time',
            data: data.properTimeVelocity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Velocity vs Coordinate Time',
            data: data.coordTimeVelocity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
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
        [{
            label: 'Time Dilation vs Proper Time (1/γ)',
            data: data.properTimeLorentz,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Time Dilation vs Coordinate Time (1/γ)',
            data: data.coordTimeLorentz,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
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
        [{
            label: 'Rapidity vs Proper Time',
            data: data.properTimeRapidity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Rapidity vs Coordinate Time',
            data: data.coordTimeRapidity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
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
        [{
            label: '40% Efficiency',
            data: data.properTimeMassRemaining40,
            borderColor: '#ff5555',
            backgroundColor: 'rgba(255, 85, 85, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: '50% Efficiency',
            data: data.properTimeMassRemaining50,
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: '60% Efficiency',
            data: data.properTimeMassRemaining60,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: '70% Efficiency',
            data: data.properTimeMassRemaining70,
            borderColor: '#aa55ff',
            backgroundColor: 'rgba(170, 85, 255, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#ffaa00',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (years)',
            yAxisLabel: '% of Initial Mass',
            xMax: maxMassProperTime,
            yMax: 100
        }
    );

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
    data: { x: number; y: number }[],
    title: string
): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Create velocity-based gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#00d9ff');     // electric cyan at low velocity
    gradient.addColorStop(0.5, '#00ff9f');   // scientific green at mid
    gradient.addColorStop(1, '#ffaa00');     // amber at high velocity

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Trajectory',
                data: data,
                borderColor: gradient,
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#00ff9f',
                    font: { size: 16, family: 'Orbitron' }
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

function createSpacetimeChart(
    canvas: HTMLCanvasElement,
    data: { x: number; y: number }[],
    title: string
): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Find max values for light cone
    const maxTime = Math.max(...data.map(d => d.x));
    const maxDistance = Math.max(...data.map(d => d.y));

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Worldline',
                    data: data,
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
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
            aspectRatio: 1.5,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#00ff9f',
                    font: { size: 16, family: 'Orbitron' }
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
