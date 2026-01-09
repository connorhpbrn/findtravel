'use client';

import { useState } from 'react';
import { Destination, TripAnswers, SavedTrip, TripPlan } from '@/types';
import { saveTrip, generateTripId } from '@/lib/storage';
import { fetchTripPlan } from '@/lib/api';

function linkifyText(text: string): React.ReactNode {
  // Handle markdown-style links [text](url) and plain URLs
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const plainUrlRegex = /(https?:\/\/[^\s\)]+)/g;
  
  // First, replace markdown links with a placeholder
  const placeholders: { placeholder: string; text: string; url: string }[] = [];
  let processedText = text.replace(markdownLinkRegex, (match, linkText, url) => {
    const placeholder = `__LINK_${placeholders.length}__`;
    placeholders.push({ placeholder, text: linkText, url });
    return placeholder;
  });
  
  // Then handle plain URLs (that aren't already in markdown format)
  processedText = processedText.replace(plainUrlRegex, (url) => {
    // Extract domain name for display
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const placeholder = `__LINK_${placeholders.length}__`;
      placeholders.push({ placeholder, text: domain, url });
      return placeholder;
    } catch {
      return url;
    }
  });
  
  // Split by placeholders and rebuild with React elements
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  placeholders.forEach(({ placeholder, text: linkText, url }, index) => {
    const placeholderIndex = processedText.indexOf(placeholder, lastIndex);
    if (placeholderIndex > lastIndex) {
      parts.push(processedText.slice(lastIndex, placeholderIndex));
    }
    parts.push(
      <a
        key={`link-${index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline transition-colors"
      >
        {linkText}
      </a>
    );
    lastIndex = placeholderIndex + placeholder.length;
  });
  
  if (lastIndex < processedText.length) {
    parts.push(processedText.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

interface ResultsScreenProps {
  answers: TripAnswers;
  travelStyle: string;
  destinations: Destination[];
  onViewLibrary: () => void;
}

export default function ResultsScreen({
  answers,
  travelStyle,
  destinations,
  onViewLibrary,
}: ResultsScreenProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Record<string, TripPlan>>({});

  async function handleSaveTrip(destination: Destination) {
    if (savingId) return;
    
    setSavingId(destination.id);
    
    try {
      let plan = plans[destination.id];
      
      if (!plan) {
        const result = await fetchTripPlan(answers, destination);
        if (result.error || !result.data) {
          console.error('Failed to generate plan:', result.error);
          setSavingId(null);
          return;
        }
        plan = result.data;
        setPlans((prev) => ({ ...prev, [destination.id]: plan }));
      }

      const trip: SavedTrip = {
        id: generateTripId(),
        destination,
        travelStyle,
        plan,
        answers,
        createdAt: new Date().toISOString(),
      };

      saveTrip(trip);
      setSavedIds((prev) => new Set([...prev, destination.id]));
      setShowConfirmation(destination.id);

      setTimeout(() => {
        setShowConfirmation(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving trip:', error);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-screen px-6 py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        <section className="mb-16">
          <p className="text-sm text-[var(--foreground-muted)] mb-3 font-medium">
            Your travel style
          </p>
          <p
            className="text-2xl md:text-3xl leading-relaxed"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {travelStyle}
          </p>
        </section>

        <section>
          <h2
            className="text-2xl md:text-3xl font-medium mb-8"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Destinations chosen for you
          </h2>

          <div className="space-y-6">
            {destinations.map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                isSaved={savedIds.has(destination.id)}
                isSaving={savingId === destination.id}
                showConfirmation={showConfirmation === destination.id}
                onSave={() => handleSaveTrip(destination)}
              />
            ))}
          </div>
        </section>

        <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[var(--foreground-muted)]">
            {savedIds.size > 0
              ? `${savedIds.size} trip${savedIds.size > 1 ? 's' : ''} saved to your library`
              : 'Save trips to build your library'}
          </p>
          <button
            onClick={onViewLibrary}
            className="px-6 py-3 rounded-full border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            View library
          </button>
        </div>
      </div>
    </div>
  );
}

interface DestinationCardProps {
  destination: Destination;
  isSaved: boolean;
  isSaving: boolean;
  showConfirmation: boolean;
  onSave: () => void;
}

function DestinationCard({
  destination,
  isSaved,
  isSaving,
  showConfirmation,
  onSave,
}: DestinationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div
        className="h-32 md:h-40 bg-cover bg-center bg-[var(--border)]"
        style={{
          backgroundImage: `url(${destination.imageUrl})`,
        }}
      />

      <div className="p-6 md:p-8">
        <h3
          className="text-2xl font-medium mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {destination.name}
        </h3>
        <p className="text-[var(--foreground-muted)] mb-4">
          {destination.tagline}
        </p>

        <div className="mb-6">
          <p className="text-sm text-[var(--foreground-muted)] mb-2 font-medium">
            Why this fits you
          </p>
          <p className="leading-relaxed">{linkifyText(destination.whyItFits)}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div>
            <p className="text-[var(--foreground-muted)] mb-1">Best time</p>
            <p className="font-medium">{destination.bestTimeToVisit}</p>
          </div>
          <div>
            <p className="text-[var(--foreground-muted)] mb-1">Daily spend</p>
            <p className="font-medium">{destination.estimatedDailySpend}</p>
          </div>
          <div>
            <p className="text-[var(--foreground-muted)] mb-1">Flight time</p>
            <p className="font-medium">{destination.flightTime}</p>
          </div>
        </div>

        <div className="relative">
          {showConfirmation ? (
            <div className="flex items-center gap-2 text-green-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">Saved to library</span>
            </div>
          ) : isSaved ? (
            <span className="text-[var(--foreground-muted)]">
              Already saved
            </span>
          ) : isSaving ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[var(--foreground-muted)]">Creating your itinerary...</span>
            </div>
          ) : (
            <button
              onClick={onSave}
              className="px-6 py-3 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium"
            >
              Save this trip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
