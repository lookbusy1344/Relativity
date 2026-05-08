import Decimal from "decimal.js";

export function getDefaultValue(inputId: string): string {
	const input = document.getElementById(inputId) as HTMLInputElement;
	return input?.defaultValue || input?.value || "";
}

export function isValidNumber(value: string): boolean {
	if (!value || value.trim() === "") return false;
	try {
		const decimal = new Decimal(value);
		return decimal.isFinite();
	} catch {
		return false;
	}
}

export function getActiveTab(): string {
	const activeTab = document.querySelector(".nav-link.active");
	if (!activeTab) return "motion";

	const tabId = activeTab.getAttribute("id");
	if (tabId === "motion-tab") return "motion";
	if (tabId === "travel-tab") return "flip";
	if (tabId === "twins-tab") return "twins";
	if (tabId === "spacetime-tab") return "spacetime";
	if (tabId === "simultaneity-tab") return "simultaneity";
	if (tabId === "conversions-tab") return "calc";

	return "motion";
}
