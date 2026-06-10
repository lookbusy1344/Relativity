import { describe, it, expect } from "vitest";
import indexHtml from "../index.html?raw";

const EXPECTED_TAB_ORDER = [
	{ id: "motion-tab", label: "Const accel" },
	{ id: "travel-tab", label: "Flip" },
	{ id: "simultaneity-tab", label: "Simultaneity" },
	{ id: "twins-tab", label: "Twin Paradox" },
	{ id: "spacetime-tab", label: "Spacetime" },
	{ id: "conversions-tab", label: "Calc" },
] as const;

function extractTabButtons(html: string): Array<{ id: string; label: string }> {
	const tabListMatch = html.match(
		/<ul class="nav nav-tabs" id="calculatorTabs" role="tablist">([\s\S]*?)<\/ul>/
	);
	if (!tabListMatch) {
		throw new Error("calculator tab list not found");
	}

	const buttonPattern = /<button[^>]*id="([^"]+)"[^>]*>([^<]+)<\/button>/g;
	const tabListHtml = tabListMatch[1];
	const tabs: Array<{ id: string; label: string }> = [];
	let match: RegExpExecArray | null;

	while ((match = buttonPattern.exec(tabListHtml)) !== null) {
		tabs.push({
			id: match[1],
			label: match[2].replace(/\s+/g, " ").trim(),
		});
	}

	return tabs;
}

describe("calculator tab order", () => {
	it("matches the requested navigation sequence", () => {
		const tabs = extractTabButtons(indexHtml);

		expect(tabs).toEqual(EXPECTED_TAB_ORDER);
	});
});
