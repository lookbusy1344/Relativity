import { describe, it, expect, beforeEach } from "vitest";
import {
	setElement,
	getInputElement,
	getResultElement,
	getButtonElement,
	getCanvasElement,
} from "./domUtils";
import { clearBody } from "../test-utils/dom-helpers";

describe("domUtils", () => {
	beforeEach(() => {
		clearBody();
	});

	describe("setElement", () => {
		it("sets textContent and title when units are empty", () => {
			const span = document.createElement("span");
			span.id = "result";
			document.body.appendChild(span);

			setElement(span, "42.5", "");

			expect(span.textContent).toBe("42.5");
			expect(span.getAttribute("title")).toBe("42.5");
		});

		it("sets textContent and title with units", () => {
			const span = document.createElement("span");
			document.body.appendChild(span);

			setElement(span, "100", "m/s");

			expect(span.textContent).toBe("100 m/s");
			expect(span.getAttribute("title")).toBe("100 m/s");
		});

		it("sets textContent without units when value is dash", () => {
			const span = document.createElement("span");
			document.body.appendChild(span);

			setElement(span, "-", "kg");

			expect(span.textContent).toBe("-");
			expect(span.getAttribute("title")).toBe("-");
		});

		it("handles zero as value", () => {
			const span = document.createElement("span");
			document.body.appendChild(span);

			setElement(span, "0", "seconds");

			expect(span.textContent).toBe("0 seconds");
			expect(span.getAttribute("title")).toBe("0 seconds");
		});
	});

	describe("getInputElement", () => {
		it("returns input element by id", () => {
			const input = document.createElement("input");
			input.id = "test-input";
			input.value = "42";
			document.body.appendChild(input);

			const result = getInputElement("test-input");

			expect(result).toBe(input);
			expect(result?.value).toBe("42");
		});

		it("returns null for missing element", () => {
			const result = getInputElement("nonexistent");
			expect(result).toBeNull();
		});

		it("returns input element with correct type", () => {
			const input = document.createElement("input");
			input.id = "typed-input";
			input.type = "number";
			document.body.appendChild(input);

			const result = getInputElement("typed-input");

			expect(result).toBeInstanceOf(HTMLInputElement);
			expect(result?.type).toBe("number");
		});
	});

	describe("getResultElement", () => {
		it("returns span element by id", () => {
			const span = document.createElement("span");
			span.id = "result-span";
			document.body.appendChild(span);

			const result = getResultElement("result-span");

			expect(result).toBe(span);
		});

		it("returns div element by id", () => {
			const div = document.createElement("div");
			div.id = "result-div";
			document.body.appendChild(div);

			const result = getResultElement("result-div");

			expect(result).toBe(div);
		});

		it("returns null for missing element", () => {
			const result = getResultElement("nonexistent");
			expect(result).toBeNull();
		});
	});

	describe("getButtonElement", () => {
		it("returns button element by id", () => {
			const button = document.createElement("button");
			button.id = "submit-btn";
			document.body.appendChild(button);

			const result = getButtonElement("submit-btn");

			expect(result).toBe(button);
		});

		it("returns null for missing element", () => {
			const result = getButtonElement("nonexistent");
			expect(result).toBeNull();
		});

		it("can return any HTML element", () => {
			const div = document.createElement("div");
			div.id = "clickable-div";
			document.body.appendChild(div);

			const result = getButtonElement("clickable-div");

			expect(result).toBe(div);
		});
	});

	describe("getCanvasElement", () => {
		it("returns canvas element by id", () => {
			const canvas = document.createElement("canvas");
			canvas.id = "chart-canvas";
			document.body.appendChild(canvas);

			const result = getCanvasElement("chart-canvas");

			expect(result).toBe(canvas);
		});

		it("returns null for missing element", () => {
			const result = getCanvasElement("nonexistent");
			expect(result).toBeNull();
		});

		it("returns canvas with correct type", () => {
			const canvas = document.createElement("canvas");
			canvas.id = "test-canvas";
			canvas.width = 800;
			canvas.height = 600;
			document.body.appendChild(canvas);

			const result = getCanvasElement("test-canvas");

			expect(result).toBeInstanceOf(HTMLCanvasElement);
			expect(result?.width).toBe(800);
			expect(result?.height).toBe(600);
		});
	});
});
