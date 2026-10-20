import React, { useState } from 'react';

const PRESET_COLORS = [
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#94a3b8'  // Slate
];

export default function CustomSubjectModal({
  isOpen,
  tags = [],
  onClose,
  onSaveTags,
  onSelectTag
}) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    const cleanName = newTagName.trim();
    if (!cleanName) {
      setError('Please enter a subject name');
      return;
    }

    if (tags.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      setError('A subject with this name already exists');
      return;
    }

    const newTag = {
      id: 'tag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      color: newTagColor
    };

    const updated = [...tags, newTag];
    onSaveTags(updated);
    if (onSelectTag) onSelectTag(newTag);
    setNewTagName('');
    setError('');
  };

  const handleDelete = (id) => {
    const updated = tags.filter((t) => t.id !== id);
    onSaveTags(updated);
  };

  const handleStartEdit = (t) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditColor(t.color || PRESET_COLORS[0]);
  };

  const handleSaveEdit = (id) => {
    const clean = editName.trim();
    if (!clean) return;
    const updated = tags.map((t) => (t.id === id ? { ...t, name: clean, color: editColor } : t));
    onSaveTags(updated);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(14,11,32,0.86)] backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[26px] p-6 sm:p-7 w-full max-w-[480px] max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏷️</span>
            <div>
              <h3 className="serif text-xl sm:text-2xl font-normal">Custom Subjects</h3>
              <p className="text-xs text-[var(--mut)]">Create your own subjects to categorize your focus time</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--line)] bg-[var(--surf2)] hover:bg-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Add New Subject Form */}
        <form onSubmit={handleAdd} className="mt-4 p-4 rounded-2xl bg-[var(--surf2)] border border-[var(--line)]">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--mut)] mb-2.5">
            + Add New Custom Subject
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-[var(--mut)] mb-1">Subject Name</label>
              <input
                type="text"
                placeholder="e.g. Neuroscience, Physics, LeetCode, Piano..."
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  if (error) setError('');
                }}
                maxLength={30}
                className="w-full bg-[var(--surf)] border border-[var(--line)] rounded-xl px-3.5 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
                autoFocus
              />
              {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-xs text-[var(--mut)] mb-1.5">Pick Theme Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      newTagColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[var(--surf2)]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-6 h-6 rounded-full border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
                  title="Custom hex color"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 w-full py-2.5 px-4 rounded-xl bg-[var(--lamp)] text-[#1b1730] font-semibold text-xs transition-all hover:brightness-105 active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>+</span>
              <span>Create Subject</span>
            </button>
          </div>
        </form>

        {/* Existing Custom Subjects List */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--mut)] mb-2.5">
            <span>Your Subjects ({tags.length})</span>
            {tags.length > 0 && <span className="text-[11px] font-normal lowercase">click tag to select</span>}
          </div>

          {tags.length === 0 ? (
            <div className="p-5 text-center rounded-2xl border border-dashed border-[var(--line)] text-xs text-[var(--mut)]">
              No subjects added yet. Create your first subject above!
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {tags.map((t) => {
                const isEditing = editingId === t.id;
                return (
                  <div
                    key={t.id || t.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surf2)] border border-[var(--line)] text-sm group transition-all"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-5 h-5 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={30}
                          className="flex-1 bg-[var(--surf)] border border-[var(--line)] rounded-lg px-2 py-1 text-xs text-[var(--ink)] outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--lamp)] text-[#1b1730] text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 rounded-lg text-xs text-[var(--mut)] hover:text-[var(--ink)] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectTag) onSelectTag(t);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 text-left flex-1 cursor-pointer hover:opacity-85"
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.color || '#94a3b8' }}
                          />
                          <span className="font-medium text-xs sm:text-sm text-[var(--ink)]">{t.name}</span>
                        </button>

                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(t)}
                            title="Edit subject"
                            className="p-1 rounded text-xs text-[var(--mut)] hover:text-[var(--ink)] cursor-pointer"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            title="Delete subject"
                            className="p-1 rounded text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            🗑
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--surf2)] hover:bg-[var(--line)] text-xs font-medium text-[var(--ink)] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
