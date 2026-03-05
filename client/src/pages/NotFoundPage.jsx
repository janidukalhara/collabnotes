import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative text-center animate-fade-in">
        {/* Big 404 */}
        <div className="relative inline-block mb-6">
          <p className="font-display font-bold text-[9rem] leading-none text-zinc-800 select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard"
            className="bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm rounded-xl px-5 py-2.5
              transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            Back to notes
          </Link>
          <Link to="/login"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl px-5 py-2.5 border border-zinc-700
              transition-all duration-150 active:scale-[0.98]"
          >
            Sign in
          </Link>
        </div>

        {/* Brand */}
        <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
          <div className="w-5 h-5 bg-amber-400 rounded-md flex items-center justify-center rotate-3">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <span className="text-zinc-500 text-xs font-display font-semibold">CollabNotes</span>
        </div>
      </div>
    </div>
  );
}
