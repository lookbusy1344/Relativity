/**
 * Minimal Bootstrap 5 type definitions for Modal and Tab components
 */

export interface BootstrapModal {
	show(): void;
	hide(): void;
	dispose(): void;
}

export interface BootstrapTab {
	show(): void;
	dispose(): void;
}

export interface BootstrapTooltip {
	dispose(): void;
}

interface BootstrapStatic {
	Modal: new (element: HTMLElement) => BootstrapModal;
	Tab: new (element: HTMLElement) => BootstrapTab;
	Tooltip: new (element: Element) => BootstrapTooltip;
}

declare global {
	interface Window {
		bootstrap?: BootstrapStatic;
	}
}

export {};
