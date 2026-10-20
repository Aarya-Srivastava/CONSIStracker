import React, { useEffect, useState } from 'react';

// Time-spent review tiers with realistic, motivating feedback
export function getSessionReview(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

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
      stairNote: '🐾 First stair unlocks at 15m. Push yourself to take step 1!'
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
      targetSteps: 0,
      dianoMood: 'motivating',
      allowResume: true,
      canCelebrate: false,
      stairNote: '🐾 Almost there! Reach 15 minutes to conquer Step 1.'
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
      stairNote: '🎯 Step 1 conquered! The resistance barrier is broken.'
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
      stairNote: '🔥 Step 2 reached! Solid disciplined block.'
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
      stairNote: '⚡ Step 3 ascended! Deep flow momentum locked in.'
    };
  }

  // 60+ minutes
  const hrs = Math.floor(m / 60);
  const remM = m % 60;
  return {
    tier: 'elite',
    badge: '👑 Peak Discipline · Masterclass',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.18)',
    badgeBorder: 'rgba(251, 191, 36, 0.5)',
    title: 'Outstanding Discipline.',
    durationText: `${hrs}h ${remM > 0 ? `${remM}m` : ''} focused`,
    roastText: `An elite ${hrs}h+ deep work stretch! You climbed to the very top step of the consistency staircase today.`,
    coachAdvice: 'Time for a mandatory rest: hydrate, stretch your legs, rest your eyes, and take pride in this win.',
    targetSteps: 5,
    dianoMood: 'master',
    allowResume: false,
    canCelebrate: true,
    stairNote: '🏆 Top of the stairs reached! Elite endurance unlocked.'
  };
}

export default function StairsOverlay({
  isOpen,
  seconds,
  distractions = [],
  onClose,
  onResume
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [dianoPos, setDianoPos] = useState({ left: 32, bottom: 0 });
  const [jump, setJump] = useState(false);

  const review = getSessionReview(seconds);
  const unit = 15;

  useEffect(() => {
    if (!isOpen) return;

    setActiveStep(0);
    setDianoPos({ left: 32, bottom: 0 });
    setJump(false);

    if (review.targetSteps === 0) {
      // For micro sessions, Diano stays at the base of stairs
      setDianoPos({ left: 32, bottom: 0 });
      return;
    }

    const timers = [];
    for (let i = 1; i <= review.targetSteps; i++) {
      timers.push(
        setTimeout(() => {
          setActiveStep(i);
          const stepLeft = 64 + (i - 0.5) * 88;
          setDianoPos({ left: stepLeft, bottom: i * 44 });
          if (i === review.targetSteps && review.canCelebrate) {
            setTimeout(() => setJump(true), 450);
          }
        }, i * 450)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [isOpen, review.targetSteps, review.canCelebrate]);

  if (!isOpen) return null;

  return (
    <div
      id="stairs"
      role="dialog"
      aria-label="Session saved"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-[radial-gradient(55%_45%_at_50%_72%,rgba(240,178,90,0.18),transparent_75%),radial-gradient(circle_at_50%_45%,#1b2244,#0f1428_62%,#070a16)] text-[#f1ecff] text-center overflow-y-auto"
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

        <div
          className="serif text-xl sm:text-2xl font-normal mt-0.5"
          style={{ color: review.badgeColor }}
        >
          {review.durationText}
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

      {/* Stairs stage */}
      <div className="w-full max-w-[560px] flex flex-col items-center my-3 shrink-0">
        <div className="relative w-full h-[200px] sm:h-[230px] flex items-end border-b-2 border-[var(--lamp)] pl-10 sm:pl-16">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex-1 flex flex-col justify-start items-center text-[11px] pt-1.5 transition-all duration-300 border-t-2 border-l ${
                i <= activeStep
                  ? 'bg-gradient-to-b from-[rgba(240,178,90,0.45)] to-[rgba(240,178,90,0.1)] border-t-[var(--lamp)] text-[var(--lamp)] font-semibold'
                  : 'bg-gradient-to-b from-[rgba(240,178,90,0.14)] to-[rgba(240,178,90,0.03)] border-t-[rgba(240,178,90,0.3)] border-l-[rgba(240,178,90,0.2)] text-[#a9a2cf]'
              }`}
              style={{ height: `${i * 38}px` }}
            >
              {unit * i}m
            </div>
          ))}

          {/* Mascot climbing */}
          <div
            className={`absolute w-[50px] sm:w-[58px] h-[50px] sm:h-[58px] transition-all duration-500 pointer-events-none ${
              jump ? 'stairs-jump' : ''
            }`}
            style={{
              left: `${dianoPos.left}px`,
              bottom: `${dianoPos.bottom}px`,
              transform: 'translate(-50%, 0)'
            }}
          >
            <svg className="w-full h-full">
              <use href="#dn" />
            </svg>
          </div>
        </div>

        {/* Stair note indicator */}
        <p className="text-[11px] text-[#b4aecd] mt-2 font-medium">
          {review.stairNote}
        </p>
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
        {/* If session was short, provide a prominent "Push Harder & Resume" button */}
        {review.allowResume && onResume && (
          <button
            type="button"
            onClick={onResume}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:brightness-110 shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔥</span>
            <span>Push Harder · Jump Back In</span>
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
