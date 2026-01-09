'use client';

interface NavigationProps {
  currentView: 'questions' | 'loading' | 'results' | 'library' | 'detail';
  onNavigateToLibrary: () => void;
  onNavigateToQuestions: () => void;
}

export default function Navigation({
  currentView,
  onNavigateToLibrary,
  onNavigateToQuestions,
}: NavigationProps) {
  if (currentView === 'loading') return null;

  return (
    <nav className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between">
      <div className="text-sm font-medium text-[var(--foreground)]" style={{ fontFamily: 'var(--font-heading)' }}>
        findtravel.today
      </div>
      <div className="flex items-center gap-4">
        {currentView !== 'questions' && (
          <button
            onClick={onNavigateToQuestions}
            className="px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            New trip
          </button>
        )}
        {currentView !== 'library' && currentView !== 'detail' && (
          <button
            onClick={onNavigateToLibrary}
            className="px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Library
          </button>
        )}
      </div>
    </nav>
  );
}
