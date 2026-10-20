import React, { useState } from 'react';

const GOALS = [
  { val: 0.5, label: '30 min' },
  { val: 1, label: '1 hour' },
  { val: 2, label: '2 hours' },
  { val: 3, label: '3 hours' },
  { val: 4, label: '4 hours' }
];

export default function WelcomeModal({ isOpen, initialGoal = 2, onFinish }) {
  const [selectedGoal, setSelectedGoal] = useState(initialGoal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(14,11,32,0.86)] backdrop-blur-md">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[26px] p-8 w-full max-w-[420px] text-center shadow-2xl">
        <svg className="w-24 h-24 mx-auto mb-2 pet-hop">
          <use href="#dn" />
        </svg>
        <h3 className="serif text-3xl font-normal mb-1">Hi, I’m Diano</h3>
        <p className="text-sm text-[var(--mut)] mb-6">
          Pick a daily goal small enough to keep on your worst day. You can change it any time.
        </p>

        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {GOALS.map((g) => (
            <button
              key={g.val}
              type="button"
              onClick={() => setSelectedGoal(g.val)}
              className={`border rounded-full px-4 py-2 text-sm transition-all cursor-pointer ${
                selectedGoal === g.val
                  ? 'bg-[var(--lamp)] text-[#1b1730] border-[var(--lamp)] font-semibold shadow-md'
                  : 'bg-[var(--surf2)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--lamp)]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onFinish(selectedGoal)}
            className="border border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] rounded-full px-8 py-3 text-sm font-semibold hover:brightness-110 shadow-lg cursor-pointer"
          >
            Set my goal
          </button>
        </div>
      </div>
    </div>
  );
}
