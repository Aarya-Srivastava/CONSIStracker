import React, { useState, useEffect } from 'react';

const MESSAGES = [
  ["You Woke Up ? Wow!", "The world isn't going to save itself, but maybe start with your to-do list? Or just keep hanging out."],
  ["Oh, You're Back.", "Your goals called. They said they're starting to feel like a rumor."],
  ["Look Who Showed Up!", "Bold of you to open a consistency tracker after yesterday's performance."],
  ["Day 1. Again.", "Consistency is just Day 1 repeated with better PR. Let's pretend this is the real one."],
  ["Productivity Awaits.", "Right after you scroll for 'just five more minutes'. We've seen how that goes."],
  ["Ah, The Procrastinator.", "Don't worry, the deadline is also thinking about you. Constantly."],
  ["Still Alive? Great.", "Low bar, I know. But hey, you cleared it. Now try the second one."],
  ["Motivation Not Found.", "Discipline, however, is on a different shelf. Go get it."],
  ["Wow, A Visitor.", "Your streak says 'It's complicated.' Let's fix that, shall we?"],
  ["Rise And Grind.", "Or rise and stare at the ceiling. We track both, but only one counts."]
];

const GLASSES_OPTIONS = [
  // 3D glasses
  (
    <g key="3d">
      <rect x="-38" y="-55" width="34" height="24" fill="rgba(6, 182, 212, 0.85)" stroke="#0F172A" strokeWidth="3" rx="4"/>
      <rect x="4" y="-55" width="34" height="24" fill="rgba(239, 68, 68, 0.85)" stroke="#0F172A" strokeWidth="3" rx="4"/>
      <line x1="-4" y1="-43" x2="4" y2="-43" stroke="#0F172A" strokeWidth="4"/>
    </g>
  ),
  // Sunglasses
  (
    <g key="sun">
      <rect x="-40" y="-55" width="36" height="22" fill="#0F172A" stroke="#020617" strokeWidth="2" rx="8"/>
      <rect x="4" y="-55" width="36" height="22" fill="#0F172A" stroke="#020617" strokeWidth="2" rx="8"/>
      <line x1="-4" y1="-47" x2="4" y2="-47" stroke="#020617" strokeWidth="4"/>
      <line x1="-34" y1="-50" x2="-26" y2="-44" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <line x1="10" y1="-50" x2="18" y2="-44" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
    </g>
  ),
  // Nerd glasses
  (
    <g key="nerd">
      <circle cx="-20" cy="-43" r="14" fill="rgba(255,255,255,0.25)" stroke="#1E293B" strokeWidth="3"/>
      <circle cx="20" cy="-43" r="14" fill="rgba(255,255,255,0.25)" stroke="#1E293B" strokeWidth="3"/>
      <line x1="-6" y1="-43" x2="6" y2="-43" stroke="#1E293B" strokeWidth="3"/>
    </g>
  ),
  // Fancy monocle
  (
    <g key="monocle">
      <circle cx="20" cy="-43" r="14" fill="rgba(255,255,255,0.25)" stroke="#CA8A04" strokeWidth="3"/>
      <path d="M 34 -40 Q 50 -10 40 20" fill="none" stroke="#CA8A04" strokeWidth="2"/>
    </g>
  )
];

const MOUTH_OPTIONS = [
  // Cigarette
  (
    <g key="cig" transform="rotate(-15) translate(-10, 0)">
      <rect x="-60" y="10" width="35" height="8" fill="#F1F5F9" stroke="#334155" strokeWidth="2"/>
      <rect x="-25" y="10" width="12" height="8" fill="#D97706" stroke="#334155" strokeWidth="2"/>
      <circle cx="-60" cy="14" r="4" fill="#EF4444"/>
      <path d="M -65,14 Q -80,25 -70,40 T -85,65" fill="none" stroke="rgba(200, 200, 200, 0.7)" strokeWidth="4" className="p1-smoke"/>
    </g>
  ),
  // Coffee mug
  (
    <g key="mug" transform="rotate(-15) translate(-10, 0)">
      <rect x="-62" y="2" width="28" height="26" rx="4" fill="#F8FAFC" stroke="#334155" strokeWidth="2"/>
      <path d="M -34 8 Q -22 8 -34 22" fill="none" stroke="#334155" strokeWidth="3"/>
      <path d="M -54 -2 Q -60 -14 -52 -24" fill="none" stroke="rgba(200, 200, 200, 0.8)" strokeWidth="4" className="p1-smoke"/>
      <path d="M -44 -2 Q -50 -14 -42 -24" fill="none" stroke="rgba(200, 200, 200, 0.8)" strokeWidth="4" className="p1-smoke"/>
    </g>
  ),
  // Lollipop
  (
    <g key="lollipop" transform="rotate(-15) translate(-10, 0)">
      <line x1="-14" y1="14" x2="-62" y2="14" stroke="#F1F5F9" strokeWidth="4"/>
      <circle cx="-72" cy="14" r="13" fill="#EC4899" stroke="#9D174D" strokeWidth="2"/>
      <path d="M -72 14 m -7 0 a 7 7 0 1 1 7 7" fill="none" stroke="#fff" strokeWidth="2.5"/>
    </g>
  ),
  // Toothpick
  (
    <g key="toothpick" transform="rotate(-15) translate(-10, 0)">
      <line x1="-14" y1="14" x2="-70" y2="8" stroke="#D6A75E" strokeWidth="3" strokeLinecap="round"/>
    </g>
  )
];

