import React, { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../utils/api';
import { playSfx } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

const RATINGS = [
  { id: 'loved', label: 'Loved it', emoji: '😍', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
  { id: 'good', label: 'Smooth & Good', emoji: '😊', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { id: 'okay', label: "It's Okay", emoji: '😐', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { id: 'idea', label: 'Have an Idea', emoji: '💡', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
  { id: 'bug', label: 'Found a Bug', emoji: '🐛', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' }
];

const CATEGORIES = [
  'General Vibe',
  'Focus Engine & Modes',
  'Habit Matrix',
  'Dopamine Quests',
  'Tutorial / Onboarding',
  'Feature Suggestion',
  'Bug Report'
];

export default function FeedbackModal({ isOpen, onClose, showToast, isMuted }) {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser.username?.toLowerCase() === 'admin';

  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'feedback'); // 'feedback' | 'admin'
  const [rating, setRating] = useState('loved');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Admin feedbacks & site stats
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ totalVisits: 0, todayVisits: 0, totalUsers: 0, totalFeedbacks: 0 });
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSent(false);
      setMessage('');
      if (isAdmin) {
        loadAdminData();
      }
    }
  }, [isOpen, isAdmin]);

  const loadAdminData = async () => {
    setIsLoadingFeedbacks(true);
    try {
      const [fbRes, statsRes] = await Promise.all([
        api.getFeedbacks(),
        api.getSiteStats()
      ]);
      if (fbRes.success && Array.isArray(fbRes.feedbacks)) {
        setFeedbacks(fbRes.feedbacks);
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (e) {
      console.error('Could not load admin data:', e);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.sendFeedback({
        username: currentUser.username || 'anonymous',
        rating,
        category,
        message: message.trim()
      });

      if (res.success) {
        triggerConfetti();
        playSfx('celebrate', isMuted);
        setIsSent(true);
        if (showToast) showToast('💖 Thank you! Feedback sent directly to admin.');
        if (isAdmin) loadAdminData();
      } else {
        if (showToast) showToast(res.message || 'Could not send feedback');
      }
    } catch (err) {
      if (showToast) showToast('Error sending feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      const res = await api.deleteFeedback(id);
      if (res.success) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        if (showToast) showToast('Feedback item removed');
      }
    } catch {
      if (showToast) showToast('Error deleting feedback');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[var(--surf)] border border-[var(--line)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)] bg-[var(--surf2)]/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">✨</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="serif text-lg sm:text-xl font-normal text-[var(--ink)]">
                  {isAdmin && activeTab === 'admin' ? 'Admin Feedback Inbox' : 'Trial Run Feedback'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                  Trial Mode
                </span>
              </div>
              <p className="text-xs text-[var(--mut)]">
                {isAdmin && activeTab === 'admin'
                  ? `Reviewing live user thoughts (${feedbacks.length} submissions)`
                  : 'Your thoughts shape CONSIStracker during our early trial!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex rounded-full bg-[var(--surf)] border border-[var(--line)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('feedback');
                    setIsSent(false);
                  }}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                    activeTab === 'feedback' ? 'bg-[var(--lamp)] text-[#1b1730]' : 'text-[var(--mut)] hover:text-[var(--ink)]'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    loadAdminData();
                  }}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                    activeTab === 'admin' ? 'bg-[var(--lamp)] text-[#1b1730]' : 'text-[var(--mut)] hover:text-[var(--ink)]'
                  }`}
                >
                  Admin View ({feedbacks.length})
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--surf2)] hover:bg-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)] flex items-center justify-center text-sm cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'admin' && isAdmin ? (
            /* ADMIN VIEW: ANALYTICS & USER FEEDBACKS */
            <div className="space-y-4">
              {/* Website Visit & System Analytics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-[var(--surf2)] to-[var(--surf)] border border-[var(--line)] shadow-inner">
                <div className="flex flex-col p-2.5 rounded-xl bg-[var(--surf)]/90 border border-[var(--line)]/60 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mut)]">Total Visits</span>
                  <div className="text-xl sm:text-2xl font-bold text-[var(--lamp)] mt-0.5 flex items-center justify-center gap-1">
                    <span>👁️</span>
                    <span>{stats.totalVisits || 0}</span>
                  </div>
                  <span className="text-[9px] text-[var(--mut)]">site loads</span>
                </div>

                <div className="flex flex-col p-2.5 rounded-xl bg-[var(--surf)]/90 border border-[var(--line)]/60 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mut)]">Today's Visits</span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    <span>📈</span>
                    <span>{stats.todayVisits || 0}</span>
                  </div>
                  <span className="text-[9px] text-emerald-400/80 font-medium">active today</span>
                </div>

                <div className="flex flex-col p-2.5 rounded-xl bg-[var(--surf)]/90 border border-[var(--line)]/60 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mut)]">Registered Users</span>
                  <div className="text-xl sm:text-2xl font-bold text-cyan-400 mt-0.5 flex items-center justify-center gap-1">
                    <span>👥</span>
                    <span>{stats.totalUsers || 0}</span>
                  </div>
                  <span className="text-[9px] text-[var(--mut)]">accounts</span>
                </div>

                <div className="flex flex-col p-2.5 rounded-xl bg-[var(--surf)]/90 border border-[var(--line)]/60 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mut)]">Feedbacks</span>
                  <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-0.5 flex items-center justify-center gap-1">
                    <span>💬</span>
                    <span>{feedbacks.length}</span>
                  </div>
                  <span className="text-[9px] text-[var(--mut)]">user reviews</span>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <div className="text-xs font-semibold text-[var(--ink)]">
                  Feedback Submissions: <span className="text-[var(--lamp)] font-bold">{feedbacks.length}</span>
                </div>
                <button
                  type="button"
                  onClick={loadAdminData}
                  disabled={isLoadingFeedbacks}
                  className="text-xs text-[var(--lamp)] hover:underline cursor-pointer flex items-center gap-1 font-medium"
                >
                  <span>🔄</span>
                  <span>{isLoadingFeedbacks ? 'Refreshing...' : 'Refresh All Data'}</span>
                </button>
              </div>

              {feedbacks.length === 0 ? (
                <div className="text-center py-12 text-[var(--mut)]">
                  <div className="text-4xl mb-2">📬</div>
                  <p className="text-sm font-medium">No feedback submitted yet.</p>
                  <p className="text-xs opacity-75 mt-1">Feedback sent by users during the trial run will show up here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((item) => {
                    const ratingObj = RATINGS.find((r) => r.id === item.rating) || RATINGS[0];
                    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent';
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--surf2)]/60 hover:border-[var(--lamp)]/50 transition-all flex flex-col gap-2 relative shadow-xs"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{ratingObj.emoji}</span>
                            <span className="text-xs font-bold text-[var(--ink)]">@{item.username}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ratingObj.color}`}>
                              {ratingObj.label}
                            </span>
                            <span className="text-[10px] text-[var(--mut)] px-2 py-0.5 rounded-md bg-[var(--surf)] border border-[var(--line)]">
                              {item.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[var(--mut)]">
                            <span>{dateStr}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteFeedback(item.id)}
                              title="Delete feedback"
                              className="text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--ink)] whitespace-pre-wrap leading-relaxed mt-1 bg-[var(--surf)]/70 p-3 rounded-xl border border-[var(--line)]/50">
                          {item.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : isSent ? (
            /* SUCCESS STATE FOR USER */
            <div className="text-center py-8 px-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm animate-bounce">
                💌
              </div>
              <h4 className="serif text-xl font-normal text-[var(--ink)] mb-2">Thank you so much!</h4>
              <p className="text-xs sm:text-sm text-[var(--mut)] max-w-md mx-auto mb-6 leading-relaxed">
                Your feedback has been delivered straight to the admin! You are helping shape the future of CONSIStracker during our trial run.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setIsSent(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surf2)] text-[var(--ink)] hover:brightness-110 cursor-pointer"
                >
                  Send another thought
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--lamp)] text-[#1b1730] hover:brightness-110 cursor-pointer shadow-md"
                >
                  Back to Tracking
                </button>
              </div>
            </div>
          ) : (
            /* FEEDBACK SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Emotion / Sentiment selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-2">
                  1. How are you feeling about the app?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RATINGS.map((r) => {
                    const isSelected = rating === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRating(r.id)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-[var(--lamp)] bg-[var(--lamp)]/15 shadow-sm scale-105 ring-1 ring-[var(--lamp)]/40 font-bold'
                            : 'border-[var(--line)] bg-[var(--surf2)]/70 hover:border-[var(--mut)]'
                        }`}
                      >
                        <span className="text-2xl">{r.emoji}</span>
                        <span className="text-[10px] text-[var(--ink)] leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category picker */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  2. What is this feedback about?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        category === cat
                          ? 'border-[var(--lamp)] bg-[var(--lamp)] text-[#1b1730] font-bold shadow-xs'
                          : 'border-[var(--line)] bg-[var(--surf2)] text-[var(--mut)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message textarea */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  3. Tell us everything! (Bugs, design ideas, feature requests)
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. I really liked the focus timer, but it would be super cool if we could add... Or I noticed an issue when..."
                  className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm text-[var(--ink)] bg-[var(--surf2)] border border-[var(--line)] outline-none focus:border-[var(--lamp)] placeholder:text-[var(--mut)]/60 leading-relaxed resize-none shadow-inner"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[var(--mut)] flex items-center gap-1">
                  <span>Submitting as</span>
                  <b className="text-[var(--ink)]">@{currentUser.username}</b>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surf2)] text-[var(--mut)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-[var(--lamp)] to-emerald-400 text-[#1b1730] shadow-md hover:brightness-110 active:scale-95 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : '💌 Submit Feedback'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
