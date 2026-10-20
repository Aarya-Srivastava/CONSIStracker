import React, { useState, useEffect } from 'react';
import Phase1Intro from './components/Phase1Intro';
import Phase2Login from './components/Phase2Login';
import Phase3Dashboard from './components/Phase3Dashboard';
import DianoSvg from './components/DianoSvg';
import WelcomeModal from './components/WelcomeModal';
import { api, DEFAULT_TAGS } from './utils/api';

export default function App() {
  const [phase, setPhase] = useState(1); // 1 = Sarcastic Intro, 2 = Password Gate, 3 = Dashboard
  const [appData, setAppData] = useState({
    goal: 2,
    dayGoals: {},
    dayNotes: {},
    sessions: [],
    tags: DEFAULT_TAGS,
    scrap: [],
    closed: [],
    scene: {},
    photo: {},
    mute: false,
    welcomed: false,
    rem: { on: false, t: '21:30' },
    remDay: '',
    snooze: 0,
    lastBackup: ''
  });
  const [showWelcome, setShowWelcome] = useState(false);

  // Load state from backend for active user
  const loadUserData = async () => {
    const data = await api.getState();
    setAppData(data);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Sync state changes with backend & local storage
  const handleUpdateState = (newState) => {
    setAppData(newState);
    api.saveState(newState);
  };

  // Environmental Time Engine
  useEffect(() => {
    const hour = new Date().getHours();
    document.body.classList.remove('theme-morning', 'theme-day', 'theme-evening', 'theme-night');

    if (hour >= 6 && hour < 12) {
      document.body.classList.add('theme-morning');
    } else if (hour >= 12 && hour < 17) {
      document.body.classList.add('theme-day');
    } else if (hour >= 17 && hour < 20) {
      document.body.classList.add('theme-evening');
    } else {
      document.body.classList.add('theme-night');
    }
  }, []);

  // Update body lock class depending on phase
  useEffect(() => {
    if (phase === 1 || phase === 2) {
      document.body.classList.add('auth-locked');
    } else {
      document.body.classList.remove('auth-locked');
    }
  }, [phase]);

  // Transition from Phase 1 to Phase 2
  const handleProceedToPhase2 = () => {
    setPhase(2);
  };

  // Transition from Phase 2 to Phase 3 (when password verified)
  const handleUnlockSuccess = async () => {
    await loadUserData();
    setPhase(3);
    // Show welcome modal if first time visit
    if (!appData.welcomed) {
      setTimeout(() => setShowWelcome(true), 600);
    }
  };

  const handleFinishWelcome = (selectedGoal) => {
    const updated = {
      ...appData,
      goal: selectedGoal,
      welcomed: true
    };
    handleUpdateState(updated);
    setShowWelcome(false);
  };

  const handleLogout = () => {
    api.logout();
    setPhase(2);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Hidden SVG Symbols */}
      <DianoSvg />

      {/* Background Celestial Environment for Phase 1 & 2 */}
      {(phase === 1 || phase === 2) && (
        <>
          {/* Night Elements */}
          <div className="fixed inset-0 pointer-events-none z-0 show-night" aria-hidden="true">
            {/* Stars */}
            <svg className="absolute inset-0 w-full h-full opacity-60">
              <g fill="white">
                <circle cx="15%" cy="25%" r="1.5" /><circle cx="35%" cy="10%" r="2" />
                <circle cx="20%" cy="45%" r="1" /><circle cx="75%" cy="20%" r="2.5" />
                <circle cx="80%" cy="15%" r="1" /><circle cx="85%" cy="55%" r="1.5" />
                <circle cx="55%" cy="12%" r="1" /><circle cx="90%" cy="35%" r="2" />
                <circle cx="65%" cy="65%" r="1.2" /><circle cx="10%" cy="75%" r="1.8" />
              </g>
            </svg>
            
            {/* String Lights */}
            <svg className="absolute top-0 left-0 w-full max-w-[700px] h-[350px] opacity-80" viewBox="0 0 700 350">
              <path d="M -20,20 Q 180,140 350,60 T 720,10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
              <g fill="#FEF08A" stroke="#B45309" strokeWidth="1.5">
                <circle cx="90" cy="95" r="10" filter="drop-shadow(0 0 10px #FEF08A)"/>
                <rect x="84" y="80" width="12" height="10" fill="#374151" stroke="none"/>
                
                <circle cx="250" cy="98" r="12" filter="drop-shadow(0 0 15px #FEF08A)"/>
                <rect x="243" y="83" width="14" height="10" fill="#374151" stroke="none"/>
                
                <circle cx="430" cy="58" r="9" filter="drop-shadow(0 0 10px #FEF08A)"/>
                <rect x="425" y="45" width="10" height="9" fill="#374151" stroke="none"/>
                
                <circle cx="580" cy="35" r="11" filter="drop-shadow(0 0 12px #FEF08A)"/>
                <rect x="573" y="21" width="14" height="10" fill="#374151" stroke="none"/>
              </g>
            </svg>

            {/* Crescent Moon */}
            <svg className="absolute top-[10%] right-[10%] w-[120px] h-[120px] drop-shadow-2xl" viewBox="0 0 100 100">
              <path d="M 45 10 A 40 40 0 1 0 95 60 A 45 45 0 1 1 45 10 Z" fill="#FEF08A" filter="drop-shadow(0 0 20px rgba(254, 240, 138, 0.5))"/>
            </svg>
          </div>

          {/* Day Elements */}
          <div className="fixed inset-0 pointer-events-none z-0 show-day" aria-hidden="true">
            <svg className="absolute top-[12%] right-[12%] w-[120px] h-[120px] drop-shadow-2xl" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="#FDE047" filter="drop-shadow(0 0 40px rgba(253, 224, 71, 0.9))"/>
            </svg>
          </div>
        </>
      )}

      {/* PHASE 1: Sarcastic Wake-Up Intro */}
      {phase === 1 && (
        <div className="transition-opacity duration-600 animate-fade-in">
          <Phase1Intro onContinue={handleProceedToPhase2} />
        </div>
      )}

      {/* PHASE 2: Password Login Gate */}
      {phase === 2 && (
        <div className="transition-opacity duration-600 animate-fade-in">
          <Phase2Login
            onUnlockSuccess={handleUnlockSuccess}
            sessions={appData.sessions || []}
          />
        </div>
      )}

      {/* PHASE 3: Complete Consistracker Dashboard */}
      {phase === 3 && (
        <div className="transition-opacity duration-700 animate-fade-in">
          <Phase3Dashboard
            state={appData}
            onUpdateState={handleUpdateState}
            onLogout={handleLogout}
          />
        </div>
      )}

      {/* First-time Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        initialGoal={appData.goal || 2}
        onFinish={handleFinishWelcome}
      />
    </div>
  );
}
