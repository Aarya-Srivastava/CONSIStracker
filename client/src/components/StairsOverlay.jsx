import React, { useEffect, useState } from 'react';
import { playSfx } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

// Time-spent review tiers with realistic, motivating feedback
export function getSessionReview(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const hrs = Math.floor(seconds / 3600);
  const remM = Math.floor((seconds % 3600) / 60);

  if (seconds < 60) {
    return {
      tier: 'micro',
      badge: '⚠️ Barely Warmed Up (< 1 min)',
      badgeColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.4)',
      title: 'That Was Just A Blink!',
      durationText: `${s} second${s !== 1 ? 's' : ''}`,
      roastText: `You only stayed for ${s} seconds! The human brain takes at least 10 to 15 minutes just to silence background chatter and enter real flow.`,
      coachAdvice: 'Don’t cheat yourself with a 2-second session. Push through the starting friction and stay in the seat for at least 15 to 25 minutes right now!',
      targetSteps: 0,
      dianoMood: 'curious',
      allowResume: true,
      canCelebrate: false,
      stairNote: '🐾 Break starting friction to start taking steps today!'
    };
  }

  if (m < 5) {
    return {
      tier: 'brief',
      badge: '🌱 Short Stint · Warm-Up Only',
      badgeColor: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeBorder: 'rgba(56, 189, 248, 0.4)',
      title: "Good Start, But Don't Stop Here!",
      durationText: `${m}m ${s > 0 ? `${s}s` : ''} focused`,
      roastText: `You clocked ${m} minute${m > 1 ? 's' : ''}. You broke the initial inertia, but you stopped right before reaching your deep work velocity.`,
      coachAdvice: 'Challenge yourself: stay in your seat for at least 15 to 25 minutes to feel the genuine compound momentum.',
      targetSteps: 1,
      dianoMood: 'motivating',
      allowResume: true,
      canCelebrate: false,
      stairNote: '🐾 Initial inertia broken. Push forward to keep climbing!'
    };
  }

  if (m < 15) {
    return {
      tier: 'pact',
      badge: '⚡ 5-Minute Pact Cleared',
      badgeColor: '#c084fc',
      badgeBg: 'rgba(192, 132, 252, 0.15)',
      badgeBorder: 'rgba(192, 132, 252, 0.4)',
      title: 'Inertia Broken!',
      durationText: `${m} minutes focused`,
      roastText: `You pushed past the initial friction for ${m} minutes. Starting is 80% of the battle, and you conquered it.`,
      coachAdvice: 'You are officially warmed up. Try turning this spark into a full 25-minute Pomodoro block!',
      targetSteps: 1,
      dianoMood: 'encouraged',
      allowResume: true,
      canCelebrate: true,
      stairNote: '🎯 Step climbed! The resistance barrier is broken.'
    };
  }

  if (m < 30) {
    return {
      tier: 'solid',
      badge: '🎯 Solid Focus Block',
      badgeColor: '#34d399',
      badgeBg: 'rgba(52, 211, 153, 0.15)',
      badgeBorder: 'rgba(52, 211, 153, 0.4)',
      title: 'Well Done!',
      durationText: `${m} minutes focused`,
      roastText: `${m} minutes of undivided attention. You reached the neurochemical flow threshold where learning compounds.`,
      coachAdvice: 'Quality focus in the bank. Take a 5-minute stretch or hydration break before your next push.',
      targetSteps: 2,
      dianoMood: 'celebrating',
      allowResume: false,
      canCelebrate: true,
      stairNote: '🔥 Solid disciplined block logged!'
    };
  }

  if (m < 60) {
    return {
      tier: 'deep',
      badge: '🧠 Deep Flow State',
      badgeColor: '#22d3ee',
      badgeBg: 'rgba(34, 211, 238, 0.15)',
      badgeBorder: 'rgba(34, 211, 238, 0.4)',
      title: 'Superb Deep Work!',
      durationText: `${m} minutes focused`,
      roastText: `${m} minutes of uninterrupted, high-yield focus. Zero tab drift, pure problem-solving execution.`,
      coachAdvice: 'Outstanding focus stamina. Your ability to sustain attention puts you in the top tier of consistent learners.',
      targetSteps: 3,
      dianoMood: 'celebrating',
      allowResume: false,
      canCelebrate: true,
      stairNote: '⚡ Deep flow momentum locked in!'
    };
  }

  // 60+ minutes (format in hour:min:sec)
  return {
    tier: 'elite',
    badge: '👑 Peak Discipline · Masterclass',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.18)',
    badgeBorder: 'rgba(251, 191, 36, 0.5)',
    title: 'Outstanding Discipline.',
    durationText: `${hrs}h ${remM > 0 ? `${remM}m ` : ''}${s > 0 ? `${s}s` : ''}`.trim() + ' focused',
    roastText: `An elite ${hrs}h+ deep work stretch! You sustained high cognitive output without burning out.`,
    coachAdvice: 'Time for a mandatory rest: hydrate, stretch your legs, rest your eyes, and take pride in this win.',
    targetSteps: 4,
    dianoMood: 'master',
    allowResume: false,
    canCelebrate: true,
    stairNote: '🏆 Elite endurance unlocked!'
  };
}

