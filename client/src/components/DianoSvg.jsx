import React from 'react';

export default function DianoSvg() {
  return (
    <svg style={{ display: 'none' }} aria-hidden="true">
      {/* Mini Diano Icon */}
      <symbol id="dm" viewBox="0 0 120 120">
        <g stroke="#26170c" strokeWidth="4" strokeLinejoin="round">
          <path d="M22 86Q8 82 12 68Q20 74 28 74Z" fill="#16a34a"/>
          <path d="M52 18L60 7L66 20ZM68 26L78 18L76 32Z" fill="#16a34a"/>
          <ellipse cx="58" cy="82" rx="28" ry="24" fill="#74f27a"/>
          <circle cx="58" cy="48" r="32" fill="#74f27a"/>
          <ellipse cx="46" cy="102" rx="8" ry="9" fill="#74f27a"/>
          <ellipse cx="70" cy="102" rx="8" ry="9" fill="#74f27a"/>
        </g>
        <ellipse cx="42" cy="52" rx="5.5" ry="3.5" fill="#fb7185"/>
        <ellipse cx="74" cy="52" rx="5.5" ry="3.5" fill="#fb7185"/>
        <circle cx="44" cy="46" r="5" fill="#26170c"/>
        <circle cx="72" cy="46" r="5" fill="#26170c"/>
        <path d="M52 50Q58 55 64 50" fill="none" stroke="#26170c" strokeWidth="3.5" strokeLinecap="round"/>
      </symbol>

      {/* Main Diano Mascot */}
      <symbol id="dn" viewBox="0 0 400 430">
        <g fill="#15803d" stroke="#26170c" strokeWidth="8" strokeLinejoin="round">
          <path d="M188 76C198 32 224 34 236 82Z"/>
          <path d="M248 92C284 64 304 84 282 128Z"/>
          <path d="M288 148C324 140 328 168 292 190Z"/>
          <path d="M278 212C308 214 308 238 274 248Z"/>
        </g>
        <g fill="#74f27a" stroke="#26170c" strokeWidth="8" strokeLinejoin="round">
          <path d="M236 318C282 320 294 348 240 356Z"/>
          <path d="M142 256C126 300 130 356 200 358 266 356 268 300 252 256Z"/>
          <ellipse cx="198" cy="176" rx="102" ry="92"/>
        </g>
        <ellipse cx="150" cy="130" rx="38" ry="22" fill="#b9ffb9" opacity=".55" transform="rotate(-24 150 130)"/>
        <ellipse cx="122" cy="202" rx="14" ry="9" fill="#fb7185"/>
        <ellipse cx="264" cy="202" rx="14" ry="9" fill="#fb7185"/>
        
        {/* Open eyes */}
        <g className="pet-eyes-open" fill="#26170c">
          <circle cx="136" cy="186" r="15"/>
          <circle cx="250" cy="186" r="15"/>
          <circle cx="141" cy="181" r="5" fill="#fff"/>
          <circle cx="255" cy="181" r="5" fill="#fff"/>
        </g>
        {/* Closed eyes */}
        <g className="pet-eyes-closed" style={{ display: 'none' }} fill="none" stroke="#26170c" strokeWidth="7" strokeLinecap="round">
          <path d="M120 190Q136 202 152 190"/>
          <path d="M234 190Q250 202 266 190"/>
        </g>

        <path d="M176 198Q195 210 214 198" fill="none" stroke="#26170c" strokeWidth="7" strokeLinecap="round"/>
        <g fill="#74f27a" stroke="#26170c" strokeWidth="7">
          <ellipse cx="146" cy="290" rx="20" ry="30" transform="rotate(14 146 290)"/>
          <ellipse cx="252" cy="290" rx="20" ry="30" transform="rotate(-14 252 290)"/>
          <ellipse cx="152" cy="344" rx="24" ry="27"/>
          <ellipse cx="238" cy="344" rx="24" ry="27"/>
        </g>
        <g fill="#15803d">
          <path d="M152 358C138 348 138 336 146 336 150 336 152 341 152 341 152 341 154 336 158 336 166 336 166 348 152 358Z"/>
          <path d="M238 358C224 348 224 336 232 336 236 336 238 341 238 341 238 341 240 336 244 336 252 336 252 348 238 358Z"/>
        </g>
      </symbol>

      {/* Scrapbook Duck */}
      <symbol id="dk" viewBox="0 0 120 120">
        <ellipse cx="60" cy="72" rx="34" ry="26" fill="#fbbf24"/>
        <circle cx="64" cy="44" r="22" fill="#fbbf24"/>
        <path d="M78 42Q96 40 90 49Q84 54 76 50Z" fill="#f97316"/>
        <circle cx="68" cy="40" r="3.5" fill="#26170c"/>
        <ellipse cx="52" cy="74" rx="16" ry="10" fill="#f59e0b"/>
      </symbol>
    </svg>
  );
}
