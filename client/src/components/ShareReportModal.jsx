import React, { useState } from 'react';
import { playSfx } from '../utils/audio';

export default function ShareReportModal({
  isOpen,
  onClose,
  currentUser,
  todaySec = 0,
  todayGoal = 4,
  rawStreak = 0,
  isShieldActive = false,
  habits = [],
  todayIso,
  claimedMilestones = [],
  showToast
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hoursLogged = (todaySec / 3600).toFixed(1);
  const targetSec = todayGoal * 3600;
  const pct = Math.min(999, Math.round((todaySec / (targetSec || 1)) * 100));

  const habitsDone = habits.filter((h) => h.history && h.history[todayIso]).length;
  const totalHabits = habits.length;

  const star1Done = claimedMilestones.includes('star1') || todaySec >= Math.min(15 * 60, targetSec * 0.25);
  const star2Done = claimedMilestones.includes('star2') || todaySec >= targetSec * 0.5;
  const star3Done = claimedMilestones.includes('star3') || (todaySec >= targetSec && targetSec > 0);

  const shareText = `🔥 My Focus Report on CONSIStracker (${todayIso})
━━━━━━━━━━━━━━━━━━━━
⏱️ Deep Focus: ${hoursLogged}h / ${todayGoal}h (${pct}% Goal)
⭐ Milestones: ${star1Done ? '⭐ 15m' : '—'} | ${star2Done ? '⭐⭐ 50%' : '—'} | ${star3Done ? '👑 Goal Crushed' : '—'}
🔥 Consistency Streak: ${rawStreak} ${rawStreak === 1 ? 'day' : 'days'}${isShieldActive ? ' (🛡️ Shield Active)' : ''}
🎯 Habits Completed: ${habitsDone}/${totalHabits}
━━━━━━━━━━━━━━━━━━━━
"a little progress, every day"
⚡ Track your discipline: https://consistracker.onrender.com`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      playSfx('check');
      if (showToast) showToast('📋 Focus report copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      if (showToast) showToast('Copy failed, please copy manually.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CONSIStracker Daily Focus Report — ${currentUser?.username || 'User'}`,
          text: shareText,
          url: 'https://consistracker.onrender.com'
        });
      } catch (e) {}
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[var(--surf)] border border-[var(--line)] p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-[var(--ink)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <h3 className="serif text-lg font-semibold leading-tight">Daily Focus Card</h3>
              <p className="text-[11px] text-[var(--mut)]">Share your progress with friends or study groups</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--surf2)] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* The Visual Share Card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#1b1730] via-[#241c40] to-[#120e26] border border-amber-500/30 p-5 shadow-inner text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Brand + Date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-xs tracking-wider text-amber-200">
                {currentUser?.username || 'Focus Cadet'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {todayIso}
            </span>
          </div>

          {/* Big Stat Hero */}
          <div className="text-center my-3">
            <div className="text-3xl sm:text-4xl font-extrabold serif text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-[var(--lamp)] to-emerald-400">
              {hoursLogged}h Focused
            </div>
            <span className="text-xs text-gray-300 mt-0.5 block">
              {pct}% of {todayGoal}h target reached today
            </span>
          </div>

          {/* 3 Metric Blocks */}
          <div className="grid grid-cols-3 gap-2 my-4 text-center">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-sm block mb-0.5">🔥</span>
              <span className="text-xs font-bold block">{rawStreak}d</span>
              <span className="text-[9px] text-gray-400">Streak</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-sm block mb-0.5">🎯</span>
              <span className="text-xs font-bold block">{habitsDone}/{totalHabits}</span>
              <span className="text-[9px] text-gray-400">Habits</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-sm block mb-0.5">{star3Done ? '👑' : star2Done ? '⭐⭐' : '⭐'}</span>
              <span className="text-xs font-bold block">{star3Done ? '100%' : star2Done ? '50%' : '15m'}</span>
              <span className="text-[9px] text-gray-400">Milestone</span>
            </div>
          </div>

          {/* Milestone Badges Strip */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-semibold py-2 px-3 rounded-xl bg-black/30 border border-white/5">
            <span className={star1Done ? 'text-emerald-300' : 'text-gray-500 line-through'}>
              ⭐ 15m
            </span>
            <span className="text-gray-600">·</span>
            <span className={star2Done ? 'text-emerald-300' : 'text-gray-500 line-through'}>
              ⭐⭐ 50%
            </span>
            <span className="text-gray-600">·</span>
            <span className={star3Done ? 'text-amber-300 font-bold' : 'text-gray-500 line-through'}>
              👑 Goal Crushed
            </span>
          </div>

          {/* Footer Motto */}
          <div className="mt-3 text-center text-[10px] text-gray-400 italic">
            CONSIStracker · a little progress, every day
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-[var(--lamp)] text-[#1b1730] hover:brightness-110 active:scale-95'
            }`}
          >
            <span>{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary Text'}</span>
          </button>

          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--surf2)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>📲</span>
              <span>Share...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