export default function Phase1Intro({ onContinue }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [glassesIdx, setGlassesIdx] = useState(0);
  const [mouthIdx, setMouthIdx] = useState(0);

  useEffect(() => {
    // Select randomized quote without repeating last one
    let mi = Math.floor(Math.random() * MESSAGES.length);
    try {
      const last = parseInt(localStorage.getItem('consis-last-msg'), 10);
      if (MESSAGES.length > 1 && mi === last) mi = (mi + 1) % MESSAGES.length;
      localStorage.setItem('consis-last-msg', String(mi));
    } catch (e) {}
    setMsgIndex(mi);
    setGlassesIdx(Math.floor(Math.random() * GLASSES_OPTIONS.length));
    setMouthIdx(Math.floor(Math.random() * MOUTH_OPTIONS.length));
  }, []);

  return (
    <div
      id="phase1-wrapper"
      role="region"
      aria-labelledby="p1-title"
      onClick={onContinue}
      className="absolute inset-0 z-50 flex flex-col items-center justify-between cursor-pointer bg-black/40 backdrop-blur-sm p-4 overflow-y-auto select-none"
    >
      {/* Sarcastic Duck (Upside Down, Top Right) */}
      <div className="absolute top-0 right-[5%] md:right-[15%] w-[260px] h-[380px] pointer-events-none">
        <svg viewBox="0 0 250 350" className="w-full h-full drop-shadow-2xl overflow-visible">
          {/* Wires */}
          <g id="p1-wires">
            <path d="M 125 0 Q 130 50 125 100" fill="none" stroke="#1F2937" strokeWidth="6"/>
            <path d="M 125,100 Q 50,150 80,210 T 70,250" fill="none" stroke="#DC2626" strokeWidth="4"/>
            <path d="M 125,100 Q 180,170 150,230 T 170,260" fill="none" stroke="#475569" strokeWidth="3"/>
          </g>

          {/* Duck Body */}
          <g transform="translate(125, 200) rotate(180)">
            {/* Note Book Dangling */}
            <g transform="translate(40, -40) rotate(20)">
              <rect x="-15" y="-20" width="30" height="40" fill="#F8FAFC" stroke="#475569" strokeWidth="2"/>
              <line x1="-10" y1="-10" x2="10" y2="-10" stroke="#94A3B8" strokeWidth="1.5"/>
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#94A3B8" strokeWidth="1.5"/>
              <line x1="-10" y1="10" x2="5" y2="10" stroke="#94A3B8" strokeWidth="1.5"/>
            </g>

            <path d="M -35,0 C -45,-80 45,-80 35,0 C 35,80 65,120 65,170 C 65,200 -65,200 -65,170 C -65,120 -35,80 -35,0 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="3"/>
            {/* Wings */}
            <path d="M -35,50 Q -60,100 -50,150" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round"/>
            <path d="M 35,50 Q 60,100 50,150" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round"/>
            {/* Beak */}
            <path d="M -30,-10 C -55,20 0,60 30,-10 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="2"/>
            {/* Feet hanging onto wire */}
            <path d="M -15,190 L -40,235 L 10,235 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="2"/>
            <path d="M 15,190 L 40,235 L -10,235 Z" fill="#EA580C" stroke="#9A3412" strokeWidth="2"/>

            {/* Randomized Glasses */}
            {GLASSES_OPTIONS[glassesIdx]}

            {/* Randomized Mouth Accessory */}
            {MOUTH_OPTIONS[mouthIdx]}
          </g>
        </svg>
      </div>

      {/* Spacing for mobile so text doesn't overlap duck */}
      <div className="h-[280px] md:h-[120px] shrink-0"></div>

      {/* Sarcastic Text Block */}
      <div className="text-center z-10 pointer-events-none relative px-4 my-auto">
        <h1 id="p1-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-2xl text-white">
          {MESSAGES[msgIndex][0]}
        </h1>
        <p id="p1-sub" className="text-base sm:text-lg md:text-2xl font-light max-w-3xl mx-auto px-4 leading-relaxed text-gray-200" style={{ textShadow: '0 1px 14px rgba(0, 0, 0, 0.5)' }}>
          {MESSAGES[msgIndex][1]}
        </p>
      </div>

      {/* Continue Prompt */}
      <div className="mb-8 md:mb-12 shrink-0 z-20">
        <button
          type="button"
          id="p1-continue-btn"
          className="glass-panel animate-pulse px-8 sm:px-10 py-3 sm:py-4 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase text-white border-white/40 cursor-pointer hover:bg-white/20 transition-colors"
        >
          Tap anywhere to continue
        </button>
      </div>
    </div>
  );
}
