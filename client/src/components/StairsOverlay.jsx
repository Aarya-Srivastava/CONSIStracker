import React, { useEffect, useState } from 'react';

export default function StairsOverlay({ isOpen, seconds, distractions = [], onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const [dianoPos, setDianoPos] = useState({ left: 4, bottom: 0 });
  const [jump, setJump] = useState(false);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const unit = m > 75 ? 30 : 15;
  const targetSteps = Math.min(5, Math.max(seconds > 0 ? 1 : 0, Math.ceil(m / unit)));

  useEffect(() => {
    if (!isOpen) return;

    setActiveStep(0);
    setDianoPos({ left: 4, bottom: 0 });
    setJump(false);

    const timers = [];
    for (let i = 1; i <= targetSteps; i++) {
      timers.push(
        setTimeout(() => {
          setActiveStep(i);
          const stepLeft = 64 + (i - 0.5) * 88;
          setDianoPos({ left: stepLeft, bottom: i * 44 });
          if (i === targetSteps) {
            setTimeout(() => setJump(true), 450);
          }
        }, i * 500)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [isOpen, targetSteps]);

  if (!isOpen) return null;

  const durationText = m
    ? `${m} minute${m > 1 ? 's' : ''}${s ? ` ${s}s` : ''} focused`
    : `${s} second${s !== 1 ? 's' : ''} focused`;

  const msgText =
    m >= 60
      ? 'A long, deep stretch. You reached the top step.'
      : m >= 30
      ? 'Steady, meaningful progress. This is how habits form.'
      : m >= 15
      ? 'A solid block in the bank.'
      : 'Showing up counts. Tomorrow’s session starts easier.';

  return (
    <div
      id="stairs"
      role="dialog"
      aria-label="Session saved"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-8 bg-[radial-gradient(55%_45%_at_50%_72%,rgba(240,178,90,0.18),transparent_75%),radial-gradient(circle_at_50%_45%,#1b2244,#0f1428_62%,#070a16)] text-[#f1ecff] text-center overflow-y-auto"
    >
      <div className="pt-2">
        <span className="text-xs text-[var(--lamp)] border border-[var(--line)] rounded-full px-4 py-1.5 font-medium">
          Session saved
        </span>
        <h2 className="serif text-[clamp(36px,6vw,60px)] leading-tight text-[#f6e7b8] mt-2">
          Well done.
        </h2>
        <div className="serif text-xl sm:text-2xl text-[var(--lamp)] font-normal">
          {durationText}
        </div>
        <p className="text-xs sm:text-sm max-w-md text-[#c9c3ee] mt-1 mx-auto">
          {msgText}
        </p>
      </div>

      {/* Stairs stage */}
      <div className="relative w-full max-w-[560px] h-[220px] sm:h-[260px] flex items-end border-b-2 border-[var(--lamp)] my-4 pl-12 sm:pl-16 shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex-1 flex flex-col justify-start items-center text-[11px] pt-1.5 transition-all duration-300 border-t-2 border-l ${
              i <= activeStep
                ? 'bg-gradient-to-b from-[rgba(240,178,90,0.45)] to-[rgba(240,178,90,0.1)] border-t-[var(--lamp)] text-[var(--lamp)] font-semibold'
                : 'bg-gradient-to-b from-[rgba(240,178,90,0.14)] to-[rgba(240,178,90,0.03)] border-t-[rgba(240,178,90,0.3)] border-l-[rgba(240,178,90,0.2)] text-[#a9a2cf]'
            }`}
            style={{ height: `${i * 44}px` }}
          >
            {unit * i}m
          </div>
        ))}

        {/* Mascot climbing */}
        <div
          className={`absolute w-[54px] sm:w-[60px] h-[54px] sm:h-[60px] transition-all duration-500 pointer-events-none ${
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

      {/* Parked Distraction Recap */}
      {distractions.length > 0 && (
        <div className="w-full max-w-md my-3 p-4 rounded-2xl glass-panel border border-purple-400/40 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200 mb-2">
            <span>🧠</span>
            <span>Your Distraction Parking Lot ({distractions.length} saved thoughts):</span>
          </div>
          <p className="text-[11px] text-gray-300 mb-2.5">
            You successfully resisted tab-switching! Here is what you parked to check now:
          </p>
          <ul className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
            {distractions.map((thought, idx) => (
              <li
                key={idx}
                className="text-xs text-white bg-black/40 px-3 py-1.5 rounded-lg border border-purple-300/20 flex items-center gap-2"
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="line-through text-gray-300 opacity-90">{thought}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pb-4">
        <button
          type="button"
          onClick={onClose}
          className="border border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] rounded-full px-8 py-3 font-semibold text-sm hover:brightness-110 transition-all cursor-pointer shadow-lg"
        >
          Back to today
        </button>
      </div>
    </div>
  );
}
