import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

export default function Phase2Login({ onUnlockSuccess, sessions = [] }) {
  const [username, setUsername] = useState('default');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showMultiUser, setShowMultiUser] = useState(false);

  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const inputRef = useRef(null);
  const continueBtnRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setIsShaking(false);

    try {
      let res;
      if (isRegisterMode) {
        res = await api.register(username, password);
      } else {
        res = await api.login(password, username);
      }

      if (res.success) {
        setIsSuccess(true);
        setStatus({
          text: isRegisterMode
            ? `Welcome, ${username}! Account created.`
            : `Welcome back${username !== 'default' ? ', ' + username : ''}! Access granted.`,
          type: 'ok'
        });
        setTimeout(() => {
          setShowModal(true);
          setTimeout(() => continueBtnRef.current?.focus(), 100);
        }, 500);
      } else {
        setIsShaking(true);
        setPassword('');
        setStatus({ text: res.message || 'Incorrect password. Try again.', type: 'error' });
        setTimeout(() => setIsShaking(false), 500);
        inputRef.current?.focus();
      }
    } catch (err) {
      setStatus({ text: 'Error communicating with server.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    setShowModal(false);
    onUnlockSuccess();
  };

  const handleResetPassword = async () => {
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      setResetMessage(data.message || 'Password reset to default (focus).');
      setTimeout(() => {
        setShowResetModal(false);
        setResetMessage('');
        setPassword('focus');
        inputRef.current?.focus();
      }, 1500);
    } catch (err) {
      setResetMessage('Reset to local default (focus).');
      setPassword('focus');
    }
  };

  // Determine current day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const currentDayOfWeek = new Date().getDay();
  const days = [
    { label: 'M', dayIdx: 1, defaultHours: '1.5h' },
    { label: 'T', dayIdx: 2, defaultHours: '2h' },
    { label: 'W', dayIdx: 3, defaultHours: '0h' },
    { label: 'T', dayIdx: 4, defaultHours: '4h' },
    { label: 'F', dayIdx: 5, defaultHours: '1h' },
    { label: 'S', dayIdx: 6, defaultHours: '3h' },
    { label: 'S', dayIdx: 0, defaultHours: '0.5h' }
  ];

  return (
    <main
      id="phase2-wrapper"
      className="absolute inset-0 z-40 flex flex-col items-center overflow-y-auto overflow-x-hidden px-4 py-8"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      {/* Branding */}
      <h1
        id="p2-title"
        tabIndex="-1"
        className="mt-auto shrink-0 mb-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.2em] drop-shadow-xl z-30 text-white w-full text-center pointer-events-none"
      >
        CONSIS<span className="font-light">tracker</span>
      </h1>

      <div className="relative w-full max-w-[650px] lg:max-w-[780px] mb-auto flex flex-col items-center shrink-0">
        
        {/* MASCOT (Diano) */}
        <div
          id="p2-dino-wrap"
          className="relative z-50 shrink-0 pointer-events-none drop-shadow-2xl flex items-end justify-center -mb-8"
          style={{ height: 'clamp(90px, 19vh, 160px)' }}
        >
          <svg viewBox="0 0 150 150" className="w-[120px] sm:w-[150px] h-full" aria-hidden="true">
            <path d="M 50 36 Q 52 18 64 28 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M 70 26 Q 76 6 88 22 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M 96 30 Q 112 18 114 38 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M 98 118 Q 128 122 132 100 Q 120 112 100 104 Z" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" strokeLinejoin="round"/>
            <ellipse cx="75" cy="114" rx="28" ry="25" fill="#6EE7B7" stroke="#065F46" strokeWidth="3"/>
            <ellipse cx="75" cy="120" rx="16" ry="15" fill="#D1FAE5"/>
            <ellipse cx="46" cy="110" rx="7" ry="10" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" transform="rotate(25 46 110)"/>
            <ellipse cx="104" cy="110" rx="7" ry="10" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" transform="rotate(-25 104 110)"/>
            <ellipse cx="60" cy="138" rx="11" ry="7" fill="#6EE7B7" stroke="#065F46" strokeWidth="3"/>
            <ellipse cx="90" cy="138" rx="11" ry="7" fill="#6EE7B7" stroke="#065F46" strokeWidth="3"/>
            <path d="M 57 137 L 57 141 M 63 137 L 63 141 M 87 137 L 87 141 M 93 137 L 93 141" stroke="#065F46" strokeWidth="1.8" strokeLinecap="round"/>
            <ellipse cx="75" cy="66" rx="48" ry="42" fill="#6EE7B7" stroke="#065F46" strokeWidth="3"/>
            <ellipse cx="62" cy="46" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-20 62 46)"/>
            <ellipse cx="54" cy="68" rx="6.5" ry="8" fill="#0F172A"/>
            <ellipse cx="96" cy="68" rx="6.5" ry="8" fill="#0F172A"/>
            <circle cx="56.5" cy="64.5" r="2.6" fill="#FFFFFF"/>
            <circle cx="98.5" cy="64.5" r="2.6" fill="#FFFFFF"/>
            <circle cx="52" cy="71" r="1.2" fill="#FFFFFF"/>
            <circle cx="94" cy="71" r="1.2" fill="#FFFFFF"/>
            <ellipse cx="40" cy="82" rx="8" ry="5.5" fill="#FB7185" opacity="0.75"/>
            <ellipse cx="110" cy="82" rx="8" ry="5.5" fill="#FB7185" opacity="0.75"/>
            <path d="M 66 80 Q 75 90 84 80" fill="#FB7185" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="70" cy="74" r="1.2" fill="#065F46"/>
            <circle cx="80" cy="74" r="1.2" fill="#065F46"/>
          </svg>
        </div>

        {/* Glass Container */}
        <div className="glass-panel rounded-[2.5rem] p-6 sm:p-10 md:p-14 w-full relative z-20 flex flex-col shadow-2xl">
          <div className="text-center mb-8 sm:mb-10 mt-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 tracking-wide text-white drop-shadow-md">
              {isRegisterMode ? 'Create Account' : 'Enter Password'}
            </h2>
            <p className="text-sm md:text-base font-light tracking-wide text-gray-200">
              {isRegisterMode ? 'Start your consistency journey' : 'Track your consistency'}
            </p>
          </div>

          {/* 7-Day Tracker */}
          <div className="flex justify-between items-center w-full mb-8 sm:mb-10 px-0 sm:px-4 md:px-6 relative" role="list" aria-label="Focus hours this week">
            <div className="absolute top-[24px] left-[5%] right-[5%] h-[1px] bg-white/20 z-0" aria-hidden="true"></div>
            
            {days.map((item, idx) => {
              const isActive = item.dayIdx === currentDayOfWeek || (currentDayOfWeek === 0 && item.dayIdx === 0);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 z-10" role="listitem">
                  <span className={`text-xs ${isActive ? 'font-bold text-white shadow-sm' : 'font-light text-white'}`} aria-hidden="true">
                    {item.label}
                  </span>
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-medium border border-white/20 transition-all ${
                      isActive
                        ? 'border-white bg-white/25 text-white font-bold text-sm sm:text-base shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-110 -translate-y-1'
                        : 'bg-white/5 text-xs text-white/90'
                    }`}
                  >
                    {item.defaultHours}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form */}
          <form id="p2-form" onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* Optional Multi-User Selector */}
            {showMultiUser && (
              <div className="mb-4 px-0 sm:px-4 md:px-6 animate-fade-in">
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. yash, alex, default"
                  className="w-full px-5 py-3 rounded-xl font-medium text-base text-white bg-black/40 border border-white/20 outline-none focus:border-white/60 mb-2"
                />
                <div className="flex justify-between items-center text-xs text-gray-300 px-1">
                  <span>{isRegisterMode ? 'Already have an account?' : 'Want a new profile?'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setStatus({ text: '', type: '' });
                    }}
                    className="underline text-amber-300 hover:text-white font-semibold cursor-pointer"
                  >
                    {isRegisterMode ? 'Switch to Sign In' : 'Create new account'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full px-0 sm:px-4 md:px-6">
              <label htmlFor="p2-password-input" className="sr-only">Password</label>
              <input
                ref={inputRef}
                type="password"
                id="p2-password-input"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSuccess || isLoading}
                placeholder="••••••••"
                className={`flex-1 px-6 py-4 rounded-xl tracking-[0.4em] font-medium text-lg placeholder:tracking-widest placeholder:font-light outline-none transition-all bg-black/40 border border-white/20 text-white focus:border-white/60 focus:bg-black/60 ${
                  isShaking ? 'p2-shake-error' : ''
                } ${isSuccess ? 'p2-success-state' : ''}`}
              />
              <button
                type="submit"
                id="p2-unlock-btn"
                disabled={isSuccess || isLoading}
                className={`px-8 sm:px-10 py-4 rounded-xl font-semibold tracking-wide text-lg text-white transition-all cursor-pointer border border-white/40 backdrop-blur-sm ${
                  isSuccess
                    ? 'bg-emerald-500/30 border-emerald-400'
                    : 'bg-white/15 hover:bg-white/30 hover:-translate-y-0.5'
                }`}
              >
                {isSuccess ? '✓' : isLoading ? '...' : isRegisterMode ? 'Register' : 'Unlock'}
              </button>
            </div>

            {/* Live status message */}
            <p
              id="p2-status"
              className={`min-h-[1.5rem] mt-4 text-center text-sm font-medium ${
                status.type === 'error' ? 'text-rose-300' : status.type === 'ok' ? 'text-emerald-300' : 'text-gray-200'
              }`}
            >
              {status.text}
            </p>
          </form>

          {/* User Mode & Reset options */}
          <div className="flex justify-between items-center mt-6 text-sm font-light text-gray-200 px-0 sm:px-4 md:px-6 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowMultiUser(!showMultiUser)}
              className="text-xs text-amber-300/90 hover:text-white underline transition-colors cursor-pointer"
            >
              {showMultiUser ? '‹ Use quick login' : '👤 Switch user / Create account'}
            </button>

            <div>
              Need help? or{' '}
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="underline hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-light text-xs sm:text-sm"
              >
                Reset password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Granted Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-panel p-8 rounded-2xl text-center max-w-sm w-full shadow-2xl border border-emerald-400/50 transform scale-100 transition-transform">
            <h3 className="text-2xl font-bold text-white mb-2">Access Granted</h3>
            <p className="text-gray-200 font-light mb-6">Entering Dashboard Phase...</p>
            <button
              ref={continueBtnRef}
              type="button"
              onClick={handleContinueToDashboard}
              className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-panel p-8 rounded-2xl text-center max-w-sm w-full shadow-2xl border border-white/30">
            <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
            <p className="text-sm text-gray-300 mb-6">
              Default password is <code className="bg-white/20 px-2 py-0.5 rounded text-amber-300 font-mono">focus</code> for user <b className="text-white">{username}</b>. Would you like to reset it?
            </p>
            {resetMessage && (
              <p className="text-sm font-semibold text-emerald-300 mb-4">{resetMessage}</p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-black bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Reset to "focus"
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
