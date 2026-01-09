import { TripAnswers, Destination, TripPlan } from '@/types';

interface GenerateResponse<T> {
  data?: T;
  error?: string;
}

export async function fetchTravelStyle(
  answers: TripAnswers
): Promise<GenerateResponse<string>> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'travelStyle', answers }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to generate travel style' };
    }

    const data = await response.json();
    return { data: data.travelStyle };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

export async function fetchDestinations(
  answers: TripAnswers
): Promise<GenerateResponse<Destination[]>> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'destinations', answers }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to generate destinations' };
    }

    const data = await response.json();
    return { data: data.destinations };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

export async function fetchTripPlan(
  answers: TripAnswers,
  destination: Destination
): Promise<GenerateResponse<TripPlan>> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tripPlan', answers, destination }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to generate trip plan' };
    }

    const data = await response.json();
    return { data: data.plan };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}
