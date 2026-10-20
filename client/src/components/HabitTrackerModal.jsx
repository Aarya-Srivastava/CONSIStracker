import React, { useState, useMemo } from 'react';
import { playSfx } from '../utils/audio';

const HABIT_EMOJIS = ['💧', '🏃‍♂️', '📚', '💻', '🧘', '🥗', '💤', '✍️', '🎯', '🎸', '🍎', '⚡', '🧠', '🏋️', '🌿'];
const HABIT_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16'  // Lime
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  // 0 = Sunday, 1 = Monday, etc. Adjust so Monday is 0
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7; // Monday = 0, Sunday = 6
}

function formatDateKey(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function calculateStreak(history = {}) {
  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  // Check if today is completed, if not check if yesterday was completed
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (!history[todayStr] && !history[yesterdayStr]) {
    return 0;
  }

  if (!history[todayStr]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = checkDate.toISOString().slice(0, 10);
    if (history[key]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function HabitTrackerModal({
  isOpen,
  habits = [],
  onClose,
  onSaveHabits,
  isMuted = false,
  showToast
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Add / Edit habit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('💧');
  const [formColor, setFormColor] = useState(HABIT_COLORS[0]);
  const [formMonthlyTarget, setFormMonthlyTarget] = useState(20);
  const [formError, setFormError] = useState('');

  const todayStr = useMemo(() => now.toISOString().slice(0, 10), [now]);
  const daysInCurrentMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthName = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Month Statistics (must be declared before any early return)
  const monthStats = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    let goalsMet = 0;
    let totalTarget = 0;
    let totalCompleted = 0;

    habits.forEach((h) => {
      const history = h.history || {};
      const completed = Object.keys(history).filter((k) => k.startsWith(prefix) && history[k]).length;
      const target = h.monthlyTarget || 20;
      totalTarget += target;
      totalCompleted += completed;
      if (completed >= target) goalsMet++;
    });

    const completionRate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
    return { goalsMet, totalTarget, totalCompleted, completionRate };
  }, [habits, viewYear, viewMonth]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const openAddForm = () => {
    setEditingHabitId(null);
    setFormName('');
    setFormIcon('💧');
    setFormColor(HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)]);
    setFormMonthlyTarget(20);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (habit) => {
    setEditingHabitId(habit.id);
    setFormName(habit.name);
    setFormIcon(habit.icon || '💧');
    setFormColor(habit.color || HABIT_COLORS[0]);
    setFormMonthlyTarget(habit.monthlyTarget || 20);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Please enter a habit title');
      return;
    }

    const targetDays = Math.min(daysInCurrentMonth, Math.max(1, parseInt(formMonthlyTarget) || 20));

    if (editingHabitId) {
      const updated = habits.map((h) =>
        h.id === editingHabitId
          ? {
              ...h,
              name: cleanName,
              icon: formIcon,
              color: formColor,
              monthlyTarget: targetDays
            }
          : h
      );
      onSaveHabits(updated);
      if (showToast) showToast('Habit updated');
    } else {
      const newHabit = {
        id: 'h_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: cleanName,
        icon: formIcon,
        color: formColor,
        monthlyTarget: targetDays,
        createdAt: new Date().toISOString(),
        history: {}
      };
      onSaveHabits([...habits, newHabit]);
      if (showToast) showToast('Habit created');
    }

    setIsFormOpen(false);
  };

  const handleDeleteHabit = (id) => {
    if (window.confirm('Delete this habit and all its history?')) {
      const updated = habits.filter((h) => h.id !== id);
      onSaveHabits(updated);
      if (showToast) showToast('Habit deleted');
    }
  };

  const toggleDay = (habit, dayNum) => {
    const dateKey = formatDateKey(viewYear, viewMonth, dayNum);
    const history = { ...(habit.history || {}) };
    const wasCompleted = !!history[dateKey];
    const isNowCompleted = !wasCompleted;

    if (isNowCompleted) {
      history[dateKey] = true;
      playSfx('check', isMuted);
    } else {
      delete history[dateKey];
    }

    // Check if reached monthly goal
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const monthlyCount = Object.keys(history).filter((k) => k.startsWith(prefix) && history[k]).length;
    const target = habit.monthlyTarget || 20;

    if (isNowCompleted && monthlyCount === target) {
      playSfx('celebrate', isMuted);
      if (showToast) showToast(`🎉 Monthly Goal Achieved for ${habit.name}! (${monthlyCount}/${target} days)`);
    }

    const updated = habits.map((h) => (h.id === habit.id ? { ...h, history } : h));
    onSaveHabits(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[rgba(14,11,32,0.88)] backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[28px] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--line)] flex items-center justify-between flex-wrap gap-4 bg-[var(--surf)]/80">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">🎯</span>
              <div>
                <h2 className="serif text-xl sm:text-2xl font-normal">Habit Tracker & Monthly Goals</h2>
                <p className="text-xs text-[var(--mut)]">
                  Consistency beats intensity. Set your monthly targets and check off your days.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddForm}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--lamp)] text-[#1b1730] font-semibold text-xs transition-all hover:brightness-105 active:scale-95 cursor-pointer shadow flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New Habit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[var(--line)] bg-[var(--surf2)] hover:bg-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Month Navigation & Stats Bar */}
        <div className="px-5 py-3 sm:px-6 bg-[var(--surf2)]/60 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--surf)] hover:bg-[var(--line)] flex items-center justify-center text-[var(--ink)] cursor-pointer"
              title="Previous month"
            >
              ‹
            </button>
            <span className="font-semibold text-sm text-[var(--ink)] min-w-[130px] text-center">{monthName}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--surf)] hover:bg-[var(--line)] flex items-center justify-center text-[var(--ink)] cursor-pointer"
              title="Next month"
            >
              ›
            </button>
            {(viewMonth !== now.getMonth() || viewYear !== now.getFullYear()) && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-2 py-1 rounded-lg bg-[var(--lamp)]/20 text-[var(--lamp)] hover:bg-[var(--lamp)]/30 font-medium cursor-pointer text-[11px]"
              >
                Today
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-[var(--mut)]">
            <div>
              Active Habits: <span className="font-semibold text-[var(--ink)]">{habits.length}</span>
            </div>
            <div>
              Monthly Goals Achieved:{' '}
              <span className="font-semibold text-emerald-400">
                {monthStats.goalsMet} / {habits.length}
              </span>
            </div>
            <div>
              Month Adherence:{' '}
              <span className="font-semibold text-[var(--lamp)]">{monthStats.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Main Habits List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {habits.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[var(--line)] rounded-2xl p-8">
              <span className="text-4xl block mb-2">🌱</span>
              <h3 className="serif text-lg font-normal text-[var(--ink)] mb-1">No habits tracked yet</h3>
              <p className="text-xs text-[var(--mut)] max-w-sm mx-auto mb-4">
                Build unstoppable momentum. Create habits like "Morning Run", "Drink 2L Water", or "Read 20 pages" with
                monthly targets.
              </p>
              <button
                type="button"
                onClick={openAddForm}
                className="px-4 py-2 rounded-xl bg-[var(--lamp)] text-[#1b1730] font-semibold text-xs shadow-md hover:brightness-105 cursor-pointer"
              >
                + Create Your First Habit
              </button>
            </div>
          ) : (
            habits.map((habit) => {
              const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
              const history = habit.history || {};
              const completedDaysThisMonth = Object.keys(history).filter(
                (k) => k.startsWith(prefix) && history[k]
              ).length;
              const target = habit.monthlyTarget || 20;
              const progressPct = Math.min(100, Math.round((completedDaysThisMonth / target) * 100));
              const isGoalAchieved = completedDaysThisMonth >= target;
              const streak = calculateStreak(history);
              const isTodayCompleted = !!history[todayStr];

              return (
                <div
                  key={habit.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--surf2)] border border-[var(--line)] transition-all hover:border-[var(--line2)] shadow-sm"
                >
                  {/* Habit Top Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                        style={{ backgroundColor: `${habit.color}25`, border: `1px solid ${habit.color}50` }}
                      >
                        {habit.icon || '💧'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm sm:text-base text-[var(--ink)]">{habit.name}</h4>
                          {isGoalAchieved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <span>🌟</span> Goal Reached!
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--mut)] flex items-center gap-2 mt-0.5">
                          <span>
                            Monthly Target: <strong className="text-[var(--ink)]">{target} days</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Completed:{' '}
                            <strong style={{ color: habit.color }}>
                              {completedDaysThisMonth} / {target} days ({progressPct}%)
                            </strong>
                          </span>
                          {streak > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                                🔥 {streak} day streak
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleDay(habit, now.getDate())}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 border ${
                          isTodayCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                            : 'bg-[var(--surf)] border-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)]'
                        }`}
                        title="Quick toggle for today"
                      >
                        <span>{isTodayCompleted ? '✓ Done Today' : '○ Mark Today'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditForm(habit)}
                        className="p-1.5 rounded-lg text-xs text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--line)] cursor-pointer"
                        title="Edit habit"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete habit"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: habit.color || '#10b981'
                      }}
                    />
                  </div>

                  {/* Interactive Month Day Matrix (1..31) */}
                  <div className="pt-1">
                    <div className="text-[10px] text-[var(--mut)] uppercase font-semibold tracking-wider mb-1.5 flex items-center justify-between">
                      <span>{monthName} Daily Check-in Grid (tap any day)</span>
                      <span>
                        {completedDaysThisMonth >= target
                          ? 'Goal achieved! Any extra days are pure bonus.'
                          : `${target - completedDaysThisMonth} more days needed this month`}
                      </span>
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-16 gap-1 sm:gap-1.5">
                      {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dateKey = formatDateKey(viewYear, viewMonth, dayNum);
                        const isDone = !!history[dateKey];
                        const isToday =
                          viewYear === now.getFullYear() &&
                          viewMonth === now.getMonth() &&
                          dayNum === now.getDate();

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => toggleDay(habit, dayNum)}
                            className={`h-7 sm:h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                              isDone
                                ? 'shadow-sm text-white'
                                : 'bg-[var(--surf)] border border-[var(--line)] text-[var(--mut)] hover:border-[var(--lamp)] hover:text-[var(--ink)]'
                            } ${isToday ? 'ring-2 ring-[var(--lamp)] ring-offset-1 ring-offset-[var(--surf2)]' : ''}`}
                            style={
                              isDone
                                ? {
                                    backgroundColor: habit.color,
                                    borderColor: habit.color
                                  }
                                : {}
                            }
                            title={`${dateKey}: ${isDone ? 'Completed' : 'Not completed'}`}
                          >
                            <span>{dayNum}</span>
                            {isDone && (
                              <span className="absolute -top-1 -right-1 text-[9px] w-3 h-3 bg-black/60 rounded-full flex items-center justify-center text-white">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--surf)] flex items-center justify-between text-xs text-[var(--mut)]">
          <span>Click any day in the grid to log past or current progress.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--surf2)] hover:bg-[var(--line)] text-xs font-medium text-[var(--ink)] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit Habit Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surf)] border border-[var(--line)] text-[var(--ink)] rounded-[24px] p-6 w-full max-w-md shadow-2xl">
            <h3 className="serif text-xl font-normal mb-1">
              {editingHabitId ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <p className="text-xs text-[var(--mut)] mb-4">
              Set a monthly goal to keep yourself accountable without daily burnout.
            </p>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--mut)] mb-1">Habit Title</label>
                <input
                  type="text"
                  placeholder="e.g. Morning 5km Run, Drink 2L Water, Read 20 mins..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={40}
                  className="w-full bg-[var(--surf2)] border border-[var(--line)] rounded-xl px-3.5 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)]"
                  autoFocus
                />
                {formError && <p className="text-xs text-rose-400 mt-1">{formError}</p>}
              </div>

              <div>
                <label className="block text-xs text-[var(--mut)] mb-1.5">Pick Icon / Emoji</label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {HABIT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center cursor-pointer transition-all ${
                        formIcon === emoji
                          ? 'bg-[var(--lamp)] text-[#1b1730] scale-110 shadow'
                          : 'bg-[var(--surf2)] hover:bg-[var(--line)]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--mut)]">Or type custom emoji:</span>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    maxLength={3}
                    className="w-12 text-center bg-[var(--surf2)] border border-[var(--line)] rounded-lg py-1 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--mut)] mb-1.5">Theme Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                        formColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[var(--surf)]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-6 h-6 rounded-full border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Monthly Goal Target */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-[var(--mut)]">Monthly Goal Target (Days in Month)</label>
                  <span className="text-xs font-bold text-[var(--lamp)]">{formMonthlyTarget} days / month</span>
                </div>

                <input
                  type="range"
                  min="1"
                  max={daysInCurrentMonth}
                  value={formMonthlyTarget}
                  onChange={(e) => setFormMonthlyTarget(parseInt(e.target.value) || 1)}
                  className="w-full accent-[var(--lamp)] cursor-pointer"
                />

                {/* Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[
                    { label: '10d (Gentle)', val: 10 },
                    { label: '20d (Weekdays)', val: 20 },
                    { label: '25d (Consistent)', val: 25 },
                    { label: `Full Month (${daysInCurrentMonth}d)`, val: daysInCurrentMonth }
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setFormMonthlyTarget(p.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer transition-all border ${
                        formMonthlyTarget === p.val
                          ? 'bg-[var(--lamp)] text-[#1b1730] font-semibold border-[var(--lamp)]'
                          : 'bg-[var(--surf2)] border-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--mut)] mt-1.5">
                  Aim to complete this habit on <strong>{formMonthlyTarget}</strong> out of {daysInCurrentMonth} days in {monthName}.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--mut)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--lamp)] text-[#1b1730] font-semibold text-xs shadow-md hover:brightness-105 cursor-pointer"
                >
                  {editingHabitId ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
