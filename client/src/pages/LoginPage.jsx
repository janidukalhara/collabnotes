import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CardSwap, { Card } from '../components/ui/CardSwap';
import toast from 'react-hot-toast';

const FEATURE_CARDS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    label: 'Rich Text Editing',
    desc: 'Write beautifully with headings, lists, code blocks, quotes and inline formatting — all in one editor.',
    accent: '#fbbf24',
    bg: 'from-amber-950/80 to-black',
    tag: '✦ Editor',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Real-time Collaboration',
    desc: 'Invite teammates by email, assign editor or viewer roles, and work on notes together seamlessly.',
    accent: '#34d399',
    bg: 'from-emerald-950/80 to-black',
    tag: '✦ Collaboration',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    label: 'Full-text Search',
    desc: 'Instantly find any note by title, content or tag. MongoDB-powered text index ranks results by relevance.',
    accent: '#60a5fa',
    bg: 'from-blue-950/80 to-black',
    tag: '✦ Search',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    label: 'Secure & Private',
    desc: 'JWT auth with rotating refresh tokens, bcrypt-12 hashing, Helmet headers and rate limiting built-in.',
    accent: '#c084fc',
    bg: 'from-purple-950/80 to-black',
    tag: '✦ Security',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]                 = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState({});
  const [submitting, setSubmitting]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="absolute top-8 left-8 flex items-center gap-2.5 z-10">
          <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center rotate-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">CollabNotes</span>
        </div>

        {/* Headline */}
        <div className="absolute top-24 left-8 right-8 z-10">
          <h2 className="font-display text-3xl font-bold text-white leading-tight">
            Everything you need<br />
            <span className="text-amber-400">to think clearly.</span>
          </h2>
        </div>

        {/* CardSwap */}
        <div className="absolute inset-0">
          <CardSwap
            width={340}
            height={220}
            cardDistance={50}
            verticalDistance={60}
            delay={3500}
            pauseOnHover={true}
            skewAmount={5}
            easing="elastic"
          >
            {FEATURE_CARDS.map((fc, i) => (
              <Card key={i} customClass={`bg-gradient-to-br ${fc.bg}`}>
                <div className="flex flex-col justify-between h-full p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: fc.accent + '1a', color: fc.accent }}
                    >
                      {fc.icon}
                    </div>
                    <span
                      className="text-[10px] font-mono font-semibold px-2 py-1 rounded-full border"
                      style={{ color: fc.accent, borderColor: fc.accent + '40', backgroundColor: fc.accent + '10' }}
                    >
                      {fc.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-1.5" style={{ color: fc.accent }}>
                      {fc.label}
                    </h3>
                    <p className="text-white/55 text-xs leading-relaxed">
                      {fc.desc}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </CardSwap>
        </div>

        <div className="absolute bottom-8 left-8 z-10">
          <p className="text-white/25 text-xs font-mono">
            © {new Date().getFullYear()} CollabNotes
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-zinc-950">
        <div className="w-full max-w-md animate-fade-in">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center rotate-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-white text-lg">CollabNotes</span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-zinc-500 text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
              Create one free
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all duration-150 ${
                  errors.email ? 'border-red-500/60 focus:ring-red-500/20' : 'border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/10'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-all duration-150 ${
                    errors.password ? 'border-red-500/60 focus:ring-red-500/20' : 'border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-xl py-3 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400/40 mt-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-xs text-zinc-600 text-center">
            By signing in you agree to our{' '}
            <span className="text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">Terms</span>
            {' & '}
            <span className="text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">Privacy Policy</span>
          </p>
        </div>
      </div>

    </div>
  );
}
