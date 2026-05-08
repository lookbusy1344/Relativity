import * as rl from "../../relativity_lib";
import * as simultaneityState from "../simultaneityState";
import type { SimultaneityEvent } from "./types";
import { C } from "../minkowski-core";

export function createTrainExample(): SimultaneityEvent[] {
	const time = 2;
	const ct = time * C;
	const separation = 300000;

	return [
		{
			id: "A",
			ct,
			x: -separation,
			isReference: true,
			temporalOrder: "simultaneous",
		},
		{
			id: "B",
			ct,
			x: separation,
			isReference: false,
			temporalOrder: "simultaneous",
		},
	];
}

export function syncStateToModule(events: SimultaneityEvent[]): void {
	const eventData = events.map(e => ({
		ct: e.ct,
		x: e.x,
		ctDecimal: rl.ensure(e.ct),
		xDecimal: rl.ensure(e.x),
	}));
	simultaneityState.setEvents(eventData);
}
