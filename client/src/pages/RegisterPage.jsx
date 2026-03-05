import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const fields = [
  { name: 'name',     label: 'Full name',          type: 'text',     placeholder: 'Jane Smith',      autocomplete: 'name' },
  { name: 'email',    label: 'Email address',       type: 'email',    placeholder: 'you@example.com', autocomplete: 'email' },
  { name: 'password', label: 'Password',            type: 'password', placeholder: '8+ characters',   autocomplete: 'new-password' },
  { name: 'confirm',  label: 'Confirm password',    type: 'password', placeholder: '••••••••',        autocomplete: 'new-password' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [show, setShow]         = useState({ password: false, confirm: false });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name     = 'Name is required';
    if (!form.email)                    e.email    = 'Email is required';
    if (form.password.length < 8)       e.password = 'At least 8 characters';
    if (form.password !== form.confirm) e.confirm  = 'Passwords do not match';
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
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const EyeIcon = ({ open }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center rotate-3 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">CollabNotes</span>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold text-white mb-1">Create account</h2>
          <p className="text-zinc-500 text-sm mb-7">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {fields.map(({ name, label, type, placeholder, autocomplete }) => {
              const isPasswordField = type === 'password';
              const isVisible = show[name];
              return (
                <div key={name}>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={isPasswordField && isVisible ? 'text' : type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      autoComplete={autocomplete}
                      className={`w-full bg-zinc-800 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600
                        focus:outline-none focus:ring-2 transition-all duration-150
                        ${isPasswordField ? 'pr-10' : ''}
                        ${errors[name]
                          ? 'border-red-500/60 focus:ring-red-500/20'
                          : 'border-zinc-700 focus:border-amber-500/50 focus:ring-amber-500/10'}`}
                    />
                    {isPasswordField && (
                      <button type="button" tabIndex={-1}
                        onClick={() => setShow((p) => ({ ...p, [name]: !p[name] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
                      >
                        <EyeIcon open={isVisible} />
                      </button>
                    )}
                  </div>
                  {errors[name] && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {errors[name]}
                    </p>
                  )}
                </div>
              );
            })}

            <button type="submit" disabled={submitting}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed
                text-black font-semibold text-sm rounded-xl py-3 transition-all duration-150
                active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400/40 mt-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Get started — it's free"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-xs text-zinc-600 text-center">
          By creating an account you agree to our{' '}
          <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">Terms</span>
          {' & '}
          <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
