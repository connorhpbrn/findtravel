'use client';

import { useEffect, useState } from 'react';
import { SavedTrip } from '@/types';
import { getSavedTrips, deleteTrip } from '@/lib/storage';

interface TripLibraryProps {
  onSelectTrip: (trip: SavedTrip) => void;
  onStartNewPlan: () => void;
}

export default function TripLibrary({
  onSelectTrip,
  onStartNewPlan,
}: TripLibraryProps) {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTrips(getSavedTrips());
    setIsLoaded(true);
  }, []);

  function handleDelete(tripId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Remove this trip from your library?')) {
      deleteTrip(tripId);
      setTrips(getSavedTrips());
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12 md:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1
            className="text-3xl md:text-4xl font-medium"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Your trips
          </h1>
          <button
            onClick={onStartNewPlan}
            className="px-6 py-3 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium"
          >
            Plan a new trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[var(--foreground-muted)] mb-6">
              Your saved trips will appear here.
            </p>
            <p className="text-[var(--foreground-muted)] mb-8">
              Create a plan to start building your library.
            </p>
            <button
              onClick={onStartNewPlan}
              className="px-8 py-4 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium text-lg"
            >
              Create your first plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip)}
                className="group bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <div
                  className="h-32 relative bg-cover bg-center bg-[var(--border)]"
                  style={{
                    backgroundImage: `url(${trip.destination.imageUrl})`,
                  }}
                >
                  <button
                    onClick={(e) => handleDelete(trip.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove trip"
                  >
                    <svg
                      className="w-4 h-4 text-[var(--foreground-muted)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-5">
                  <h3
                    className="text-xl font-medium mb-1"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {trip.destination.name}
                  </h3>
                  <p className="text-[var(--foreground-muted)] text-sm mb-3">
                    {trip.destination.tagline}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">
                      {formatDate(trip.createdAt)}
                    </span>
                    <span className="text-[var(--accent)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View plan
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
