import React, { useState, useEffect } from 'react';
import { playSfx } from '../utils/audio';

export default function EveningRitualModal({ isOpen, isMuted, onClose, onComplete }) {
  const [isOut, setIsOut] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [stageClass, setStageClass] = useState(''); // 'in' | 'ex' | ''
  const [isEyesClosed, setIsEyesClosed] = useState(false);
  const [isMouthBlowing, setIsMouthBlowing] = useState(false);
  const [isPuff, setIsPuff] = useState(false);
  const [isFlameOff, setIsFlameOff] = useState(false);
  const [isGlowOff, setIsGlowOff] = useState(false);
  const [isSmokeOn, setIsSmokeOn] = useState(false);
  const [isQuoteOn, setIsQuoteOn] = useState(false);
  const [promptText, setPromptText] = useState('Tap anywhere and Diano will blow out the candle');
  const [showSleepWell, setShowSleepWell] = useState(false);

  // Reset all state when opened
  useEffect(() => {
    if (isOpen) {
      setIsOut(false);
      setIsBusy(false);
      setStageClass('');
      setIsEyesClosed(false);
      setIsMouthBlowing(false);
      setIsPuff(false);
      setIsFlameOff(false);
      setIsGlowOff(false);
      setIsSmokeOn(false);
      setIsQuoteOn(false);
      setPromptText('Tap anywhere and Diano will blow out the candle');
      setShowSleepWell(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBlow = () => {
    if (isOut || isBusy) return;
    setIsBusy(true);
    playSfx('blow', isMuted);

    // 1. Inhale
    setPromptText('Diano takes a slow breath…');
    setStageClass('in');
    setIsEyesClosed(true);

    // 2. Exhale (after 450ms)
    setTimeout(() => {
      setStageClass('ex');
      setIsMouthBlowing(true);
      setIsPuff(true);

      // 3. Snuff out candle (after 320ms)
      setTimeout(() => {
        setIsOut(true); // Triggers #ritual.out background dimming & Diano fade-out
        setIsFlameOff(true);
        setIsGlowOff(true);
        setIsSmokeOn(true);

        // 4. Settle & Display Central Quote (after 550ms)
        setTimeout(() => {
          setStageClass('');
          setIsMouthBlowing(false);
          setIsEyesClosed(false);
          setPromptText('Goodnight.');
          setIsQuoteOn(true);
          setShowSleepWell(true);

          if (onComplete) onComplete();
        }, 550);
      }, 320);
    }, 450);
  };

  return (
    <div
      id="ritual"
      className={isOut ? 'out' : ''}
      onClick={handleBlow}
      role="dialog"
      aria-label="Evening ritual"
    >
      {/* Top Bar with Prompt */}
      <div>
        <span className="text-xs text-[#c9d3ee] border border-[var(--line)] rounded-full px-4 py-1.5 font-medium inline-block mb-1">
          Tonight
        </span>
        <div className="prompt" id="rp">
          {promptText}
        </div>
      </div>

      {/* Big Diano with Candle SVG */}
      <svg
        className={`dstage ${stageClass}`}
        id="ds"
        viewBox="0 0 400 430"
      >
        <defs>
          <radialGradient id="gl">
            <stop offset="0" stopColor="#fde6a8" stopOpacity=".55" />
            <stop offset=".5" stopColor="#f0b25a" stopOpacity=".18" />
            <stop offset="1" stopColor="#facc15" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gf" cx=".45" cy=".38" r=".6">
            <stop offset="0" stopColor="#98fb98" />
            <stop offset=".7" stopColor="#72ef76" />
            <stop offset="1" stopColor="#5ce062" />
          </radialGradient>
        </defs>

        {/* Diano Spikes */}
        <g fill="#15803d" stroke="#26170c" strokeWidth="8" strokeLinejoin="round">
          <path d="M188 76C198 32 224 34 236 82Z" />
          <path d="M248 92C284 64 304 84 282 128Z" />
          <path d="M288 148C324 140 328 168 292 190Z" />
          <path d="M278 212C308 214 308 238 274 248Z" />
        </g>

        {/* Diano Body */}
        <g fill="url(#gf)" stroke="#26170c" strokeWidth="8" strokeLinejoin="round">
          <path d="M236 318C282 320 294 348 240 356Z" />
          <path d="M142 256C126 300 130 356 200 358 266 356 268 300 252 256Z" />
          <ellipse cx="198" cy="176" rx="102" ry="92" />
        </g>

        {/* Warm Candle Glow */}
        <circle
          id="glow"
          className={isGlowOff ? 'off' : ''}
          cx="200"
          cy="250"
          r="86"
          fill="url(#gl)"
        />

        {/* Cheeks */}
        <ellipse cx="122" cy="202" rx="14" ry="9" fill="#fb7185" />
        <ellipse cx="264" cy="202" rx="14" ry="9" fill="#fb7185" />

        {/* Open Eyes */}
        <g id="eo" fill="#26170c" style={{ display: isEyesClosed ? 'none' : '' }}>
          <circle cx="136" cy="186" r="15" />
          <circle cx="250" cy="186" r="15" />
        </g>

        {/* Closed Eyes */}
        <g
          id="ec"
          fill="none"
          stroke="#26170c"
          strokeWidth="7"
          strokeLinecap="round"
          style={{ display: isEyesClosed ? '' : 'none' }}
        >
          <path d="M120 186Q136 198 152 186" />
          <path d="M234 186Q250 198 266 186" />
        </g>

        {/* Normal Smile Mouth */}
        <path
          id="ms"
          d="M176 196Q195 206 214 196"
          fill="none"
          stroke="#26170c"
          strokeWidth="7"
          strokeLinecap="round"
          style={{ display: isMouthBlowing ? 'none' : '' }}
        />

        {/* Round Exhaling Mouth */}
        <ellipse
          id="mb"
          cx="196"
          cy="201"
          rx="8"
          ry="10"
          fill="#26170c"
          style={{ display: isMouthBlowing ? '' : 'none' }}
        />

        {/* Puff of Air */}
        <g
          id="puff"
          className={isPuff ? 'on' : ''}
          fill="none"
          stroke="#bae6fd"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M196 212Q190 232 182 248" />
          <path d="M198 212Q202 234 210 250" />
        </g>

        {/* Candle Body */}
        <rect x="176" y="274" width="46" height="68" rx="10" fill="#fde6ba" stroke="#26170c" strokeWidth="6" />
        <line x1="199" y1="264" x2="199" y2="277" stroke="#26170c" strokeWidth="5" strokeLinecap="round" />

        {/* Animated Rising Smoke */}
        <g id="smoke" className={isSmokeOn ? 'on' : ''}>
          <path
            d="M199 262C188 244 212 228 196 208 184 192 208 176 198 160"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* Candle Flame with Flicker Animation */}
        <g id="flame" className={isFlameOff ? 'off' : ''}>
          <path d="M199 224C182 244 182 264 199 266 216 264 216 244 199 224Z" fill="#f97316" />
          <path d="M199 236C190 248 190 262 199 264 208 262 208 248 199 236Z" fill="#fef08a" />
        </g>

        {/* Arms and Feet */}
        <g fill="url(#gf)" stroke="#26170c" strokeWidth="7" strokeLinejoin="round">
          <path d="M145 280C154 274 178 278 186 290 192 298 186 314 174 314 162 314 144 304 145 280Z" />
          <path d="M253 280C244 274 220 278 212 290 206 298 212 314 224 314 236 314 254 304 253 280Z" />
          <ellipse cx="152" cy="344" rx="24" ry="27" />
          <ellipse cx="238" cy="344" rx="24" ry="27" />
        </g>
        <g fill="#15803d">
          <path d="M152 358C138 348 138 336 146 336 150 336 152 341 152 341 152 341 154 336 158 336 166 336 166 348 152 358Z" />
          <path d="M238 358C224 348 224 336 232 336 236 336 238 341 238 341 238 341 240 336 244 336 252 336 252 348 238 358Z" />
        </g>
      </svg>

      {/* Central Rest Quote (Fades in over darkness when candle is blown out) */}
      <div className={`quote ${isQuoteOn ? 'on' : ''}`} id="rq">
        <span>“You did what you could today. Now you can rest.”</span>
        <small>Tomorrow, be 0.1% ahead of today.</small>
      </div>

      {/* Bottom Action Controls */}
      <div onClick={(e) => e.stopPropagation()} className="pb-4">
        {showSleepWell ? (
          <button
            type="button"
            id="sw"
            onClick={onClose}
            className="border border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] rounded-full px-8 py-3 font-semibold text-sm hover:brightness-110 transition-all cursor-pointer shadow-lg"
          >
            Sleep well
          </button>
        ) : (
          <button
            type="button"
            id="rb"
            onClick={onClose}
            className="border border-[var(--line)] bg-[var(--surf2)] text-white rounded-full px-7 py-2.5 font-medium text-sm hover:border-[var(--lamp)] transition-colors cursor-pointer"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
