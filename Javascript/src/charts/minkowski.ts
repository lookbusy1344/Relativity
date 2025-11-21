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

    // Calculate scale to fit all coordinates with 30% padding for labels
    const maxCoord = Math.max(Math.abs(ct), Math.abs(x), Math.abs(ctPrime), Math.abs(xPrime)) * 1.3;
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
    ctx.font = '13px "IBM Plex Mono", monospace';

    const extent = maxCoord;

    // Draw light cone lines (45° diagonals)
    ctx.strokeStyle = COLORS.amber + '60'; // Semi-transparent
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

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

    // Draw light cone at the event (if not at origin)
    if (ct !== 0 || x !== 0) {
        // Light cone through event point
        ctx.beginPath();
        const [evlcX1, evlcY1] = toCanvas(x - extent, ct - extent);
        const [evlcX2, evlcY2] = toCanvas(x + extent, ct + extent);
        ctx.moveTo(evlcX1, evlcY1);
        ctx.lineTo(evlcX2, evlcY2);
        ctx.stroke();

        ctx.beginPath();
        const [evlcX3, evlcY3] = toCanvas(x - extent, ct + extent);
        const [evlcX4, evlcY4] = toCanvas(x + extent, ct - extent);
        ctx.moveTo(evlcX3, evlcY3);
        ctx.lineTo(evlcX4, evlcY4);
        ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw original frame axes (orthogonal) - VERY PROMINENT
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 4;

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

    // Axis labels for original frame - LARGER and better positioned
    ctx.fillStyle = COLORS.cyan;
    ctx.font = 'bold 16px "IBM Plex Mono", monospace';
    // Position labels at a reasonable distance from center, not at the extreme ends
    const labelDist = extent * 0.75;
    const [ctLabelX, ctLabelY] = toCanvas(0, labelDist);
    const [xLabelX, xLabelY] = toCanvas(labelDist, 0);
    ctx.fillText('ct', ctLabelX + 15, ctLabelY);
    ctx.fillText('x', xLabelX - 10, xLabelY + 25);
    ctx.font = '13px "IBM Plex Mono", monospace';

    // Draw transformed frame axes (tilted) - VERY PROMINENT
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 4;

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

    // Axis labels for transformed frame - LARGER and better positioned
    ctx.fillStyle = COLORS.green;
    ctx.font = 'bold 16px "IBM Plex Mono", monospace';
    // Position labels along the tilted axes at reasonable distance
    const [ctpLabelX, ctpLabelY] = toCanvas(labelDist * sinAngle, labelDist * cosAngle);
    const [xpLabelX, xpLabelY] = toCanvas(labelDist * cosAngle, labelDist * sinAngle);
    ctx.fillText("ct'", ctpLabelX + 15, ctpLabelY);
    ctx.fillText("x'", xpLabelX - 15, xpLabelY + 25);
    ctx.font = '13px "IBM Plex Mono", monospace';

    // Draw simultaneity and position lines if event is not at origin
    if (ct !== 0 || x !== 0) {
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;

        // Original frame: horizontal line through event (line of simultaneity)
        ctx.strokeStyle = COLORS.cyan + '50'; // Semi-transparent
        ctx.beginPath();
        const [simX1, simY1] = toCanvas(-extent, ct);
        const [simX2, simY2] = toCanvas(extent, ct);
        ctx.moveTo(simX1, simY1);
        ctx.lineTo(simX2, simY2);
        ctx.stroke();

        // Original frame: vertical line through event (line of constant position)
        ctx.beginPath();
        const [posX1, posY1] = toCanvas(x, -extent);
        const [posX2, posY2] = toCanvas(x, extent);
        ctx.moveTo(posX1, posY1);
        ctx.lineTo(posX2, posY2);
        ctx.stroke();

        // Transformed frame: tilted simultaneity line (parallel to x' axis through event)
        ctx.strokeStyle = COLORS.green + '50'; // Semi-transparent
        ctx.beginPath();
        // Points on line parallel to x' axis through (x, ct)
        const simLength = extent / cosAngle;
        const [simPX1, simPY1] = toCanvas(x - simLength * cosAngle, ct - simLength * sinAngle);
        const [simPX2, simPY2] = toCanvas(x + simLength * cosAngle, ct + simLength * sinAngle);
        ctx.moveTo(simPX1, simPY1);
        ctx.lineTo(simPX2, simPY2);
        ctx.stroke();

        // Transformed frame: tilted position line (parallel to ct' axis through event)
        ctx.beginPath();
        // Points on line parallel to ct' axis through (x, ct)
        const posPrimeLength = extent / cosAngle;
        const [posPX1, posPY1] = toCanvas(x - posPrimeLength * sinAngle, ct - posPrimeLength * cosAngle);
        const [posPX2, posPY2] = toCanvas(x + posPrimeLength * sinAngle, ct + posPrimeLength * cosAngle);
        ctx.moveTo(posPX1, posPY1);
        ctx.lineTo(posPX2, posPY2);
        ctx.stroke();

        ctx.setLineDash([]);
    }

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

    // Draw events - LARGER
    // Origin
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
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
    ctx.arc(eventX, eventY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw coordinate labels
    ctx.font = '12px "IBM Plex Mono", monospace';

    // Origin label
    ctx.fillStyle = COLORS.white;
    ctx.fillText('Origin', centerX + 10, centerY - 10);

    // Event labels with better formatting
    const ctLabel = formatCoordinate(ct);
    const xLabel = formatCoordinate(x);
    const ctPrimeLabel = formatCoordinate(ctPrime);
    const xPrimeLabel = formatCoordinate(xPrime);

    // Background for labels
    const labelX = eventX + 12;
    const labelY1 = eventY - 25;
    const labelY2 = eventY - 8;

    // Original frame label
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(`(ct=${ctLabel}, x=${xLabel})`, labelX, labelY1);

    // Transformed frame label
    ctx.fillStyle = COLORS.green;
    ctx.fillText(`(ct'=${ctPrimeLabel}, x'=${xPrimeLabel})`, labelX, labelY2);
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
