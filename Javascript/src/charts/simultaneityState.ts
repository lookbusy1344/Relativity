/**
 * State management for simultaneity diagram events
 * Replaces global window pollution with proper module-level state
 */

export interface SimultaneityEventData {
    ct: number;
    x: number;
}

type EventCallback = (events: SimultaneityEventData[]) => void;

/**
 * Internal state
 */
let currentEvents: SimultaneityEventData[] = [];
let pendingEvents: SimultaneityEventData[] | null = null;
const subscribers = new Set<EventCallback>();

/**
 * Get current events from the simultaneity diagram
 */
export function getEvents(): SimultaneityEventData[] {
    return currentEvents;
}

/**
 * Update current events (called by simultaneity diagram)
 */
export function setEvents(events: SimultaneityEventData[]): void {
    currentEvents = events;
    notifySubscribers();
}

/**
 * Store pending events (called when loading from URL before diagram initializes)
 */
export function setPendingEvents(events: SimultaneityEventData[]): void {
    pendingEvents = events;
}

/**
 * Get and clear pending events (called by diagram during initialization)
 */
export function consumePendingEvents(): SimultaneityEventData[] | null {
    const events = pendingEvents;
    pendingEvents = null;
    return events;
}

/**
 * Subscribe to event changes
 */
export function subscribe(callback: EventCallback): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of event changes
 */
function notifySubscribers(): void {
    subscribers.forEach(cb => cb(currentEvents));
}
