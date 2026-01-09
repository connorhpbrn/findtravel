'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  error?: string | null;
  onRetry?: () => void;
}

export default function LoadingScreen({ error, onRetry }: LoadingScreenProps) {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    if (error) return;
    
    const dotInterval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 400);

    return () => {
      clearInterval(dotInterval);
    };
  }, [error]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1
            className="text-2xl md:text-3xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Something went wrong
          </h1>
          
          <p className="text-[var(--foreground-muted)] mb-6">
            {error}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="mb-10">
          <div className="flex justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-all duration-300 ease-out"
                style={{
                  backgroundColor: i === activeDot ? 'var(--accent)' : 'var(--border)',
                  transform: i === activeDot ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        <h1
          className="text-3xl md:text-4xl font-medium mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Designing your trip
        </h1>

        <p className="text-[var(--foreground-muted)] text-lg">
          Matching your preferences with destinations that fit.
        </p>
      </div>
    </div>
  );
}
