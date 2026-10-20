import React, { useState, useEffect, useRef } from 'react';
import TimerOverlay from './TimerOverlay';
import StairsOverlay from './StairsOverlay';
import EveningRitualModal from './EveningRitualModal';
import ManualEntryModal from './ManualEntryModal';
import ScrapbookModal from './ScrapbookModal';
import DayGoalModal from './DayGoalModal';
import { playSfx } from '../utils/audio';
import { DEFAULT_TAGS, getCurrentUser } from '../utils/api';

const SCENES = [
  { name: 'Pine dusk', key: 'pine', palette: ['#3a2f7a', '#e58f6a', '#f6c978', '#fde7a3', '#6b5aa8', '#43397e', '#231c4f', '#1c1640'] },
  { name: 'Sea at dawn', key: 'sea', palette: ['#2d4a7a', '#e8a0a0', '#ffd9a8', '#fff0c8', '#5e86b0', '#3e648f', '#2b4a70', '#1f3856'] },
  { name: 'Desert dunes', key: 'dune', palette: ['#7a3d5c', '#e0795a', '#f4b86a', '#ffe0a0', '#c46a4a', '#9c4a3c', '#6e3132', '#4d2328'] },
  { name: 'Alpine night', key: 'peak', palette: ['#0f1b3d', '#2f4a8a', '#7f9fd0', '#e8eefc', '#40588f', '#2a3d6d', '#18254a', '#101a36'] },
  { name: 'Spring meadow', key: 'pine', palette: ['#3d6a8a', '#9fcfa8', '#f4e9a0', '#fffbd0', '#6fa070', '#4d8058', '#2f5a3a', '#234530'] },
  { name: 'Autumn ridge', key: 'peak', palette: ['#5a2d3d', '#d9733f', '#f2b35c', '#ffe3a6', '#a65a3a', '#7d3f32', '#4f2a2a', '#33201f'] }
];

