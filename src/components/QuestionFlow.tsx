'use client';

import { useState } from 'react';
import { Question, TripAnswers, ImageOption } from '@/types';
import { questions } from '@/lib/questions';
import ProgressBar from './ProgressBar';

interface QuestionFlowProps {
  onComplete: (answers: TripAnswers) => void;
}

export default function QuestionFlow({ onComplete }: QuestionFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<TripAnswers>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const filteredQuestions = questions.filter((q) => {
    if (!q.conditionalOn) return true;
    const { field, value } = q.conditionalOn;
    const answer = answers[field];
    
    // Handle array conditional values (e.g., show foodStyle if interests includes 'Great food')
    if (Array.isArray(value)) {
      if (Array.isArray(answer)) {
        return value.some(v => answer.includes(v));
      }
      return value.includes(answer as string);
    }
    
    return answer === value;
  });

  const currentQuestion = filteredQuestions[currentIndex];
  const isLastQuestion = currentIndex === filteredQuestions.length - 1;
  const canProceed = currentQuestion?.optional || hasAnswer(currentQuestion?.id);

  function hasAnswer(questionId?: string): boolean {
    if (!questionId) return false;
    const answer = answers[questionId as keyof TripAnswers];
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'number') return true;
    return !!answer;
  }

  function handleAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (!canProceed) return;
    
    if (isLastQuestion) {
      onComplete(answers as TripAnswers);
      return;
    }

    setDirection('forward');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
  }

  function handleBack() {
    if (currentIndex === 0) return;
    setDirection('backward');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setIsAnimating(false);
    }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canProceed) {
      handleNext();
    }
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen flex flex-col" onKeyDown={handleKeyDown}>
      <ProgressBar current={currentIndex + 1} total={filteredQuestions.length} />
      
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className={`w-full max-w-xl transition-all duration-300 ${
            isAnimating
              ? direction === 'forward'
                ? 'opacity-0 translate-x-8'
                : 'opacity-0 -translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        >
          <p className="text-sm text-[var(--foreground-muted)] mb-3 font-medium">
            {currentQuestion.category}
          </p>
          
          <h1 className="text-3xl md:text-4xl font-medium mb-10 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            {currentQuestion.question}
          </h1>

          <QuestionInput
            question={currentQuestion}
            value={answers[currentQuestion.id as keyof TripAnswers]}
            onChange={(value) => handleAnswer(currentQuestion.id, value)}
          />

          <div className="flex items-center justify-between mt-12">
            <button
              onClick={handleBack}
              className={`text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors ${
                currentIndex === 0 ? 'invisible' : ''
              }`}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                canProceed
                  ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--foreground)]'
                  : 'bg-[var(--border)] text-[var(--foreground-muted)] cursor-not-allowed'
              }`}
            >
              {isLastQuestion ? 'Create my plan' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuestionInputProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  switch (question.type) {
    case 'text':
      return (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className="w-full px-0 py-4 text-xl border-b-2 border-[var(--border)] focus:border-[var(--accent)] outline-none bg-transparent transition-colors placeholder:text-[var(--foreground-muted)]/50"
          autoFocus
        />
      );

    case 'single':
      return (
        <div className="space-y-3">
          {question.options?.map((option) => (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all ${
                value === option
                  ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      );

    case 'multi':
      const selectedValues = (value as string[]) || [];
      return (
        <div className="flex flex-wrap gap-3">
          {question.options?.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
              <button
                key={option}
                onClick={() => {
                  if (isSelected) {
                    onChange(selectedValues.filter((v) => v !== option));
                  } else {
                    onChange([...selectedValues, option]);
                  }
                }}
                className={`px-5 py-3 rounded-full border-2 transition-all ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                    : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      );

    case 'slider':
      const sliderValue = (value as number) || question.min || 0;
      const sliderMin = question.min || 0;
      const sliderMax = question.max || 100;
      const sliderPercent = ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100;
      return (
        <div className="space-y-4">
          <div className="text-4xl font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
            {sliderValue} people
          </div>
          <div className="relative h-2">
            <div className="absolute inset-0 bg-[var(--border)] rounded-full" />
            <div 
              className="absolute left-0 top-0 h-full bg-[var(--accent)] rounded-full transition-all duration-150"
              style={{ width: `${sliderPercent}%` }}
            />
            <input
              type="range"
              min={question.min}
              max={question.max}
              step={question.step}
              value={sliderValue}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[var(--accent)] rounded-full shadow-md pointer-events-none transition-all duration-150 hover:scale-110"
              style={{ left: `calc(${sliderPercent}% - 10px)` }}
            />
          </div>
          <div className="flex justify-between text-sm text-[var(--foreground-muted)]">
            <span>{question.min}</span>
            <span>{question.max}</span>
          </div>
        </div>
      );

    case 'budget':
      const budgetValue = value === 'flexible' ? 'flexible' : (value as number) || question.min || 500;
      const isFlexible = budgetValue === 'flexible';
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onChange(isFlexible ? question.min : 'flexible')}
              className={`px-5 py-3 rounded-full border-2 transition-all ${
                isFlexible
                  ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/50'
              }`}
            >
              I'm flexible
            </button>
          </div>
          
          {!isFlexible && (
            <div className="space-y-4">
              <div className="text-4xl font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                ${(budgetValue as number).toLocaleString()}
              </div>
              {(() => {
                const budgetMin = question.min || 0;
                const budgetMax = question.max || 10000;
                const budgetPercent = (((budgetValue as number) - budgetMin) / (budgetMax - budgetMin)) * 100;
                return (
                  <div className="relative h-2">
                    <div className="absolute inset-0 bg-[var(--border)] rounded-full" />
                    <div 
                      className="absolute left-0 top-0 h-full bg-[var(--accent)] rounded-full transition-all duration-150"
                      style={{ width: `${budgetPercent}%` }}
                    />
                    <input
                      type="range"
                      min={question.min}
                      max={question.max}
                      step={question.step}
                      value={budgetValue as number}
                      onChange={(e) => onChange(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[var(--accent)] rounded-full shadow-md pointer-events-none transition-all duration-150"
                      style={{ left: `calc(${budgetPercent}% - 10px)` }}
                    />
                  </div>
                );
              })()}
              <div className="flex justify-between text-sm text-[var(--foreground-muted)]">
                <span>${question.min?.toLocaleString()}</span>
                <span>${question.max?.toLocaleString()}+</span>
              </div>
            </div>
          )}
        </div>
      );

    case 'image-select':
      return (
        <ImageSelectInput
          options={question.imageOptions || []}
          value={value as string}
          onChange={onChange}
        />
      );

    case 'binary-toggles':
      return (
        <BinaryTogglesInput
          toggles={question.binaryToggles || []}
          value={value as Record<string, number>}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}

function ImageSelectInput({ 
  options, 
  value, 
  onChange 
}: { 
  options: ImageOption[]; 
  value: string; 
  onChange: (value: string) => void;
}) {
  // Pick a random image index for each option on mount (fresh each questionnaire session)
  const [imageIndices] = useState<Record<string, number>>(() => {
    const indices: Record<string, number> = {};
    options.forEach(opt => {
      indices[opt.id] = Math.floor(Math.random() * opt.images.length);
    });
    return indices;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {options.map((option) => {
        const imageIndex = imageIndices[option.id] || 0;
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`relative aspect-[4/3] rounded-xl overflow-hidden border-3 transition-all ${
              isSelected
                ? 'border-[var(--accent)]'
                : 'border-transparent hover:border-[var(--accent)]/50'
            }`}
          >
            <img
              src={option.images[imageIndex]}
              alt={option.label}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-medium text-sm">{option.label}</p>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function BinaryTogglesInput({
  toggles,
  value,
  onChange,
}: {
  toggles: { id: string; leftLabel: string; rightLabel: string }[];
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}) {
  const currentValue = value || toggles.reduce((acc, t) => ({ ...acc, [t.id]: 50 }), {});

  const handleToggleChange = (toggleId: string, newValue: number) => {
    onChange({ ...currentValue, [toggleId]: newValue });
  };

  return (
    <div className="space-y-8">
      {toggles.map((toggle) => {
        const toggleValue = currentValue[toggle.id] ?? 50;
        return (
          <div key={toggle.id} className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={toggleValue < 50 ? 'text-[var(--foreground)] font-medium' : 'text-[var(--foreground-muted)]'}>
                {toggle.leftLabel}
              </span>
              <span className={toggleValue > 50 ? 'text-[var(--foreground)] font-medium' : 'text-[var(--foreground-muted)]'}>
                {toggle.rightLabel}
              </span>
            </div>
            <div className="relative h-2">
              <div className="absolute inset-0 bg-[var(--border)] rounded-full" />
              <div 
                className="absolute top-0 h-full bg-[var(--accent)] rounded-full transition-all duration-150"
                style={{ 
                  left: toggleValue < 50 ? `${toggleValue}%` : '50%',
                  width: `${Math.abs(toggleValue - 50)}%`
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={toggleValue}
                onChange={(e) => handleToggleChange(toggle.id, parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[var(--accent)] rounded-full shadow-md pointer-events-none transition-all duration-150"
                style={{ left: `calc(${toggleValue}% - 10px)` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
