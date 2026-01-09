'use client';

import { jsPDF } from 'jspdf';
import { SavedTrip } from '@/types';

interface TripDetailProps {
  trip: SavedTrip;
  onBack: () => void;
}

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

// Strip markdown links and URLs for PDF text
function stripLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s]+/g, '');
}

export default function TripDetail({ trip, onBack }: TripDetailProps) {
  const { destination, plan } = trip;

  function handleDownload() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [30, 30, 30]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(stripLinks(text), contentWidth);
      
      // Check if we need a new page
      const lineHeight = fontSize * 0.5;
      if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + 4;
    };

    const addSection = (title: string) => {
      y += 6;
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(title.toUpperCase(), margin, y);
      y += 8;
      // Add accent line
      doc.setDrawColor(200, 160, 120);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + 40, y);
      y += 8;
    };

    const addBullet = (text: string) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(stripLinks(text), contentWidth - 10);
      
      if (y + lines.length * 5 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFillColor(200, 160, 120);
      doc.circle(margin + 2, y - 1.5, 1.5, 'F');
      doc.text(lines, margin + 8, y);
      y += lines.length * 5 + 3;
    };

    // Header
    doc.setFillColor(245, 240, 235);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(destination.name, margin, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(destination.tagline, margin, 42);
    
    y = 65;

    // Trip Overview
    addSection('Trip Overview');
    addText(plan.overview, 11, false, [50, 50, 50]);

    // Day by Day
    addSection('Day by Day');
    plan.dayByDay.forEach((day) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 160, 120);
      
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(`Day ${day.day}`, margin, y);
      doc.setTextColor(30, 30, 30);
      doc.text(` — ${day.title}`, margin + 15, y);
      y += 6;
      addText(day.description, 11, false, [50, 50, 50]);
      y += 2;
    });

    // Food Highlights
    addSection('Food Highlights');
    plan.foodHighlights.forEach((item) => addBullet(item));

    // Things to Do
    addSection('Things to Do');
    plan.thingsToDo.forEach((item) => addBullet(item));

    // Where to Stay
    addSection('Where to Stay');
    plan.whereToStay.forEach((place) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(place.neighborhood, margin, y);
      y += 6;
      addText(place.description, 11, false, [80, 80, 80]);
    });

    // Getting Around
    addSection('Getting Around');
    addText(plan.gettingAround, 11, false, [50, 50, 50]);

    // What to Pack
    addSection('What to Pack');
    plan.whatToPack.forEach((item) => addBullet(item));

    // Budget Overview
    addSection('Budget Overview');
    const budgetItems = [
      ['Accommodation', plan.budgetOverview.accommodation],
      ['Food', plan.budgetOverview.food],
      ['Activities', plan.budgetOverview.activities],
      ['Transport', plan.budgetOverview.transport],
    ];
    
    budgetItems.forEach(([label, value]) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(value, margin + 50, y);
      y += 6;
    });
    
    y += 4;
    doc.setFillColor(245, 240, 235);
    doc.roundedRect(margin, y - 4, contentWidth, 16, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Estimated Daily Total:', margin + 5, y + 6);
    doc.setTextColor(200, 160, 120);
    doc.text(plan.budgetOverview.total, margin + 70, y + 6);

    // Footer
    y = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Fara — Your personal travel advisor', margin, y);

    // Save
    const fileName = `${destination.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-trip-plan.pdf`;
    doc.save(fileName);
  }

  return (
    <div className="min-h-screen px-6 py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-8"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to library
        </button>

        <div
          className="h-48 md:h-64 rounded-2xl mb-8 bg-cover bg-center bg-[var(--border)]"
          style={{
            backgroundImage: `url(${destination.imageUrl})`,
          }}
        />

        <h1
          className="text-4xl md:text-5xl font-medium mb-3"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {destination.name}
        </h1>
        <p className="text-xl text-[var(--foreground-muted)] mb-8">
          {destination.tagline}
        </p>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Trip overview
          </h2>
          <p className="text-lg leading-relaxed">{linkifyText(plan.overview)}</p>
        </section>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Day by day
          </h2>
          <div className="space-y-6">
            {plan.dayByDay.map((day) => (
              <div
                key={day.day}
                className="border-l-2 border-[var(--accent)] pl-6"
              >
                <p className="text-sm text-[var(--foreground-muted)] mb-1">
                  Day {day.day}
                </p>
                <h3
                  className="text-xl font-medium mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {day.title}
                </h3>
                <p className="leading-relaxed">{linkifyText(day.description)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Food highlights
          </h2>
          <ul className="space-y-2">
            {plan.foodHighlights.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0" />
                <span>{linkifyText(item)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Things to do
          </h2>
          <ul className="space-y-2">
            {plan.thingsToDo.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0" />
                <span>{linkifyText(item)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Where to stay
          </h2>
          <div className="space-y-4">
            {plan.whereToStay.map((place, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-[var(--background-subtle)] border border-[var(--border)]"
              >
                <h3
                  className="font-medium mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {place.neighborhood}
                </h3>
                <p className="text-[var(--foreground-muted)]">
                  {linkifyText(place.description)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Getting around
          </h2>
          <p className="leading-relaxed">{linkifyText(plan.gettingAround)}</p>
        </section>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            What to pack
          </h2>
          <ul className="space-y-2">
            {plan.whatToPack.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0" />
                <span>{linkifyText(item)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Budget overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border)]">
              <p className="text-sm text-[var(--foreground-muted)] mb-1">
                Accommodation
              </p>
              <p className="font-medium">{plan.budgetOverview.accommodation}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border)]">
              <p className="text-sm text-[var(--foreground-muted)] mb-1">Food</p>
              <p className="font-medium">{plan.budgetOverview.food}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border)]">
              <p className="text-sm text-[var(--foreground-muted)] mb-1">
                Activities
              </p>
              <p className="font-medium">{plan.budgetOverview.activities}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border)]">
              <p className="text-sm text-[var(--foreground-muted)] mb-1">
                Transport
              </p>
              <p className="font-medium">{plan.budgetOverview.transport}</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">
              Estimated daily total
            </p>
            <p
              className="text-xl font-medium"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {plan.budgetOverview.total}
            </p>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-[var(--border)]">
          <button
            onClick={handleDownload}
            className="px-6 py-3 rounded-full border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors font-medium"
          >
            Download plan (PDF)
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors font-medium"
          >
            Back to library
          </button>
        </div>

      </div>
    </div>
  );
}
