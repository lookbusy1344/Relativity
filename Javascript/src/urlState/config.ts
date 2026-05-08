interface ParamMap {
	[paramName: string]: string;
}

export interface TabConfig {
	name: string;
	params: ParamMap;
	buttonId: string;
	tabId: string;
	pendingResultId?: string;
}

export const TAB_CONFIGS: Record<string, TabConfig> = {
	motion: {
		name: "motion",
		params: {
			accel: "aAccelInput",
			time: "aInput",
			dry: "aDryMassInput",
			eff: "aEfficiencyInput",
		},
		buttonId: "aButton",
		tabId: "motion-tab",
		pendingResultId: "resultA2",
	},
	flip: {
		name: "flip",
		params: {
			accel: "flipAccelInput",
			dist: "flipInput",
			dry: "flipDryMassInput",
			eff: "flipEfficiencyInput",
		},
		buttonId: "flipButton",
		tabId: "travel-tab",
		pendingResultId: "resultFlip1",
	},
	twins: {
		name: "twins",
		params: {
			vel: "twinsVelocityInput",
			time: "twinsTimeInput",
		},
		buttonId: "twinsButton",
		tabId: "twins-tab",
	},
	spacetime: {
		name: "spacetime",
		params: {
			time: "spacetimeTime2",
			dist: "spacetimeX2",
			vel: "spacetimeVelocity",
		},
		buttonId: "spacetimeButton",
		tabId: "spacetime-tab",
	},
	simultaneity: {
		name: "simultaneity",
		params: {
			vel: "simVelocityInput",
		},
		buttonId: "",
		tabId: "simultaneity-tab",
	},
	calc: {
		name: "calc",
		params: {
			calc: "calcType",
			vel: "lorentzInput",
			vel1: "v1Input",
			vel2: "v2Input",
			rapidity: "rapidityInput",
			fuel: "pionFuelMassInput",
			dry: "pionDryMassInput",
			eff: "pionEfficiencyInput",
			thrustTime: "fuelFractionTimeInput",
			thrustEff: "fuelFractionEffInput",
			warpDist: "warpDistanceInput",
			warpBoost: "warpBoostInput",
			warpTransit: "warpTransitInput",
			warpDuration: "warpBoostDurationInput",
		},
		buttonId: "",
		tabId: "conversions-tab",
	},
};

export const CALC_CONFIGS: Record<string, { params: string[]; buttonId: string }> = {
	lorentz: { params: ["vel"], buttonId: "lorentzButton" },
	rapidity: { params: ["rapidity"], buttonId: "rapidityButton" },
	velocity: { params: ["vel"], buttonId: "velocityButton" },
	addvel: { params: ["vel1", "vel2"], buttonId: "addButton" },
	pion: { params: ["fuel", "dry", "eff"], buttonId: "pionAccelButton" },
	fuelfrac: { params: ["thrustTime", "thrustEff"], buttonId: "fuelFractionButton" },
	warp: {
		params: ["warpDist", "warpBoost", "warpTransit", "warpDuration"],
		buttonId: "warpButton",
	},
};
