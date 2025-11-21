export interface MinkowskiData {
    time: number;           // Time coordinate in seconds
    distance: number;       // Distance coordinate in km
    velocity: number;       // Relative velocity as fraction of c
    deltaTPrime: number;    // Transformed time coordinate
    deltaXPrime: number;    // Transformed distance coordinate
    intervalType: string;   // "timelike", "spacelike", or "lightlike"
}

const COLORS = {
    cyan: '#00d9ff',
    green: '#00ff9f',
    amber: '#ffaa00',
    white: '#e8f1f5',
    gray: 'rgba(232, 241, 245, 0.2)',
};

export function drawMinkowskiDiagram(canvas: HTMLCanvasElement, data: MinkowskiData): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (responsive)
    const size = Math.min(600, canvas.parentElement?.clientWidth || 600);
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;

    // Convert km to light-seconds for consistent units (c*t has same units as x/c)
    const c = 299792.458; // km/s
    const ct = data.time * c; // Convert time to distance units (km)
    const x = data.distance;
    const beta = data.velocity;

    // Lorentz factor
    const gamma = 1 / Math.sqrt(1 - beta * beta);

    // Transformed coordinates
    const ctPrime = gamma * (ct - beta * x);
    const xPrime = gamma * (x - beta * ct);

    // Calculate scale to fit all coordinates with 20% padding
    const maxCoord = Math.max(Math.abs(ct), Math.abs(x), Math.abs(ctPrime), Math.abs(xPrime)) * 1.2;
    const scale = (size / 2) / maxCoord;

    // Helper function to convert spacetime coords to canvas coords
    const toCanvas = (xCoord: number, ctCoord: number): [number, number] => {
        return [
            centerX + xCoord * scale,
            centerY - ctCoord * scale  // Invert Y for standard orientation
        ];
    };

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, size, size);

    // Set font
    ctx.font = '12px "IBM Plex Mono", monospace';

    // Draw light cone lines (45° diagonals)
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const extent = maxCoord;
    ctx.beginPath();
    const [lcX1, lcY1] = toCanvas(-extent, -extent);
    const [lcX2, lcY2] = toCanvas(extent, extent);
    ctx.moveTo(lcX1, lcY1);
    ctx.lineTo(lcX2, lcY2);
    ctx.stroke();

    ctx.beginPath();
    const [lcX3, lcY3] = toCanvas(-extent, extent);
    const [lcX4, lcY4] = toCanvas(extent, -extent);
    ctx.moveTo(lcX3, lcY3);
    ctx.lineTo(lcX4, lcY4);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw original frame axes (orthogonal)
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2;

    // ct axis (vertical)
    ctx.beginPath();
    const [ctX1, ctY1] = toCanvas(0, -extent);
    const [ctX2, ctY2] = toCanvas(0, extent);
    ctx.moveTo(ctX1, ctY1);
    ctx.lineTo(ctX2, ctY2);
    drawArrow(ctx, ctX2, ctY2, 0, -1);
    ctx.stroke();

    // x axis (horizontal)
    ctx.beginPath();
    const [xX1, xY1] = toCanvas(-extent, 0);
    const [xX2, xY2] = toCanvas(extent, 0);
    ctx.moveTo(xX1, xY1);
    ctx.lineTo(xX2, xY2);
    drawArrow(ctx, xX2, xY2, 1, 0);
    ctx.stroke();

    // Axis labels for original frame
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText('ct', ctX2 + 10, ctY2 + 5);
    ctx.fillText('x', xX2 - 10, xY2 + 20);

    // Draw transformed frame axes (tilted)
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;

    const angle = Math.atan(beta);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    // ct' axis (tilted)
    ctx.beginPath();
    const ctPrimeLength = extent / cosAngle;
    const [ctpX1, ctpY1] = toCanvas(-ctPrimeLength * sinAngle, -ctPrimeLength * cosAngle);
    const [ctpX2, ctpY2] = toCanvas(ctPrimeLength * sinAngle, ctPrimeLength * cosAngle);
    ctx.moveTo(ctpX1, ctpY1);
    ctx.lineTo(ctpX2, ctpY2);
    drawArrow(ctx, ctpX2, ctpY2, sinAngle, cosAngle);
    ctx.stroke();

    // x' axis (tilted opposite direction)
    ctx.beginPath();
    const xPrimeLength = extent / cosAngle;
    const [xpX1, xpY1] = toCanvas(-xPrimeLength * cosAngle, -xPrimeLength * sinAngle);
    const [xpX2, xpY2] = toCanvas(xPrimeLength * cosAngle, xPrimeLength * sinAngle);
    ctx.moveTo(xpX1, xpY1);
    ctx.lineTo(xpX2, xpY2);
    drawArrow(ctx, xpX2, xpY2, cosAngle, sinAngle);
    ctx.stroke();

    // Axis labels for transformed frame
    ctx.fillStyle = COLORS.green;
    ctx.fillText("ct'", ctpX2 + 10, ctpY2 + 5);
    ctx.fillText("x'", xpX2 - 10, xpY2 + 20);

    // Draw interval line
    if (ct !== 0 || x !== 0) {
        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const [eventX, eventY] = toCanvas(x, ct);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(eventX, eventY);
        ctx.stroke();
    }

    // Draw events
    // Origin
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Event 2 (color-coded by interval type)
    const [eventX, eventY] = toCanvas(x, ct);
    if (data.intervalType === 'timelike') {
        ctx.fillStyle = COLORS.cyan;
    } else if (data.intervalType === 'spacelike') {
        ctx.fillStyle = COLORS.amber;
    } else {
        ctx.fillStyle = COLORS.white;
    }
    ctx.beginPath();
    ctx.arc(eventX, eventY, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw coordinate labels
    ctx.fillStyle = COLORS.white;
    ctx.font = '11px "IBM Plex Mono", monospace';

    // Origin label
    ctx.fillText('(0, 0)', centerX + 10, centerY - 10);

    // Event 2 labels - original frame
    ctx.fillStyle = COLORS.cyan;
    const ctLabel = formatCoordinate(ct);
    const xLabel = formatCoordinate(x);
    ctx.fillText(`(${ctLabel}, ${xLabel})`, eventX + 10, eventY - 20);

    // Event 2 labels - transformed frame
    ctx.fillStyle = COLORS.green;
    const ctPrimeLabel = formatCoordinate(ctPrime);
    const xPrimeLabel = formatCoordinate(xPrime);
    ctx.fillText(`(${ctPrimeLabel}, ${xPrimeLabel})'`, eventX + 10, eventY - 5);
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number): void {
    const arrowLength = 10;
    const arrowWidth = 5;

    ctx.save();
    ctx.translate(x, y);
    const angle = Math.atan2(-dy, dx);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowLength, -arrowWidth);
    ctx.lineTo(-arrowLength, arrowWidth);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function formatCoordinate(value: number): string {
    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
        return value.toExponential(2);
    }
    return value.toFixed(2);
}
