import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('consistracker_v4');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0e0b20] text-[#f1ecff]">
          <div className="bg-[#1b1730] border border-white/10 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl">
            <span className="text-5xl block mb-3">🦖</span>
            <h2 className="serif text-2xl font-normal mb-2">Diano stumbled upon a glitch</h2>
            <p className="text-xs text-white/60 mb-4">
              Something went slightly out of sync. Don't worry, your data is safe on the server.
            </p>

            {this.state.error && (
              <pre className="text-left text-[11px] p-3 rounded-xl bg-black/40 text-rose-300 font-mono mb-5 overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </pre>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-[var(--lamp)] text-[#1b1730] font-semibold text-xs cursor-pointer shadow-md hover:brightness-105"
              >
                Reload Dashboard
              </button>
              <button
                type="button"
                onClick={this.handleResetState}
                className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs text-white/70 hover:text-white cursor-pointer"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
