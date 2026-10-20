import React, { useState } from 'react';
import { DEFAULT_TAGS } from '../utils/api';

export default function ManualEntryModal({
  isOpen,
  sessions = [],
  tags = DEFAULT_TAGS,
  onClose,
  onSave,
  onDeleteSession
}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayIso);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [selectedTag, setSelectedTag] = useState(tags[0] || DEFAULT_TAGS[0]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const daySessions = sessions.filter((s) => s.date === date);

  const handleSubmit = (e) => {
    e.preventDefault();
    const h = Math.min(16, Math.max(0, parseInt(hours) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minutes) || 0));
    const totalSec = h * 3600 + m * 60;

    if (totalSec < 60) {
      alert('Please enter at least 1 minute');
      return;
    }

    onSave({
      id: 'm' + Date.now(),
      date,
      sec: totalSec,
      type: 'manual',
      tag: selectedTag.name,
      color: selectedTag.color,
      note: note.trim() || `${selectedTag.name} study`
    });
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(14,11,32,0.86)] backdrop-blur-md">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[26px] p-7 w-full max-w-[460px] max-h-[88vh] overflow-y-auto shadow-2xl">
        <h3 className="serif text-2xl font-normal mb-1">Add hours manually</h3>
        <p className="text-[13.5px] text-[var(--mut)] mb-4">
          These count toward your goal and streak, and are categorized by subject.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-[var(--mut)] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--mut)] mb-1">Hours</label>
              <input
                type="number"
                min="0"
                max="16"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--mut)] mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
              />
            </div>
          </div>

          {/* Subject / Category Tag Selector */}
          <div>
            <label className="block text-xs text-[var(--mut)] mb-1.5">Subject / Category</label>
            <div className="flex gap-1.5 flex-wrap">
              {tags.map((t) => {
                const isSelected = selectedTag.id === t.id || selectedTag.name === t.name;
                return (
                  <button
                    key={t.id || t.name}
                    type="button"
                    onClick={() => setSelectedTag(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'font-bold shadow-sm'
                        : 'bg-[var(--surf2)] opacity-70 hover:opacity-100 border-[var(--line)]'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${t.color}30`,
                            borderColor: t.color,
                            color: t.color
                          }
                        : {}
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--mut)] mb-1">Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Chapter 4 problem set"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
            />
          </div>

          {/* Sessions already on this date */}
          {daySessions.length > 0 && (
            <div className="mt-2 pt-3 border-t border-[var(--line)]">
              <span className="block text-xs text-[var(--mut)] mb-2">Already logged on this date</span>
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                {daySessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-lg bg-[var(--surf2)] border border-[var(--line)]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color || '#94a3b8' }}
                        title={s.tag || 'General'}
                      />
                      <em className="not-italic text-[var(--mut)]">
                        [{s.tag || 'General'}]
                      </em>
                      <span className="text-[var(--ink)]">{s.note}</span> · <b>{Math.max(1, Math.round(s.sec / 60))}m</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(s.id)}
                      className="text-[var(--warn)] hover:underline ml-2 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-5 py-2.5 text-sm font-semibold hover:border-[var(--lamp)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] rounded-full px-6 py-2.5 text-sm font-semibold hover:brightness-110 transition-colors shadow-md cursor-pointer"
            >
              Save study time
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