// Generate ladder/stair steps based on previous seconds, session seconds, and daily goal hours
export function generateStairSteps(prevSec = 0, sessionSec = 0, dailyGoalHours = 2) {
  const goalHours = Math.max(0.5, parseFloat(dailyGoalHours) || 2);
  const goalSec = Math.round(goalHours * 3600);
  const safePrevSec = Math.max(0, Math.floor(prevSec || 0));
  const safeSessionSec = Math.max(0, Math.floor(sessionSec || 0));
  const totalSec = safePrevSec + safeSessionSec;

  // Step duration increment:
  // 15m (900s) for goals <= 1h, 30m (1800s) for goals <= 3h, 1h (3600s) for goals > 3h
  let stepSec = 1800; // 30 min default
  if (goalHours <= 1) {
    stepSec = 900;
  } else if (goalHours <= 3) {
    stepSec = 1800;
  } else if (goalHours <= 6) {
    stepSec = 3600;
  } else {
    stepSec = 7200;
  }

  const maxTimeNeeded = Math.max(goalSec, totalSec) + stepSec * 0.5;
  const numSteps = Math.min(7, Math.max(4, Math.ceil(maxTimeNeeded / stepSec)));

  const steps = [];
  let goalStepIndex = -1;
  let minGoalDiff = Infinity;

  for (let i = 1; i <= numSteps; i++) {
    const sSec = i * stepSec;
    const diff = Math.abs(sSec - goalSec);
    if (diff < minGoalDiff) {
      minGoalDiff = diff;
      goalStepIndex = i;
    }

    const h = sSec / 3600;
    let label = '';
    if (h >= 1) {
      label = Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
    } else {
      label = `${Math.round(sSec / 60)}m`;
    }

    steps.push({
      index: i,
      sec: sSec,
      label,
      isGoal: false,
      goalLabel: ''
    });
  }

  // Set the Red Flag goal step
  if (goalStepIndex > 0 && goalStepIndex <= steps.length) {
    steps[goalStepIndex - 1].isGoal = true;
    steps[goalStepIndex - 1].goalLabel = `${goalHours}h Goal`;
  }

  // Determine starting step for Diano (based on previous completed seconds)
  let startStep = 0;
  for (let i = 0; i < steps.length; i++) {
    if (safePrevSec >= steps[i].sec) {
      startStep = steps[i].index;
    } else if (i === 0 && safePrevSec >= steps[i].sec * 0.4) {
      startStep = 1;
    }
  }

  // Determine ending step for Diano (based on cumulative total seconds)
  let endStep = startStep;
  for (let i = 0; i < steps.length; i++) {
    if (totalSec >= steps[i].sec) {
      endStep = steps[i].index;
    } else if (totalSec > (i === 0 ? 0 : steps[i - 1].sec) + (steps[i].sec - (i === 0 ? 0 : steps[i - 1].sec)) * 0.4) {
      endStep = steps[i].index;
    }
  }

  // If a meaningful session (>= 3m) was logged and endStep didn't advance, advance 1 step if room
  if (safeSessionSec >= 180 && endStep === startStep && endStep < steps.length) {
    endStep = Math.min(steps.length, startStep + 1);
  }

  const reachedGoal = totalSec >= goalSec;
  const reachedGoalThisSession = (safePrevSec < goalSec && totalSec >= goalSec) || (safeSessionSec > 0 && reachedGoal);

  return {
    steps,
    goalStepIndex,
    startStep,
    endStep,
    goalSec,
    prevSec: safePrevSec,
    totalSec,
    goalHours,
    reachedGoal,
    reachedGoalThisSession
  };
}

