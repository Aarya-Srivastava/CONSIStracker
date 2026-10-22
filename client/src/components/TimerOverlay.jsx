import React, { useState, useEffect, useRef } from 'react';
import { playSfx, startAmbient, stopAmbient, setAmbientVolume, getAmbientState } from '../utils/audio';

const SARCASTIC_TAB_ROASTS = [
  (mins) => `Away for ${mins}m? Let me guess, "essential research" on YouTube?`,
  (mins) => `Welcome back! Your streak held its breath for ${mins} minutes.`,
  (mins) => `${mins} minutes in another tab? The deadline was asking about you.`,
  (mins) => `Look who returned! Did you find what you were wandering for?`,
  (mins) => `Diano saw that tab switch. ${mins} minutes of procrastination noted.`
];

export default function TimerOverlay({
  isOpen,
  mode, // 'open' | 'strict' | 'pomo25' | 'pomo50' | 'pact5'
  activeTag,
  seconds,
  isPaused,
  isMuted,
  distractions = [],
  onAddDistraction,
  onPauseToggle,
  onEndSession
}) {
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [thoughtInput, setThoughtInput] = useState('');
  const [thoughtSavedMsg, setThoughtSavedMsg] = useState('');

  // Sarcastic Tab Guard
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [tabRoastMsg, setTabRoastMsg] = useState('');
  const awayTimerRef = useRef(null);
  const titleFlashRef = useRef(null);

  // False Reading / Time Sanity Check State
  const [showSanityCheck, setShowSanityCheck] = useState(false);
  const [customTrimMin, setCustomTrimMin] = useState(25);

  // Ambient Soundscape State
  const [ambientType, setAmbientType] = useState('off');

  // Sync ambient sound with timer open/paused state
  useEffect(() => {
    if (isOpen && !isPaused && ambientType !== 'off') {
      startAmbient(ambientType, isMuted);
    } else {
      stopAmbient();
    }
    return () => {
      stopAmbient();
    };
  }, [isOpen, isPaused, ambientType, isMuted]);

  const handleAmbientToggle = (type) => {
    setAmbientType(type);
    if (type === 'off') {
      stopAmbient();
    } else if (isOpen && !isPaused) {
      startAmbient(type, isMuted);
    }
  };

  const fmt = (t) => {
    t = Math.floor(Math.max(0, t || 0));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Keyboard shortcut: Press 'D' to open Brain Dump
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'd' || e.key === 'D') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowBrainDump((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Tab Guard title flasher & away tracker
  useEffect(() => {
    if (!isOpen) return;

    const titles = [
      '👀 Already on YouTube?',
      '🚨 Diano sees you procrastinating',
      '🦆 Your streak is weeping',
      '📱 Did you pick up your phone?'
    ];
    let titleIdx = 0;

    const handleVisibility = () => {
      if (document.hidden) {
        // Start counting away seconds & flashing title
        let startAway = Date.now();
        clearInterval(awayTimerRef.current);
        clearInterval(titleFlashRef.current);

        awayTimerRef.current = setInterval(() => {
          setAwaySeconds(Math.floor((Date.now() - startAway) / 1000));
        }, 1000);

        titleFlashRef.current = setInterval(() => {
          titleIdx = (titleIdx + 1) % titles.length;
          document.title = titles[titleIdx];
        }, 1800);
      } else {
        // User returned!
        clearInterval(awayTimerRef.current);
        clearInterval(titleFlashRef.current);
        document.title = 'CONSIStracker';

        setAwaySeconds((currAway) => {
          if (currAway >= 45) {
            const mins = Math.max(1, Math.round(currAway / 60));
            const pickRoast = SARCASTIC_TAB_ROASTS[Math.floor(Math.random() * SARCASTIC_TAB_ROASTS.length)];
            setTabRoastMsg(pickRoast(mins));
            setTimeout(() => setTabRoastMsg(''), 7000);
          }
          return 0;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(awayTimerRef.current);
      clearInterval(titleFlashRef.current);
      document.title = 'CONSIStracker';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Pomodoro / Pact Countdown calculations
  let targetLimit = 0;
  let isCountdown = false;
  let modeLabel = 'Flexible mode';

  if (mode === 'strict') {
    modeLabel = 'Strict mode';
  } else if (mode === 'pomo25') {
    modeLabel = 'Pomodoro (25m Focus)';
    targetLimit = 25 * 60;
    isCountdown = true;
  } else if (mode === 'pomo50') {
    modeLabel = 'Deep Work (50m Focus)';
    targetLimit = 50 * 60;
    isCountdown = true;
  } else if (mode === 'pact5') {
    modeLabel = 'The 5-Minute Pact';
    targetLimit = 5 * 60;
    isCountdown = true;
  }

  const remainingSec = isCountdown ? Math.max(0, targetLimit - seconds) : seconds;
  const isTargetCompleted = isCountdown && seconds >= targetLimit;

  // Handle Brain Dump submission
  const handleSaveThought = (e) => {
    e.preventDefault();
    if (!thoughtInput.trim()) return;

    onAddDistraction(thoughtInput.trim());
    setThoughtInput('');
    setThoughtSavedMsg('Parked! Your mind is free to focus.');
    playSfx('beep', isMuted);

    setTimeout(() => {
      setThoughtSavedMsg('');
      setShowBrainDump(false);
    }, 1200);
  };

  // Attempt ending session: check if runaway / false reading
  const handleAttemptEnd = () => {
    // If timer ran for more than 45 minutes or user was away for > 15 minutes, trigger Sanity Check!
    if (seconds >= 45 * 60) {
      setShowSanityCheck(true);
    } else {
      onEndSession(Math.floor(seconds));
    }
  };

  const confirmTrimmedTime = (minutes) => {
    setShowSanityCheck(false);
    onEndSession(Math.min(Math.floor(seconds), Math.max(60, minutes * 60)));
  };

  const confirmDiscard = () => {
    setShowSanityCheck(false);
    onEndSession(0); // discard session
  };

  return (
    <div
      id="fs"
      role="dialog"
      aria-label="Focus session"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-8 bg-[rgba(14,11,32,0.94)] backdrop-blur-xl text-[#f1ecff] select-none"
    >
      {/* Sarcastic Tab Return Roast Banner */}
      {tabRoastMsg && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl glass-panel border border-amber-400/60 shadow-2xl text-amber-200 text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce max-w-md text-center">
          <span className="text-lg">🦆</span>
          <span>{tabRoastMsg}</span>
        </div>
      )}

      {/* Top Bar: Mode, Active Tag, & Brain Dump Trigger */}
      <div className="flex items-center justify-between w-full max-w-2xl pt-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-[var(--lamp)] border border-[var(--line)] rounded-full px-4 py-1.5 font-medium tracking-wide">
            {modeLabel}
          </div>
          {activeTag && (
            <div
              className="text-xs rounded-full px-3.5 py-1.5 font-semibold flex items-center gap-1.5 border"
              style={{
                backgroundColor: `${activeTag.color}25`,
                borderColor: activeTag.color,
                color: activeTag.color
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTag.color }} />
              {activeTag.name}
            </div>
          )}
        </div>

        {/* Brain Dump / Distraction Parking Lot Button */}
        <button
          type="button"
          onClick={() => setShowBrainDump(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-purple-400/40 bg-purple-500/15 text-purple-200 hover:bg-purple-500/30 transition-all cursor-pointer shadow-sm"
        >
          <span>🧠</span>
          <span>Brain Dump</span>
          <kbd className="hidden sm:inline bg-purple-900/60 px-1.5 py-0.5 rounded text-[10px] text-purple-300 font-mono">
            D
          </kbd>
          {distractions.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-purple-400 text-black text-[10px] font-bold flex items-center justify-center ml-0.5">
              {distractions.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Center Clock / Countdown */}
      <div className="flex flex-col items-center justify-center my-auto text-center">
        {isCountdown && (
          <div className="text-xs uppercase tracking-widest text-[var(--mut)] mb-2 font-semibold">
            {isTargetCompleted ? '🎉 Goal Completed! Keep rolling or wrap up:' : 'Remaining Focus Time:'}
          </div>
        )}

        <div className="serif text-[clamp(68px,17vw,160px)] leading-none tabular-nums text-white drop-shadow-[0_0_60px_rgba(240,178,90,0.55)]">
          {fmt(isCountdown ? remainingSec : seconds)}
        </div>

        {/* Elapsed counter for Pomodoro / Pact */}
        {isCountdown && (
          <div className="text-xs sm:text-sm text-[var(--mut)] mt-3">
            Total elapsed: <b className="text-white">{fmt(seconds)}</b>
          </div>
        )}

        {/* Status text */}
        <div className="text-xs sm:text-sm text-[var(--lamp)] min-h-[24px] mt-2">
          {isPaused
            ? "Paused. This time isn't counted."
            : isTargetCompleted
            ? '🔥 Target reached! Bonus momentum unlocked.'
            : ''}
        </div>
      </div>

      {/* Ambient Soundscape Dock */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg flex-wrap justify-center">
          <span className="text-[11px] text-gray-400 font-medium px-2 flex items-center gap-1">
            <span>🎧</span>
            <span className="hidden sm:inline">Soundscape:</span>
          </span>
          {[
            { id: 'off', label: 'Off', icon: '🔇' },
            { id: 'brown', label: 'Brown Noise', icon: '☕' },
            { id: 'rain', label: 'Rain', icon: '🌧️' },
            { id: 'drone', label: '432Hz Drone', icon: '🧘' }
          ].map((amb) => {
            const isSelected = ambientType === amb.id;
            return (
              <button
                key={amb.id}
                type="button"
                onClick={() => handleAmbientToggle(amb.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--lamp)] text-[#1b1730] font-bold shadow-md scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{amb.icon}</span>
                <span>{amb.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex gap-4 justify-center pb-6 flex-wrap">
        <button
          type="button"
          onClick={onPauseToggle}
          className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-8 py-3.5 font-semibold text-sm hover:border-[var(--lamp)] transition-colors cursor-pointer"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          onClick={handleAttemptEnd}
          className="border border-[var(--line)] bg-[var(--surf2)] rounded-full px-8 py-3.5 font-semibold text-sm text-[var(--warn)] hover:border-[var(--warn)] transition-colors cursor-pointer"
        >
          End session
        </button>
      </div>

      {/* Brain Dump / Distraction Collector Drawer Modal */}
      {showBrainDump && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl w-full max-w-md shadow-2xl border border-purple-400/50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="serif text-xl font-normal text-white flex items-center gap-2">
                <span>🧠</span>
                <span>Brain Dump / Distraction Parking Lot</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowBrainDump(false)}
                className="text-gray-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-purple-200/80 mb-4">
              Got a random thought or urge to look something up? Park it here so you don’t switch tabs. Check it when your session finishes.
            </p>

            <form onSubmit={handleSaveThought} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                value={thoughtInput}
                onChange={(e) => setThoughtInput(e.target.value)}
                placeholder="e.g. Check flight prices, reply to Alex, buy coffee..."
                className="w-full bg-black/50 border border-purple-300/40 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none focus:border-purple-400"
              />

              {thoughtSavedMsg && (
                <div className="text-xs font-semibold text-emerald-300 text-center animate-fade-in">
                  ✓ {thoughtSavedMsg}
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <span className="text-[11px] text-gray-400">
                  {distractions.length} thought{distractions.length !== 1 ? 's' : ''} currently parked
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBrainDump(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-md cursor-pointer"
                  >
                    Park Thought (Enter)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Time Sanity Check Modal (Solves "Forgot to turn off timer") */}
      {showSanityCheck && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-7 rounded-[26px] w-full max-w-lg shadow-2xl border border-amber-400/50 text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">⏱️</span>
              <div>
                <h4 className="serif text-2xl font-normal text-white">Time Sanity Check</h4>
                <p className="text-xs text-amber-300 font-medium">Anti-False Reading Protection</p>
              </div>
            </div>

            <p className="text-sm text-gray-200 my-4 leading-relaxed">
              Your timer clocked <b className="text-amber-300 text-base">{fmt(seconds)}</b>. Did you study the whole time, or did you leave the timer running by mistake?
            </p>

            <div className="flex flex-col gap-2.5 my-4">
              <button
                type="button"
                onClick={() => onEndSession(Math.floor(seconds))}
                className="w-full text-left p-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm flex justify-between items-center cursor-pointer transition-colors"
              >
                <span>Yes, I was fully focused the entire time</span>
                <b className="text-amber-300">{fmt(seconds)}</b>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => confirmTrimmedTime(25)}
                  className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-xs text-white text-center cursor-pointer"
                >
                  Trim to <b>25m</b>
                </button>
                <button
                  type="button"
                  onClick={() => confirmTrimmedTime(45)}
                  className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-xs text-white text-center cursor-pointer"
                >
                  Trim to <b>45m</b>
                </button>
                <button
                  type="button"
                  onClick={() => confirmTrimmedTime(60)}
                  className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-xs text-white text-center cursor-pointer"
                >
                  Trim to <b>1 hour</b>
                </button>
              </div>

              {/* Custom Trim Input */}
              <div className="flex gap-2 items-center mt-1">
                <span className="text-xs text-gray-300 shrink-0">Custom minutes:</span>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={customTrimMin}
                  onChange={(e) => setCustomTrimMin(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => confirmTrimmedTime(customTrimMin)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={confirmDiscard}
                className="text-xs text-rose-300 hover:text-rose-200 underline cursor-pointer"
              >
                Discard this session (Accidental run)
              </button>
              <button
                type="button"
                onClick={() => setShowSanityCheck(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
