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

interface BootstrapStatic {
	Modal: new (element: HTMLElement) => BootstrapModal;
	Tab: new (element: HTMLElement) => BootstrapTab;
}

declare global {
	interface Window {
		bootstrap?: BootstrapStatic;
	}
}

export {};