function formatHMS(sec) {
  sec = Math.floor(Math.max(0, sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}h ${m > 0 ? `${m}m ` : ''}${s > 0 ? `${s}s` : ''}`.trim();
  }
  if (m > 0) {
    return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  }
  return `${s}s`;
}

export default function StairsOverlay({
  isOpen,
  seconds,
  prevSeconds = 0,
  dailyGoalHours = 2,
  distractions = [],
  isMuted = false,
  onClose,
  onResume
}) {
  const stairData = generateStairSteps(prevSeconds, seconds, dailyGoalHours);
  const [activeStep, setActiveStep] = useState(stairData.startStep);
  const [dianoPos, setDianoPos] = useState({ left: '3%', bottom: '0px' });
  const [jump, setJump] = useState(false);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);

  const review = getSessionReview(seconds);

  useEffect(() => {
    if (!isOpen) return;

    const start = stairData.startStep;
    const end = stairData.endStep;
    const stepCount = stairData.steps.length;

    // Initially position Diano at startStep (where they stood before this session)
    setActiveStep(start);
    if (start === 0) {
      setDianoPos({ left: '3%', bottom: '0px' });
    } else {
      const stepWidth = 100 / stepCount;
      const leftPct = (start - 0.5) * stepWidth;
      const bottomPx = Math.round((start / stepCount) * 130 + 36);
      setDianoPos({ left: `${leftPct}%`, bottom: `${bottomPx}px` });
    }
    setJump(false);
    setShowGoalCelebration(stairData.reachedGoal && start >= stairData.goalStepIndex);

    // If no steps climbed this session
    if (end <= start) {
      if (stairData.reachedGoal) {
        setShowGoalCelebration(true);
      }
      return;
    }

    const timers = [];
    const climbSteps = end - start;

    // Step-by-step climb animation from startStep up to endStep
    for (let offset = 1; offset <= climbSteps; offset++) {
      const targetS = start + offset;
      timers.push(
        setTimeout(() => {
          setActiveStep(targetS);
          const stepWidth = 100 / stepCount;
          const leftPct = (targetS - 0.5) * stepWidth;
          const bottomPx = Math.round((targetS / stepCount) * 130 + 36);
          setDianoPos({ left: `${leftPct}%`, bottom: `${bottomPx}px` });
          playSfx('check', isMuted);

          // Reached final climbed step
          if (targetS === end) {
            setTimeout(() => setJump(true), 250);

            // Reached or surpassed the Red Flag daily goal!
            if (targetS >= stairData.goalStepIndex && stairData.reachedGoal) {
              setTimeout(() => {
                triggerConfetti();
                playSfx('celebrate', isMuted);
                setShowGoalCelebration(true);
              }, 350);
            }
          }
        }, 350 + offset * 450)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [isOpen, stairData.startStep, stairData.endStep, stairData.steps.length, isMuted]);

  if (!isOpen) return null;

  return (
    <div
      id="stairs"
      role="dialog"
      aria-label="Session saved"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-[radial-gradient(55%_45%_at_50%_72%,rgba(240,178,90,0.18),transparent_75%),radial-gradient(circle_at_50%_45%,#1b2244,#0f1428_62%,#070a16)] text-[#f1ecff] text-center overflow-y-auto animate-fade-in"
    >
      {/* Header & Review Badge */}
      <div className="pt-2 max-w-xl w-full flex flex-col items-center">
        <div
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border shadow-sm transition-all"
          style={{
            color: review.badgeColor,
            backgroundColor: review.badgeBg,
            borderColor: review.badgeBorder
          }}
        >
          {review.badge}
        </div>

        <h2 className="serif text-[clamp(28px,5vw,52px)] leading-tight text-[#f6e7b8] mt-2 font-medium">
          {review.title}
        </h2>

        {/* Dual Duration Pill: This Session + Cumulative Day Progress */}
        <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
          <span
            className="serif text-xl sm:text-2xl font-normal"
            style={{ color: review.badgeColor }}
          >
            +{formatHMS(seconds)}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-200 border border-white/15">
            Total Today: <b className="text-[var(--lamp)]">{formatHMS(stairData.totalSec)}</b> / {dailyGoalHours}h
          </span>
        </div>

        {/* Dynamic Coach Reality Check & Push Message */}
        <div className="mt-3 w-full max-w-md p-3.5 rounded-2xl bg-black/40 border border-white/10 shadow-lg text-left backdrop-blur-md">
          <p className="text-xs sm:text-sm text-[#e2dcfc] leading-relaxed">
            {review.roastText}
          </p>

          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-start gap-2">
            <span className="text-sm shrink-0">
              {review.tier === 'micro' || review.tier === 'brief' ? '💪' : '💡'}
            </span>
            <p className="text-[11px] sm:text-xs font-medium text-[#ffd480] leading-snug">
              <strong className="text-white">Coach Tip: </strong>
              {review.coachAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Stairs & Red Flag Stage */}
      <div className="w-full max-w-[620px] flex flex-col items-center my-3 shrink-0 px-2">
        {/* Goal celebration banner */}
        {showGoalCelebration && (
          <div className="mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-rose-500/30 to-purple-500/25 border border-amber-400 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl animate-bounce">
            <span>🎉</span>
            <span>Daily Goal Cleared! {dailyGoalHours}h Red Flag Milestone Conquered!</span>
            <span>🏆</span>
          </div>
        )}

        <div className="relative w-full h-[220px] sm:h-[240px] flex items-end border-b-2 border-[var(--lamp)] px-2 sm:px-4">
          {stairData.steps.map((st) => {
            const isReached = st.index <= activeStep;
            return (
              <div
                key={st.index}
                className={`flex-1 flex flex-col justify-start items-center text-[11px] pt-1.5 relative transition-all duration-300 border-t-2 border-l ${
                  isReached
                    ? 'bg-gradient-to-b from-[rgba(240,178,90,0.5)] to-[rgba(240,178,90,0.12)] border-t-[var(--lamp)] text-[var(--lamp)] font-bold'
                    : 'bg-gradient-to-b from-[rgba(240,178,90,0.12)] to-[rgba(240,178,90,0.02)] border-t-[rgba(240,178,90,0.3)] border-l-[rgba(240,178,90,0.2)] text-[#a9a2cf]'
                }`}
                style={{ height: `${Math.round((st.index / stairData.steps.length) * 130 + 36)}px` }}
              >
                {/* Step time label */}
                <span className="text-[10px] sm:text-[11px] font-semibold">{st.label}</span>

                {/* Red Flag for Daily Goal Step */}
                {st.isGoal && (
                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none">
                    <div
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg transition-all duration-500 whitespace-nowrap ${
                        activeStep >= st.index
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-amber-300 shadow-rose-500/50 scale-105'
                          : 'bg-rose-600 text-white shadow-rose-900/60'
                      }`}
                    >
                      <span>🚩</span>
                      <span>{st.goalLabel}</span>
                      {activeStep >= st.index && <span className="text-amber-200">⭐</span>}
                    </div>
                    <div className={`w-0.5 h-3 ${activeStep >= st.index ? 'bg-amber-300' : 'bg-rose-400'}`} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Diano Mascot climbing */}
          <div
            className={`absolute w-[50px] sm:w-[58px] h-[50px] sm:h-[58px] transition-all duration-500 pointer-events-none z-30 ${
              jump ? 'stairs-jump' : ''
            }`}
            style={{
              left: dianoPos.left,
              bottom: dianoPos.bottom,
              transform: 'translate(-50%, 0)'
            }}
          >
            <svg className="w-full h-full">
              <use href="#dn" />
            </svg>
          </div>
        </div>

        {/* Dynamic progress & stair note indicator */}
        <div className="flex flex-col items-center gap-1 mt-2.5">
          <p className="text-xs sm:text-sm text-[#ffd480] font-semibold">
            {activeStep >= stairData.goalStepIndex
              ? `🏆 Target Achieved: ${formatHMS(stairData.totalSec)} logged today!`
              : `🚩 ${Math.max(1, Math.round((stairData.goalSec - stairData.totalSec) / 60))}m left to reach your ${dailyGoalHours}h Red Flag!`}
          </p>
          <p className="text-[11px] text-[#b4aecd]">
            {review.stairNote}
          </p>
        </div>
      </div>

      {/* Parked Distraction Recap */}
      {distractions.length > 0 && (
        <div className="w-full max-w-md my-2 p-3.5 rounded-2xl glass-panel border border-purple-400/40 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200 mb-1.5">
            <span>🧠</span>
            <span>Your Distraction Parking Lot ({distractions.length} saved thoughts):</span>
          </div>
          <ul className="flex flex-col gap-1 max-h-[100px] overflow-y-auto pr-1">
            {distractions.map((thought, idx) => (
              <li
                key={idx}
                className="text-xs text-white bg-black/40 px-3 py-1 rounded-lg border border-purple-300/20 flex items-center gap-2"
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="line-through text-gray-300 opacity-90">{thought}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pb-3 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
        {/* Resume button (Push Harder for short sessions, or Continue Session for longer blocks) */}
        {onResume && (
          <button
            type="button"
            onClick={onResume}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:brightness-110 shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔥</span>
            <span>{review.allowResume ? 'Push Harder · Jump Back In' : 'Continue Session · Keep Stacking'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className={`w-full sm:w-auto rounded-full px-6 py-2.5 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
            review.allowResume
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : 'border border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] hover:brightness-110 shadow-lg'
          }`}
        >
          {review.allowResume ? 'Close & Keep Record' : 'Back to Today'}
        </button>
      </div>
    </div>
  );
}
