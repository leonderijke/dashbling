import { Event } from "./Event";

export interface EventHistory {
  put(id: string, event: Event): void;
  getAll(): Event[];
  get(id: string): Promise<Event | null>;
}