export default function Phase3Dashboard({ state, onUpdateState, onLogout }) {
  const [now, setNow] = useState(new Date());
  const currentUser = getCurrentUser();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const todayIso = now.toISOString().slice(0, 10);
  const currentMonthKey = todayIso.slice(0, 7);

  // Subject Tags state
  const tags = state.tags || DEFAULT_TAGS;
  const [selectedTag, setSelectedTag] = useState(tags[0] || DEFAULT_TAGS[0]);

  // Mascot interaction
  const [petHop, setPetHop] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handlePokeDiano = () => {
    setPetHop(true);
    setTimeout(() => setPetHop(false), 700);
    showToast(isPetAwake ? 'Diano waves back' : 'Shh, Diano is resting');
  };

  // Timer state
  const [timerMode, setTimerMode] = useState('open'); // 'open' | 'strict' | 'pomo25' | 'pomo50' | 'pact5'
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showStrictWarning, setShowStrictWarning] = useState(false);
  const [showStairsModal, setShowStairsModal] = useState(false);
  const [lastSessionSec, setLastSessionSec] = useState(0);

  // Distraction Parking Lot for active session
  const [sessionDistractions, setSessionDistractions] = useState([]);

  const timerRef = useRef({ last: 0, interval: null });

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showScrapbookModal, setShowScrapbookModal] = useState(false);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoalDate, setSelectedGoalDate] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [chartView, setChartView] = useState('total'); // 'total' | 'subjects'

  // Goal calculations
  const defaultGoal = state.goal || 2;
  const goalForDate = (date) => (state.dayGoals && state.dayGoals[date] != null ? state.dayGoals[date] : defaultGoal);
  const todayGoal = goalForDate(todayIso);
  const todayGoalSec = todayGoal * 3600;

  // Study seconds for date
  const secOnDate = (date) => (state.sessions || []).filter((s) => s.date === date).reduce((acc, s) => acc + s.sec, 0);
  const todaySec = secOnDate(todayIso);
  const progressPct = Math.min(1, todaySec / todayGoalSec);
  const ringOffset = 678.6 * (1 - progressPct);

  const isPetAwake = timerRunning || progressPct >= 1;

  // -------------------------------------------------------------
  // Anti-Derailment Streak Shield (Mending Mode) Calculation
  // -------------------------------------------------------------
  let rawStreak = 0;
  let isShieldActive = false;
  const tempDate = new Date(now);

  // Check today
  const studiedToday = secOnDate(tempDate.toISOString().slice(0, 10)) >= 300;
  if (!studiedToday) {
    tempDate.setDate(tempDate.getDate() - 1);
  }

  // Count streak backwards
  while (secOnDate(tempDate.toISOString().slice(0, 10)) >= 300) {
    rawStreak++;
    tempDate.setDate(tempDate.getDate() - 1);
  }

  // If streak broke yesterday, check if day before yesterday had a streak
  if (rawStreak === 0 && !studiedToday) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(now);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    if (secOnDate(dayBeforeYesterday.toISOString().slice(0, 10)) >= 300) {
      // Calculate past streak before the missed day
      let pastStreak = 0;
      const testD = new Date(dayBeforeYesterday);
      while (secOnDate(testD.toISOString().slice(0, 10)) >= 300) {
        pastStreak++;
        testD.setDate(testD.getDate() - 1);
      }
      if (pastStreak > 0) {
        rawStreak = pastStreak;
        isShieldActive = true;
      }
    }
  }

  // Timer tick
  useEffect(() => {
    if (timerRunning && !timerPaused) {
      timerRef.current.interval = setInterval(() => {
        const delta = (performance.now() - timerRef.current.last) / 1000;
        timerRef.current.last = performance.now();
        setTimerSec((prev) => prev + delta);
      }, 250);
    } else {
      clearInterval(timerRef.current.interval);
    }
    return () => clearInterval(timerRef.current.interval);
  }, [timerRunning, timerPaused]);

  // Strict mode visibility check
  useEffect(() => {
    const handleVisChange = () => {
      if (document.hidden && timerRunning && !timerPaused && timerMode === 'strict') {
        setTimerPaused(true);
        setShowStrictWarning(true);
      } else if (!document.hidden) {
        timerRef.current.last = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, [timerRunning, timerPaused, timerMode]);

  const startTimer = (overrideMode = null) => {
    playSfx('start', state.mute);
    if (overrideMode) setTimerMode(overrideMode);
    setTimerSec(0);
    setTimerPaused(false);
    setSessionDistractions([]);
    timerRef.current.last = performance.now();
    setTimerRunning(true);
    setShowTimerModal(true);
  };

  const endTimer = (verifiedSeconds) => {
    playSfx('end', state.mute);
    setTimerRunning(false);
    setShowTimerModal(false);

    const s = Math.floor(verifiedSeconds);
    setLastSessionSec(s);

    if (s > 0) {
      const newSession = {
        id: 't' + Date.now(),
        date: todayIso,
        sec: s,
        type: 'timed',
        tag: selectedTag.name,
        color: selectedTag.color,
        note: `${selectedTag.name} focus session`
      };
      onUpdateState({
        ...state,
        sessions: [...(state.sessions || []), newSession]
      });
      showToast(`${Math.max(1, Math.round(s / 60))}m logged for ${selectedTag.name}`);
    }

    setShowStairsModal(true);
  };

  // Add a parked distraction
  const handleAddDistraction = (thought) => {
    setSessionDistractions((prev) => [...prev, thought]);
  };

  // Theme toggle
  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.dataset.theme !== 'light';
    root.dataset.theme = isDark ? 'light' : 'dark';
    showToast(isDark ? 'Light theme active' : 'Dark theme active');
  };

  // Mute toggle
  const toggleMute = () => {
    const nextMute = !state.mute;
    onUpdateState({ ...state, mute: nextMute });
    if (!nextMute) playSfx('beep', false);
    showToast(nextMute ? 'Sounds off' : 'Sounds on');
  };

  // Monthly Mist Calculation
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let studyDaysCount = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    if (secOnDate(dStr) >= 300) studyDaysCount++;
  }
  const mistClearPct = studyDaysCount / daysInMonth;
  const mistBlur = (16 * (1 - mistClearPct)).toFixed(1);
  const mistOpacity = (1 - mistClearPct).toFixed(2);

  const selectedSceneIdx = state.scene && state.scene[currentMonthKey] != null ? state.scene[currentMonthKey] : month % SCENES.length;
  const currentScene = SCENES[selectedSceneIdx % SCENES.length];
  const userPhoto = state.photo && state.photo[currentMonthKey];

  const handleSceneChange = (idx) => {
    if (userPhoto) return;
    onUpdateState({
      ...state,
      scene: { ...(state.scene || {}), [currentMonthKey]: parseInt(idx) }
    });
    showToast('Scene changed');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateState({
        ...state,
        photo: { ...(state.photo || {}), [currentMonthKey]: reader.result }
      });
      showToast('Photo set. Mist clears as you study.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    const updated = { ...(state.photo || {}) };
    delete updated[currentMonthKey];
    onUpdateState({ ...state, photo: updated });
    showToast('Photo removed');
  };

  const handleKeepMonth = () => {
    const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const note = prompt('Add a note to remember this month by:', 'Every quiet session cleared a little fog.');
    if (note === null) return;

    const newScrap = [...(state.scrap || [])];
    const existingIdx = newScrap.findIndex((x) => x.label === label);
    const entry = {
      label,
      days: studyDaysCount,
      dim: daysInMonth,
      sc: selectedSceneIdx,
      ph: userPhoto || null,
      note: note || 'Consistent effort, day by day.'
    };

    if (existingIdx >= 0) newScrap[existingIdx] = entry;
    else newScrap.unshift(entry);

    onUpdateState({ ...state, scrap: newScrap });
    setShowScrapbookModal(true);
    showToast('Month kept');
  };

  // Weekly focus statistics & Subject Breakdown
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7 * weekOffset);

  let weekTotalSec = 0;
  let weekTimedSec = 0;
  let weekManualSec = 0;
  let weekSessionsCount = 0;
  const weekDays = [];
  const subjectTotals = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dIso = d.toISOString().slice(0, 10);
    const dSessions = (state.sessions || []).filter((s) => s.date === dIso);
    const dSec = dSessions.reduce((acc, s) => acc + s.sec, 0);

    weekTotalSec += dSec;
    const dayTagBreakdown = {};

    dSessions.forEach((s) => {
      weekSessionsCount++;
      if (s.type === 'manual') weekManualSec += s.sec;
      else weekTimedSec += s.sec;

      const tagName = s.tag || 'General';
      const tagColor = s.color || '#94a3b8';

      subjectTotals[tagName] = (subjectTotals[tagName] || 0) + s.sec;
      dayTagBreakdown[tagName] = {
        sec: (dayTagBreakdown[tagName]?.sec || 0) + s.sec,
        color: tagColor
      };
    });

    weekDays.push({
      dateIso: dIso,
      hours: dSec / 3600,
      isToday: dIso === todayIso,
      label: 'MTWTFSS'[i],
      goal: goalForDate(dIso),
      tags: dayTagBreakdown
    });
  }

  // Backup Data Export / Import
  const handleExportBackup = () => {
    const backupJson = JSON.stringify(
      {
        app: 'consistracker',
        version: 4,
        exported: new Date().toISOString(),
        user: currentUser.username,
        state
      },
      null,
      2
    );

    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consistracker-${currentUser.username}-${todayIso}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup saved');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.app === 'consistracker' && parsed.state) {
          onUpdateState({ ...state, ...parsed.state });
          showToast('Backup restored successfully');
        } else {
          showToast('Invalid backup file');
        }
      } catch (err) {
        showToast('Could not read backup file');
      }
    };
    reader.readAsText(file);
  };

  const fmtMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-6 pb-20 text-[var(--ink)]">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-[var(--ink)] text-[var(--bg)] font-medium text-sm shadow-2xl transition-all animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Header with User Profile */}
      <header className="flex justify-between items-center gap-4 pb-6 flex-wrap">
        <div>
          <div className="serif text-2xl sm:text-3xl font-semibold text-[var(--ink)]">
            Consistracker
            <small className="serif italic font-normal text-xs sm:text-sm text-[var(--mut)] block">
              a little progress, every day
            </small>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Active User Badge with Logout / Switch */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surf2)] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-[var(--ink)]">
              {currentUser.username}
            </span>
            <button
              type="button"
              onClick={onLogout}
              title="Switch user or log out"
              className="text-[var(--mut)] hover:text-[var(--warn)] ml-1 cursor-pointer font-medium"
            >
              (switch)
            </button>
          </div>

          <div className="hidden sm:block text-right text-xs text-[var(--mut)] ml-1">
            <b className="block text-[var(--ink)] font-semibold">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </b>
            <span>
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowScrapbookModal(true)}
            title="Scrapbook"
            className="w-10 h-10 rounded-full border border-[var(--line)] bg-transparent hover:border-[var(--lamp)] flex items-center justify-center text-lg transition-colors cursor-pointer"
          >
            📖
          </button>
          <button
            type="button"
            onClick={toggleMute}
            title={state.mute ? 'Unmute sounds' : 'Mute sounds'}
            className="w-10 h-10 rounded-full border border-[var(--line)] bg-transparent hover:border-[var(--lamp)] flex items-center justify-center text-lg transition-colors cursor-pointer"
          >
            {state.mute ? '🔕' : '🔔'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            title="Switch light or dark"
            className="w-10 h-10 rounded-full border border-[var(--line)] bg-transparent hover:border-[var(--lamp)] flex items-center justify-center text-lg transition-colors cursor-pointer"
          >
            ◐
          </button>
        </div>
      </header>

      {/* Main Grid: Hero + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-5">
        {/* Hero Section */}
        <section className="relative rounded-[26px] border border-[var(--line)] bg-[var(--surf)] p-6 sm:p-7 flex flex-col items-center text-center overflow-hidden bg-[radial-gradient(70%_60%_at_50%_38%,rgba(240,178,90,0.16),transparent_70%)]">
          {/* Diano Mascot */}
          <div className="relative mb-2">
            <svg
              onClick={handlePokeDiano}
              role="img"
              aria-label="Diano"
              className={`w-20 h-20 cursor-pointer transition-transform ${
                petHop ? 'pet-hop' : isPetAwake ? 'pet-glad' : ''
              }`}
            >
              <use href="#dn" />
            </svg>
            {!isPetAwake && (
              <span className="absolute top-1 left-20 serif italic text-sm text-[var(--mut)] pet-zz">
                z z
              </span>
            )}
          </div>

          <h2 className="serif text-xl sm:text-2xl font-normal text-[var(--ink)] mb-1">
            {progressPct >= 1 ? 'Goal reached' : todaySec > 0 ? 'Keep the lamp lit' : 'Ready when you are'}
          </h2>
          <p className="text-xs sm:text-[13.5px] text-[var(--mut)] mb-3">
            {progressPct >= 1
              ? 'Anything more is a bonus. Rest is allowed too.'
              : todaySec > 0
              ? `${Math.ceil((todayGoalSec - todaySec) / 60)} minutes to go.`
              : 'Tap the lamp to start a focus session.'}
          </p>

          {/* Subject / Category Tag Selector Pill Bar */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center mb-1 max-w-sm">
            {tags.map((t) => {
              const isSelected = selectedTag.id === t.id || selectedTag.name === t.name;
              return (
                <button
                  key={t.id || t.name}
                  type="button"
                  onClick={() => setSelectedTag(t)}
                  className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'font-bold shadow-md scale-105'
                      : 'bg-[var(--surf2)] opacity-70 hover:opacity-100 border-[var(--line)]'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${t.color}35`,
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

          {/* Circular Progress Ring Button */}
          <button
            type="button"
            onClick={() => startTimer()}
            aria-label="Start focus session"
            className="relative w-[min(260px,68vw)] aspect-square border-0 bg-transparent my-2 cursor-pointer group"
          >
            <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
              <circle cx="120" cy="120" r="108" fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle
                cx="120"
                cy="120"
                r="108"
                fill="none"
                stroke="var(--lamp)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="678.6"
                strokeDashoffset={ringOffset}
                className="transition-all duration-800 group-hover:drop-shadow-[0_0_12px_var(--lamp)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="serif text-4xl sm:text-5xl font-normal tabular-nums leading-none">
                {fmtMinSec(todaySec)}
              </span>
              <span className="text-xs text-[var(--mut)] mt-1">of {todayGoal}h today</span>
              <span className="text-xs font-semibold text-[var(--lamp)] mt-2 flex items-center gap-1">
                Start {selectedTag.name} session
              </span>
            </div>
          </button>

          {/* Quick "5-Minute Pact" Trigger (Anti-Procrastination / Break Starting Inertia) */}
          <button
            type="button"
            onClick={() => startTimer('pact5')}
            className="mb-3 px-4 py-1.5 rounded-full text-xs font-semibold border border-amber-400/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>⚡</span>
            <span>Overcome Friction: The 5-Minute Pact</span>
          </button>

          {/* Mode Selector (Flexible, Strict, Pomodoro 25/5, Deep Work 50/10) */}
          <div className="inline-flex border border-[var(--line)] rounded-full p-1 mt-1 flex-wrap justify-center gap-1">
            <button
              type="button"
              onClick={() => setTimerMode('open')}
              className={`border-0 py-1 px-3 rounded-full text-xs transition-colors cursor-pointer ${
                timerMode === 'open' ? 'bg-[var(--lamp)] text-[#1b1730] font-semibold' : 'text-[var(--mut)]'
              }`}
            >
              Flexible
            </button>
            <button
              type="button"
              onClick={() => setTimerMode('strict')}
              className={`border-0 py-1 px-3 rounded-full text-xs transition-colors cursor-pointer ${
                timerMode === 'strict' ? 'bg-[var(--lamp)] text-[#1b1730] font-semibold' : 'text-[var(--mut)]'
              }`}
            >
              Strict
            </button>
            <button
              type="button"
              onClick={() => setTimerMode('pomo25')}
              className={`border-0 py-1 px-3 rounded-full text-xs transition-colors cursor-pointer ${
                timerMode === 'pomo25' ? 'bg-[var(--lamp)] text-[#1b1730] font-semibold' : 'text-[var(--mut)]'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              type="button"
              onClick={() => setTimerMode('pomo50')}
              className={`border-0 py-1 px-3 rounded-full text-xs transition-colors cursor-pointer ${
                timerMode === 'pomo50' ? 'bg-[var(--lamp)] text-[#1b1730] font-semibold' : 'text-[var(--mut)]'
              }`}
            >
              Deep Work (50m)
            </button>
          </div>

          <p className="text-xs text-[var(--mut)] min-h-[20px] mt-2">
            {timerMode === 'strict'
              ? 'Leaving this tab pauses the timer until you come back.'
              : timerMode === 'pomo25'
              ? '25-minute focused sprint followed by a 5-minute break.'
              : timerMode === 'pomo50'
              ? '50-minute deep immersion followed by a 10-minute break.'
              : 'Pause whenever you need. Paused time is never counted.'}
          </p>

          {/* Goal row */}
          <div className="flex gap-2.5 items-center justify-center mt-2 text-xs sm:text-sm text-[var(--mut)]">
            <span>Daily goal</span>
            <select
              value={defaultGoal}
              onChange={(e) => onUpdateState({ ...state, goal: parseFloat(e.target.value) })}
              className="bg-[var(--surf2)] border border-[var(--line)] rounded-xl py-1 px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--lamp)] cursor-pointer"
            >
              <option value="0.5">30 min</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
            </select>
          </div>
        </section>

        {/* Stats Section with Anti-Derailment Streak Shield */}
        <section className="rounded-[26px] border border-[var(--line)] bg-[var(--surf)] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h2 className="serif text-xl sm:text-2xl font-normal text-[var(--ink)] mb-1">
              {weekOffset ? `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'This week'}
            </h2>
            <p className="text-xs text-[var(--mut)]">
              {(weekTimedSec / 3600).toFixed(1)}h timed, {(weekManualSec / 3600).toFixed(1)}h added manually
            </p>
          </div>

          <div className="flex flex-col divide-y divide-[var(--line)] my-auto">
            {/* Streak with Shield Status */}
            <div className="flex items-baseline justify-between py-4">
              <div>
                <span className="text-[13.5px] text-[var(--mut)] block">Current streak</span>
                {isShieldActive && (
                  <span className="text-[11px] text-amber-300 font-medium">
                    🛡️ Streak Shield Active (Study 20m today to save)
                  </span>
                )}
              </div>
              <b className="serif text-3xl sm:text-4xl font-normal text-[var(--ink)] flex items-center gap-1.5">
                {rawStreak} {rawStreak === 1 ? 'day' : 'days'}
                {isShieldActive && <span className="text-xl" title="Shield Active">🛡️</span>}
              </b>
            </div>

            <div className="flex items-baseline justify-between py-4">
              <span className="text-[13.5px] text-[var(--mut)]">Focus time</span>
              <b className="serif text-3xl sm:text-4xl font-normal text-[var(--ink)]">
                {(weekTotalSec / 3600).toFixed(1)}h
              </b>
            </div>
            <div className="flex items-baseline justify-between py-4">
              <span className="text-[13.5px] text-[var(--mut)]">Sessions logged</span>
              <b className="serif text-3xl sm:text-4xl font-normal text-[var(--ink)]">
                {weekSessionsCount}
              </b>
            </div>
          </div>
        </section>
      </div>

      {/* Study Journey & This Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* Weekly Chart with Subject Breakdown Toggle */}
        <section className="rounded-[26px] border border-[var(--line)] bg-[var(--surf)] p-6">
          <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
            <div>
              <h2 className="serif text-xl font-normal">Your study journey</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="inline-flex border border-[var(--line)] rounded-full p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setChartView('total')}
                  className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    chartView === 'total' ? 'bg-[var(--lamp)] text-[#1b1730] font-semibold' : 'text-[var(--mut)]'
                  }`}
                >
                  Total
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('subjects')}
                  className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    chartView === 'subjects' ? 'bg-[var(--lamp)] text-[#1b1730] font-semibold' : 'text-[var(--mut)]'
                  }`}
                >
                  Subjects
                </button>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="w-7 h-7 rounded-full border border-[var(--line)] bg-transparent hover:border-[var(--lamp)] flex items-center justify-center text-sm cursor-pointer"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={weekOffset === 0}
                  onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                  className="w-7 h-7 rounded-full border border-[var(--line)] bg-transparent hover:border-[var(--lamp)] disabled:opacity-30 flex items-center justify-center text-sm cursor-pointer"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--mut)] mb-3">
            {chartView === 'subjects'
              ? 'Color-coded breakdown by subject tags studied each day.'
              : 'Daily focus against your goal. The dashed line is today’s target.'}
          </p>

          {/* SVG Bar Chart */}
          <div className="w-full h-44">
            <svg viewBox="0 0 520 210" className="w-full h-full">
              {/* Target Line */}
              <line
                x1="8"
                x2="512"
                y1="70"
                y2="70"
                stroke="var(--lamp)"
                strokeDasharray="4 5"
                opacity="0.8"
              />
              {weekDays.map((d, i) => {
                const maxVal = 6;
                const x = 20 + i * 72;
                const totalBarHeight = Math.max(3, (d.hours / maxVal) * 130);

                if (chartView === 'subjects' && d.hours > 0) {
                  let currentBottom = 170;
                  const tagKeys = Object.keys(d.tags || {});

                  return (
                    <g key={i}>
                      {tagKeys.map((tName, tIdx) => {
                        const tagSec = d.tags[tName].sec;
                        const segHeight = Math.max(2, ((tagSec / 3600) / maxVal) * 130);
                        const y = currentBottom - segHeight;
                        currentBottom = y;
                        return (
                          <rect
                            key={tIdx}
                            x={x}
                            y={y}
                            width="44"
                            height={segHeight}
                            rx={tIdx === tagKeys.length - 1 ? 8 : 2}
                            fill={d.tags[tName].color}
                            opacity={d.isToday ? 1 : 0.85}
                          />
                        );
                      })}
                      <text
                        x={x + 22}
                        y={170 - totalBarHeight - 6}
                        textAnchor="middle"
                        fill="var(--mut)"
                        fontSize="12"
                      >
                        {d.hours.toFixed(1)}h
                      </text>
                      <text
                        x={x + 22}
                        y="194"
                        textAnchor="middle"
                        fill={d.isToday ? 'var(--ink)' : 'var(--mut)'}
                        fontWeight={d.isToday ? '600' : '400'}
                        fontSize="12"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                }

                // Default single color bar
                const isOverGoal = d.hours >= d.goal;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={170 - totalBarHeight}
                      width="44"
                      height={totalBarHeight}
                      rx="10"
                      fill={isOverGoal ? 'var(--lamp)' : 'var(--sage)'}
                      opacity={d.hours > 0 ? (d.isToday ? 1 : 0.75) : 0.25}
                    />
                    {d.hours > 0 && (
                      <text
                        x={x + 22}
                        y={170 - totalBarHeight - 6}
                        textAnchor="middle"
                        fill="var(--mut)"
                        fontSize="12"
                      >
                        {d.hours.toFixed(1)}h
                      </text>
                    )}
                    <text
                      x={x + 22}
                      y="194"
                      textAnchor="middle"
                      fill={d.isToday ? 'var(--ink)' : 'var(--mut)'}
                      fontWeight={d.isToday ? '600' : '400'}
                      fontSize="12"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Subject Distribution Breakdown Legend */}
          {chartView === 'subjects' && Object.keys(subjectTotals).length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--line)] flex gap-3 flex-wrap">
              {Object.keys(subjectTotals).map((tName) => {
                const sSec = subjectTotals[tName];
                const sHours = (sSec / 3600).toFixed(1);
                const pct = weekTotalSec > 0 ? Math.round((sSec / weekTotalSec) * 100) : 0;
                const tagObj = tags.find((t) => t.name === tName) || { color: '#94a3b8' };
                return (
                  <div key={tName} className="flex items-center gap-1.5 text-xs text-[var(--mut)]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tagObj.color }} />
                    <span className="text-[var(--ink)] font-medium">{tName}:</span>
                    <span>{sHours}h ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* This Month Calendar */}
        <section className="rounded-[26px] border border-[var(--line)] bg-[var(--surf)] p-6">
          <h2 className="serif text-xl font-normal mb-1">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-xs text-[var(--mut)] mb-4">
            {studyDaysCount} of {daysInMonth} days with at least 5 minutes. Tap a date to set a custom goal.
          </p>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const sSec = secOnDate(dIso);
              const dGoalSec = goalForDate(dIso) * 3600;
              const isToday = dIso === todayIso;

              const level = sSec >= dGoalSec ? 3 : sSec >= dGoalSec / 2 ? 2 : sSec >= 300 ? 1 : 0;
              const hasCustom = state.dayGoals && state.dayGoals[dIso] != null;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => {
                    setSelectedGoalDate(dIso);
                    setShowGoalModal(true);
                  }}
                  className={`aspect-square rounded-full border border-[var(--line)] flex items-center justify-center text-xs relative transition-all cursor-pointer ${
                    isToday ? 'ring-2 ring-[var(--ink)] ring-offset-1 ring-offset-[var(--surf)] font-bold' : ''
                  } ${
                    level === 3
                      ? 'bg-[var(--lamp)] text-[#1b1730] font-bold border-transparent'
                      : level === 2
                      ? 'bg-[color-mix(in_srgb,var(--lamp)_65%,transparent)] text-[#1b1730]'
                      : level === 1
                      ? 'bg-[color-mix(in_srgb,var(--lamp)_30%,transparent)] text-[var(--ink)]'
                      : 'text-[var(--mut)] hover:border-[var(--lamp)]'
                  }`}
                >
                  {dayNum}
                  {hasCustom && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current"></span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Action Buttons: Add Hours & Call It a Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <button
          type="button"
          onClick={() => setShowManualModal(true)}
          className="text-left rounded-3xl border border-[var(--line)] bg-[var(--surf)] p-5 hover:border-[var(--lamp)] transition-colors cursor-pointer group"
        >
          <b className="serif font-normal text-lg block text-[var(--ink)] mb-1 group-hover:text-[var(--lamp)] transition-colors">
            Add hours manually
          </b>
          <span className="text-xs sm:text-sm text-[var(--mut)]">
            Log study categorized by subjects away from the timer.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowRitualModal(true)}
          className="text-left rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--surf)] to-[color-mix(in_srgb,var(--lamp)_14%,var(--surf))] p-5 hover:border-[var(--lamp)] transition-colors cursor-pointer group"
        >
          <b className="serif font-normal text-lg block text-[var(--ink)] mb-1 group-hover:text-[var(--lamp)] transition-colors">
            Call it a day
          </b>
          <span className="text-xs sm:text-sm text-[var(--mut)]">
            Close the chapter. Diano will blow out the candle.
          </span>
        </button>
      </div>

      {/* The Monthly Mist */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--surf)] p-6 mt-6">
        <h2 className="serif text-xl font-normal mb-1">The monthly mist</h2>
        <p className="text-xs text-[var(--mut)] mb-4">
          Every day you study at least 5 minutes lifts a little more fog.
        </p>

        {/* Landscape Container */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/7] bg-[#2b2455]">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="Monthly scene"
              className="w-full h-full object-cover transition-all duration-1000"
              style={{ filter: `blur(${mistBlur}px)` }}
            />
          ) : (
            <svg
              viewBox="0 0 600 300"
              className="w-full h-full transition-all duration-1000"
              style={{ filter: `blur(${mistBlur}px)` }}
            >
              <defs>
                <linearGradient id="sc-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={currentScene.palette[0]} />
                  <stop offset="0.6" stopColor={currentScene.palette[1]} />
                  <stop offset="1" stopColor={currentScene.palette[2]} />
                </linearGradient>
              </defs>
              <rect width="600" height="300" fill="url(#sc-grad)" />
              <circle cx="410" cy="170" r="44" fill={currentScene.palette[3]} />
              <g fill="#fff" className="star-twinkle">
                <circle cx="60" cy="38" r="1.8" />
                <circle cx="170" cy="22" r="1.4" />
                <circle cx="260" cy="48" r="1.6" />
                <circle cx="350" cy="26" r="1.4" />
              </g>
              <path d="M0 200Q120 130 250 190T500 170T600 190V300H0Z" fill={currentScene.palette[4]} />
              <path d="M0 240Q150 180 300 235T600 215V300H0Z" fill={currentScene.palette[5]} />
            </svg>
          )}

          <div
            className="absolute inset-0 bg-gradient-to-b from-[rgba(235,230,255,0.55)] to-[rgba(190,180,230,0.75)] pointer-events-none transition-opacity duration-1000"
            style={{ opacity: mistOpacity }}
          />

          <div className="absolute left-4 bottom-4 bg-[rgba(20,16,45,0.78)] text-[#f1ecff] px-4 py-1.5 rounded-full text-xs">
            {Math.round(mistClearPct * 100)}% clear · {studyDaysCount} study days
          </div>
        </div>

        {/* Scene controls */}
        <div className="flex gap-3 items-center justify-start mt-4 flex-wrap text-xs">
          <select
            value={selectedSceneIdx}
            disabled={!!userPhoto}
            onChange={(e) => handleSceneChange(e.target.value)}
            className="bg-[var(--surf2)] border border-[var(--line)] rounded-xl py-1.5 px-3 text-[var(--ink)] outline-none"
          >
            {SCENES.map((sc, i) => (
              <option key={i} value={i}>
                {sc.name}
              </option>
            ))}
          </select>

          {userPhoto ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="border border-[var(--line)] bg-[var(--surf2)] text-[var(--warn)] rounded-full px-4 py-2 hover:border-[var(--warn)] transition-colors cursor-pointer"
            >
              Remove photo
            </button>
          ) : (
            <label className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-4 py-2 hover:border-[var(--lamp)] transition-colors cursor-pointer">
              Use my photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}

          <button
            type="button"
            onClick={handleKeepMonth}
            className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-4 py-2 hover:border-[var(--lamp)] transition-colors cursor-pointer"
          >
            Keep this month
          </button>
        </div>
      </section>

      {/* Backup and Care Settings */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--surf)] p-6 mt-6">
        <h2 className="serif text-xl font-normal mb-1">Back up your history</h2>
        <p className="text-xs text-[var(--mut)] mb-4">
          Data for <b className="text-[var(--ink)]">{currentUser.username}</b> is saved on the server database. You can also export portable JSON snapshots.
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportBackup}
            className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-5 py-2 text-xs sm:text-sm font-semibold hover:border-[var(--lamp)] transition-colors cursor-pointer"
          >
            Export backup
          </button>
          <label className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-5 py-2 text-xs sm:text-sm font-semibold hover:border-[var(--lamp)] transition-colors cursor-pointer">
            Import backup
            <input type="file" accept=".json,application/json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </section>

      {/* Modals */}
      <TimerOverlay
        isOpen={showTimerModal}
        mode={timerMode}
        activeTag={selectedTag}
        seconds={timerSec}
        isPaused={timerPaused}
        isMuted={state.mute}
        distractions={sessionDistractions}
        onAddDistraction={handleAddDistraction}
        onPauseToggle={() => setTimerPaused((prev) => !prev)}
        onEndSession={endTimer}
      />

      <StairsOverlay
        isOpen={showStairsModal}
        seconds={lastSessionSec}
        distractions={sessionDistractions}
        onClose={() => setShowStairsModal(false)}
      />

      <EveningRitualModal
        isOpen={showRitualModal}
        isMuted={state.mute}
        onClose={() => setShowRitualModal(false)}
        onComplete={() => {
          if (!state.closed.includes(todayIso)) {
            onUpdateState({
              ...state,
              closed: [...(state.closed || []), todayIso]
            });
          }
        }}
      />

      <ManualEntryModal
        isOpen={showManualModal}
        sessions={state.sessions || []}
        tags={tags}
        onClose={() => setShowManualModal(false)}
        onSave={(newSession) => {
          onUpdateState({
            ...state,
            sessions: [...(state.sessions || []), newSession]
          });
          setShowManualModal(false);
          showToast('Study time added');
        }}
        onDeleteSession={(sessionId) => {
          onUpdateState({
            ...state,
            sessions: (state.sessions || []).filter((s) => s.id !== sessionId)
          });
          showToast('Session removed');
        }}
      />

      <ScrapbookModal
        isOpen={showScrapbookModal}
        scrap={state.scrap || []}
        onClose={() => setShowScrapbookModal(false)}
      />

      <DayGoalModal
        isOpen={showGoalModal}
        date={selectedGoalDate}
        defaultGoal={defaultGoal}
        currentDayGoal={state.dayGoals && state.dayGoals[selectedGoalDate]}
        currentDayNote={state.dayNotes && state.dayNotes[selectedGoalDate]}
        onClose={() => setShowGoalModal(false)}
        onSave={(date, goalVal, noteVal, isReset) => {
          const updatedGoals = { ...(state.dayGoals || {}) };
          const updatedNotes = { ...(state.dayNotes || {}) };

          if (isReset) {
            delete updatedGoals[date];
            delete updatedNotes[date];
          } else {
            updatedGoals[date] = goalVal;
            if (noteVal) updatedNotes[date] = noteVal;
            else delete updatedNotes[date];
          }

          onUpdateState({
            ...state,
            dayGoals: updatedGoals,
            dayNotes: updatedNotes
          });
          setShowGoalModal(false);
          showToast(isReset ? 'Back to default goal' : 'Goal saved');
        }}
      />

      {/* Strict Mode Tab Warning */}
      {showStrictWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(14,11,32,0.88)] backdrop-blur-md">
          <div className="bg-[var(--surf)] border border-[var(--line)] rounded-[26px] p-7 max-w-sm w-full text-center shadow-2xl">
            <h3 className="serif text-2xl font-normal mb-2">You left the page</h3>
            <p className="text-xs text-[var(--mut)] mb-6">
              Strict mode paused your timer so your record stays honest.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowStrictWarning(false);
                setTimerPaused(false);
              }}
              className="border border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] rounded-full px-6 py-2.5 text-sm font-semibold hover:brightness-110 shadow-md cursor-pointer"
            >
              Resume focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
