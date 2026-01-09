'use client';

import { useState, useEffect, useCallback } from 'react';
import { TripAnswers, SavedTrip, Destination } from '@/types';
import QuestionFlow from '@/components/QuestionFlow';
import LoadingScreen from '@/components/LoadingScreen';
import ResultsScreen from '@/components/ResultsScreen';
import TripLibrary from '@/components/TripLibrary';
import TripDetail from '@/components/TripDetail';
import Navigation from '@/components/Navigation';
import { fetchTravelStyle, fetchDestinations } from '@/lib/api';

type AppView = 'questions' | 'loading' | 'results' | 'library' | 'detail';

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('questions');
  const [answers, setAnswers] = useState<TripAnswers | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [travelStyle, setTravelStyle] = useState<string>('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateResults = useCallback(async (tripAnswers: TripAnswers) => {
    setIsGenerating(true);
    setError(null);

    try {
      const [styleResult, destinationsResult] = await Promise.all([
        fetchTravelStyle(tripAnswers),
        fetchDestinations(tripAnswers),
      ]);

      if (styleResult.error) {
        throw new Error(styleResult.error);
      }
      if (destinationsResult.error) {
        throw new Error(destinationsResult.error);
      }

      setTravelStyle(styleResult.data || '');
      setDestinations(destinationsResult.data || []);
      setCurrentView('results');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  function handleQuestionsComplete(completedAnswers: TripAnswers) {
    setAnswers(completedAnswers);
    setCurrentView('loading');
  }

  useEffect(() => {
    if (currentView === 'loading' && answers && !isGenerating) {
      generateResults(answers);
    }
  }, [currentView, answers, isGenerating, generateResults]);

  function handleViewLibrary() {
    setCurrentView('library');
  }

  function handleSelectTrip(trip: SavedTrip) {
    setSelectedTrip(trip);
    setCurrentView('detail');
  }

  function handleStartNewPlan() {
    setAnswers(null);
    setSelectedTrip(null);
    setTravelStyle('');
    setDestinations([]);
    setError(null);
    setCurrentView('questions');
  }

  function handleBackToLibrary() {
    setSelectedTrip(null);
    setCurrentView('library');
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navigation
        currentView={currentView}
        onNavigateToLibrary={handleViewLibrary}
        onNavigateToQuestions={handleStartNewPlan}
      />

      {currentView === 'questions' && (
        <QuestionFlow onComplete={handleQuestionsComplete} />
      )}

      {currentView === 'loading' && (
        <LoadingScreen error={error} onRetry={() => answers && generateResults(answers)} />
      )}

      {currentView === 'results' && answers && (
        <ResultsScreen
          answers={answers}
          travelStyle={travelStyle}
          destinations={destinations}
          onViewLibrary={handleViewLibrary}
        />
      )}

      {currentView === 'library' && (
        <TripLibrary
          onSelectTrip={handleSelectTrip}
          onStartNewPlan={handleStartNewPlan}
        />
      )}

      {currentView === 'detail' && selectedTrip && (
        <TripDetail trip={selectedTrip} onBack={handleBackToLibrary} />
      )}
    </main>
  );
}
