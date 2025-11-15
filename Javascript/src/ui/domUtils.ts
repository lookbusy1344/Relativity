/**
 * DOM utility functions for type-safe element access and result display
 */

export function setElement(e: HTMLElement, value: string, units: string): void {
    if (units === "" || value === "-") {
        // no units
        e.textContent = value;
        e.setAttribute('title', value);
    } else {
        // units specified - display value with units
        e.textContent = `${value} ${units}`;
        e.setAttribute('title', `${value} ${units}`);
    }
}

export function getInputElement(id: string): HTMLInputElement | null {
    return document.getElementById(id) as HTMLInputElement | null;
}

export function getCanvasElement(id: string): HTMLCanvasElement | null {
    return document.getElementById(id) as HTMLCanvasElement | null;
}

export function getResultElement(id: string): HTMLElement | null {
    return document.getElementById(id);
}

export function getButtonElement(id: string): HTMLElement | null {
    return document.getElementById(id);
}
