import React, { useState, useEffect, useRef, useMemo } from 'react';
import TimerOverlay from './TimerOverlay';
import StairsOverlay from './StairsOverlay';
import EveningRitualModal from './EveningRitualModal';
import ManualEntryModal from './ManualEntryModal';
import ScrapbookModal from './ScrapbookModal';
import DayGoalModal from './DayGoalModal';
import HabitTrackerModal from './HabitTrackerModal';
import CustomSubjectModal from './CustomSubjectModal';
import FeedbackModal from './FeedbackModal';
import { playSfx, setVolumeLevel } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import { getCurrentUser } from '../utils/api';

const SCENES = [
  { name: 'Pine dusk', key: 'pine', palette: ['#3a2f7a', '#e58f6a', '#f6c978', '#fde7a3', '#6b5aa8', '#43397e', '#231c4f', '#1c1640'] },
  { name: 'Sea at dawn', key: 'sea', palette: ['#2d4a7a', '#e8a0a0', '#ffd9a8', '#fff0c8', '#5e86b0', '#3e648f', '#2b4a70', '#1f3856'] },
  { name: 'Desert dunes', key: 'dune', palette: ['#7a3d5c', '#e0795a', '#f4b86a', '#ffe0a0', '#c46a4a', '#9c4a3c', '#6e3132', '#4d2328'] },
  { name: 'Alpine night', key: 'peak', palette: ['#0f1b3d', '#2f4a8a', '#7f9fd0', '#e8eefc', '#40588f', '#2a3d6d', '#18254a', '#101a36'] },
  { name: 'Spring meadow', key: 'pine', palette: ['#3d6a8a', '#9fcfa8', '#f4e9a0', '#fffbd0', '#6fa070', '#4d8058', '#2f5a3a', '#234530'] },
  { name: 'Autumn ridge', key: 'peak', palette: ['#5a2d3d', '#d9733f', '#f2b35c', '#ffe3a6', '#a65a3a', '#7d3f32', '#4f2a2a', '#33201f'] }
];


