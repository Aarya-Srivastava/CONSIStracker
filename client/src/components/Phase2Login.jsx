import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { DOMAINS } from './WelcomeModal';

export default function Phase2Login({ onUnlockSuccess, sessions = [] }) {
  const [selectedDomain, setSelectedDomain] = useState('swe_dsa');
  const [username, setUsername] = useState('default');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState(null); // null | 'checking' | 'exists' | 'available'

  const [status, setStatus] = useState({ text: '', type: '' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('default');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState({ text: '', type: '' });
  const [isResetLoading, setIsResetLoading] = useState(false);

  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const continueBtnRef = useRef(null);

  useEffect(() => {
    if (passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 300);
    }
  }, []);

  // Real-time check if username exists in Register Mode
  useEffect(() => {
    if (!isRegisterMode) {
      setUsernameCheck(null);
      return;
    }

    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameCheck(null);
      return;
    }

    setUsernameCheck('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(clean);
        if (res.exists) {
          setUsernameCheck('exists');
        } else {
          setUsernameCheck('available');
        }
      } catch {
        setUsernameCheck(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, isRegisterMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();

    if (!cleanUser) {
      setStatus({ text: 'Please enter a username (e.g. default)', type: 'error' });
      usernameInputRef.current?.focus();
      return;
    }

    if (!password.trim()) {
      setStatus({ text: 'Please enter your password', type: 'error' });
      passwordInputRef.current?.focus();
      return;
    }

    if (isRegisterMode && usernameCheck === 'exists') {
      setIsShaking(true);
      setStatus({ text: 'Username already exists. Please choose a different username or sign in.', type: 'error' });
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsLoading(true);
    setIsShaking(false);
    setStatus({ text: '', type: '' });

    try {
      let res;
      if (isRegisterMode) {
        res = await api.register(cleanUser, password);
      } else {
        res = await api.login(password, cleanUser);
      }

      if (res.success) {
        setIsSuccess(true);
        setStatus({
          text: isRegisterMode
            ? `Welcome, ${cleanUser}! Account created successfully.`
            : `Welcome back, ${cleanUser}! Access granted.`,
          type: 'ok'
        });
        setTimeout(() => {
          setShowModal(true);
          setTimeout(() => continueBtnRef.current?.focus(), 100);
        }, 500);
      } else {
        setIsShaking(true);
        if (!isRegisterMode) setPassword('');
        setStatus({
          text: res.message || (isRegisterMode ? 'Username already exists.' : 'Incorrect password. Try again.'),
          type: 'error'
        });
        setTimeout(() => setIsShaking(false), 500);
        passwordInputRef.current?.focus();
      }
    } catch (err) {
      setStatus({ text: 'Error connecting to server. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    setShowModal(false);
    onUnlockSuccess(selectedDomain);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = resetUsername.trim().toLowerCase();
    if (!cleanUser) {
      setResetStatus({ text: 'Please enter username', type: 'error' });
      return;
    }
    if (!resetNewPassword || resetNewPassword.trim().length < 3) {
      setResetStatus({ text: 'New password must be at least 3 characters', type: 'error' });
      return;
    }

    setIsResetLoading(true);
    setResetStatus({ text: '', type: '' });

    try {
      const res = await api.resetPassword(cleanUser, resetNewPassword);
      if (res.success) {
        setResetStatus({ text: res.message || 'Password updated successfully!', type: 'ok' });
        setTimeout(() => {
          setShowResetModal(false);
          setUsername(cleanUser);
          setPassword(resetNewPassword);
          setResetStatus({ text: '', type: '' });
          setResetNewPassword('');
          passwordInputRef.current?.focus();
        }, 1200);
      } else {
        setResetStatus({ text: res.message || 'Could not reset password for this user', type: 'error' });
      }
    } catch (err) {
      setResetStatus({ text: 'Error updating password', type: 'error' });
    } finally {
      setIsResetLoading(false);
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
            <path d="M 50 36 Q 52 18 64 28 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 70 26 Q 76 6 88 22 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 96 30 Q 112 18 114 38 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 98 118 Q 128 122 132 100 Q 120 112 100 104 Z" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" strokeLinejoin="round" />
            <ellipse cx="75" cy="114" rx="28" ry="25" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" />
            <ellipse cx="75" cy="120" rx="16" ry="15" fill="#D1FAE5" />
            <ellipse cx="46" cy="110" rx="7" ry="10" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" transform="rotate(25 46 110)" />
            <ellipse cx="104" cy="110" rx="7" ry="10" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" transform="rotate(-25 104 110)" />
            <ellipse cx="60" cy="138" rx="11" ry="7" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" />
            <ellipse cx="90" cy="138" rx="11" ry="7" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" />
            <path d="M 57 137 L 57 141 M 63 137 L 63 141 M 87 137 L 87 141 M 93 137 L 93 141" stroke="#065F46" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="75" cy="66" rx="48" ry="42" fill="#6EE7B7" stroke="#065F46" strokeWidth="3" />
            <ellipse cx="62" cy="46" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-20 62 46)" />
            <ellipse cx="54" cy="68" rx="6.5" ry="8" fill="#0F172A" />
            <ellipse cx="96" cy="68" rx="6.5" ry="8" fill="#0F172A" />
            <circle cx="56.5" cy="64.5" r="2.6" fill="#FFFFFF" />
            <circle cx="98.5" cy="64.5" r="2.6" fill="#FFFFFF" />
            <circle cx="52" cy="71" r="1.2" fill="#FFFFFF" />
            <circle cx="94" cy="71" r="1.2" fill="#FFFFFF" />
            <ellipse cx="40" cy="82" rx="8" ry="5.5" fill="#FB7185" opacity="0.75" />
            <ellipse cx="110" cy="82" rx="8" ry="5.5" fill="#FB7185" opacity="0.75" />
            <path d="M 66 80 Q 75 90 84 80" fill="#FB7185" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="70" cy="74" r="1.2" fill="#065F46" />
            <circle cx="80" cy="74" r="1.2" fill="#065F46" />
          </svg>
        </div>

        {/* Glass Container */}
        <div className="glass-panel rounded-[2.5rem] p-6 sm:p-10 md:p-14 w-full relative z-20 flex flex-col shadow-2xl">
          {/* Sign In vs Register Toggle Pills */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 bg-black/40 border border-white/20 rounded-full shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setStatus({ text: '', type: '' });
                }}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  !isRegisterMode
                    ? 'bg-white/20 text-white shadow-sm border border-white/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setStatus({ text: '', type: '' });
                  if (username === 'default') setUsername('');
                }}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isRegisterMode
                    ? 'bg-white/20 text-white shadow-sm border border-white/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                New User (Register)
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-1 tracking-wide text-white drop-shadow-md">
              {isRegisterMode ? 'Create New Account' : 'Welcome to Consistracker'}
            </h2>
            <p className="text-xs sm:text-sm font-light tracking-wide text-gray-200">
              {isRegisterMode
                ? 'Choose your username to start tracking'
                : 'Enter your username and password below'}
            </p>
          </div>

          {/* 7-Day Tracker Preview */}
          <div className="flex justify-between items-center w-full mb-6 sm:mb-8 px-0 sm:px-4 md:px-6 relative" role="list" aria-label="Focus hours this week">
            <div className="absolute top-[24px] left-[5%] right-[5%] h-[1px] bg-white/20 z-0" aria-hidden="true"></div>
            {days.map((item, idx) => {
              const isActive = item.dayIdx === currentDayOfWeek || (currentDayOfWeek === 0 && item.dayIdx === 0);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 z-10" role="listitem">
                  <span className={`text-xs ${isActive ? 'font-bold text-white shadow-sm' : 'font-light text-white'}`} aria-hidden="true">
                    {item.label}
                  </span>
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-medium border border-white/20 transition-all ${
                      isActive
                        ? 'border-white bg-white/25 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-110 -translate-y-1'
                        : 'bg-white/5 text-[11px] text-white/90'
                    }`}
                  >
                    {item.defaultHours}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form with BOTH Username and Password inputs */}
          <form id="p2-form" onSubmit={handleSubmit} noValidate autoComplete="off" className="px-0 sm:px-4 md:px-6">
            {/* PRE-SIGN-IN FOCUS DOMAIN RECOMMENDATION */}
            <div className="mb-5 p-3 rounded-2xl bg-black/35 border border-white/20 shadow-inner">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎯 Choose Your Focus Domain</span>
                </span>
                <span className="text-[10px] text-amber-300 font-medium">Daily challenges adapt to this</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DOMAINS.map((dom) => {
                  const isSel = selectedDomain === dom.id;
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => setSelectedDomain(dom.id)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                        isSel
                          ? 'border-[var(--lamp)] bg-white/20 shadow-md ring-1 ring-[var(--lamp)] scale-102'
                          : 'border-white/10 bg-black/20 hover:border-white/30 text-gray-300'
                      }`}
                    >
                      <span className="text-xl">{dom.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{dom.shortName}</div>
                        <div className="text-[9px] text-gray-300 truncate">{dom.badge || 'Domain'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. USERNAME INPUT BOX */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <label className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👤 Username</span>
                  {!isRegisterMode && (
                    <span className="text-[10px] lowercase text-amber-300 font-normal">
                      (type <code className="bg-white/15 px-1 rounded">default</code> or your name)
                    </span>
                  )}
                </label>

                {/* Real-time username check tag for new users */}
                {isRegisterMode && username.trim() && (
                  <span className="text-xs font-bold transition-all">
                    {usernameCheck === 'checking' && (
                      <span className="text-gray-300">Checking...</span>
                    )}
                    {usernameCheck === 'exists' && (
                      <span className="text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                        ⚠️ Already exists
                      </span>
                    )}
                    {usernameCheck === 'available' && (
                      <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                        ✓ Available
                      </span>
                    )}
                  </span>
                )}
              </div>

              <input
                ref={usernameInputRef}
                type="text"
                id="p2-username-input"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSuccess || isLoading}
                placeholder="e.g. default, aarya, admin"
                className={`w-full px-5 py-3.5 rounded-xl font-medium text-base text-white bg-black/40 border outline-none transition-all focus:bg-black/60 ${
                  isRegisterMode && usernameCheck === 'exists'
                    ? 'border-rose-400 focus:border-rose-300'
                    : 'border-white/25 focus:border-white/70'
                }`}
              />
              {isRegisterMode && usernameCheck === 'exists' && (
                <p className="text-[11px] text-rose-300 mt-1 px-1 font-medium">
                  This username already exists. Please choose a unique name or switch to Sign In.
                </p>
              )}
            </div>

            {/* 2. PASSWORD INPUT BOX */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-200 uppercase tracking-wider mb-1.5 px-1">
                🔑 Password
              </label>
              <input
                ref={passwordInputRef}
                type="password"
                id="p2-password-input"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSuccess || isLoading}
                placeholder="••••••••"
                className={`w-full px-5 py-3.5 rounded-xl tracking-[0.3em] font-medium text-lg placeholder:tracking-widest placeholder:font-light outline-none transition-all bg-black/40 border border-white/25 text-white focus:border-white/70 focus:bg-black/60 ${
                  isShaking ? 'p2-shake-error' : ''
                } ${isSuccess ? 'p2-success-state' : ''}`}
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              id="p2-unlock-btn"
              disabled={isSuccess || isLoading || (isRegisterMode && usernameCheck === 'exists')}
              className={`w-full py-4 rounded-xl font-semibold tracking-wide text-base sm:text-lg text-white transition-all cursor-pointer border border-white/40 backdrop-blur-sm shadow-lg ${
                isSuccess
                  ? 'bg-emerald-500/40 border-emerald-400'
                  : 'bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 hover:-translate-y-0.5 active:scale-98'
              } ${isRegisterMode && usernameCheck === 'exists' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSuccess ? '✓ Access Granted' : isLoading ? 'Processing...' : isRegisterMode ? 'Create Account & Enter' : 'Unlock Consistracker'}
            </button>

            {/* Live status message */}
            <p
              id="p2-status"
              className={`min-h-[1.5rem] mt-3 text-center text-xs sm:text-sm font-medium ${
                status.type === 'error' ? 'text-rose-300' : status.type === 'ok' ? 'text-emerald-300' : 'text-gray-200'
              }`}
            >
              {status.text}
            </p>
          </form>

          {/* Bottom links: Switch mode & Reset password (with no focus mention) */}
          <div className="flex justify-between items-center mt-3 text-xs sm:text-sm font-light text-gray-200 px-0 sm:px-4 md:px-6 flex-wrap gap-2 pt-2 border-t border-white/15">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setStatus({ text: '', type: '' });
                if (!isRegisterMode && username === 'default') setUsername('');
              }}
              className="text-xs text-amber-300 hover:text-white underline transition-colors cursor-pointer"
            >
              {isRegisterMode ? '‹ Back to Sign In' : '✨ New user? Register here'}
            </button>

            <div>
              <button
                type="button"
                onClick={() => {
                  setResetUsername(username || 'default');
                  setResetNewPassword('');
                  setResetStatus({ text: '', type: '' });
                  setShowResetModal(true);
                }}
                className="underline hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-light text-xs text-gray-300"
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

      {/* Clean Password Reset Modal (NO 'focus' reference) */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-white/30 text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white">Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 mb-4">
              Enter the username and the new password you want to set.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-200 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="e.g. default, aarya"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-black/40 border border-white/20 outline-none focus:border-white/60"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-200 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-black/40 border border-white/20 outline-none focus:border-white/60"
                  required
                />
              </div>

              {resetStatus.text && (
                <p
                  className={`text-xs text-center font-medium py-1 ${
                    resetStatus.type === 'error' ? 'text-rose-300' : 'text-emerald-300'
                  }`}
                >
                  {resetStatus.text}
                </p>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-300 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isResetLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
