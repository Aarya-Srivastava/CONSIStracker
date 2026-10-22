import React, { useState } from 'react';
import { playSfx } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

export const DOMAINS = [
  {
    id: 'swe_dsa',
    name: 'Software Engineering & DSA',
    shortName: 'SWE & DSA',
    icon: '💻',
    color: '#06b6d4',
    badge: 'Popular',
    tagline: 'LeetCode & Algos',
    desc: 'LeetCode mediums, core algorithms, system design & internship feature PRs.'
  },
  {
    id: 'ai_ml',
    name: 'AI / ML & Data Science',
    shortName: 'AI & ML',
    icon: '🤖',
    color: '#a855f7',
    badge: 'High Impact',
    tagline: 'Models & Data Science',
    desc: 'PyTorch models, research paper breakdowns, Kaggle datasets & mathematics.'
  },
  {
    id: 'web_dev',
    name: 'Full-Stack & Web Dev',
    shortName: 'Full-Stack',
    icon: '🌐',
    color: '#3b82f6',
    badge: 'Builder',
    tagline: 'Web Apps & Cloud',
    desc: 'React, Node, cloud architecture, REST/GraphQL APIs & shipping products.'
  },
  {
    id: 'academics',
    name: 'Competitive Exams & Academics',
    shortName: 'Academics',
    icon: '📚',
    color: '#f59e0b',
    badge: 'Core Focus',
    tagline: 'Exams & Deep Study',
    desc: 'GATE, college semesters, active recall, formula derivations & deep reading.'
  },
  {
    id: 'ui_ux',
    name: 'UI/UX Design & Product',
    shortName: 'UI/UX',
    icon: '🎨',
    color: '#f43f5e',
    badge: 'Creative',
    tagline: 'Figma & Design Systems',
    desc: 'Figma design systems, micro-interactions, wireframing & portfolio case studies.'
  },
  {
    id: 'job_hunt',
    name: 'Job Search & Tech Placement',
    shortName: 'Career',
    icon: '💼',
    color: '#10b981',
    badge: 'Placements',
    tagline: 'Interviews & Resume',
    desc: 'XYZ resume bullets, cold outreach to managers, STAR behavioral interviews.'
  }
];

const TUTORIAL_SLIDES = [
  {
    step: 1,
    title: 'The Focus Engine & Diano Mascot',
    icon: '🦖',
    highlight: 'Deep Work & Zero Distractions',
    desc: 'Use the big circular focus timer to enter flow state. Categorize time by custom subject tags, park wandering thoughts into the Distraction Pad, and click Diano for encouragement.',
    bulletPoints: [
      'Circular countdown & stopwatch focus timer',
      'Subject tags for categorized study logging',
      'Distraction Pad to keep thoughts from derailing you'
    ]
  },
  {
    step: 2,
    title: 'Habit Tracker & 31-Day Matrix',
    icon: '🎯',
    highlight: 'Consistency Without the Guilt',
    desc: 'Your dashboard features an executive circular adherence ring. Click it to open the full 31-day spreadsheet matrix with sticky columns, auto-centering on today, and zero stressful red failure walls.',
    bulletPoints: [
      'Real-time monthly adherence percentage ring',
      'Sticky frozen column with horizontal 1–31 grid',
      'Single-click habit checkboxes directly on dashboard'
    ]
  },
  {
    step: 3,
    title: 'Domain Quests & Dopamine XP',
    icon: '⚡',
    highlight: 'Gamified Missions for Real Skills',
    desc: 'Every day you receive randomized challenges tailored to your chosen domain. Completing quests earns Dopamine XP, audio celebrations, and confetti to keep your momentum high.',
    bulletPoints: [
      'Tailored missions (LeetCode, PRs, PyTorch, Exams)',
      'Reroll Quest (🎲) button if you want another task',
      'XP rewards and visual celebratory feedback'
    ]
  },
  {
    step: 4,
    title: 'Time Theming & Bedtime Ritual',
    icon: '🌙',
    highlight: 'Circadian Flow & Peaceful Rest',
    desc: 'The app dynamically recalibrates its ambient lighting based on your local timezone (Morning Dawn ➔ Midnight Owl). When finished, hit "Call it a day" so Diano snuffs out the candle and logs you out to rest.',
    bulletPoints: [
      'Atmospheric daylight & night themes (Auto-sync)',
      'Evening candle blowout with calming rest quote',
      'Automatic 3-second bedtime logout'
    ]
  },
  {
    step: 5,
    title: 'AI Study Architect & Active Recall',
    icon: '🤖',
    highlight: 'Syllabus Pacer & Cognitive Load Balancing',
    desc: 'Enter any subject, target days, and daily hours. The AI breaks down your curriculum, balances cognitive load, and generates 3 daily active recall questions with hints and full solutions.',
    bulletPoints: [
      'Daily time-budgeted study blueprint with task checklist',
      'Optional syllabus/notes parsing for tailored tracking',
      'Active recall questions with hints and explanations'
    ]
  }
];

