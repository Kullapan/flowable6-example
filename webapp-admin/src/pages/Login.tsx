import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div 
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 relative z-10"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20 shadow-inner">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-display-sm font-bold text-on-surface">Admin Portal</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Authenticate to access operations control</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container/50 border border-error/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
            <span className="text-sm text-on-error-container font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-label-md font-semibold text-on-surface mb-2 pl-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-on-surface-variant/60" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-on-surface-variant/40"
                placeholder="Enter admin username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-label-md font-semibold text-on-surface mb-2 pl-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-on-surface-variant/60" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-on-surface-variant/40"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 mt-4 bg-primary hover:bg-primary/90 active:bg-primary/100 text-on-primary rounded-xl font-bold text-label-lg flex items-center justify-center gap-2 transition-all hover:shadow-[0_8px_16px_-4px_rgba(var(--primary-color-rgb),0.4)] active:scale-[0.98]"
          >
            Sign In
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
          <p className="text-xs text-on-surface-variant/80 font-medium">Secure Intranet Access Only</p>
        </div>
      </div>
    </div>
  );
}
