import { SavedTrip } from '@/types';

const STORAGE_KEY = 'findtravel_saved_trips';

export function getSavedTrips(): SavedTrip[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveTrip(trip: SavedTrip): void {
  const trips = getSavedTrips();
  const existingIndex = trips.findIndex((t) => t.id === trip.id);
  if (existingIndex >= 0) {
    trips[existingIndex] = trip;
  } else {
    trips.unshift(trip);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function deleteTrip(tripId: string): void {
  const trips = getSavedTrips().filter((t) => t.id !== tripId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function getTripById(tripId: string): SavedTrip | undefined {
  return getSavedTrips().find((t) => t.id === tripId);
}

export function generateTripId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
