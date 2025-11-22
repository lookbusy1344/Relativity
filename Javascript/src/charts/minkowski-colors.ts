/**
 * Modernized color palette for Minkowski diagram
 * All colors meet WCAG AA contrast requirements
 */

export const COLORS = {
    // Primary frame colors
    electricBlue: '#00B4D8',      // Original frame (ct, x)
    quantumGreen: '#06FFA5',      // Moving frame (ct', x')
    photonGold: '#FFB703',        // Light cones
    plasmaWhite: '#F8F9FA',       // Events, labels

    // Interval type indicators
    timelike: '#4CC9F0',          // Causally connected
    spacelike: '#FB8500',         // Not causally connected
    lightlike: '#FFD60A',         // On light cone

    // UI elements
    background: 'rgba(0, 0, 0, 0)',
    tooltipBg: 'rgba(10, 14, 39, 0.95)',
    tooltipBorder: '#00B4D8',

    // Opacity modifiers
    lightConeFill: '15',          // Hex opacity for fills
    dashedLine: '80',             // Hex opacity for dashed lines
    simultaneity: '50',           // Hex opacity for simultaneity lines
} as const;

export type ColorKey = keyof typeof COLORS;
