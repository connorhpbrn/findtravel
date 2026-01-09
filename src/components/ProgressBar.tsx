'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--accent-light)] z-50">
      <div
        className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
