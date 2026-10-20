import React, { useState, useMemo, useRef, useEffect } from 'react';
import { playSfx } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

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

const SAMPLE_HABITS = [
  { name: 'Wake up at 7 AM', icon: '⏰', color: '#10b981', monthlyTarget: 25 },
  { name: 'Drink 2L Water', icon: '💧', color: '#06b6d4', monthlyTarget: 28 },
  { name: 'Meditate & Breathe', icon: '🧘', color: '#a855f7', monthlyTarget: 20 },
  { name: 'Make Bed', icon: '🛏️', color: '#f59e0b', monthlyTarget: 25 },
  { name: 'Go for a walk / Stretch', icon: '🏃‍♂️', color: '#10b981', monthlyTarget: 22 },
  { name: 'Deep Work / Focus Study', icon: '💻', color: '#3b82f6', monthlyTarget: 22 },
  { name: 'Read for 20 minutes', icon: '📚', color: '#ec4899', monthlyTarget: 20 },
  { name: 'Write in journal', icon: '✍️', color: '#f43f5e', monthlyTarget: 15 },
  { name: 'Go to bed by 11 PM', icon: '💤', color: '#6366f1', monthlyTarget: 25 }
];

const WEEKDAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateKey(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
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

  // All Hooks must be at top level
  const todayStr = useMemo(() => now.toISOString().slice(0, 10), [now]);
  const daysInCurrentMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthName = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Days array metadata for the selected month
  const monthDays = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const dayOfWeekName = WEEKDAY_NAMES[dateObj.getDay()];
      const dateKey = formatDateKey(viewYear, viewMonth, d);
      const isToday =
        viewYear === now.getFullYear() &&
        viewMonth === now.getMonth() &&
        d === now.getDate();
      const isPast =
        viewYear < now.getFullYear() ||
        (viewYear === now.getFullYear() && viewMonth < now.getMonth()) ||
        (viewYear === now.getFullYear() && viewMonth === now.getMonth() && d < now.getDate());

      list.push({ dayNum: d, dayOfWeekName, dateKey, isToday, isPast });
    }
    return list;
  }, [viewYear, viewMonth, daysInCurrentMonth, now]);

  // Overall Month Statistics
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

    const completionRate = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;
    return { goalsMet, totalTarget, totalCompleted, completionRate };
  }, [habits, viewYear, viewMonth]);

  const todayColumnRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Auto-scroll horizontally to today when the modal opens or month changes
  useEffect(() => {
    if (isOpen && todayColumnRef.current) {
      const timer = setTimeout(() => {
        todayColumnRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, viewMonth, viewYear]);

  if (!isOpen) return null;

  const scrollToStart = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollToEnd = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        left: tableContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollToToday = () => {
    if (todayColumnRef.current) {
      todayColumnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

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

  const handleLoadSampleHabits = () => {
    const created = SAMPLE_HABITS.map((s, idx) => ({
      id: 'h_' + Date.now() + '_' + idx,
      name: s.name,
      icon: s.icon,
      color: s.color,
      monthlyTarget: s.monthlyTarget,
      createdAt: new Date().toISOString(),
      history: {}
    }));
    onSaveHabits([...habits, ...created]);
    if (showToast) showToast('Loaded sample habit goals');
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

  const handleMoveHabit = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= habits.length) return;
    const reordered = [...habits];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    onSaveHabits(reordered);
  };

  const toggleDay = (habit, dateKey) => {
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
      triggerConfetti();
      playSfx('celebrate', isMuted);
      if (showToast) showToast(`🎉 Monthly Goal Achieved for ${habit.name}! (${monthlyCount}/${target} days)`);
    }

    const updated = habits.map((h) => (h.id === habit.id ? { ...h, history } : h));
    onSaveHabits(updated);
  };

  // Donut Gauge math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - monthStats.completionRate / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[rgba(14,11,32,0.92)] backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[26px] w-full max-w-[96vw] xl:max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header Section with Donut Gauge (As shown in screenshot) */}
        <div className="p-4 sm:p-6 border-b border-[var(--line)] bg-[var(--surf2)]/70 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Circular Donut Gauge */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
                  {monthStats.completionRate}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mut)]">
                Monthly Goal Adherence
              </span>
              <div className="text-xs text-[var(--mut)] mt-0.5">
                <strong className="text-emerald-400 font-semibold">{monthStats.goalsMet}</strong> of {habits.length} monthly goals achieved
              </div>
              <div className="text-xs text-[var(--mut)]">
                <strong className="text-[var(--lamp)] font-semibold">{monthStats.totalCompleted}</strong> days completed this month
              </div>
            </div>
          </div>

          {/* Center: Title & Month Navigation */}
          <div className="flex flex-col items-center text-center">
            <h1 className="serif text-2xl sm:text-3xl font-normal tracking-wide text-[var(--ink)] uppercase">
              Daily Tasks and Goals
            </h1>
            
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--surf)] hover:bg-[var(--line)] flex items-center justify-center text-[var(--ink)] cursor-pointer text-sm"
                title="Previous month"
              >
                ‹
              </button>
              <span className="font-semibold text-xs sm:text-sm text-[var(--ink)] min-w-[140px] text-center">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--surf)] hover:bg-[var(--line)] flex items-center justify-center text-[var(--ink)] cursor-pointer text-sm"
                title="Next month"
              >
                ›
              </button>
              {(viewMonth !== now.getMonth() || viewYear !== now.getFullYear()) && (
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 rounded-lg bg-[var(--lamp)]/25 text-[var(--lamp)] font-semibold text-[11px] cursor-pointer hover:bg-[var(--lamp)]/35"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {habits.length === 0 && (
              <button
                type="button"
                onClick={handleLoadSampleHabits}
                className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surf)] hover:border-[var(--lamp)] text-xs font-semibold text-[var(--ink)] cursor-pointer transition-all"
              >
                + Load Samples
              </button>
            )}

            <button
              type="button"
              onClick={openAddForm}
              className="px-4 py-2 rounded-xl bg-[var(--lamp)] text-[#1b1730] font-semibold text-xs transition-all hover:brightness-105 active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New Habit</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[var(--line)] bg-[var(--surf2)] hover:bg-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer text-sm ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* The Spreadsheet Matrix View (As requested in image) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-5">
          {habits.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-[var(--line)] rounded-2xl p-8">
              <span className="text-4xl block mb-2">🎯</span>
              <h3 className="serif text-xl font-normal mb-1">No habits set yet</h3>
              <p className="text-xs text-[var(--mut)] max-w-md mx-auto mb-4">
                Add habits like "Wake up at 7 AM", "Drink 2L Water", "Study DSA", or load the sample set to get this exact daily matrix.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={openAddForm}
                  className="px-4 py-2 rounded-xl bg-[var(--lamp)] text-[#1b1730] font-semibold text-xs shadow-md hover:brightness-105 cursor-pointer"
                >
                  + Add Custom Habit
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleHabits}
                  className="px-4 py-2 rounded-xl bg-[var(--surf2)] border border-[var(--line)] text-xs font-semibold hover:border-[var(--lamp)] cursor-pointer"
                >
                  + Load 9 Sample Habits
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={tableContainerRef}
              className="border border-[var(--line)] rounded-2xl overflow-x-auto bg-[var(--surf)] shadow-sm"
            >
              <table className="w-full min-w-[1440px] border-collapse text-xs">
                <thead>
                  {/* Row 1: Weekday Names (MON, TUE, WED, ...) */}
                  <tr className="bg-[var(--surf2)] text-[var(--ink)] border-b border-[var(--line)]">
                    <th className="sticky left-0 z-20 bg-[var(--surf2)] p-2.5 text-left font-semibold text-xs border-r border-[var(--line)] shadow-[2px_0_6px_rgba(0,0,0,0.12)] min-w-[200px] sm:min-w-[240px]">
                      HABIT & MONTHLY GOAL
                    </th>
                    {monthDays.map((d) => (
                      <th
                        key={d.dayNum}
                        className={`p-1.5 text-center font-bold text-[10px] sm:text-[11px] min-w-[34px] sm:min-w-[38px] border-r border-[var(--line)]/60 ${
                          d.isToday ? 'bg-[var(--lamp)]/25 text-[var(--lamp)] font-extrabold' : 'text-[var(--mut)]'
                        }`}
                      >
                        {d.dayOfWeekName}
                      </th>
                    ))}
                    <th className="p-2 text-center font-semibold text-[11px] min-w-[100px] bg-[var(--surf2)] text-[var(--mut)]">
                      MONTHLY GOAL
                    </th>
                  </tr>

                  {/* Row 2: Day Numbers (1, 2, 3, ... 31) */}
                  <tr className="bg-[var(--surf2)]/70 text-[var(--ink)] border-b border-[var(--line)] font-semibold">
                    <th className="sticky left-0 z-20 bg-[var(--surf2)] p-2 text-left text-[11px] text-[var(--mut)] border-r border-[var(--line)] shadow-[2px_0_6px_rgba(0,0,0,0.12)] font-normal">
                      Target & Progress
                    </th>
                    {monthDays.map((d) => (
                      <th
                        key={d.dayNum}
                        ref={d.isToday ? todayColumnRef : null}
                        className={`p-1 text-center text-xs border-r border-[var(--line)]/60 min-w-[34px] sm:min-w-[38px] ${
                          d.isToday ? 'bg-[var(--lamp)] text-[#1b1730] font-bold rounded-sm' : ''
                        }`}
                      >
                        {d.dayNum}
                      </th>
                    ))}
                    <th className="p-1 text-center text-[10px] text-[var(--mut)] bg-[var(--surf2)] font-normal min-w-[100px]">
                      Target (Days)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {habits.map((habit, rIdx) => {
                    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
                    const history = habit.history || {};
                    const completedDays = Object.keys(history).filter(
                      (k) => k.startsWith(prefix) && history[k]
                    ).length;
                    const target = habit.monthlyTarget || 20;
                    const isGoalAchieved = completedDays >= target;
                    const progressPct = Math.min(100, Math.round((completedDays / target) * 100));

                    return (
                      <tr
                        key={habit.id}
                        className={`border-b border-[var(--line)]/60 hover:bg-white/[0.03] transition-colors ${
                          rIdx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--surf2)]/25'
                        }`}
                      >
                        {/* Habit Title Column (Sticky) */}
                        <td className="sticky left-0 z-10 bg-[var(--surf)] p-2.5 border-r border-[var(--line)] shadow-[2px_0_6px_rgba(0,0,0,0.12)] font-medium text-[var(--ink)]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {/* Reorder Buttons */}
                              <div className="flex flex-col flex-shrink-0">
                                <button
                                  type="button"
                                  disabled={rIdx === 0}
                                  onClick={() => handleMoveHabit(rIdx, -1)}
                                  className="text-[9px] text-[var(--mut)] hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer leading-none p-0.5"
                                  title="Move Up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={rIdx === habits.length - 1}
                                  onClick={() => handleMoveHabit(rIdx, 1)}
                                  className="text-[9px] text-[var(--mut)] hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer leading-none p-0.5"
                                  title="Move Down"
                                >
                                  ▼
                                </button>
                              </div>

                              <span className="text-base flex-shrink-0">{habit.icon || '💧'}</span>
                              <span className="truncate text-xs sm:text-[13px] font-semibold">{habit.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-70 hover:opacity-100 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditForm(habit)}
                                className="p-1 rounded text-xs text-[var(--mut)] hover:text-[var(--ink)] cursor-pointer"
                                title="Edit"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHabit(habit.id)}
                                className="p-1 rounded text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                                title="Delete"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Interactive 1-31 Checkbox Cells */}
                        {monthDays.map((d) => {
                          const isDone = !!history[d.dateKey];

                          return (
                            <td
                              key={d.dayNum}
                              className={`p-1 text-center border-r border-[var(--line)]/40 min-w-[34px] sm:min-w-[38px] ${
                                d.isToday ? 'bg-teal-500/10' : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleDay(habit, d.dateKey)}
                                className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-500 border border-emerald-400 text-white shadow-md hover:scale-105 hover:brightness-110'
                                    : 'border border-[var(--line)] bg-[var(--surf)] hover:border-emerald-400/60 hover:bg-[var(--surf2)]'
                                }`}
                                title={`${habit.name} on ${d.dateKey}: ${isDone ? 'Completed ✓ (click to uncheck)' : 'Click to check off'}`}
                              >
                                {isDone ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })}

                        {/* Monthly Goal Target Column */}
                        <td className="p-2 text-center bg-[var(--surf2)]/40 border-l border-[var(--line)] min-w-[100px]">
                          <div className="flex flex-col items-center">
                            <span
                              className="font-bold text-xs"
                              style={{ color: isGoalAchieved ? '#10b981' : habit.color || '#f0b25a' }}
                            >
                              {completedDays} / {target}
                            </span>
                            <span className="text-[10px] text-[var(--mut)]">
                              {progressPct}%
                            </span>
                            {isGoalAchieved && (
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">
                                🌟 Met!
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Footer Row */}
                  <tr className="bg-[var(--surf2)]/70 text-[var(--ink)] font-semibold border-t border-[var(--line)]">
                    <td className="sticky left-0 z-10 bg-[var(--surf2)] p-2.5 text-left border-r border-[var(--line)] shadow-[2px_0_6px_rgba(0,0,0,0.12)] text-xs text-[var(--mut)]">
                      Total Tasks Done
                    </td>
                    {monthDays.map((d) => {
                      const completedCountOnDay = habits.filter(
                        (h) => h.history && h.history[d.dateKey]
                      ).length;

                      return (
                        <td
                          key={d.dayNum}
                          className={`p-1.5 text-center text-xs font-bold border-r border-[var(--line)]/40 min-w-[34px] sm:min-w-[38px] ${
                            d.isToday ? 'bg-teal-500/20 text-teal-300' : ''
                          }`}
                        >
                          <span
                            className={
                              completedCountOnDay > 0
                                ? 'text-emerald-400 font-extrabold'
                                : 'text-[var(--mut)] opacity-40 font-normal'
                            }
                          >
                            {completedCountOnDay > 0 ? completedCountOnDay : '-'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center bg-[var(--surf2)] text-xs font-bold text-emerald-400 min-w-[100px]">
                      {monthStats.goalsMet} Goals
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[var(--line)] bg-[var(--surf)] flex items-center justify-between text-xs text-[var(--mut)] flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs text-[var(--mut)]">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md bg-emerald-500 inline-flex items-center justify-center text-white text-[10px] font-bold">✓</span>
              <span className="text-[var(--ink)] font-medium">Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-md border border-[var(--line)] bg-[var(--surf)] inline-block"></span>
              <span>Tap any day to toggle</span>
            </span>
          </div>

          {/* Quick Horizontal Scroll Navigator */}
          <div className="flex items-center gap-1.5 bg-[var(--surf2)] p-1 rounded-xl border border-[var(--line)]">
            <span className="text-[10px] font-semibold text-[var(--mut)] px-2">Scroll:</span>
            <button
              type="button"
              onClick={scrollToStart}
              className="px-2.5 py-1 rounded-lg bg-[var(--surf)] hover:bg-[var(--line)] text-[var(--ink)] text-xs font-medium cursor-pointer transition-colors"
              title="Scroll to beginning of month (Days 1–15)"
            >
              ◀ Days 1–15
            </button>
            <button
              type="button"
              onClick={scrollToToday}
              className="px-2.5 py-1 rounded-lg bg-[var(--lamp)]/20 hover:bg-[var(--lamp)]/30 text-[var(--lamp)] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
              title="Scroll to today"
            >
              <span>Today ({now.getDate()})</span>
            </button>
            <button
              type="button"
              onClick={scrollToEnd}
              className="px-2.5 py-1 rounded-lg bg-[var(--surf)] hover:bg-[var(--line)] text-[var(--ink)] text-xs font-medium cursor-pointer transition-colors"
              title="Scroll to end of month (Days 16–31)"
            >
              Days 16–31 ▶
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[var(--surf2)] hover:bg-[var(--line)] text-xs font-semibold text-[var(--ink)] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Habit Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surf)] border border-[var(--line)] text-[var(--ink)] rounded-[24px] p-6 w-full max-w-md shadow-2xl">
            <h3 className="serif text-xl font-normal mb-1">
              {editingHabitId ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <p className="text-xs text-[var(--mut)] mb-4">
              Add a habit to your spreadsheet matrix and set a monthly target goal.
            </p>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--mut)] mb-1">Habit Title</label>
                <input
                  type="text"
                  placeholder="e.g. Wake up at 7 AM, Read 20 mins, Drink 2L Water..."
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
                  <span className="text-xs text-[var(--mut)]">Custom emoji:</span>
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
                  Aiming to complete this habit on <strong>{formMonthlyTarget}</strong> of {daysInCurrentMonth} days in {monthName}.
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