export default function Phase3Dashboard({ state, onUpdateState, onLogout, onOpenTutorial }) {
  const [now, setNow] = useState(new Date());
  const currentUser = getCurrentUser();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const todayIso = now.toISOString().slice(0, 10);
  const currentMonthKey = todayIso.slice(0, 7);

  // Custom Subject Tags state
  const tags = state.tags || [];
  const [selectedTag, setSelectedTag] = useState(tags[0] || null);

  useEffect(() => {
    if (tags.length > 0 && (!selectedTag || !tags.some((t) => t.id === selectedTag.id))) {
      setSelectedTag(tags[0]);
    } else if (tags.length === 0) {
      setSelectedTag(null);
    }
  }, [tags]);

  // Habit Tracker state
  const habits = state.habits || [];
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showCustomSubjectModal, setShowCustomSubjectModal] = useState(false);

  // Sound Volume control state
  const [volume, setVolume] = useState(state.volume != null ? state.volume : 80);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    setVolumeLevel(state.mute ? 0 : volume / 100);
  }, [volume, state.mute]);

  const handleVolumeChange = (newVal) => {
    const val = parseInt(newVal) || 0;
    setVolume(val);
    setVolumeLevel(val / 100);
    const updatedState = { ...state, volume: val };
    if (val === 0 && !state.mute) {
      updatedState.mute = true;
    } else if (val > 0 && state.mute) {
      updatedState.mute = false;
    }
    onUpdateState(updatedState);
  };

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
  const [bouncingHabitId, setBouncingHabitId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    if (currentUser?.username?.toLowerCase() === 'admin') {
      api.getSiteStats().then((res) => {
        if (res && res.success && res.stats) setAdminStats(res.stats);
      });
    }
  }, [currentUser]);

  // Habit Monthly Statistics
  const monthStats = useMemo(() => {
    const prefix = todayIso.slice(0, 7);
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
  }, [habits, todayIso]);

  const gaugeColor = useMemo(() => {
    if (monthStats.completionRate >= 80) return '#10b981'; // vibrant emerald
    if (monthStats.completionRate >= 50) return 'var(--lamp)'; // golden lamp theme
    if (monthStats.completionRate >= 25) return '#f59e0b'; // amber
    return '#f43f5e'; // rose/coral
  }, [monthStats.completionRate]);

  const adherenceLabel = useMemo(() => {
    if (monthStats.completionRate >= 80) return { text: '🔥 High Consistency', color: 'text-emerald-500' };
    if (monthStats.completionRate >= 50) return { text: '⚡ Steady Momentum', color: 'text-[var(--lamp)]' };
    if (monthStats.completionRate >= 25) return { text: '🌱 Building Habit', color: 'text-amber-500' };
    return { text: '🎯 Getting Started', color: 'text-[var(--mut)]' };
  }, [monthStats.completionRate]);

  // Timezone & Environmental Atmospheric Theme Engine
  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  }, []);

  const activeTimeTheme = useMemo(() => {
    const mode = state.timeTheme || 'auto';
    if (mode !== 'auto') return mode;
    const hour = now.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'day';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }, [state.timeTheme, now]);

  const timeThemeMeta = useMemo(() => {
    switch (activeTimeTheme) {
      case 'morning':
        return {
          icon: '🌅',
          label: 'Morning',
          greeting: '🌅 Morning Dawn — Prime time for LeetCode Mediums & algorithm mastery',
          pillClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        };
      case 'day':
        return {
          icon: '☀️',
          label: 'Daylight',
          greeting: '☀️ Afternoon Focus — Ship internship PRs, build features & conquer bugs',
          pillClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
        };
      case 'evening':
        return {
          icon: '🌆',
          label: 'Dusk',
          greeting: '🌆 Golden Hour — Optimize complexity, review PRs & lock in daily gains',
          pillClass: 'bg-pink-500/15 text-pink-400 border-pink-500/30'
        };
      case 'night':
      default:
        return {
          icon: '🌙',
          label: 'Midnight',
          greeting: '🌙 Late Night Deep Focus — Calm, quiet hours for hard problem-solving',
          pillClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        };
    }
  }, [activeTimeTheme]);

  const handleCycleTimeTheme = () => {
    const modes = ['auto', 'morning', 'day', 'evening', 'night'];
    const current = state.timeTheme || 'auto';
    const next = modes[(modes.indexOf(current) + 1) % modes.length];

    onUpdateState({
      ...state,
      timeTheme: next
    });

    const labels = {
      auto: 'Auto (Synced with local timezone)',
      morning: 'Morning Dawn 🌅',
      day: 'Afternoon Focus ☀️',
      evening: 'Golden Dusk 🌆',
      night: 'Midnight Owl 🌙'
    };
    showToast(`Time Theme: ${labels[next]}`);
  };

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
  // Daily 3-Star Milestone Milestones (Hybrid Goal Engine)
  // -------------------------------------------------------------
  const star1Sec = Math.min(15 * 60, Math.floor(todayGoalSec * 0.25));
  const star2Sec = Math.floor(todayGoalSec * 0.5);
  const star3Sec = todayGoalSec;

  const star1Earned = todaySec >= star1Sec && todaySec > 0;
  const star2Earned = todaySec >= star2Sec && todaySec > 0;
  const star3Earned = todaySec >= star3Sec && todaySec > 0;

  const claimedMilestones = (state.claimedMilestones && state.claimedMilestones[todayIso]) || [];
  const star1Claimed = claimedMilestones.includes('star1');
  const star2Claimed = claimedMilestones.includes('star2');
  const star3Claimed = claimedMilestones.includes('star3');

  const handleClaimMilestone = (starId, xpBonus, label) => {
    if (claimedMilestones.includes(starId)) return;
    triggerConfetti();
    playSfx('celebrate', state.mute);
    const newXp = (state.dopamineXp || 0) + xpBonus;
    showToast(`🌟 Milestone Unlocked: ${label}! (+${xpBonus} XP)`);

    const updatedMap = {
      ...(state.claimedMilestones || {}),
      [todayIso]: [...claimedMilestones, starId]
    };

    onUpdateState({
      ...state,
      dopamineXp: newXp,
      claimedMilestones: updatedMap
    });
  };

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
    const s = Math.floor(verifiedSeconds);
    // Play celebratory end fanfare for meaningful focus, or gentle beep for quick check
    if (s >= 60) {
      playSfx('end', state.mute);
    } else {
      playSfx('beep', state.mute);
    }

    setTimerRunning(false);
    setShowTimerModal(false);
    setLastSessionSec(s);

    if (s > 0) {
      const tagName = selectedTag ? selectedTag.name : 'Focus';
      const tagColor = selectedTag ? selectedTag.color : '#94a3b8';
      const newSession = {
        id: 't' + Date.now(),
        date: todayIso,
        sec: s,
        type: 'timed',
        tag: tagName,
        color: tagColor,
        note: selectedTag ? `${selectedTag.name} focus session` : 'Focus session'
      };
      onUpdateState({
        ...state,
        sessions: [...(state.sessions || []), newSession]
      });

      if (s < 60) {
        showToast(`${s}s logged · Push for 15m+ to build real momentum!`);
      } else {
        const m = Math.round(s / 60);
        showToast(`${m}m logged${selectedTag ? ` for ${selectedTag.name}` : ''}`);
      }
    }

    setShowStairsModal(true);
  };

  // Quick Habit Check-in for Today with Micro-Interaction
  const handleToggleTodayHabit = (habit) => {
    setBouncingHabitId(habit.id);
    setTimeout(() => setBouncingHabitId((cur) => (cur === habit.id ? null : cur)), 400);

    const history = { ...(habit.history || {}) };
    const wasDone = !!history[todayIso];
    const isNowDone = !wasDone;

    if (isNowDone) {
      history[todayIso] = true;
      playSfx('check', state.mute);
    } else {
      delete history[todayIso];
    }

    const prefix = todayIso.slice(0, 7);
    const monthlyCount = Object.keys(history).filter((k) => k.startsWith(prefix) && history[k]).length;
    const target = habit.monthlyTarget || 20;

    const allDone = habits.every((h) => {
      if (h.id === habit.id) return isNowDone;
      return !!(h.history && h.history[todayIso]);
    });

    if (isNowDone && monthlyCount === target) {
      triggerConfetti();
      playSfx('celebrate', state.mute);
      showToast(`🎉 Monthly Goal Achieved for ${habit.name}! (${monthlyCount}/${target} days)`);
    } else if (isNowDone && allDone && habits.length > 1) {
      triggerConfetti();
      playSfx('celebrate', state.mute);
      showToast(`🌟 All ${habits.length} habits completed today! Fantastic work!`);
    } else if (isNowDone) {
      showToast(`Marked ${habit.name} done today`);
    }

    const updated = habits.map((h) => (h.id === habit.id ? { ...h, history } : h));
    onUpdateState({
      ...state,
      habits: updated
    });
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

      {/* Integrated Header: Left Brand + Right Utility & Action Stack */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        {/* Left: Brand Identity */}
        <div>
          <h1 className="serif text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight">
            Consistracker
          </h1>
          <p className="serif italic font-normal text-xs text-[var(--mut)]">
            a little progress, every day
          </p>
        </div>

        {/* Right: Integrated 2-Tier Stack */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          {/* Top Micro-Tier: Date/Day + Secondary Ghost Utilities */}
          <div className="flex items-center gap-2 text-xs text-[var(--mut)]">
            {/* Date & Day */}
            <span className="font-medium text-[var(--ink)]">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="opacity-40">·</span>
            <span className="text-[11px] tabular-nums opacity-75">
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>

            <span className="w-px h-3 bg-[var(--line)] mx-0.5 opacity-60" />

            {/* Volume Control */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                title={state.mute ? 'Unmute sounds' : `Sounds on (${volume}%)`}
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--surf2)] transition-colors cursor-pointer"
              >
                {state.mute || volume === 0 ? '🔕' : '🔔'}
              </button>

              {showVolumeSlider && (
                <div
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="absolute right-0 top-7 z-30 p-2.5 bg-[var(--surf2)] border border-[var(--line)] rounded-2xl shadow-xl flex items-center gap-2.5 min-w-[170px] animate-fade-in"
                >
                  <span className="text-xs text-[var(--mut)] cursor-pointer" onClick={() => handleVolumeChange(0)}>
                    🔇
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.mute ? 0 : volume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="w-24 accent-[var(--lamp)] cursor-pointer h-1.5"
                  />
                  <span className="text-[11px] font-bold text-[var(--ink)] min-w-[28px] text-right">
                    {state.mute ? 0 : volume}%
                  </span>
                </div>
              )}
            </div>

            {/* Scrapbook Icon */}
            <button
              type="button"
              onClick={() => setShowScrapbookModal(true)}
              title="Open Scrapbook"
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--surf2)] transition-colors cursor-pointer"
            >
              📖
            </button>

            {/* Ambient Time Theme Cycle */}
            <button
              type="button"
              onClick={handleCycleTimeTheme}
              title={`Time Zone Theme: ${timeThemeMeta.label} (${state.timeTheme && state.timeTheme !== 'auto' ? 'Manual override' : 'Auto-synced with ' + userTimezone}). Click to cycle.`}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${timeThemeMeta.pillClass} hover:brightness-110 active:scale-95`}
            >
              <span>{timeThemeMeta.icon}</span>
              <span className="hidden md:inline">{timeThemeMeta.label}</span>
              <span className="text-[9px] opacity-75 font-normal">
                {state.timeTheme && state.timeTheme !== 'auto' ? 'Manual' : 'Auto'}
              </span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Switch light or dark mode"
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--surf2)] transition-colors cursor-pointer"
            >
              ◐
            </button>
          </div>

          {/* Bottom Primary Tier: Core Interactive Action Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--surf)] border border-[var(--line)] shadow-sm backdrop-blur-md">
            {/* User Profile Chip */}
            <button
              type="button"
              onClick={onLogout}
              title={`Logged in as ${currentUser.username}. Click to switch user or log out`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surf2)] hover:bg-[var(--line)] text-xs font-semibold text-[var(--ink)] cursor-pointer transition-all border border-transparent hover:border-[var(--line)]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="max-w-[80px] truncate">{currentUser.username}</span>
              <span className="text-[10px] text-[var(--mut)]">↳</span>
            </button>

            {/* Habits Quick Pill */}
            <button
              type="button"
              onClick={() => setShowHabitModal(true)}
              title="Open Habit Tracker & Monthly Goals"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surf2)] hover:border-[var(--lamp)] text-xs font-semibold text-[var(--ink)] cursor-pointer transition-all border border-transparent"
            >
              <span>🎯</span>
              <span className="hidden sm:inline">Habits</span>
              {habits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--lamp)]/25 text-[var(--lamp)] font-bold">
                  {habits.filter((h) => h.history && h.history[todayIso]).length}/{habits.length}
                </span>
              )}
            </button>

            {/* Interactive Tutorial Tour Button */}
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                title="Interactive Feature Tour & Domain Setup"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-[var(--lamp)]/15 to-emerald-500/15 hover:border-[var(--lamp)] text-xs font-semibold text-[var(--ink)] cursor-pointer transition-all border border-amber-500/30 hover:scale-105 active:scale-95 shadow-xs"
              >
                <span>💡</span>
                <span className="hidden sm:inline">Tour</span>
              </button>
            )}

            {/* Cute Trial Feedback Pill */}
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              title="Trial Run Feedback - Tell us what you think!"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/15 via-rose-500/15 to-amber-500/15 hover:border-rose-400 text-xs font-semibold text-[var(--ink)] cursor-pointer transition-all border border-rose-500/30 hover:scale-105 active:scale-95 shadow-xs"
            >
              <span>💬</span>
              <span className="hidden sm:inline">Feedback</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            </button>

            {/* Admin Feedback Vault Pill (Visible to admin) */}
            {currentUser?.username?.toLowerCase() === 'admin' && (
              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                title={`Admin Dashboard & Site Analytics (${adminStats ? adminStats.totalVisits + ' total visits, ' + adminStats.todayVisits + ' today' : 'Click to view'})`}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 hover:border-purple-400 text-xs font-bold text-purple-300 cursor-pointer transition-all border border-purple-500/40 hover:scale-105 active:scale-95 shadow-xs"
              >
                <span>🛡️</span>
                <span>Admin</span>
                {adminStats && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-400/20 text-purple-200 border border-purple-400/30">
                    👁️ {adminStats.totalVisits}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Atmospheric Timezone & Study Context Banner */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 mb-5 rounded-2xl bg-[var(--surf2)]/50 border border-[var(--line)]/70 text-xs text-[var(--mut)] shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base flex-shrink-0">{timeThemeMeta.icon}</span>
          <span className="font-medium text-[var(--ink)] truncate">
            {timeThemeMeta.greeting}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium opacity-85 ml-auto flex-shrink-0">
          <span className="px-2 py-0.5 rounded-md bg-[var(--surf)] border border-[var(--line)]">
            📍 {userTimezone}
          </span>
          <span>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Hero Focus Timer Section (Expanded Full Width) */}
      <div className="w-full">
        <section className="relative rounded-[32px] border border-[var(--line)] bg-[var(--surf)] p-6 sm:p-10 flex flex-col items-center text-center overflow-hidden bg-[radial-gradient(85%_75%_at_50%_35%,rgba(240,178,90,0.18),transparent_75%)] shadow-xl">
          {/* Diano Mascot */}
          <div className="relative mb-2">
            <svg
              onClick={handlePokeDiano}
              role="img"
              aria-label="Diano"
              className={`w-24 h-24 cursor-pointer transition-transform ${
                petHop ? 'pet-hop' : isPetAwake ? 'pet-glad' : ''
              }`}
            >
              <use href="#dn" />
            </svg>
            {!isPetAwake && (
              <span className="absolute top-1 left-24 serif italic text-sm text-[var(--mut)] pet-zz">
                z z
              </span>
            )}
          </div>

          <h2 className="serif text-2xl sm:text-3xl font-normal text-[var(--ink)] mb-1">
            {progressPct >= 1 ? 'Goal reached' : todaySec > 0 ? 'Keep the lamp lit' : 'Ready when you are'}
          </h2>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[var(--surf2)] border border-[var(--line)] text-[var(--ink)] flex items-center gap-1.5 shadow-sm">
              <span>🔥</span>
              <span>{rawStreak} {rawStreak === 1 ? 'day' : 'days'} streak</span>
              {isShieldActive && (
                <span className="text-amber-300 ml-1 font-bold" title="Shield Active">
                  🛡️ Active
                </span>
              )}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--mut)] mb-3">
            {progressPct >= 1
              ? 'Anything more is a bonus. Rest is allowed too.'
              : todaySec > 0
              ? `${Math.ceil((todayGoalSec - todaySec) / 60)} minutes to go.`
              : 'Tap the lamp to start a focus session.'}
          </p>

          {/* Custom Subject Selector */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center mb-1 max-w-md px-2">
            {tags.map((t) => {
              const isSelected = selectedTag && (selectedTag.id === t.id || selectedTag.name === t.name);
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
                  <span>{t.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowCustomSubjectModal(true)}
              className="px-2.5 py-1 rounded-full text-xs border border-dashed border-[var(--line)] hover:border-[var(--lamp)] text-[var(--mut)] hover:text-[var(--ink)] cursor-pointer transition-all flex items-center gap-1 bg-[var(--surf2)]/50 hover:bg-[var(--surf2)]"
              title="Add or manage custom subjects"
            >
              <span>+</span>
              <span>{tags.length === 0 ? 'Add Custom Subject' : 'Subject'}</span>
            </button>

            {tags.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCustomSubjectModal(true)}
                className="w-6 h-6 rounded-full border border-[var(--line)] hover:border-[var(--lamp)] text-[var(--mut)] hover:text-[var(--ink)] flex items-center justify-center text-[11px] cursor-pointer transition-colors"
                title="Manage custom subjects"
              >
                ⚙️
              </button>
            )}
          </div>

          {/* Circular Progress Ring Button - Now BIG and IMMERSIVE */}
          <button
            type="button"
            onClick={() => startTimer()}
            aria-label="Start focus session"
            className="relative w-[min(380px,85vw)] aspect-square border-0 bg-transparent my-4 cursor-pointer group transition-transform hover:scale-[1.01]"
          >
            <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
              <circle cx="120" cy="120" r="106" fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle
                cx="120"
                cy="120"
                r="106"
                fill="none"
                stroke="var(--lamp)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="666"
                strokeDashoffset={666 * (1 - progressPct)}
                className="transition-all duration-800 group-hover:drop-shadow-[0_0_20px_var(--lamp)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="serif text-5xl sm:text-6xl md:text-7xl font-normal tabular-nums leading-none tracking-tight">
                {fmtMinSec(todaySec)}
              </span>
              <span className="text-xs sm:text-sm text-[var(--mut)] mt-2 font-medium">of {todayGoal}h goal today</span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--lamp)] mt-3 px-3.5 py-1 rounded-full bg-[var(--lamp)]/15 border border-[var(--lamp)]/35 flex items-center gap-1.5 shadow-sm">
                <span>▶</span>
                <span>Start {selectedTag ? `${selectedTag.name} ` : ''}session</span>
              </span>
            </div>
          </button>

          {/* Daily 3-Star Milestone Track (Unified Hybrid Goal) */}
          <div className="w-full max-w-[min(380px,90vw)] my-3 p-3 rounded-2xl bg-[var(--surf2)]/60 border border-[var(--line)] shadow-inner">
            <div className="flex items-center justify-between text-xs font-semibold mb-2 px-1">
              <span className="text-[var(--mut)] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <span>⚡ Daily Goal Milestones</span>
              </span>
              <span className="text-[11px] font-bold text-[var(--lamp)] tabular-nums">
                {Math.round(progressPct * 100)}% ({fmtMinSec(todaySec)} / {todayGoal}h)
              </span>
            </div>

            {/* 3 Interactive Star Cards */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {/* Star 1: 15m Starter */}
              <button
                type="button"
                disabled={!star1Earned || star1Claimed}
                onClick={() => handleClaimMilestone('star1', 10, 'Starter 15m')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                  star1Claimed
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : star1Earned
                    ? 'bg-amber-400/25 border-amber-400 text-amber-200 animate-pulse cursor-pointer shadow-md shadow-amber-400/20 hover:scale-105 active:scale-95'
                    : 'bg-[var(--surf)] border-[var(--line)]/60 text-[var(--mut)] opacity-60 cursor-default'
                }`}
              >
                <span className="text-base sm:text-lg mb-0.5">⭐</span>
                <span className="text-[10px] sm:text-xs font-bold leading-tight">
                  {star1Claimed ? '✓ 15m Done' : star1Earned ? '+10 XP Claim' : '15m Starter'}
                </span>
                <span className="text-[9px] opacity-75 mt-0.5">
                  {star1Claimed ? 'Claimed' : star1Earned ? 'Tap for XP!' : `${Math.max(0, Math.ceil((star1Sec - todaySec) / 60))}m left`}
                </span>
              </button>

              {/* Star 2: 50% Halfway */}
              <button
                type="button"
                disabled={!star2Earned || star2Claimed}
                onClick={() => handleClaimMilestone('star2', 20, 'Halfway Mark')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                  star2Claimed
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : star2Earned
                    ? 'bg-amber-400/25 border-amber-400 text-amber-200 animate-pulse cursor-pointer shadow-md shadow-amber-400/20 hover:scale-105 active:scale-95'
                    : 'bg-[var(--surf)] border-[var(--line)]/60 text-[var(--mut)] opacity-60 cursor-default'
                }`}
              >
                <span className="text-base sm:text-lg mb-0.5">⭐⭐</span>
                <span className="text-[10px] sm:text-xs font-bold leading-tight">
                  {star2Claimed ? '✓ 50% Done' : star2Earned ? '+20 XP Claim' : '50% Halfway'}
                </span>
                <span className="text-[9px] opacity-75 mt-0.5">
                  {star2Claimed ? 'Claimed' : star2Earned ? 'Tap for XP!' : `${Math.max(0, Math.ceil((star2Sec - todaySec) / 60))}m left`}
                </span>
              </button>

              {/* Star 3: 100% Goal Cleared */}
              <button
                type="button"
                disabled={!star3Earned || star3Claimed}
                onClick={() => handleClaimMilestone('star3', 50, 'Goal Crushed!')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                  star3Claimed
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : star3Earned
                    ? 'bg-gradient-to-r from-amber-400 via-[var(--lamp)] to-emerald-400 text-[#1b1730] font-extrabold animate-bounce cursor-pointer shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-[var(--surf)] border-[var(--line)]/60 text-[var(--mut)] opacity-60 cursor-default'
                }`}
              >
                <span className="text-base sm:text-lg mb-0.5">👑</span>
                <span className="text-[10px] sm:text-xs font-bold leading-tight">
                  {star3Claimed ? '✓ Crushed!' : star3Earned ? '+50 XP Claim' : '100% Goal'}
                </span>
                <span className="text-[9px] opacity-75 mt-0.5">
                  {star3Claimed ? 'Victory!' : star3Earned ? 'Tap reward!' : `${Math.max(0, Math.ceil((star3Sec - todaySec) / 60))}m left`}
                </span>
              </button>
            </div>
          </div>

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
                            fill={d.tags[tName]?.color || '#94a3b8'}
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

      {/* Habit Tracker & Monthly Goals Overview (Interactive Summary Card) */}
      <section
        onClick={() => setShowHabitModal(true)}
        className="group relative rounded-[28px] border border-[var(--line)] bg-[var(--surf)] p-5 sm:p-7 mt-6 cursor-pointer hover:border-[var(--lamp)] hover:shadow-lg transition-all duration-300"
      >
        {habits.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-3xl block mb-2">🌱</span>
            <h2 className="serif text-lg font-normal text-[var(--ink)] mb-1">Daily Tasks & Monthly Goals</h2>
            <p className="text-xs text-[var(--mut)] max-w-md mx-auto mb-4">
              Set monthly targets for your habits, build momentum, and track your daily adherence matrix.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHabitModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[var(--lamp)] text-[#1b1730] text-xs font-semibold hover:brightness-105 active:scale-95 cursor-pointer transition-all shadow-sm"
            >
              + Create Your First Habit
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-[color-mix(in_srgb,var(--lamp)_18%,var(--surf2))] border border-[var(--line)] flex items-center justify-center text-xl shadow-xs">
                  🎯
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[var(--surf2)] text-[var(--mut)] border border-[var(--line)]">
                      {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-[var(--mut)] font-medium">Daily Tasks & Monthly Goals</span>
                  </div>
                  <h2 className="serif text-xl sm:text-2xl font-normal text-[var(--ink)] mt-0.5">
                    Habit Adherence Overview
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--surf2)] group-hover:bg-[var(--lamp)] text-[var(--ink)] group-hover:text-[#1b1730] border border-[var(--line)] group-hover:border-transparent text-xs font-semibold transition-all shadow-xs">
                  <span>Open Habit List & Grid</span>
                  <span className="text-sm transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                </span>
              </div>
            </div>

            {/* Main Interactive Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Circular Adherence Ring */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-[var(--surf2)]/70 border border-[var(--line)]">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <defs>
                      <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={gaugeColor} floodOpacity="0.4" />
                      </filter>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="var(--line)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(100, monthStats.completionRate) / 100)}
                      strokeLinecap="round"
                      filter="url(#gaugeGlow)"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span
                      className="text-2xl font-bold tracking-tight transition-colors duration-500"
                      style={{ color: monthStats.completionRate > 0 ? gaugeColor : 'var(--ink)' }}
                    >
                      {monthStats.completionRate}%
                    </span>
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-[var(--mut)]">
                      Adherence
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-center">
                  <span className={`text-[11px] font-semibold transition-colors duration-300 ${adherenceLabel.color}`}>
                    {adherenceLabel.text}
                  </span>
                </div>
              </div>

              {/* Stats & Quick Habit Overview */}
              <div className="md:col-span-8 flex flex-col justify-between h-full gap-4">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--surf2)] border border-[var(--line)]">
                    <span className="text-[10px] font-semibold text-[var(--mut)] tracking-wide uppercase block mb-1">
                      Goals Met
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-[var(--ink)]">
                        {monthStats.goalsMet}
                      </span>
                      <span className="text-xs text-[var(--mut)]">/ {habits.length} habits</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-medium mt-1 block">
                      {monthStats.goalsMet > 0 ? `${monthStats.goalsMet} target reached` : 'Targets in progress'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--surf2)] border border-[var(--line)]">
                    <span className="text-[10px] font-semibold text-[var(--mut)] tracking-wide uppercase block mb-1">
                      Month Check-ins
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-[var(--ink)]">
                        {monthStats.totalCompleted}
                      </span>
                      <span className="text-xs text-[var(--mut)]">/ {monthStats.totalTarget}d target</span>
                    </div>
                    <span className="text-[10px] text-[var(--mut)] mt-1 block">
                      Cumulative days completed
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--surf2)] border border-[var(--line)]">
                    <span className="text-[10px] font-semibold text-[var(--mut)] tracking-wide uppercase block mb-1">
                      Today's Momentum
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-[var(--ink)]">
                        {habits.filter((h) => h.history && h.history[todayIso]).length}
                      </span>
                      <span className="text-xs text-[var(--mut)]">/ {habits.length} done</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-medium mt-1 block">
                      {habits.filter((h) => h.history && h.history[todayIso]).length === habits.length && habits.length > 0
                        ? 'All completed today! 🌟'
                        : 'Tap habit below to check'}
                    </span>
                  </div>
                </div>

                {/* Quick Interactive Habit Chips */}
                <div className="p-3.5 rounded-2xl bg-[var(--surf2)]/50 border border-[var(--line)] flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--mut)] font-medium mr-1">Habits today:</span>
                  {habits.slice(0, 6).map((habit) => {
                    const isTodayDone = !!(habit.history && habit.history[todayIso]);
                    const isBouncing = bouncingHabitId === habit.id;
                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTodayHabit(habit);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer select-none active:scale-90 hover:scale-[1.02] ${
                          isBouncing ? 'scale-105 ring-2 ring-emerald-400' : ''
                        } ${
                          isTodayDone
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[var(--surf)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--lamp)]'
                        }`}
                        title={isTodayDone ? `${habit.name}: Completed today! Click to uncheck` : `${habit.name}: Click to check off today`}
                      >
                        <span className="text-sm">{habit.icon || '💧'}</span>
                        <span className="max-w-[100px] truncate">{habit.name}</span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                            isTodayDone
                              ? 'bg-emerald-500 text-white scale-100'
                              : 'border border-[var(--line)] text-transparent scale-90'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                  {habits.length > 6 && (
                    <span className="text-xs text-[var(--mut)] font-semibold px-2 py-0.5">
                      +{habits.length - 6} more
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--mut)] ml-auto hidden sm:inline-block">
                    Click card to view 31-day matrix →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

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
        onResume={() => {
          setShowStairsModal(false);
          startTimer();
        }}
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
        onLogout={onLogout}
      />

      <ManualEntryModal
        isOpen={showManualModal}
        sessions={state.sessions || []}
        tags={tags}
        onClose={() => setShowManualModal(false)}
        onOpenCustomSubjects={() => setShowCustomSubjectModal(true)}
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

      <CustomSubjectModal
        isOpen={showCustomSubjectModal}
        tags={tags}
        onClose={() => setShowCustomSubjectModal(false)}
        onSaveTags={(newTags) => {
          onUpdateState({
            ...state,
            tags: newTags
          });
          showToast('Subjects updated');
        }}
        onSelectTag={(t) => setSelectedTag(t)}
      />

      <HabitTrackerModal
        isOpen={showHabitModal}
        habits={habits}
        isMuted={state.mute}
        showToast={showToast}
        onClose={() => setShowHabitModal(false)}
        onSaveHabits={(newHabits) => {
          onUpdateState({
            ...state,
            habits: newHabits
          });
        }}
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

      {/* Trial Run Cute Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        showToast={showToast}
        isMuted={state.mute}
      />
    </div>
  );
}
