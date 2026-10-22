import React, { useState } from 'react';
import { generateStudyPlan } from '../utils/aiCurriculum';
import { playSfx } from '../utils/audio';

export default function AIStudyModal({
  isOpen,
  onClose,
  activePlan,
  onSavePlan,
  onStartFocusSession,
  showToast
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState(activePlan ? 'plan' : 'create'); // 'create' | 'plan'

  // Creation form state
  const [subject, setSubject] = useState('');
  const [scopeType, setScopeType] = useState('all'); // 'all' | 'topic'
  const [specificTopic, setSpecificTopic] = useState('');
  const [targetDays, setTargetDays] = useState(7);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [userNotes, setUserNotes] = useState('');
  const [generationStep, setGenerationStep] = useState(0);

  // Active plan inspection state
  const [selectedDayIdx, setSelectedDayIdx] = useState(
    activePlan ? Math.max(0, (activePlan.currentDayNumber || 1) - 1) : 0
  );
  const [revealedSolutions, setRevealedSolutions] = useState({});
  const [revealedHints, setRevealedHints] = useState({});

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!subject.trim()) {
      if (showToast) showToast('Please enter a subject name to generate a blueprint.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    setTimeout(() => setGenerationStep(2), 500);
    setTimeout(() => setGenerationStep(3), 1000);

    setTimeout(() => {
      const newPlan = generateStudyPlan({
        subject,
        scopeType,
        specificTopic,
        targetDays,
        hoursPerDay,
        userNotes
      });

      onSavePlan(newPlan);
      setIsGenerating(false);
      setViewMode('plan');
      setSelectedDayIdx(0);
      playSfx('celebrate');
      if (showToast) showToast(`✨ Generated ${targetDays}-day AI Study Blueprint for ${newPlan.subject}!`);
    }, 1500);
  };

  const handleToggleTask = (dayIdx, taskId) => {
    if (!activePlan) return;
    playSfx('check');

    const updatedDays = activePlan.days.map((day, dIdx) => {
      if (dIdx !== dayIdx) return day;
      const updatedTasks = day.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      const allTasksDone = updatedTasks.every((t) => t.completed);
      return {
        ...day,
        completed: allTasksDone,
        tasks: updatedTasks
      };
    });

    onSavePlan({
      ...activePlan,
      days: updatedDays
    });
  };

  const handleStartSessionForDay = (day) => {
    if (onStartFocusSession) {
      onStartFocusSession({
        subjectName: activePlan.subject,
        allottedMinutes: day.allottedMinutes
      });
      onClose();
    }
  };

  const toggleSolution = (qId) => {
    setRevealedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const toggleHint = (qId) => {
    setRevealedHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const currentDayData = activePlan?.days?.[selectedDayIdx];

  // Calculate overall completion %
  const totalTasks = activePlan?.days?.reduce((acc, d) => acc + d.tasks.length, 0) || 1;
  const completedTasks =
    activePlan?.days?.reduce((acc, d) => acc + d.tasks.filter((t) => t.completed).length, 0) || 0;
  const completionPct = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[var(--surf)] border border-[var(--line)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[var(--ink)] my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surf2)]/40 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg shadow-xs">
              🤖
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="serif text-base sm:text-lg font-semibold leading-tight text-[var(--ink)]">
                  AI Study Architect & Syllabus Pacer
                </h3>
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  Active Recall
                </span>
              </div>
              <p className="text-[11px] text-[var(--mut)]">Paces your curriculum into realistic daily hours with practice</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activePlan && viewMode === 'plan' && (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode('create')}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surf2)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] cursor-pointer transition-all"
                >
                  + New Blueprint
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this active study blueprint?')) {
                      onSavePlan(null);
                      setViewMode('create');
                      if (showToast) showToast('AI Study Blueprint removed');
                    }
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Delete current study plan"
                >
                  Delete
                </button>
              </>
            )}
            {activePlan && viewMode === 'create' && (
              <button
                type="button"
                onClick={() => setViewMode('plan')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 cursor-pointer transition-all"
              >
                View Active Plan
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--surf2)] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {viewMode === 'create' ? (
            /* =================== CREATION WIZARD =================== */
            <div className="flex flex-col gap-5">
              {/* Step 1: Subject Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mut)] mb-1.5">
                  1. What subject are you mastering?
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms, Organic Chemistry, Indian Polity..."
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--surf2)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--lamp)] transition-all shadow-inner"
                />

                {/* Quick Subject Suggestions Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                  <span className="text-[11px] text-[var(--mut)]">Popular:</span>
                  {['Computer Science', 'Organic Chem', 'Calculus', 'History & Polity', 'Machine Learning'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      className="px-2.5 py-0.5 rounded-lg bg-[var(--surf2)]/70 hover:bg-[var(--surf2)] text-[11px] text-[var(--mut)] hover:text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Scope (Complete vs Specific Topic) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mut)] mb-1.5">
                  2. Learning Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScopeType('all')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      scopeType === 'all'
                        ? 'border-[var(--lamp)] bg-[var(--lamp)]/10 text-[var(--ink)] font-bold shadow-sm'
                        : 'border-[var(--line)] bg-[var(--surf2)]/50 text-[var(--mut)] hover:border-[var(--line)]'
                    }`}
                  >
                    <span className="text-base block mb-0.5">📚 Full Syllabus</span>
                    <span className="text-[11px] font-normal opacity-80 block">Cover the entire foundation from A to Z</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeType('topic')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      scopeType === 'topic'
                        ? 'border-[var(--lamp)] bg-[var(--lamp)]/10 text-[var(--ink)] font-bold shadow-sm'
                        : 'border-[var(--line)] bg-[var(--surf2)]/50 text-[var(--mut)] hover:border-[var(--line)]'
                    }`}
                  >
                    <span className="text-base block mb-0.5">🎯 Specific Topic</span>
                    <span className="text-[11px] font-normal opacity-80 block">Focus laser-sharp on one tricky chapter</span>
                  </button>
                </div>

                {scopeType === 'topic' && (
                  <input
                    type="text"
                    value={specificTopic}
                    onChange={(e) => setSpecificTopic(e.target.value)}
                    placeholder="Enter specific topic (e.g. Dynamic Programming, Electromagnetism, Cell Division...)"
                    className="w-full px-4 py-2.5 mt-2.5 rounded-xl bg-[var(--surf2)] border border-[var(--line)] text-xs text-[var(--ink)] outline-none focus:border-[var(--lamp)] transition-all animate-fade-in"
                  />
                )}
              </div>

              {/* Step 3 & 4: Days Target & Daily Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Days */}
                <div className="p-4 rounded-2xl bg-[var(--surf2)]/50 border border-[var(--line)]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--mut)]">
                      3. Target Days
                    </label>
                    <span className="text-sm font-bold text-[var(--lamp)]">{targetDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    value={targetDays}
                    onChange={(e) => setTargetDays(parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--lamp)] cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--mut)] mt-1">
                    <span>3d (Sprint)</span>
                    <span>14d (Standard)</span>
                    <span>30d (Mastery)</span>
                  </div>
                </div>

                {/* Daily Hours with Custom Option */}
                <div className="p-4 rounded-2xl bg-[var(--surf2)]/50 border border-[var(--line)]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--mut)]">
                      4. Hours / Day
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.25"
                        max="18"
                        step="0.5"
                        value={hoursPerDay}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setHoursPerDay(Math.max(0.25, Math.min(18, val)));
                        }}
                        className="w-16 px-2 py-0.5 rounded-lg bg-[var(--surf)] border border-[var(--line)] text-xs font-bold text-[var(--lamp)] text-center outline-none focus:border-[var(--lamp)]"
                      />
                      <span className="text-xs font-bold text-[var(--lamp)]">h daily</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="14"
                    step="0.5"
                    value={Math.min(14, hoursPerDay)}
                    onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                    className="w-full accent-[var(--lamp)] cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--mut)] mt-1">
                    <span>30 min</span>
                    <span>4 hours</span>
                    <span>8 hours</span>
                    <span>14 hours</span>
                  </div>

                  {/* Preset quick chips */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <span className="text-[10px] text-[var(--mut)]">Presets:</span>
                    {[1, 2, 3, 4, 6, 8, 10, 12].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHoursPerDay(h)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer transition-all ${
                          hoursPerDay === h
                            ? 'bg-[var(--lamp)] text-[#1b1730] border-[var(--lamp)]'
                            : 'bg-[var(--surf)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--lamp)]'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 5: Optional Notes / Syllabus Outline */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--mut)] mb-1.5">
                  5. Have notes, lecture topics, or syllabus text? <span className="text-[10px] lowercase font-normal opacity-70">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Paste lecture topics, bullet points, textbook table of contents, or syllabus chapters here. The AI will parse and distribute them across your target days!"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surf2)] border border-[var(--line)] text-xs text-[var(--ink)] outline-none focus:border-[var(--lamp)] transition-all resize-none shadow-inner"
                />
              </div>

              {/* Generate Button with Animation */}
              <button
                type="button"
                disabled={isGenerating || !subject.trim()}
                onClick={handleGenerate}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-500 via-indigo-500 to-[var(--lamp)] text-white hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>
                      {generationStep === 1
                        ? 'Deconstructing syllabus & prerequisites...'
                        : generationStep === 2
                        ? 'Calibrating daily cognitive load & timing...'
                        : 'Formulating active recall practice questions...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Generate AI Study Blueprint ({targetDays * hoursPerDay} Total Hours)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* =================== ACTIVE PLAN VIEWER =================== */
            <div className="flex flex-col gap-4">
              {/* Blueprint Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-[var(--surf2)] to-amber-500/10 border border-[var(--line)]">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400 block">
                      Active AI Blueprint
                    </span>
                    <h4 className="serif text-xl font-semibold text-[var(--ink)]">
                      {activePlan.subject}
                    </h4>
                    <span className="text-xs text-[var(--mut)]">
                      Scope: <b className="text-[var(--ink)]">{activePlan.topic}</b> · {activePlan.targetDays} Days · {activePlan.hoursPerDay}h/day ({activePlan.totalTargetHours}h Total)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-extrabold text-[var(--lamp)] block">
                      {completionPct}%
                    </span>
                    <span className="text-[10px] text-[var(--mut)]">
                      {completedTasks}/{totalTasks} tasks done
                    </span>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[var(--surf)] border border-[var(--line)] overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-[var(--lamp)] transition-all duration-500 shadow-sm"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              {/* Day Selector Navigation Pills */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mut)] block mb-1.5">
                  Select Day Roadmap:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {activePlan.days.map((day, idx) => {
                    const isSelected = selectedDayIdx === idx;
                    const isDone = day.completed;
                    return (
                      <button
                        key={day.dayNumber}
                        type="button"
                        onClick={() => setSelectedDayIdx(idx)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105'
                            : isDone
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-[var(--surf2)] border-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <span>{isDone ? '✓' : `Day ${day.dayNumber}`}</span>
                        {isDone && <span className="text-[10px]">Done</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day View */}
              {currentDayData && (
                <div className="p-4 rounded-2xl bg-[var(--surf2)]/60 border border-[var(--line)] flex flex-col gap-4 animate-fade-in">
                  {/* Day Banner */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[var(--line)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                          Day {currentDayData.dayNumber} of {activePlan.targetDays}
                        </span>
                        <span className="text-xs font-semibold text-[var(--ink)]">
                          {currentDayData.theme}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--lamp)]">
                      ⏱️ {currentDayData.allottedHours}h target ({currentDayData.allottedMinutes}m)
                    </span>
                  </div>

                  {/* Section A: Daily Tasks Checklist */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--mut)] mb-2 flex items-center gap-1.5">
                      <span>📋 Today's Guided Checklist:</span>
                    </h5>
                    <div className="flex flex-col gap-2">
                      {currentDayData.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(selectedDayIdx, task.id)}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all select-none ${
                            task.completed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-[var(--surf)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--lamp)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}}
                            className="mt-0.5 accent-emerald-500 cursor-pointer w-4 h-4 rounded"
                          />
                          <div className="flex-1">
                            <span className={`text-xs block leading-relaxed ${task.completed ? 'line-through opacity-75' : 'font-medium'}`}>
                              {task.title}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surf2)] border border-[var(--line)] text-[var(--mut)] flex-shrink-0">
                            ~{task.durationMin}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section B: Daily Practice & Active Recall Questions */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--mut)] mb-2 flex items-center gap-1.5">
                      <span>🧠 Practice Challenge Questions:</span>
                    </h5>
                    <div className="flex flex-col gap-2.5">
                      {currentDayData.questions.map((q, qIdx) => {
                        const isSolOpen = revealedSolutions[q.id];
                        const isHintOpen = revealedHints[q.id];
                        return (
                          <div key={q.id} className="p-3 rounded-xl bg-[var(--surf)] border border-[var(--line)] text-xs">
                            <div className="flex items-start gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                Q{qIdx + 1}
                              </span>
                              <p className="font-semibold text-[var(--ink)] leading-relaxed flex-1">
                                {q.prompt}
                              </p>
                            </div>

                            {/* Hint & Solution Toggles */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--line)]/50">
                              <button
                                type="button"
                                onClick={() => toggleHint(q.id)}
                                className="text-[10px] text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>💡</span>
                                <span>{isHintOpen ? 'Hide Hint' : 'View Hint'}</span>
                              </button>
                              <span className="text-[var(--line)]">·</span>
                              <button
                                type="button"
                                onClick={() => toggleSolution(q.id)}
                                className="text-[10px] text-purple-300 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>👁️</span>
                                <span>{isSolOpen ? 'Hide Explanation' : 'Reveal Solution'}</span>
                              </button>
                            </div>

                            {isHintOpen && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed animate-fade-in">
                                <b>Hint:</b> {q.hint}
                              </div>
                            )}

                            {isSolOpen && (
                              <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200 text-[11px] leading-relaxed animate-fade-in">
                                <b>Solution / Key Takeaway:</b> {q.solution}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Launch Timer Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleStartSessionForDay(currentDayData)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-[var(--lamp)] text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <span>⏱️</span>
                      <span>Start Focus Session ({currentDayData.allottedHours}h)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
