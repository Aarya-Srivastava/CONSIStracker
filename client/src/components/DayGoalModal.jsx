import React, { useState, useEffect } from 'react';

export default function DayGoalModal({
  isOpen,
  date,
  defaultGoal,
  currentDayGoal,
  currentDayNote,
  onClose,
  onSave
}) {
  const [goalHours, setGoalHours] = useState(defaultGoal);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGoalHours(currentDayGoal != null ? currentDayGoal : defaultGoal);
      setNote(currentDayNote || '');
    }
  }, [isOpen, currentDayGoal, currentDayNote, defaultGoal]);

  if (!isOpen || !date) return null;

  const dateObj = new Date(date + 'T00:00:00');
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const handleSave = () => {
    const val = parseFloat(goalHours);
    if (!(val >= 0.25 && val <= 16)) {
      alert('Enter a goal between 0.25 and 16 hours');
      return;
    }
    onSave(date, Math.round(val * 100) / 100, note.trim(), false);
  };

  const handleReset = () => {
    onSave(date, null, null, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(14,11,32,0.86)] backdrop-blur-md">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[26px] p-7 w-full max-w-[380px] shadow-2xl">
        <h3 className="serif text-2xl font-normal mb-1">{dateFormatted}</h3>
        <p className="text-[13px] text-[var(--mut)] mb-4">
          Your default is {defaultGoal}h. A custom goal applies to this day only.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-[var(--mut)] mb-1">Study goal (hours)</label>
            <input
              type="number"
              min="0.25"
              max="16"
              step="0.25"
              value={goalHours}
              onChange={(e) => setGoalHours(e.target.value)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--mut)] mb-1">Goal in words (optional)</label>
            <input
              type="text"
              maxLength="120"
              placeholder="e.g. Finish chapter 4 and 10 questions"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-4 py-2 text-sm font-semibold hover:border-[var(--lamp)]"
            >
              Cancel
            </button>
            {(currentDayGoal != null || currentDayNote) && (
              <button
                type="button"
                onClick={handleReset}
                className="border border-[var(--line)] bg-[var(--surf2)] text-[var(--warn)] rounded-full px-4 py-2 text-sm font-semibold hover:border-[var(--warn)]"
              >
                Reset day
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="border border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] rounded-full px-5 py-2 text-sm font-semibold hover:brightness-110 shadow-md"
            >
              Save goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
