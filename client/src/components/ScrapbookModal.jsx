import React, { useState } from 'react';

const DUCK_QUOTES = [
  'Even ten minutes of reading counts. Quack.',
  'A missed day isn’t a failure. The mist just waits.',
  'Rest is part of the schedule, not a gap in it.',
  'You’re doing better than you think.'
];

export default function ScrapbookModal({ isOpen, scrap = [], onClose }) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  if (!isOpen) return null;

  const handleDuckClick = () => {
    setQuoteIdx((prev) => (prev + 1) % DUCK_QUOTES.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(14,11,32,0.86)] backdrop-blur-md">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[26px] p-7 w-full max-w-[760px] max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="serif text-2xl font-normal mb-1">Scrapbook</h3>
            <p className="text-[13.5px] text-[var(--mut)]">Months you chose to keep.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-5 py-2 text-sm font-semibold hover:border-[var(--lamp)] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Scrapbook Duck */}
        <button
          type="button"
          onClick={handleDuckClick}
          className="flex items-center gap-4 w-full text-left p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surf2)] hover:border-[var(--lamp)] transition-colors cursor-pointer my-4"
        >
          <svg className="w-14 h-14 shrink-0">
            <use href="#dk" />
          </svg>
          <div>
            <b className="serif font-normal text-base block text-[var(--ink)]">Scrapbook Duck</b>
            <span className="text-xs sm:text-sm text-[var(--mut)]">{DUCK_QUOTES[quoteIdx]}</span>
          </div>
        </button>

        {/* Cards Grid */}
        {scrap.length === 0 ? (
          <p className="text-sm text-[var(--mut)] py-8 text-center">
            No months kept yet. Use “Keep this month” beside the mist to save one here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {scrap.map((item, idx) => {
              const blurVal = (10 * (1 - item.days / (item.dim || 30))).toFixed(1);
              return (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--surf2)] flex flex-col"
                >
                  <div className="aspect-[2/1] w-full overflow-hidden bg-[#2b2455] relative">
                    {item.ph ? (
                      <img
                        src={item.ph}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: `blur(${blurVal}px)` }}
                      />
                    ) : (
                      <svg
                        viewBox="0 0 600 300"
                        className="w-full h-full"
                        style={{ filter: `blur(${blurVal}px)` }}
                      >
                        <use href="#ls" />
                      </svg>
                    )}
                  </div>
                  <div className="p-3 text-xs text-[var(--mut)]">
                    <b className="serif font-normal text-sm text-[var(--ink)] block mb-1">
                      {item.label}
                    </b>
                    {item.days} of {item.dim} days
                    <p className="italic text-[var(--ink)] mt-1 line-clamp-2">
                      “{item.note}”
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