const GOALS = [
  { val: 0.5, label: '30 min' },
  { val: 1, label: '1 hour' },
  { val: 2, label: '2 hours' },
  { val: 3, label: '3 hours' },
  { val: 4, label: '4 hours' }
];

export default function WelcomeModal({
  isOpen,
  initialGoal = 2,
  initialDomain = 'swe_dsa',
  onFinish
}) {
  const [step, setStep] = useState(1); // 1: Domain Selection | 2: Guided Tour | 3: Daily Target
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [tourIndex, setTourIndex] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(initialGoal);

  if (!isOpen) return null;

  const handleNextStep = () => {
    playSfx('click');
    setStep((prev) => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    playSfx('click');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleCompleteAll = () => {
    triggerConfetti();
    playSfx('celebrate');
    onFinish({
      selectedGoal,
      selectedDomain
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[rgba(10,8,22,0.92)] backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surf)] text-[var(--ink)] border border-[var(--line)] rounded-[32px] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header with Stepper Progress */}
        <div className="p-4 sm:p-6 border-b border-[var(--line)] bg-[var(--surf2)]/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[var(--lamp)]/20 border border-[var(--lamp)]/30 flex items-center justify-center text-xl shadow-xs">
              🦖
            </span>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[var(--surf)] text-[var(--mut)] border border-[var(--line)]">
                Step {step} of 3
              </span>
              <h2 className="serif text-lg sm:text-xl font-normal text-[var(--ink)] mt-0.5">
                {step === 1 && 'Choose Your Focus Domain'}
                {step === 2 && 'Interactive Guided Tour'}
                {step === 3 && 'Set Your Daily Target'}
              </h2>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-6 bg-[var(--lamp)]'
                    : step > s
                    ? 'bg-emerald-400'
                    : 'bg-[var(--line)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body: Dynamic Step Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ================= STEP 1: DOMAIN SELECTION ================= */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <h3 className="serif text-xl sm:text-2xl font-normal text-[var(--ink)] mb-1">
                  What are you focused on building?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
                  Consistracker tailors your daily dopamine challenges, study quests, and habit suggestions to your field. You can switch this anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {DOMAINS.map((dom) => {
                  const isSelected = selectedDomain === dom.id;
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => {
                        setSelectedDomain(dom.id);
                        playSfx('check');
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[var(--surf2)] border-[var(--lamp)] shadow-md ring-2 ring-[var(--lamp)]/40 scale-[1.01]'
                          : 'bg-[var(--surf2)]/40 border-[var(--line)] hover:border-[var(--line2)] hover:bg-[var(--surf2)]/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-xs"
                            style={{ backgroundColor: `${dom.color}25` }}
                          >
                            {dom.icon}
                          </span>
                          <span className="font-semibold text-xs sm:text-sm text-[var(--ink)]">
                            {dom.name}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border"
                          style={{
                            borderColor: `${dom.color}40`,
                            backgroundColor: `${dom.color}15`,
                            color: dom.color
                          }}
                        >
                          {dom.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--mut)] leading-relaxed">
                        {dom.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2: INTERACTIVE GUIDED TOUR ================= */}
          {step === 2 && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[var(--lamp)]/20 text-[var(--lamp)] border border-[var(--lamp)]/30">
                  Feature Walkthrough ({tourIndex + 1}/4)
                </span>
                <h3 className="serif text-xl sm:text-2xl font-normal text-[var(--ink)] mt-1.5 mb-1">
                  {TUTORIAL_SLIDES[tourIndex].title}
                </h3>
                <span className="text-xs text-emerald-400 font-semibold block mb-2">
                  ✦ {TUTORIAL_SLIDES[tourIndex].highlight}
                </span>
                <p className="text-xs sm:text-sm text-[var(--mut)] leading-relaxed mb-4">
                  {TUTORIAL_SLIDES[tourIndex].desc}
                </p>
              </div>

              {/* Visual Feature Card Preview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surf2)] border border-[var(--line)] shadow-inner mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-12 h-12 rounded-2xl bg-[var(--surf)] border border-[var(--line)] flex items-center justify-center text-2xl shadow-xs">
                    {TUTORIAL_SLIDES[tourIndex].icon}
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm text-[var(--ink)]">
                      {TUTORIAL_SLIDES[tourIndex].title}
                    </h4>
                    <span className="text-xs text-[var(--mut)]">
                      Consistracker Core System
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {TUTORIAL_SLIDES[tourIndex].bulletPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[var(--ink)]">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        ✓
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide Selector Carousel Tabs */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--line)]/60">
                <div className="flex items-center gap-1.5">
                  {TUTORIAL_SLIDES.map((s, idx) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setTourIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        tourIndex === idx
                          ? 'w-7 bg-[var(--lamp)]'
                          : 'w-2 bg-[var(--line)] hover:bg-[var(--mut)]'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={tourIndex === 0}
                    onClick={() => setTourIndex((i) => Math.max(0, i - 1))}
                    className="px-3 py-1 rounded-xl bg-[var(--surf)] border border-[var(--line)] text-xs text-[var(--ink)] disabled:opacity-30 cursor-pointer hover:border-[var(--lamp)] transition-all"
                  >
                    ‹ Prev Slide
                  </button>
                  <button
                    type="button"
                    disabled={tourIndex === TUTORIAL_SLIDES.length - 1}
                    onClick={() => setTourIndex((i) => Math.min(TUTORIAL_SLIDES.length - 1, i + 1))}
                    className="px-3 py-1 rounded-xl bg-[var(--surf)] border border-[var(--line)] text-xs text-[var(--ink)] disabled:opacity-30 cursor-pointer hover:border-[var(--lamp)] transition-all"
                  >
                    Next Slide ›
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: DAILY STUDY GOAL ================= */}
          {step === 3 && (
            <div className="text-center py-2">
              <svg className="w-20 h-20 mx-auto mb-2 pet-hop">
                <use href="#dn" />
              </svg>
              <h3 className="serif text-2xl sm:text-3xl font-normal text-[var(--ink)] mb-1">
                Pick Your Daily Goal
              </h3>
              <p className="text-xs sm:text-sm text-[var(--mut)] max-w-md mx-auto mb-6">
                Pick a study target small enough to keep on your busiest days. Consistency beats intensity every single time.
              </p>

              <div className="flex gap-2.5 flex-wrap justify-center mb-6">
                {GOALS.map((g) => (
                  <button
                    key={g.val}
                    type="button"
                    onClick={() => {
                      setSelectedGoal(g.val);
                      playSfx('check');
                    }}
                    className={`border rounded-2xl px-5 py-2.5 text-xs sm:text-sm transition-all cursor-pointer ${
                      selectedGoal === g.val
                        ? 'bg-[var(--lamp)] text-[#1b1730] border-[var(--lamp)] font-bold shadow-md scale-105'
                        : 'bg-[var(--surf2)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--lamp)]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Ready Summary Card */}
              <div className="p-4 rounded-2xl bg-[var(--surf2)]/70 border border-[var(--line)] max-w-md mx-auto text-left flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {DOMAINS.find((d) => d.id === selectedDomain)?.icon || '💻'}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--mut)] font-bold block">
                      Target Domain Configured
                    </span>
                    <span className="font-semibold text-xs sm:text-sm text-[var(--ink)]">
                      {DOMAINS.find((d) => d.id === selectedDomain)?.name}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                  +50 XP Ready
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 sm:p-5 border-t border-[var(--line)] bg-[var(--surf)] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-xl bg-[var(--surf2)] border border-[var(--line)] hover:bg-[var(--line)] text-xs font-semibold text-[var(--ink)] cursor-pointer transition-all"
            >
              Back
            </button>
          ) : (
            <span className="text-xs text-[var(--mut)]">Welcome to Consistracker</span>
          )}

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-[var(--lamp)] text-[#1b1730] text-xs font-bold hover:brightness-105 active:scale-95 cursor-pointer transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Continue</span>
                <span>➔</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteAll}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-[var(--lamp)] to-emerald-400 text-[#1b1730] text-xs font-bold hover:brightness-110 active:scale-95 cursor-pointer transition-all shadow-lg flex items-center gap-2"
              >
                <span>Launch Consistency Journey</span>
                <span>🚀</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
