import { describe, it, expect, beforeEach, vi } from "vitest";
import Decimal from "decimal.js";
import {
	getEvents,
	setEvents,
	setPendingEvents,
	consumePendingEvents,
	subscribe,
	type SimultaneityEventData,
} from "./simultaneityState";

describe("Simultaneity State Management", () => {
	// Helper to create test events
	const createEvent = (ct: number, x: number): SimultaneityEventData => ({
		ct,
		x,
		ctDecimal: new Decimal(ct),
		xDecimal: new Decimal(x),
	});

	beforeEach(() => {
		// Reset state between tests
		setEvents([]);
		consumePendingEvents(); // Clear any pending events
	});

	describe("getEvents/setEvents", () => {
		it("returns empty array initially", () => {
			setEvents([]);
			expect(getEvents()).toEqual([]);
		});

		it("stores and retrieves events", () => {
			const events = [createEvent(0, 0), createEvent(1, 1)];
			setEvents(events);

			expect(getEvents()).toEqual(events);
		});

		it("returns same reference when called multiple times", () => {
			const events = [createEvent(0, 0)];
			setEvents(events);

			const result1 = getEvents();
			const result2 = getEvents();
			expect(result1).toBe(result2);
		});

		it("overwrites previous events", () => {
			const events1 = [createEvent(0, 0)];
			const events2 = [createEvent(1, 1), createEvent(2, 2)];

			setEvents(events1);
			expect(getEvents()).toEqual(events1);

			setEvents(events2);
			expect(getEvents()).toEqual(events2);
		});

		it("stores events with Decimal precision", () => {
			const events = [createEvent(0.123456789, 0.987654321)];
			setEvents(events);

			const retrieved = getEvents();
			expect(retrieved[0].ctDecimal.toString()).toBe("0.123456789");
			expect(retrieved[0].xDecimal.toString()).toBe("0.987654321");
		});
	});

	describe("subscribe", () => {
		it("calls subscriber when events change", () => {
			const subscriber = vi.fn();
			const unsubscribe = subscribe(subscriber);

			const events = [createEvent(0, 0)];
			setEvents(events);

			expect(subscriber).toHaveBeenCalledTimes(1);
			expect(subscriber).toHaveBeenCalledWith(events);
			unsubscribe();
		});

		it("calls multiple subscribers", () => {
			const subscriber1 = vi.fn();
			const subscriber2 = vi.fn();

			const unsub1 = subscribe(subscriber1);
			const unsub2 = subscribe(subscriber2);

			const events = [createEvent(1, 2)];
			setEvents(events);

			expect(subscriber1).toHaveBeenCalledWith(events);
			expect(subscriber2).toHaveBeenCalledWith(events);

			unsub1();
			unsub2();
		});

		it("unsubscribe stops notifications", () => {
			const subscriber = vi.fn();
			const unsubscribe = subscribe(subscriber);

			unsubscribe();
			setEvents([createEvent(0, 0)]);

			expect(subscriber).not.toHaveBeenCalled();
		});

		it("notifies on empty array", () => {
			const subscriber = vi.fn();
			const unsubscribe = subscribe(subscriber);

			setEvents([]);

			expect(subscriber).toHaveBeenCalledWith([]);
			unsubscribe();
		});
	});

	describe("setPendingEvents/consumePendingEvents", () => {
		it("stores and retrieves pending events", () => {
			const events = [createEvent(3, 4), createEvent(5, 6)];
			setPendingEvents(events);

			const retrieved = consumePendingEvents();
			expect(retrieved).toEqual(events);
		});

		it("returns null when no pending events", () => {
			const result = consumePendingEvents();
			expect(result).toBeNull();
		});

		it("clears pending events after consuming", () => {
			const events = [createEvent(1, 2)];
			setPendingEvents(events);

			const first = consumePendingEvents();
			expect(first).toEqual(events);

			const second = consumePendingEvents();
			expect(second).toBeNull();
		});

		it("pending events do not affect current events", () => {
			const currentEvts = [createEvent(0, 0)];
			const pendingEvts = [createEvent(1, 1)];

			setEvents(currentEvts);
			setPendingEvents(pendingEvts);

			expect(getEvents()).toEqual(currentEvts);
			expect(consumePendingEvents()).toEqual(pendingEvts);
		});

		it("overwrites previous pending events", () => {
			const events1 = [createEvent(1, 1)];
			const events2 = [createEvent(2, 2)];

			setPendingEvents(events1);
			setPendingEvents(events2);

			expect(consumePendingEvents()).toEqual(events2);
		});

		it("does not notify subscribers when setting pending events", () => {
			const subscriber = vi.fn();
			subscribe(subscriber);

			setPendingEvents([createEvent(1, 1)]);

			expect(subscriber).not.toHaveBeenCalled();
		});
	});

	describe("integration scenarios", () => {
		it("handles typical URL loading workflow", () => {
			// 1. URL state loads before diagram initializes
			const urlEvents = [createEvent(2, 3), createEvent(4, 5)];
			setPendingEvents(urlEvents);

			// 2. Diagram initializes and consumes pending events
			const pending = consumePendingEvents();
			expect(pending).toEqual(urlEvents);

			// 3. Diagram sets these as current events
			if (pending) {
				setEvents(pending);
			}
			expect(getEvents()).toEqual(urlEvents);

			// 4. No more pending events
			expect(consumePendingEvents()).toBeNull();
		});

		it("handles user interaction updating events", () => {
			const subscriber = vi.fn();
			subscribe(subscriber);

			// Initial state
			const initial = [createEvent(0, 0)];
			setEvents(initial);
			expect(subscriber).toHaveBeenCalledWith(initial);

			// User adds event
			const updated = [...initial, createEvent(1, 1)];
			setEvents(updated);
			expect(subscriber).toHaveBeenCalledWith(updated);
			expect(subscriber).toHaveBeenCalledTimes(2);
		});

		it("handles clearing all events", () => {
			const subscriber = vi.fn();
			subscribe(subscriber);

			setEvents([createEvent(1, 1), createEvent(2, 2)]);
			setEvents([]);

			expect(getEvents()).toEqual([]);
			expect(subscriber).toHaveBeenLastCalledWith([]);
		});
	});
});
